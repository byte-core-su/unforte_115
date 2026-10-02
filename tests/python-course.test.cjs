const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

(async () => {
  const { lessons, dictionary } = await import(pathToFileURL(path.join(root, 'pythonlab/course-data.js')));
  assert.equal(lessons.length, 10);
  const requests = [];
  for (const lesson of lessons) {
    assert.equal(lesson.activities.length, 3);
    for (const id of lesson.syntax) assert.ok(dictionary.find(entry => entry.id === id), `${lesson.id}: missing syntax ${id}`);
    for (const source of lesson.source) assert.ok(fs.existsSync(path.join(root, `pythonlab/data/class-${String(source).padStart(2, '0')}.txt`)));
    lesson.activities.forEach((activity, stage) => {
      assert.ok(activity.starter.trim(), `${lesson.id}/${stage}: blank starter`);
      requests.push({ action: 'compile', code: activity.starter, label: `${lesson.id}/${stage}: starter` });
      requests.push({ action: 'run', code: activity.solution, input: activity.input, label: `${lesson.id}/${stage}: solution` });
      if (stage === 0) requests.push({ action: 'check', code: activity.starter, tests: [{ name: 'demo', expected: activity.expected, input: activity.input }], label: `${lesson.id}: demonstration` });
      if (stage > 0) {
        assert.ok(activity.tests.length, `${lesson.id}/${stage}: no meaningful tests`);
        requests.push({ action: 'check', code: activity.solution, tests: activity.tests, label: `${lesson.id}/${stage}: cases` });
      }
    });
  }
  for (const entry of dictionary) requests.push({ action: 'check', code: entry.example, tests: [{ name: entry.id, input: entry.input || '', expected: entry.output }], label: `dictionary ${entry.id}` });
  const driver = `import sys, json, importlib.util\nspec = importlib.util.spec_from_file_location('runner', 'pythonlab/runner.py')\nrunner = importlib.util.module_from_spec(spec)\nspec.loader.exec_module(runner)\nrequests = json.load(sys.stdin)\nresults = []\nfor request in requests:\n    if request['action'] == 'compile':\n        compile(request['code'], 'starter.py', 'exec')\n        results.append({'output': '', 'error': None})\n    else:\n        results.append(json.loads(runner._lab_dispatch(json.dumps(request))))\nprint(json.dumps(results, ensure_ascii=False))\n`;
  const results = JSON.parse(execFileSync('python', ['-X', 'utf8', '-c', driver], { cwd: root, input: JSON.stringify(requests), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }));
  results.forEach((result, i) => {
    assert.ok(!result.error, `${requests[i].label}: ${JSON.stringify(result.error)}`);
    for (const item of result.results || []) assert.equal(item.passed, true, `${requests[i].label}/${item.name}: ${JSON.stringify(item)}`);
  });
  const engineRequests = [
    { action: 'run', code: 'print(missing)', input: '' },
    { action: 'run', code: 'if True\n    print(1)', input: '' },
    { action: 'run', code: 'input()\ninput()', input: 'one' },
    { action: 'run', code: 'private_value = 99', input: '' },
    { action: 'run', code: 'print(private_value)', input: '' },
    { action: 'run', code: 'while True:\n    print("x" * 1000)', input: '' },
    { action: 'check', code: 'print(5050)', tests: lessons[4].activities[1].tests },
    { action: 'check', code: 'n = int(input())\nprint(sum(range(1, n + 1)))', tests: lessons[4].activities[2].tests.filter(test => !test.requires) },
    { action: 'check', code: 'print(float("nan"))', tests: [{ name: 'finite only', input: '', expected: '80', numeric: true }] }
  ];
  const engine = JSON.parse(execFileSync('python', ['-X', 'utf8', '-c', driver], { cwd: root, input: JSON.stringify(engineRequests), encoding: 'utf8' }));
  assert.equal(engine[0].error.type, 'NameError'); assert.equal(engine[0].error.line, 1);
  assert.equal(engine[1].error.type, 'SyntaxError'); assert.equal(engine[1].error.line, 1);
  assert.equal(engine[2].error.type, 'EOFError'); assert.equal(engine[2].error.line, 2);
  assert.equal(engine[4].error.type, 'NameError', 'globals must be fresh');
  assert.equal(engine[5].error.type, 'RuntimeError', 'runaway output must be capped');
  assert.equal(engine[6].results[0].passed, false, 'hardcoding must not satisfy a for task');
  assert.ok(engine[7].results.every(item => item.passed), 'different correct implementations should pass output checks');
  assert.equal(engine[8].results[0].passed, false, 'NaN must not pass numeric comparison');
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /href="(?:pythonlab\/index.html|#python-course)"/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'pythonlab/index.html'), 'utf8'), /(?:href|src)="\.\.\//);
  console.log(`Python curriculum: ${requests.length} demo, starter, solution and dictionary checks passed; runtime error, isolation, output limit and alternative-solution checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
