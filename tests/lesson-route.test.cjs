const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const CourseScenarios = require('../course-scenarios.js');

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
  const programScript = html.indexOf('src="block-program.js"');
  const preview = html.indexOf('src="lesson-preview.js"');
  const routes = html.indexOf('src="lesson-routes.js"');
  assert.ok(html.includes('href="lesson-route.css"'), `${page} should load the route styles`);
  assert.ok(assessments !== -1 && assessments < guide && guide < engine && engine < routes, `${page} should load assessment data, guide and routes in order`);
  assert.ok(programScript >= 0 && programScript < preview && preview < routes, `${page} should load the result preview before starting the route`);

  let started;
  const window = {
    LessonLabels: catalog.window.LessonLabels,
    LessonAssessments: catalog.window.LessonAssessments,
    CourseScenarios,
    LearningGuide: catalog.window.LessonAssessments[page],
    LessonRoute: { start: config => { started = config; } }
  };
  vm.runInNewContext(read('block-program-tasks.js'), { window });
  vm.runInNewContext(read('lesson-routes.js'), { window, location: { pathname: `/${page}` } });
  assert.ok(started, `${page} should start a learning route`);
  const { steps, references = [], program, extraPrograms, next, teacherFinish } = started;
  assert.equal(steps[0].title, '認識任務');
  assert.equal(steps[0].anchors[0], '#learning-guide');
  assert.equal(steps[0].checks, undefined, `${page}: introduction has no completion checklist`);
  const { entry } = steps[0];
  if (page === '1150801.html') {
    const { tool, chip, pack } = CourseScenarios.active.inventory.items;
    assert.deepEqual(Array.from(entry.items), [tool.label, chip.label, pack.label]);
    assert.ok([0, 1].includes(entry.correct), "only an earlier list entry may be requested");
    assert.equal(entry.choices, undefined);
  } else {
    assert.equal(entry, undefined, `${page}: students can start directly`);
  }
  assert.deepEqual(Array.from(steps.slice(-2), step => step.title), ['換題練習', '離堂任務'], `${page} should end with practice and the exit task`);
  assert.ok(program?.cases.length && steps.some(step => step.anchors.includes('#block-program')), `${page} should include the simulator step`);
  assert.ok(steps.slice(1).some(step => step.period === 1 && !step.optional), `${page}: first period has required work`);
  const secondPeriod = steps.findIndex(step => step.period === 2);
  assert.ok(secondPeriod > 1 && steps.slice(secondPeriod).every(step => step.period === 2), `${page}: clear second period boundary`);
  const firstOptional = steps.findIndex(step => step.optional);
  if (firstOptional >= 0) assert.ok(steps.slice(firstOptional, -1).every(step => step.optional), `${page}: extensions follow required activities`);
  if (page === '1150702.html') {
    for (const [index, id, label] of [[1, 'seq', '開始平均數實作'], [2, 'sel', '開始及格判斷實作'], [3, 'rep', '開始累加實作']]) {
      const step = steps[index];
      assert.equal(step.parts[0].nextLabel, label);
      assert.equal(step.parts[0].reviewNextLabel, '重做積木實作');
      assert.equal(step.parts[0].completionAnchor, `#${id}-flow-completion`);
      assert.ok(html.includes(`id="${id}-flow-completion"`));
      assert.ok(step.parts[0].activity.selector.includes(`#${id}-flow-msg[data-lesson-activity]`));
      assert.equal(step.parts[1].anchors[0], `#${id}-block-program`);
      assert.equal(step.parts[1].resume, true);
      window.structureFlowHint = structure => structure;
      assert.equal(step.parts[1].flowHint(), id);
      assert.equal(step.activity.selector, `#${id}-block-program[data-program-passed]`);
      assert.equal(extraPrograms[`${id}-block-program`].cases.length, 2);
    }
  }
  const lessonProgram = steps.find(step => step.anchors.includes('#block-program'));
  if (page.startsWith('11507')) {
    assert.ok(!lessonProgram.optional, `${page}: block programming is required`);
    assert.match(lessonProgram.activity.selector, /data-program-passed/);
  }
  if (page === '1150701.html') {
    assert.equal(steps[2], lessonProgram);
    assert.ok(!lessonProgram.optional);
  }
  if (page === '1150802.html') {
    assert.equal(steps[2], lessonProgram);
    assert.equal(steps[3].title, '錄音與素材判斷');
    assert.match(lessonProgram.activity.selector, /data-program-two-runs/);
  }
  if (page === '1150803.html') {
    assert.equal(steps[4], lessonProgram);
    assert.ok(!lessonProgram.optional);
  }
  if (page === '1150805.html') {
    const shuffle = steps[1];
    assert.equal(shuffle.parts[1].anchors[0], '#shuffle-block-program');
    assert.equal(shuffle.parts[1].activity.selector, '#shuffle-block-program[data-program-passed]');
    assert.equal(shuffle.parts[2].anchors[0], '#sorting-lab');
    assert.equal(shuffle.parts[2].resume, true);
    assert.equal(shuffle.activity.selector, '#sorting-lab[data-lesson-activity]');
    assert.equal(extraPrograms['shuffle-block-program'].cases.length, 2);
  }
  assert.match(html, /src="block-program\.js"/);
  assert.doesNotMatch(html, /scratch\.mit\.edu|href="[^"]*\.sb3/i);
  const practice = steps.at(-2);
  assert.equal(practice.optional, page !== '1150801.html', `${page}: only grade 8 lesson 1 requires practice`);
  assert.equal(practice.activity.selector, '#adaptive-practice[data-lesson-activity]');
  assert.ok(!steps.at(-1).optional, `${page}: submission is the last required step`);
  assert.ok(steps.at(-1).submission && steps.at(-1).response, `${page}: exit requires an answer and submission confirmation`);
  const referenceIds = [...html.matchAll(/<details id="(route-lesson-(?:objectives|key-points))"/g)].map(([, id]) => `#${id}`);
  assert.deepEqual(Array.from(references), referenceIds, `${page}: lesson references belong in the header`);
  assert.ok(steps.every(step => (step.anchors || []).every(anchor => !referenceIds.includes(anchor))), `${page}: references should remain available during each step`);
  for (const step of steps.slice(1)) {
    assert.ok(step.todo && step.todo.length > 8, `${page} / ${step.title}: needs a clear instruction`);
    assert.ok(Array.isArray(step.checks) && step.checks.length, `${page} / ${step.title}: needs completion checks`);
    assert.ok(Array.isArray(step.hints) && step.hints.length, `${page} / ${step.title}: needs at least one hint`);
    assert.ok(step.activity?.selector && step.activity?.pending || step.response, `${page} / ${step.title}: needs observable work or a written answer`);
    if (step.anchors?.length > 1) {
      assert.equal(step.parts.reduce((count, part) => count + (part.anchorCount || 1), 0), step.anchors.length);
      assert.ok(step.parts.every(part => part.title && part.todo));
    }
  }
  if (html.includes('curriculum-labs.js')) assert.ok(steps.some(step => (step.anchors || []).includes('#curriculum-lab')));
  const simulators = new Set(['#block-program', ...Object.keys(extraPrograms || {}).map(id => '#' + id)]);
  const generated = new Map([['#learning-guide', 'learning-guides.js'], ['#adaptive-practice', 'adaptive-practice.js'], ['#curriculum-lab', 'curriculum-labs.js'], ['#sorting-lab', 'curriculum-labs.js']]);
  for (const locator of steps.flatMap(step => [...(step.anchors || []), ...(step.parts || []).flatMap(part => part.anchors || [])])) {
    const selectors = typeof locator === 'string' ? [locator] : locator.common || [locator.up];
    for (const selector of selectors) {
      assert.match(selector, /^#[\w-]+$/, `${page}: use a fixed ID`);
      if (simulators.has(selector)) {
        assert.ok(html.includes('src="lesson-route.js"'));
      } else if (generated.has(selector)) {
        const file = generated.get(selector);
        assert.ok(html.includes(`src="${file}"`));
        assert.ok(read(file).includes(`.id = '${selector.slice(1)}'`));
      } else {
        assert.equal(html.split(`id="${selector.slice(1)}"`).length - 1, 1, `${page}: missing or duplicate ${selector}`);
      }
    }
  }
  const lesson = Number(page[6]);
  assert.equal(next?.href, lesson < 6 ? `1150${page[4]}0${lesson + 1}.html` : undefined);
  assert.equal(teacherFinish.href, `1150${page[4]}00.html`);
}

