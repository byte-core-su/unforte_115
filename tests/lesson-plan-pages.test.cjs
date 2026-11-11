const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const CourseScenarios = require('../course-scenarios.js');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const guides = fs.readFileSync(path.join(root, 'learning-guides.js'), 'utf8');
const records = fs.readFileSync(path.join(root, 'STUDENT_RECORDS.md'), 'utf8');
assert.match(records, /七年級：第 2–5 課離堂任務/);
assert.match(records, /八年級：音符清單與索引/);

for (const grade of [7, 8]) {
  for (let lesson = 1; lesson <= 6; lesson++) {
    const page = `1150${grade}0${lesson}.html`;
    const section = { setAttribute() {} };
    const main = { parentNode: { insertBefore(node) { assert.equal(node, section); } } };
    const document = { querySelector: () => main, createElement: () => section, body: { classList: { add() {} } } };
    vm.runInNewContext(guides, { document, window: { CourseScenarios, location: { pathname: `/${page}` } } });
    assert.match(section.innerHTML, /class="learning-guide__exit"/, `${page}: each lesson should render an exit task`);
    assert.match(section.innerHTML, /回班級平台繳交/);
    assert.match(section.innerHTML, /href="student-records\.html"[^>]*>查看學習紀錄模板/);
    assert.match(section.innerHTML, new RegExp(`href="lesson-plan-grade-${grade}\\.html#lesson-${lesson}"[^>]*>教師備課：本課教案`), `${page}: teachers should reach this lesson's plan`);
    assert.match(section.innerHTML, /網頁答對或闖關成功不等於正式成績/);
  }
  const source = fs.readFileSync(path.join(root, `LESSON_PLAN_GRADE_${grade}.md`), 'utf8');
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

  const markdownLessonTitles = [...source.matchAll(/^### (第 [1-6] 課.+)$/gm)].map(match => match[1]);
  markdownLessonTitles.forEach(title => assert.ok(html.includes(title), `${filename} is missing ${title}`));
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
for (const [source, page, heading] of [['STUDENT_RECORDS.md', 'student-records.html', '七年級：防禦網參數與資料分析'], ['CURRICULUM_ALIGNMENT.md', 'curriculum-alignment.html', '官方來源與引用方式']]) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert.ok(html.includes(heading), `${page} should be built from ${source}`);
  assert.match(home, new RegExp(`href="${page}"`), `home should link ${page}`);
  assert.doesNotMatch(home, new RegExp(`href="${source}"`), `home should not link raw ${source}`);
  for (const [, href] of html.matchAll(/href="([^"#]+)/g)) {
    if (!/^(?:https?:|mailto:)/.test(href)) assert.ok(fs.existsSync(path.join(root, href)), `${page} has a missing local link: ${href}`);
  }
}
assert.match(fs.readFileSync(path.join(root, 'student-records.html'), 'utf8'), /複製表格/);

console.log('lesson plan pages and links passed');
