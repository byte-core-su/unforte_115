const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const CourseScenarios = require('../course-scenarios.js');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const prep = fs.readFileSync(path.join(root, 'teacher-resources.html'), 'utf8');
const guides = fs.readFileSync(path.join(root, 'learning-guides.js'), 'utf8');
const records = fs.readFileSync(path.join(root, 'STUDENT_RECORDS.md'), 'utf8');
assert.match(records, /第 4 課｜不重複抽取\n<!-- assessment:g8-04 -->/);
const recordIndex = fs.readFileSync(path.join(root, 'student-records.html'), 'utf8');
assert.equal((recordIndex.match(/href="student-record-g[78]-0[1-6]\.html"/g) || []).length, 12);
assert.doesNotMatch(recordIndex, /class="lesson-record" id=/);
const routes = fs.readFileSync(path.join(root, 'lesson-routes.js'), 'utf8');
const assessments = fs.readFileSync(path.join(root, 'lesson-assessments.js'), 'utf8');
execFileSync(process.execPath, [path.join(root, 'scripts/build-lesson-plans.cjs'), '--check'], { cwd: root });

for (const grade of [7, 8]) {
  const overview = fs.readFileSync(path.join(root, `1150${grade}00.html`), 'utf8');
  assert.doesNotMatch(overview, /href="[^"]*(?:lesson-plan-grade|student-records|teacher-resources)\b/);
  assert.match(prep, new RegExp(`href="student-records\\.html#grade-${grade}"`));
  const curriculumMap = fs.readFileSync(path.join(root, 'curriculum-map.html'), 'utf8');
  for (let lesson = 1; lesson <= 6; lesson++) {
    const page = `1150${grade}0${lesson}.html`;
    const videoCard = { append(node) { assert.equal(node, player); } };
    const mission = { setAttribute() {}, querySelector: () => videoCard };
    const section = { setAttribute() {}, querySelector: () => ({ remove() {}, addEventListener() {} }), before(node) { assert.equal(node, mission); } };
    const player = { querySelector: () => ({ addEventListener() {} }), addEventListener() {} };
    const main = { parentNode: { insertBefore(node) { assert.equal(node, section); } } };
    const elements = [section, mission, player];
    const document = { querySelector: selector => selector === 'main' ? main : null, createElement: () => elements.shift(), body: { classList: { add() {} } } };
    const id = `g${grade}-0${lesson}`;
    const module = require(`../modules/${id}.json`);
    const location = { pathname: `/${page}` };
    const window = { CourseScenarios, location };
    const context = vm.createContext({ document, window, location });
    vm.runInContext(assessments, context);
    vm.runInContext(guides, context);
    assert.match(player.innerHTML, /<video controls playsinline preload="none"><\/video>/, `${id}: optional inline concept video`);
    assert.equal((player.innerHTML.match(/<option /g) || []).length, ['g7-02', 'g8-01'].includes(id) ? 3 : 0);
    vm.runInContext(fs.readFileSync(path.join(root, 'lesson-labels.js'), 'utf8'), context);
    vm.runInContext(routes, context);
    const steps = window.LessonRoutes[page];
    const exit = steps.at(-1);
    const planPage = fs.readFileSync(path.join(root, `lesson-plan-grade-${grade}.html`), 'utf8');
    const planSection = planPage.split(`id="lesson-${lesson}"`)[1].split(/<h[23][ >]/)[0];
    assert.equal(module.resources.records, `student-record-${id}.html`);
    assert.ok(recordIndex.includes(`id="${id}"><a href="${module.resources.records}"`), `${id}: keep the directory entry and old anchor`);
    const recordPage = fs.readFileSync(path.join(root, module.resources.records), 'utf8');
    assert.deepEqual([...recordPage.matchAll(/class="lesson-record" id="([^"]+)"/g)].map(([, value]) => value), [id]);
    assert.ok(recordPage.includes(`href="${page}">回到本課教材`), `${id}: link back to lesson`);
    assert.match(recordPage, /複製本課紀錄與要求/);
    const recordSection = recordPage.split(`id="${id}"`)[1].split('</article>')[0];
    const overviewCard = overview.split(`href="${page}"`)[1].split('</a>')[0];
    const mapCard = curriculumMap.split(`href="${page}"`)[1].split('</a>')[0];
    for (const html of [section.innerHTML, planSection, recordSection, overviewCard, mapCard]) {
      const list = html.match(/<ul class="evidence-list" role="list">([\s\S]*?)<\/ul>/)?.[1];
      assert.ok(list, `${id}: required work should be a list`);
      assert.deepEqual([...list.matchAll(/<li>([^<]+)<\/li>/g)].map(([, item]) => item),
        module.evidence.map(CourseScenarios.escapeHtml), `${id}: same required work`);
    }
    for (const html of [planSection, recordSection]) {
      assert.ok(html.includes(CourseScenarios.escapeHtml(module.successCriteria)), `${id}: same criteria`);
    }
    const title = CourseScenarios.escapeHtml(module.title);
    assert.ok(fs.readFileSync(path.join(root, page), 'utf8').includes(`<title>${title}｜資訊科技課程</title>`));
    const studentHeading = mission.innerHTML;
    for (const html of [studentHeading, planSection, recordPage]) assert.ok(html.includes(title), `${id}: same formal title`);
    assert.ok(studentHeading.includes(CourseScenarios.escapeHtml(CourseScenarios.active.grades[grade].cards[lesson - 1].title)));
    assert.match(studentHeading, /<h1 id="learning-guide-title">[^<]+<\/h1>\s*<p>[^<]+<\/p>/);
    assert.doesNotMatch(section.innerHTML, /<h1/);
    if (id === 'g8-04') {
      assert.match(studentHeading, /招募先遣隊（不重複的隨機抽取）[\s\S]*替先遣隊抽出四名不同的隊員/);
    }
    assert.ok(planSection.includes(`href="${module.resources.records}"`), `${id}: plan links to its own record page`);
    assert.ok(planSection.includes(`${module.periods} 節`), `${id}: recommended periods remain in the plan`);
    for (const period of [1, 2]) {
      const required = steps.slice(1).filter(step => step.period === period && !step.optional).map(step => CourseScenarios.escapeHtml(step.title));
      assert.ok(planSection.includes(`<strong>第 ${period} 節</strong> ${required.join(' → ')}`), `${id}: pacing matches the route`);
    }
    assert.ok(recordSection.includes(CourseScenarios.escapeHtml(exit.response)), `${id}: record and exit prompt agree`);
    const optionalActivities = steps.filter(step => step.optional).map(step => CourseScenarios.escapeHtml(step.title));
    const optionalRow = planSection.match(/<p><strong>選做活動<\/strong> (.*?)<\/p>/);
    assert.equal(optionalRow?.[1], optionalActivities.length ? optionalActivities.join('、') : undefined, `${id}: optional activities match the student route`);
    if (module.activity) {
      const preview = steps.find(step => step.todo === module.activity.preview);
      const practice = steps.find(step => step.todo === module.activity.practice);
      assert.equal(preview?.questions.before, module.activity.questions.before);
      assert.equal(preview?.questions.during, module.activity.questions.during);
      assert.equal(practice?.questions.after, module.activity.questions.after);
      assert.equal(practice.link, undefined, `${id}: the record template stays in teacher prep`);
      for (const question of Object.values(module.activity.questions)) {
        assert.ok(planSection.includes(CourseScenarios.escapeHtml(question)));
        assert.ok(recordSection.includes(CourseScenarios.escapeHtml(question)));
      }
      for (const instruction of [module.activity.preview, module.activity.practice]) {
        assert.ok(planSection.includes(CourseScenarios.escapeHtml(instruction)));
      }
    }
    assert.deepEqual(Array.from(exit.evidence), module.evidence);
    assert.equal(exit.checks[0], module.successCriteria);
    assert.ok(steps.every(step => !step.link), `${id}: the student route stays on the lesson page`);
    assert.match(exit.todo, /班級平台.*繳交/);
    assert.ok(prep.includes(`href="${module.resources.records}"`), `${id}: teachers can reach the record template`);
    assert.match(section.innerHTML, /從哪裡開始[\s\S]*最後交什麼/);
    assert.match(section.innerHTML, /data-lesson-start/);
    assert.doesNotMatch(section.innerHTML, /怎樣算達標|離堂檢核/);
    const teacherResources = /href="[^"]*(?:lesson-plan-grade|student-record|teacher-resources)\b|教師備課：本課教案/;
    assert.doesNotMatch(section.innerHTML, teacherResources, `${page}: start guide only shows student materials`);
    assert.doesNotMatch(studentHeading, teacherResources, `${page}: student heading has no teacher resource links`);
  }
  const filename = `lesson-plan-grade-${grade}.html`;
  const html = fs.readFileSync(path.join(root, filename), 'utf8');
  const map = home.match(new RegExp(`<article class="curriculum-grade curriculum-grade-${grade}"[^>]*>([\\s\\S]*?)<\\/article>`))?.[1];
  const resources = prep.match(new RegExp(`<div id="grade-${grade}"[^>]*>([\\s\\S]*?)<\\/div>`))?.[1];
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
for (const [source, page, heading] of [['STUDENT_RECORDS.md', 'student-records.html', '七、八年級課程學習紀錄表'], ['CURRICULUM_ALIGNMENT.md', 'curriculum-alignment.html', '官方來源與引用方式']]) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert.ok(html.includes(heading), `${page} should be built from ${source}`);
  assert.match(prep, new RegExp(`href="${page}"`), `teacher prep should link ${page}`);
  assert.doesNotMatch(prep, new RegExp(`href="${source}"`), `teacher prep should link the rendered page for ${source}`);
  for (const [, href] of html.matchAll(/href="([^"#]+)/g)) {
    if (!/^(?:https?:|mailto:)/.test(href)) assert.ok(fs.existsSync(path.join(root, href)), `${page} has a missing local link: ${href}`);
  }
}

console.log('lesson plan pages and links passed');
