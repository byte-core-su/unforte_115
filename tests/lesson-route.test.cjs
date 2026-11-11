const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = [7, 8].flatMap(grade => [1, 2, 3, 4, 5, 6].map(lesson => `1150${grade}0${lesson}.html`));

new vm.Script(read('lesson-route.js'), { filename: 'lesson-route.js' });

for (const page of pages) {
  const html = read(page);
  const guide = html.indexOf('src="learning-guides.js"');
  const engine = html.indexOf('src="lesson-route.js"');
  const routes = html.indexOf('src="lesson-routes.js"');
  assert.ok(html.includes('href="lesson-route.css"'), `${page} should load the route styles`);
  assert.ok(guide !== -1 && guide < engine && engine < routes, `${page} should load learning guide, route engine and routes in order`);

  let started;
  const window = {
    LearningGuide: { evidence: '本課成果', exit: '本課離堂任務。' },
    LessonRoute: { start: config => { started = config; } }
  };
  vm.runInNewContext(read('lesson-routes.js'), { window, location: { pathname: `/${page}` } });
  assert.ok(started, `${page} should start a learning route`);
  const { steps, next } = started;
  assert.equal(steps[0].title, '認識任務');
  assert.equal(steps[0].anchors[0], '#learning-guide');
  assert.deepEqual(Array.from(steps.slice(-2), step => step.title), ['換題練習', '離堂任務'], `${page} should end with practice and the exit task`);
  assert.ok(steps.some(step => /Scratch/.test(step.title)), `${page} should include a Scratch hands-on step`);
  assert.ok(!steps.at(-1).optional && !steps.at(-2).optional, `${page} should not end on an optional step`);
  for (const step of steps) {
    assert.ok(step.todo && step.todo.length > 8, `${page} / ${step.title}: needs a clear instruction`);
    assert.ok(Array.isArray(step.checks) && step.checks.length, `${page} / ${step.title}: needs completion checks`);
    assert.ok(Array.isArray(step.hints) && step.hints.length, `${page} / ${step.title}: needs at least one hint`);
  }
  if (html.includes('curriculum-labs.js')) assert.ok(steps.some(step => (step.anchors || []).includes('section.curriculum-lab')), `${page} should route through its extra activity`);
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
assert.match(pythonlab, /route=all/);

console.log('learning routes: 12 Scratch lessons, CodeGame and Python Lab follow one guided path');