// Exercise the student view across a task with two interactive panels.
{
  function element(parent) {
    const children = [];
    const attrs = new Set();
    const listeners = {};
    const button = {};
    const message = {};
    const flowContent = {};
    const node = {
      children, parentElement: parent, isConnected: true,
      classList: { add() {} }, style: { setProperty() {} },
      contains: other => other === node || children.some(child => child.contains(other)),
      setAttribute: name => attrs.add(name), removeAttribute: name => attrs.delete(name),
      hasAttribute: name => attrs.has(name),
      toggleAttribute(name, on) { if (on) attrs.add(name); else attrs.delete(name); },
      after(...siblings) { for (const sibling of siblings) sibling.parentElement = node.parentElement; },
      append(child) { child.parentElement = node; },
      before() {}, querySelectorAll: () => [],
      querySelector: selector => ({ '[data-action="done"]': button, '.lesson-route__msg': message, '[data-flow-hint-content]': flowContent })[selector],
      addEventListener: (name, callback) => { listeners[name] = callback; },
      showModal() { this.open = true; },
      close() { this.open = false; listeners.close?.(); },
      action: name => listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: name } } : null } }),
      node: index => listeners.click({ target: { closest: () => ({ dataset: { node: String(index) } }) } }),
      compareDocumentPosition: () => 0,
      button
    };
    if (parent) parent.children.push(node);
    return node;
  }
  const body = element();
  const intro = element(body);
  const guide = element(body);
  const main = element(body);
  const firstFrame = element(main);
  const secondFrame = element(body);
  const first = element(firstFrame);
  const flowControls = element(first);
  const second = element(secondFrame);
  const practice = element(body);
  const legacy = element(main);
  const start = element(guide);
  let advanceOpening;
  start.addEventListener = (_, callback) => { advanceOpening = callback; };
  const lookup = new Map([['main', main], ['#learning-guide', guide], ['[data-lesson-start]', start], ['#first', first],
    ['#flow-controls', flowControls], ['#second', second], ['#block-program', practice]]);
  const created = [];
  const document = {
    body, querySelector: selector => lookup.get(selector),
    getElementById: id => id === 'learning-guide-heading' ? intro : undefined,
    createElement: () => { const node = element(); created.push(node); return node; }
  };
  let refresh;
  let savedRoute;
  const flowTimers = new Set();
  const reviewed = [];
  const window = { TeacherDemo: { isOn: () => false }, dispatchEvent() {} };
  vm.runInNewContext(read('lesson-route.js'), {
    window, document, location: { pathname: '/test.html' },
    localStorage: { getItem: () => savedRoute, setItem: (_, value) => { savedRoute = value; } },
    MutationObserver: class { constructor(callback) { refresh = callback; } observe() {} },
    setTimeout(callback, delay) {
      if (delay === 5000) { flowTimers.add(callback); return callback; }
      callback();
      return 0;
    }, clearTimeout: callback => flowTimers.delete(callback), requestAnimationFrame() {}, Event: class {}, Node: {}
  });
  const config = { steps: [
    { title: '看任務', anchors: ['#learning-guide'] },
    { title: '完成兩項操作', anchors: ['#first'], review: reviewing => reviewed.push(reviewing),
      parts: [
        { title: '第一項', nextLabel: '開始實作', completionAnchor: '#flow-controls',
          reviewTodo: '重新排列流程圖', reviewNextLabel: '重做積木實作',
          activity: { selector: '#first-passed', pending: '先完成第一項。' } },
        { title: '第二項', anchors: ['#second'], resume: true }
      ],
      activity: { selector: '#both-passed', pending: '先完成兩項。' } },
    { title: '再做一題' },
    { title: '積木程式實作', anchors: ['#block-program'], activity: { selector: '#practice-passed', pending: '先比對積木。' } },
    { title: '選做', optional: true },
    { title: '交件' }
  ] };
  window.LessonRoute.start(config);
  const [panel, completion, progress] = created;
  const hidden = item => item.hasAttribute('data-route-locked') || item.hasAttribute('data-route-outside-task') ||
    Boolean(item.parentElement && hidden(item.parentElement));
  assert.equal(hidden(intro), false);
  assert.ok(hidden(first) && hidden(second));
  advanceOpening();
  assert.ok(hidden(intro) && hidden(guide) && hidden(second) && hidden(legacy));
  assert.equal(hidden(first), false);
  assert.equal(completion.parentElement, flowControls);
  assert.match(completion.innerHTML, /開始實作/);
  assert.equal(completion.button.disabled, true);
  lookup.set('#first-passed', first);
  refresh();
  assert.equal(completion.button.disabled, false);
  completion.action('done');
  assert.match(panel.innerHTML, /第二項/);
  assert.notEqual(completion.parentElement, flowControls);
  const paused = savedRoute;
  assert.equal(hidden(first), true);
  assert.equal(hidden(second), false);
  assert.equal(completion.button.disabled, true);
  completion.action('previous-part');
  assert.equal(reviewed.at(-1), true);
  assert.match(panel.innerHTML, /重新排列流程圖/);
  assert.doesNotMatch(panel.innerHTML, /重做積木實作/);
  assert.match(completion.innerHTML, /重做積木實作/);
  assert.equal(completion.parentElement, flowControls);
  assert.equal(completion.hidden, false);
  assert.ok(!hidden(first) && hidden(second));
  assert.equal(savedRoute, paused, 'review should keep the active part and its saved progress');
  completion.action('next-part');
  assert.equal(reviewed.at(-1), false);
  assert.ok(hidden(first) && !hidden(second));
  assert.equal(completion.button.disabled, true);
  lookup.set('#both-passed', second);
  completion.action('done');
  assert.ok(hidden(first) && hidden(second));
  progress.node(1);
  assert.equal(reviewed.at(-1), true);
  assert.ok(!hidden(first) && hidden(second));
  assert.doesNotMatch(completion.innerHTML, /data-action="review-program"/);
  lookup.delete('#first-passed');
  completion.action('next-part');
  assert.ok(hidden(first) && !hidden(second));
  assert.match(completion.innerHTML, /繼續：再做一題/);
  completion.action('review-next');
  assert.ok(hidden(first) && hidden(second));
  assert.match(completion.innerHTML, /前往積木程式實作/);
  completion.action('done');
  assert.equal(hidden(practice), false);
  assert.equal(completion.button.disabled, true);
  progress.node(1);
  completion.action('next-part');
  assert.match(completion.innerHTML, /繼續：積木程式實作/);
  completion.action('review-program');
  assert.equal(hidden(practice), false);
  assert.equal(completion.button.disabled, true);
  lookup.set('#practice-passed', practice);
  completion.action('done');
  completion.action('skip');
  assert.match(panel.innerHTML, /交件/);
  completion.action('done');
  const finished = savedRoute;
  progress.node(1);
  completion.action('next-part');
  assert.match(completion.innerHTML, /重做積木實作/);
  completion.action('review-program');
  assert.equal(hidden(practice), false);
  assert.match(completion.innerHTML, /回看：交件/);
  assert.doesNotMatch(completion.innerHTML, /回看：選做/);
  completion.action('review-next');
  assert.equal(hidden(practice), true);
  assert.match(completion.innerHTML, /回到終點/);
  completion.action('resume');
  assert.match(panel.innerHTML, /本課學習路線已完成/);
  assert.equal(savedRoute, finished, 'replaying an activity should preserve the completed route');
  savedRoute = paused;
  lookup.delete('#both-passed');
  config.steps[1].parts[1].flowHint = () => '<p>提示圖</p>';
  window.LessonRoute.start(config);
  const [resumedPanel, resumedCompletion] = created.slice(3);
  assert.match(resumedPanel.innerHTML, /第二項/);
  assert.ok(hidden(first) && !hidden(second));
  assert.match(resumedCompletion.innerHTML, /流程圖提示/);
  assert.doesNotMatch(resumedCompletion.innerHTML, /回看前一小步/);
  resumedCompletion.action('flow-hint');
  const dialog = created.at(-1);
  assert.equal(dialog.open, true);
  assert.equal(dialog.querySelector('[data-flow-hint-content]').innerHTML, '<p>提示圖</p>');
  assert.equal(flowTimers.size, 1);
  dialog.close();
  assert.equal(flowTimers.size, 0);
  resumedCompletion.action('flow-hint');
  assert.equal(created.at(-1), dialog);
  assert.equal(dialog.open, true);
  assert.equal(flowTimers.size, 1);
  const [autoClose] = flowTimers;
  autoClose();
  assert.equal(dialog.open, false);
  assert.equal(flowTimers.size, 0);
  assert.ok(hidden(first) && !hidden(second));
  assert.equal(resumedCompletion.button.disabled, true);
  assert.equal(savedRoute, paused);
}

// CodeGame keeps its own guided route. Python Lab offers independent units.
const codegame = read('codegame/lightbot.js');
assert.match(codegame, /function levelOpen\(item\)/);
assert.match(codegame, /button\.disabled = !open/);
assert.match(codegame, /function stuckHint\(\)/);
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
assert.match(read('teacher-resources.html'), /id="teacher-demo-toggle"/);
assert.match(read('lesson-route.js'), /const missing = demo \? \[\]/, 'demo mode should not require ticking completion checks');

console.log('learning routes: 12 block programming lessons and CodeGame use guided paths; Python Lab keeps teacher-demo support');
