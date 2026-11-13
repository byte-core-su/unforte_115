const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const CourseScenarios = require('../course-scenarios.js');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const guides = fs.readFileSync(path.join(root, 'learning-guides.js'), 'utf8');
const records = fs.readFileSync(path.join(root, 'STUDENT_RECORDS.md'), 'utf8');
assert.match(records, /第 4 課｜不重複抽取\n<!-- assessment:g8-04 -->/);
const recordPage = fs.readFileSync(path.join(root, 'student-records.html'), 'utf8');
const routes = fs.readFileSync(path.join(root, 'lesson-routes.js'), 'utf8');
const assessments = fs.readFileSync(path.join(root, 'lesson-assessments.js'), 'utf8');
execFileSync(process.execPath, [path.join(root, 'scripts/build-lesson-plans.cjs'), '--check'], { cwd: root });

for (const grade of [7, 8]) {
  for (let lesson = 1; lesson <= 6; lesson++) {
    const page = `1150${grade}0${lesson}.html`;
    const section = { setAttribute() {} };
    const main = { parentNode: { insertBefore(node) { assert.equal(node, section); } } };
    const document = { querySelector: () => main, createElement: () => section, body: { classList: { add() {} } } };
    const id = `g${grade}-0${lesson}`;
    const module = require(`../modules/${id}.json`);
    const location = { pathname: `/${page}` };
    const window = { CourseScenarios, location };
    const context = vm.createContext({ document, window, location });
    vm.runInContext(assessments, context);
    vm.runInContext(guides, context);
    vm.runInContext(fs.readFileSync(path.join(root, 'lesson-labels.js'), 'utf8'), context);
    vm.runInContext(routes, context);
    const steps = window.LessonRoutes[page];
    const exit = steps.at(-1);
    const planPage = fs.readFileSync(path.join(root, `lesson-plan-grade-${grade}.html`), 'utf8');
    const planSection = planPage.split(`id="lesson-${lesson}"`)[1].split(/<h[23][ >]/)[0];
    const recordSection = recordPage.split(`id="${id}"`)[1].split(/<div class="lesson-record"|<\/article>/)[0];
    for (const html of [section.innerHTML, planSection, recordSection]) {
      assert.ok(html.includes(CourseScenarios.escapeHtml(module.evidence)), `${id}: same required work`);
      assert.ok(html.includes(CourseScenarios.escapeHtml(module.successCriteria)), `${id}: same criteria`);
    }
    const title = CourseScenarios.escapeHtml(module.title);
    assert.ok(fs.readFileSync(path.join(root, page), 'utf8').includes(`<title>${title}｜資訊科技課程</title>`));
    for (const html of [section.innerHTML, planSection, recordSection]) assert.ok(html.includes(title), `${id}: same formal title`);
    for (const html of [section.innerHTML, planSection]) assert.ok(html.includes(`${module.periods} 節`), `${id}: same periods`);
    for (const step of steps.filter(step => step.optional)) assert.ok(planSection.includes(CourseScenarios.escapeHtml(step.title)));
    assert.ok(exit.todo.includes(module.evidence));
    assert.equal(exit.checks[0], module.successCriteria);
    assert.equal(exit.link.href, module.resources.records);
    assert.match(section.innerHTML, /class="learning-guide__exit"/, `${page}: each lesson should render an exit task`);
    assert.match(section.innerHTML, /回班級平台繳交/);
    assert.match(section.innerHTML, new RegExp(`href="student-records\\.html#${id}"[^>]*>打開學習紀錄表`));
    assert.match(section.innerHTML, new RegExp(`href="lesson-plan-grade-${grade}\\.html#lesson-${lesson}"[^>]*>教師備課：本課教案`), `${page}: teachers should reach this lesson's plan`);
    assert.match(section.innerHTML, /網頁作答用來練習，正式成績依老師說明/);
  }
  const filename = `lesson-plan-grade-${grade}.html`;
  const html = fs.readFileSync(path.join(root, filename), 'utf8');
  const map = home.match(new RegExp(`<article class="curriculum-grade curriculum-grade-${grade}"[^>]*>([\\s\\S]*?)<\\/article>`))?.[1];
  const resources = home.match(new RegExp(`<div id="grade-${grade}"[^>]*>([\\s\\S]*?)<\\/div>`))?.[1];
  assert.ok(map, `grade ${grade} home map should exist`);
  assert.ok(resources, `grade ${grade} teaching resources should exist`);
  assert.match(map, new RegExp(`href="1150${grade}00.html"`));
  assert.match(resources, new RegExp(`href="${filename}"`));
  assert.equal((html.match(/<h1>/g) || []).length, 1, `${filename} should have one H1`);
  assert.equal((html.match(/<h3 id="lesson-[1-6]">第 [1-6] 課/g) || []).length, 6, `${filename} should include six anchored lessons`);
  for (let lesson = 1; lesson <= 6; lesson++) assert.match(html, new RegExp(`<a href="#lesson-${lesson}">第 ${lesson} 課</a>`));
  assert.match(html, /<h2 id="section-4">評量方式<\/h2>/);
  assert.match(html, /4：能遷移與改良/);
  assert.match(html, /網頁不保存姓名或成績/);
  assert.match(html, /<div class="lesson-table-scroll"><table>/);

  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]));
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (href.startsWith('#')) {
      assert.ok(ids.has(href.slice(1)), `${filename} has a broken section link: ${href}`);
    } else if (!/^(?:https?:|mailto:)/.test(href)) {
      assert.ok(fs.existsSync(path.join(root, href.split('#')[0])), `${filename} has a missing local link: ${href}`);
    }
  }
}

// Shared teaching documents are rendered pages, not raw Markdown, wherever teachers click them.
for (const [source, page, heading] of [['STUDENT_RECORDS.md', 'student-records.html', '第 6 課｜參數測試與資料應用'], ['CURRICULUM_ALIGNMENT.md', 'curriculum-alignment.html', '官方來源與引用方式']]) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert.ok(html.includes(heading), `${page} should be built from ${source}`);
  assert.match(home, new RegExp(`href="${page}"`), `home should link ${page}`);
  assert.doesNotMatch(home, new RegExp(`href="${source}"`), `home should not link raw ${source}`);
  for (const [, href] of html.matchAll(/href="([^"#]+)/g)) {
    if (!/^(?:https?:|mailto:)/.test(href)) assert.ok(fs.existsSync(path.join(root, href)), `${page} has a missing local link: ${href}`);
  }
}
assert.match(recordPage, /複製本課紀錄與要求/);

console.log('lesson plan pages and links passed');
