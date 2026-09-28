const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'curriculum-labs.js'), 'utf8');

function loadLab(page) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) {
      elements.set(id, {
        innerHTML: '', textContent: '', value: '', listeners: {},
        addEventListener(type, callback) { this.listeners[type] = callback; },
        click() { this.listeners.click?.(); }
      });
    }
    return elements.get(id);
  };
  const section = {
    className: '', innerHTML: '',
    setAttribute() {},
    querySelector(selector) { return selector === '[data-quiz]' ? null : element(selector); }
  };
  const main = { appendChild() {} };
  const document = {
    querySelector(selector) { return selector === 'main' ? main : null; },
    createElement() { return section; }
  };
  vm.runInNewContext(source, { document, window: { location: { pathname: `/${page}` } }, Math });
  return element;
}

{
  const get = loadLab('1150706.html');
  const result = get('#g7-data-result');
  assert.match(result.innerHTML, /練習題/);
  assert.match(result.innerHTML, /防護強度門檻/);
  const first = result.innerHTML;
  get('#g7-data-new').click();
  assert.notEqual(result.innerHTML, first, 'new data challenge should differ');
  get('#g7-data-demo').click();
  assert.match(result.innerHTML, /固定示範/);
  assert.match(result.innerHTML, /<td>A<\/td><td>4<\/td><td>1<\/td>/);
  get('#g7-data-query').value = 'B';
  get('#g7-data-run').click();
  assert.match(result.innerHTML, /共 1 筆/);
  get('#g7-data-new').click();
  assert.match(result.innerHTML, /先算出各筆消耗量/);
  get('#g7-data-run').click();
  const threshold = Number(result.innerHTML.match(/門檻為 (\d+)/)[1]);
  const rows = [...result.innerHTML.matchAll(/<tr><td>[A-D]<\/td><td>(\d+)<\/td><td>(\d+)<\/td><td>(是|否)<\/td><td>(\d+)<\/td><\/tr>/g)];
  assert.equal(rows.length, 4);
  rows.forEach(([, count, width, blocked, cost]) => {
    assert.equal(Number(cost), Number(count) * Number(width));
    assert.equal(blocked === '是', Number(cost) >= threshold);
  });
}

{
  const get = loadLab('1150801.html');
  const state = get('#g8-search-state');
  const first = state.textContent;
  assert.match(first, /練習題；清單：\[/);
  get('#g8-search-step').click();
  assert.match(state.textContent, /第 1 次比較/);
  get('#g8-search-reset').click();
  assert.equal(state.textContent, first, 'retry should preserve the case');
  get('#g8-search-new').click();
  assert.notEqual(state.textContent, first, 'new search case should differ');
  get('#g8-search-demo').click();
  assert.match(state.textContent, /固定示範；清單：\[能量電池、防護罩、修復劑、雷射槍\]/);
  get('#g8-search-step').click();
  get('#g8-search-step').click();
  assert.match(state.textContent, /找到，位置是第 2 項/);
  get('#g8-search-target').value = '不存在的裝備';
  get('#g8-search-reset').click();
  for (let i = 0; i < 4; i++) get('#g8-search-step').click();
  assert.match(state.textContent, /沒有找到/);
}

{
  const get = loadLab('1150805.html');
  const state = get('#g8-sort-state');
  const first = state.textContent;
  assert.match(first, /練習題；清單：\[/);
  get('#g8-sort-step').click();
  assert.match(state.textContent, /比較 1 次/);
  get('#g8-sort-reset').click();
  assert.equal(state.textContent, first, 'retry should restore the original values');
  get('#g8-sort-new').click();
  assert.notEqual(state.textContent, first, 'new sort case should differ');
  for (let i = 0; i < 15; i++) get('#g8-sort-step').click();
  assert.match(state.textContent, /排序完成/);
  get('#g8-sort-demo').click();
  assert.match(state.textContent, /固定示範；清單：\[7、3、5、1\]/);
}

console.log('curriculum-labs challenges passed');
