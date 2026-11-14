const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const catalog = { window: {} };
vm.runInNewContext(read('lesson-assessments.js'), catalog);
vm.runInNewContext(read('lesson-labels.js'), catalog);
const pages = [7, 8].flatMap(grade => [1, 2, 3, 4, 5, 6].map(lesson => `1150${grade}0${lesson}.html`));

new vm.Script(read('lesson-route.js'), { filename: 'lesson-route.js' });

for (const page of pages) {
  const html = read(page);
  const assessments = html.indexOf('src="lesson-assessments.js"');
  const guide = html.indexOf('src="learning-guides.js"');
  const engine = html.indexOf('src="lesson-route.js"');
  const routes = html.indexOf('src="lesson-routes.js"');
  assert.ok(html.includes('href="lesson-route.css"'), `${page} should load the route styles`);
  assert.ok(assessments !== -1 && assessments < guide && guide < engine && engine < routes, `${page} should load assessment data, guide and routes in order`);

  let started;
  const window = {
    LessonLabels: catalog.window.LessonLabels,
    LessonAssessments: catalog.window.LessonAssessments,
    LearningGuide: catalog.window.LessonAssessments[page],
    LessonRoute: { start: config => { started = config; } }
  };
  vm.runInNewContext(read('lesson-routes.js'), { window, location: { pathname: `/${page}` } });
  assert.ok(started, `${page} should start a learning route`);
  const { steps, next } = started;
  assert.equal(steps[0].title, '認識任務');
  assert.equal(steps[0].anchors[0], '#learning-guide');
  assert.equal(steps[0].checks, undefined, `${page}: introduction has no completion checklist`);
  assert.deepEqual(Array.from(steps.slice(-2), step => step.title), ['換題練習', '離堂任務'], `${page} should end with practice and the exit task`);
  assert.ok(steps.some(step => /Scratch/.test(step.title)), `${page} should include a Scratch hands-on step`);
  assert.equal(steps.at(-2).optional, true, `${page}: practice can be skipped without blocking submission`);
  assert.ok(!steps.at(-1).optional, `${page}: submission is the last required step`);
  for (const step of steps.slice(1)) {
    assert.ok(step.todo && step.todo.length > 8, `${page} / ${step.title}: needs a clear instruction`);
    assert.ok(Array.isArray(step.checks) && step.checks.length, `${page} / ${step.title}: needs completion checks`);
    assert.ok(Array.isArray(step.hints) && step.hints.length, `${page} / ${step.title}: needs at least one hint`);
  }
  if (html.includes('curriculum-labs.js')) assert.ok(steps.some(step => (step.anchors || []).includes('#curriculum-lab')));
  const generated = new Map([['#learning-guide', 'learning-guides.js'], ['#adaptive-practice', 'adaptive-practice.js'], ['#curriculum-lab', 'curriculum-labs.js']]);
  for (const locator of steps.flatMap(step => step.anchors || [])) {
    const selectors = typeof locator === 'string' ? [locator] : locator.common || [locator.up];
    for (const selector of selectors) {
      assert.match(selector, /^#[\w-]+$/, `${page}: use a fixed ID`);
      if (generated.has(selector)) {
        const file = generated.get(selector);
        assert.ok(html.includes(`src="${file}"`));
        assert.ok(read(file).includes(`section.id = '${selector.slice(1)}'`));
      } else {
        assert.equal(html.split(`id="${selector.slice(1)}"`).length - 1, 1, `${page}: missing or duplicate ${selector}`);
      }
    }
  }
  const lesson = Number(page[6]);
  assert.equal(next.href, lesson < 6 ? `1150${page[4]}0${lesson + 1}.html` : `1150${page[4]}00.html`);
}

// CodeGame and Python Lab keep their own single routes.
const codegame = read('codegame/lightbot.js');
assert.match(codegame, /function levelOpen\(item\)/);
assert.match(codegame, /button\.disabled = !open/);
assert.match(codegame, /function stuckHint\(\)/);
const pythonlab = read('pythonlab/app.js');
assert.match(pythonlab, /function unitOpen\(lesson\)/);
assert.match(pythonlab, /function stageOpen\(lesson, stage\)/);
for (const file of ['lesson-route.js', 'course-home.js', 'codegame/lightbot.js', 'pythonlab/app.js']) {
  assert.match(read(file), /window\.TeacherDemo/);
}
const storage = new Map();
let replaced;
const demo = {
  window: {}, URL, URLSearchParams,
  location: { search: '?example=empty&route=all', href: 'https://example.test/1150803.html?example=empty&route=all#energy-trace', replace(url) { replaced = url; } },
  sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }
};
vm.runInNewContext(read('teacher-demo.js'), demo);
assert.equal(demo.window.TeacherDemo.isOn(), true);
assert.equal(demo.window.TeacherDemo.showAll(), true);
demo.window.TeacherDemo.end();
assert.equal(storage.size, 0);
assert.equal(replaced, 'https://example.test/1150803.html?example=empty#energy-trace');
for (const folder of ['codegame', 'pythonlab']) {
  assert.ok(read(`${folder}/teacher-demo.js`).endsWith(read('teacher-demo.js')));
  assert.match(read(`${folder}/index.html`), /src="teacher-demo\.js"/);
}
assert.match(read('index.html'), /id="teacher-demo-toggle"/);
assert.match(read('lesson-route.js'), /const missing = demo \? \[\]/, 'demo mode should not require ticking completion checks');

console.log('learning routes: 12 Scratch lessons, CodeGame and Python Lab follow one guided path');
