const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
(async () => {
  const progress = await import(pathToFileURL(path.join(root, 'pythonlab/progress.js')));
  const { lessons } = await import(pathToFileURL(path.join(root, 'pythonlab/course-data.js')));
  const { verificationTests } = await import(pathToFileURL(path.join(root, 'pythonlab/challenge-data.js')));
  const old = { code: 'print(1)', assisted: true, verifiedAt: 123 };
  const migrated = progress.migrateCompletion({ 1: old });
  assert.equal(progress.earnedStars(migrated[1]), 1, 'old completion must only become one star');
  assert.deepEqual(migrated[1].levels[1], old);
  assert.deepEqual(progress.migrateCompletion(migrated), migrated, 'migration must be idempotent');
  assert.equal(progress.canAttemptTier(undefined, 1), true);
  assert.equal(progress.canAttemptTier(undefined, 2), false);
  assert.equal(progress.canAttemptTier(migrated[1], 3), false);
  assert.throws(() => progress.awardTier(undefined, 2, old));
  const two = progress.awardTier(migrated[1], 2, { code: 'modified', verifiedAt: 456 });
  assert.equal(progress.earnedStars(two), 2);
  assert.equal(progress.canAttemptTier(two, 3), true);
  const three = progress.awardTier(two, 3, { code: 'ultimate', verifiedAt: 789 });
  assert.equal(progress.earnedStars(three), 3);
  assert.equal(progress.earnedStars(progress.awardTier(three, 1, old)), 3, 'rechecking a lower tier must preserve higher achievements');
  const requests = [];
  for (const lesson of lessons) {
    for (const stage of [3, 4]) {
      const activity = lesson.activities[stage];
      assert.ok(activity.starter.trim());
      assert.equal(activity.optional, stage === 4);
      const low = verificationTests(lesson, activity, () => 0);
      const high = verificationTests(lesson, activity, () => .999999);
      if (lesson.id !== 1) {
        assert.equal(low.length, activity.tests.length + 6);
        assert.notDeepEqual(low.slice(-6).map(item => item.input), high.slice(-6).map(item => item.input));
      }
      requests.push({ code: activity.solution, tests: low, shouldPass: true, label: `${lesson.id}/${stage}: generated minimum` });
      requests.push({ code: activity.solution, tests: high, shouldPass: true, label: `${lesson.id}/${stage}: generated maximum` });
      // 前一關未必有上限檢查；使用代表性案例避免本機刻意錯誤的程式跑巨量迴圈。
      requests.push({ code: lesson.activities[stage - 1].solution, tests: activity.tests.slice(0, 5), shouldPass: false, label: `${lesson.id}/${stage}: copying previous answer` });
    }
  }
  for (const [id, oldText, newText] of [[4, 'pressure > 100', 'pressure > 1000'], [5, 'n < 1', 'n < 0'], [8, 'score >= 60', 'score > 60'], [10, 'code < 1', 'code < 0']]) {
    const activity = lessons[id - 1].activities[3];
    assert.ok(activity.solution.includes(oldText));
    requests.push({ code: activity.solution.replace(oldText, newText), tests: activity.tests, shouldPass: false, label: `${id}: boundary defect` });
  }
  const driver = 'import sys,json,importlib.util\ns=importlib.util.spec_from_file_location("runner","pythonlab/runner.py")\nr=importlib.util.module_from_spec(s)\ns.loader.exec_module(r)\nprint(json.dumps([json.loads(r._lab_dispatch(json.dumps({"action":"check",**item}))) for item in json.load(sys.stdin)],ensure_ascii=False))\n';
  const results = JSON.parse(execFileSync('python', ['-X', 'utf8', '-c', driver], { cwd: root, input: JSON.stringify(requests), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }));
  results.forEach((result, i) => {
    assert.equal(result.results.every(item => item.passed), requests[i].shouldPass, `${requests[i].label}: ${JSON.stringify(result.results.filter(item => !item.passed))}`);
  });
  console.log('Three-star course: legacy migration, sequential unlock, optional third tier, generated inputs, 20 old-answer rejection checks and 4 boundary-defect checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
