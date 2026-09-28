const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

for (const grade of [7, 8]) {
  const source = fs.readFileSync(path.join(root, `LESSON_PLAN_GRADE_${grade}.md`), 'utf8');
  const filename = `lesson-plan-grade-${grade}.html`;
  const html = fs.readFileSync(path.join(root, filename), 'utf8');
  const card = home.match(new RegExp(`<article id="grade-${grade}"([\\s\\S]*?)<\\/article>`))?.[1];
  assert.ok(card, `grade ${grade} home card should exist`);
  assert.match(card, new RegExp(`href="1150${grade}00.html"`));
  assert.match(card, new RegExp(`href="${filename}"`));
  assert.equal((html.match(/<h1>/g) || []).length, 1, `${filename} should have one H1`);
  assert.equal((html.match(/<h3>第 [1-6] 課/g) || []).length, 6, `${filename} should include six lessons`);
  assert.match(html, /<h2 id="section-4">評量方式<\/h2>/);
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

console.log('lesson plan pages and links passed');
