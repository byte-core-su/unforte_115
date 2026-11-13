const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const CourseScenarios = require('../course-scenarios.js');
const campus = require('./fixtures/campus-scenario.cjs');

const source = fs.readFileSync(path.join(__dirname, '..', 'curriculum-labs.js'), 'utf8');

function loadLab(page, scenario = CourseScenarios.active) {
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
  const window = { CourseScenarios: { ...CourseScenarios, active: scenario }, location: { pathname: `/${page}` } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../lesson-labels.js'), 'utf8'), { window });
  vm.runInNewContext(source, { document, window, Math });
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
  get('#g7-data-prediction').value = 'B';
  get('#g7-data-run').click();
  assert.match(result.innerHTML, /預測符合條件/);
  get('#g7-data-prediction').value = 'C';
  get('#g7-data-run').click();
  assert.match(result.innerHTML, /預測不同/);
  get('#g7-data-query').value = 'B';
  get('#g7-data-run').click();
  assert.match(result.innerHTML, /共 1 筆/);
  get('#g7-data-new').click();
  assert.match(result.innerHTML, /先算出各筆消耗量/);
  assert.equal(get('#g7-data-prediction').value, '', 'new data case should clear old prediction');
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
  get('#g8-search-prediction').value = '2';
  get('#g8-search-step').click();
  get('#g8-search-step').click();
  assert.match(state.textContent, /找到，位置是第 2 項/);
  assert.match(state.textContent, /預測正確/);
  get('#g8-search-target').value = '不存在的裝備';
  get('#g8-search-reset').click();
  for (let i = 0; i < 4; i++) get('#g8-search-step').click();
  assert.match(state.textContent, /沒有找到/);
  get('#g8-search-new').click();
  assert.equal(get('#g8-search-prediction').value, '', 'new search case should clear old prediction');
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
  get('#g8-sort-prediction').value = 'swap';
  get('#g8-sort-step').click();
  assert.match(state.textContent, /第一次預測正確/);
  get('#g8-sort-new').click();
  assert.equal(get('#g8-sort-prediction').value, '', 'new sort case should clear old prediction');
}

{
  const get = loadLab('1150801.html', campus);
  const state = get('#g8-search-state');
  get('#g8-search-demo').click();
  assert.match(state.textContent, /固定示範；清單：\[借書卡、預約單、修補膠帶、掃描器\]/);
  get('#g8-search-prediction').value = '2';
  get('#g8-search-step').click();
  get('#g8-search-step').click();
  assert.match(state.textContent, /找到，位置是第 2 項.*預測正確/);
  get('#g8-search-target').value = '推車';
  get('#g8-search-reset').click();
  for (let i = 0; i < 4; i++) get('#g8-search-step').click();
  assert.match(state.textContent, /已檢查 4 項，沒有找到/);
}

{
  const get = loadLab('1150706.html', campus);
  get('#g7-data-demo').click();
  get('#g7-data-prediction').value = 'B';
  get('#g7-data-run').click();
  const result = get('#g7-data-result').innerHTML;
  assert.match(result, /緩衝強度門檻為 15/);
  assert.match(result, /<th>攔住測試球<\/th>/);
  assert.match(result, /最省資源的是 B（消耗量 18）.*預測符合條件/);
}

{
  const get = loadLab('1150806.html', campus);
  const options = get('#g8-module-options');
  for (const name of campus.duel.modules) {
    assert.ok(options.innerHTML.includes(name));
    options.listeners.click({ target: { dataset: { module: name } } });
  }
  assert.match(get('#g8-module-state').textContent, /建立數字卡庫 → 洗牌數字卡 → 分配數字卡 → 逐項比較。順序正確/);
}

console.log('curriculum-labs challenges passed');
