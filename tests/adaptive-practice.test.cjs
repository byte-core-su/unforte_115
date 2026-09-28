const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createQuestion, gradeAttempt } = require('../adaptive-practice.js');

const root = path.resolve(__dirname, '..');
for (const grade of [7, 8]) {
  for (let lesson = 1; lesson <= 6; lesson++) {
    const page = `1150${grade}0${lesson}.html`;
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /<script src="adaptive-practice\.js" defer><\/script>/, `${page} should load adaptive practice`);
    for (const level of [1, 2, 3]) {
      for (const fixed of [0, 0.25, 0.5, 0.75, 0.999999]) {
        const item = createQuestion(page, level, () => fixed);
        assert.ok(item.prompt.length > 15, `${page} should have a meaningful prompt`);
        assert.equal(item.choices.length, 4, `${page} level ${level} should have four choices`);
        assert.equal(new Set(item.choices).size, 4, `${page} level ${level} should not duplicate answers`);
        assert.ok(item.answer >= 0 && item.answer < 4);
        assert.equal(item.hints.length, 2);
        assert.ok(item.explanation.length > 5);
      }
      let seed = 17;
      const random = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
      for (let index = 0; index < 100; index++) createQuestion(page, level, random);
    }
  }
}

const base = { level: 1, streak: 0, attempts: 0, resolved: false };
const first = gradeAttempt(base, true);
assert.equal(first.streak, 1);
assert.equal(first.level, 1);
const promoted = gradeAttempt({ ...first, resolved: false, attempts: 0 }, true);
assert.equal(promoted.level, 2);
assert.equal(promoted.streak, 0);
const retry = gradeAttempt(base, false);
assert.equal(retry.level, 1);
assert.equal(retry.attempts, 1);
assert.equal(retry.resolved, false);
const fallback = gradeAttempt({ ...retry, level: 2 }, false);
assert.equal(fallback.level, 1);
assert.equal(fallback.resolved, true);
assert.equal(gradeAttempt({ ...base, level: 3, streak: 1 }, true).level, 3, 'challenge is the maximum level');
assert.equal(gradeAttempt({ ...base, resolved: true }, false).attempts, 0, 'resolved question cannot be graded twice');

const source = fs.readFileSync(path.join(root, 'adaptive-practice.js'), 'utf8');
assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|XMLHttpRequest/, 'practice should not persist or transmit answers');

// Mount the browser UI with a tiny DOM stand-in and exercise its feedback loop.
const elements = new Map();
const element = selector => {
  if (!elements.has(selector)) elements.set(selector, {
    textContent: '', innerHTML: '', disabled: false, listeners: {},
    addEventListener(type, callback) { this.listeners[type] = callback; },
    querySelector() { return this.selected || null; }
  });
  return elements.get(selector);
};
const levelButtons = [1, 2, 3].map(level => ({ dataset: { level: String(level) }, setAttribute() {} }));
const section = {
  innerHTML: '', className: '', setAttribute() {},
  querySelector: element,
  querySelectorAll() { return levelButtons; }
};
let inserted = false;
const main = { nextSibling: null, parentNode: { insertBefore(node) { inserted = node === section; } } };
const document = { querySelector: selector => selector === 'main' ? main : null, createElement: () => section };
const predictableMath = Object.create(Math);
predictableMath.random = () => 0;
vm.runInNewContext(source, { document, window: { location: { pathname: '/1150703.html' } }, Math: predictableMath });
assert.ok(inserted, 'practice card should be inserted beside the lesson main');
assert.match(element('.adaptive-practice__prompt').textContent, /正 .*邊形/);
let item = createQuestion('1150703.html', 1, () => 0);
element('.adaptive-practice__choices').selected = { value: String(item.answer) };
element('.adaptive-practice__check').listeners.click();
assert.match(element('.adaptive-practice__feedback').textContent, /首次答對/);
element('.adaptive-practice__next').listeners.click();
element('.adaptive-practice__choices').selected = { value: String(item.answer) };
element('.adaptive-practice__check').listeners.click();
assert.match(element('.adaptive-practice__status').textContent, /標準/);
element('.adaptive-practice__levels').listeners.click({ target: { dataset: { level: '3' } } });
item = createQuestion('1150703.html', 3, () => 0);
element('.adaptive-practice__choices').selected = { value: String((item.answer + 1) % 4) };
element('.adaptive-practice__check').listeners.click();
assert.match(element('.adaptive-practice__feedback').textContent, /可修改選擇後再檢查/);
element('.adaptive-practice__check').listeners.click();
assert.match(element('.adaptive-practice__status').textContent, /標準/);
assert.equal(element('.adaptive-practice__check').disabled, true);
console.log('adaptive practice for all 12 lessons passed');
