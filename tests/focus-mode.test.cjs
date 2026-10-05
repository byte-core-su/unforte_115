const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createFocusMode, createQuestion } = require('../adaptive-practice.js');
const source = fs.readFileSync(path.join(__dirname, '../adaptive-practice.js'), 'utf8');

test('focus mode measures absence, defaults off, and replaces once at 3 seconds', () => {
  let time = 0, replacements = 0, eligible = true;
  const mode = createFocusMode({ now: () => time, canReplace: () => eligible, replace: () => replacements++ });
  mode.update(true); time += 5000; mode.update(false);
  assert.equal(replacements, 0);
  mode.setEnabled(true);
  mode.update(true); time += 2999; mode.update(false);
  assert.equal(replacements, 0);
  mode.update(true); time += 1000; mode.update(true); time += 2000; mode.update(false);
  assert.equal(replacements, 1, 'repeated blur/hidden events must not restart the timer');
  mode.update(false);
  assert.equal(replacements, 1, 'focus/visible events must not replace twice');
  mode.update(true); time += 60000; mode.update(false);
  assert.equal(replacements, 2, 'long absences work without a background timer');
  eligible = false;
  mode.update(true); time += 5000; mode.update(false);
  assert.equal(replacements, 2, 'submitted questions are protected');
  eligible = true;
  mode.update(true); time += 5000; mode.setEnabled(false); mode.update(false);
  mode.setEnabled(true); mode.update(false);
  assert.equal(replacements, 2, 'disabling discards any pending absence');
  mode.update(true); time += 5000; mode.reset(); mode.update(false);
  assert.equal(replacements, 2, 'a new question discards the old absence');
});

function mount(page) {
  const elements = new Map();
  const node = () => ({
    textContent: '', disabled: false, checked: false, listeners: {}, selected: null,
    set innerHTML(value) { this.html = value; this.selected = null; },
    get innerHTML() { return this.html || ''; },
    addEventListener(type, callback) { this.listeners[type] = callback; },
    querySelector() { return this.selected; }, insertBefore() {}
  });
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, node());
    return elements.get(selector);
  };
  const section = { ...node(), setAttribute() {}, querySelector: element,
    querySelectorAll: () => [1, 2, 3].map(level => ({ dataset: { level }, setAttribute() {} })) };
  const main = { parentNode: { insertBefore() {} } };
  let focused = true, time = 0, random = 0;
  const document = { hidden: false, listeners: {}, hasFocus: () => focused,
    querySelector: selector => selector === 'main' ? main : null,
    createElement: tag => tag === 'section' ? section : { ...node(), querySelector: element },
    addEventListener(type, callback) { this.listeners[type] = callback; } };
  const window = { location: { pathname: `/${page}` }, listeners: {},
    addEventListener(type, callback) { this.listeners[type] = callback; } };
  const math = Object.create(Math);
  math.random = () => random;
  vm.runInNewContext(source, { window, document, Math: math, performance: { now: () => time } });
  return { element, section,
    enable(value) { element('.adaptive-practice__focus-enabled').checked = value; element('.adaptive-practice__focus-enabled').listeners.change(); },
    blur() { focused = false; window.listeners.blur(); },
    focus() { focused = true; window.listeners.focus(); },
    hide() { document.hidden = true; document.listeners.visibilitychange(); },
    show() { document.hidden = false; document.listeners.visibilitychange(); },
    advance(ms) { time += ms; }, setRandom(value) { random = value; } };
}

test('a correct submitted answer keeps its explanation and promotion after focus returns', () => {
  const ui = mount('1150703.html'), el = ui.element;
  ui.enable(true);
  el('.adaptive-practice__choices').selected = { value: String(createQuestion('1150703.html', 1, () => 0).answer) };
  el('.adaptive-practice__check').listeners.click();
  const before = el('.adaptive-practice__prompt').textContent;
  const explanation = el('.adaptive-practice__feedback').textContent;
  const status = el('.adaptive-practice__status').textContent;
  ui.blur(); ui.advance(3000); ui.focus();
  assert.equal(el('.adaptive-practice__prompt').textContent, before);
  assert.equal(el('.adaptive-practice__feedback').textContent, explanation);
  assert.equal(el('.adaptive-practice__status').textContent, status);
  assert.equal(el('.adaptive-practice__check').disabled, true);
});

for (const grade of [7, 8]) for (let lesson = 1; lesson <= 6; lesson++) {
  const page = `1150${grade}0${lesson}.html`;
  test(`${page}: focus mode clears only unsubmitted choices, keeping level and streak`, () => {
    const ui = mount(page), el = ui.element;
    assert.match(ui.section.innerHTML, /本課自適應練習/);
    assert.equal(el('.adaptive-practice__focus-enabled').checked, false);
    let before = el('.adaptive-practice__prompt').textContent;
    ui.blur(); ui.advance(4000); ui.focus();
    assert.equal(el('.adaptive-practice__prompt').textContent, before);
    // Earn one first-attempt success, then preserve it when focus replaces the next question.
    el('.adaptive-practice__choices').selected = { value: String(createQuestion(page, 1, () => 0).answer) };
    el('.adaptive-practice__check').listeners.click();
    ui.setRandom(0.5); el('.adaptive-practice__next').listeners.click();
    const status = el('.adaptive-practice__status').textContent;
    assert.match(status, /1／2/);
    ui.enable(true);
    before = el('.adaptive-practice__prompt').textContent;
    el('.adaptive-practice__choices').selected = { value: '0' };
    ui.blur(); ui.hide(); ui.advance(2999); ui.show(); ui.focus();
    assert.equal(el('.adaptive-practice__prompt').textContent, before);
    assert.ok(el('.adaptive-practice__choices').selected);
    ui.blur(); ui.hide(); ui.advance(3000); ui.focus();
    assert.equal(el('.adaptive-practice__prompt').textContent, before, 'still hidden: do not replace yet');
    ui.show();
    assert.notEqual(el('.adaptive-practice__prompt').textContent, before);
    assert.equal(el('.adaptive-practice__choices').selected, null);
    assert.equal(el('.adaptive-practice__status').textContent, status);
    assert.equal(el('.adaptive-practice__check').disabled, false);
    assert.match(el('.adaptive-practice__focus-notice').textContent, /已更換未提交/);
    before = el('.adaptive-practice__prompt').textContent;
    ui.focus(); ui.show();
    assert.equal(el('.adaptive-practice__prompt').textContent, before);
    // Submit a wrong answer: its correction hint must survive an absence.
    el('.adaptive-practice__choices').selected = { value: '-1' };
    el('.adaptive-practice__check').listeners.click();
    const hint = el('.adaptive-practice__feedback').textContent;
    ui.blur(); ui.advance(5000); ui.focus();
    assert.equal(el('.adaptive-practice__prompt').textContent, before);
    assert.equal(el('.adaptive-practice__feedback').textContent, hint);
    el('.adaptive-practice__check').listeners.click();
    const explanation = el('.adaptive-practice__feedback').textContent;
    ui.blur(); ui.advance(5000); ui.focus();
    assert.equal(el('.adaptive-practice__feedback').textContent, explanation);
    assert.equal(el('.adaptive-practice__check').disabled, true);
    el('.adaptive-practice__next').listeners.click();
    ui.enable(false);
    before = el('.adaptive-practice__prompt').textContent;
    ui.hide(); ui.advance(5000); ui.show();
    assert.equal(el('.adaptive-practice__prompt').textContent, before);
    assert.match(el('.adaptive-practice__focus-notice').textContent, /已關閉/);
  });
}
