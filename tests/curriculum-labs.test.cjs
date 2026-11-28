const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const CourseScenarios = require('../course-scenarios.js');
const campus = require('./fixtures/campus-scenario.cjs');

const source = fs.readFileSync(path.join(__dirname, '..', 'curriculum-labs.js'), 'utf8');

function loadLab(page, scenario = CourseScenarios.active, random = Math.random) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) {
      elements.set(id, {
        innerHTML: '', textContent: '', value: '', listeners: {},
        addEventListener(type, callback) { this.listeners[type] = callback; },
        click() { if (!this.disabled && !this.hidden) this.listeners.click?.(); },
        focus() {}
      });
    }
    return elements.get(id);
  };
  const sections = [];
  const makeSection = () => ({
    className: '', innerHTML: '',
    after() {},
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; },
    querySelector(selector) { return selector === '[data-quiz]' ? null : element(selector); }
  });
  const main = { appendChild() {} };
  const document = {
    querySelector(selector) { return selector === 'main' ? main : null; },
    createElement() {
      const node = makeSection();
      sections.push(node);
      return node;
    }
  };
  const window = { CourseScenarios: { ...CourseScenarios, active: scenario }, location: { pathname: `/${page}` } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../lesson-labels.js'), 'utf8'), { window });
  vm.runInNewContext(source, { document, window, Math: Object.assign(Object.create(Math), { random }) });
  return Object.assign(element, { section: sections[0], sorting: sections[1] });
}

{
  const get = loadLab('1150706.html');
  const result = get('#g7-data-result');
  const query = get('#g7-data-query');
  const prediction = get('#g7-data-prediction');
  const run = get('#g7-data-run');
  const passed = () => get.section['data-lesson-activity'] === '';
  const rows = () => [...result.innerHTML.matchAll(/<tr><td>([A-D])<\/td><td>(\d+)<\/td><td>(\d+)<\/td><td>(是|否)<\/td><td>(\d+|？)<\/td><\/tr>/g)]
    .map(([, id, count, width, blocked, shownCost]) => ({ id, cost: Number(count) * Number(width), blocked: blocked === '是', shownCost }));
  const search = id => { query.value = id; run.click(); query.value = 'all'; };
  assert.match(result.innerHTML, /練習題/);
  assert.match(result.innerHTML, /防護強度門檻/);
  const first = result.innerHTML;
  get('#g7-data-new').click();
  assert.notEqual(result.innerHTML, first, 'new data challenge should differ');
  get('#g7-data-demo').click();
  assert.match(result.innerHTML, /固定示範/);
  assert.match(result.innerHTML, /<td>A<\/td><td>4<\/td><td>1<\/td>/);
  search('A');
  prediction.value = 'B';
  run.click();
  assert.match(result.innerHTML, /最省資源的是 B/);
  assert.equal(passed(), false, 'worked example cannot complete the practice');
  get('#g7-data-new').click();
  assert.equal(prediction.value, '', 'new data case should clear old prediction');
  const wrong = rows().find(row => !row.blocked).id;
  prediction.value = wrong;
  run.click();
  assert.match(result.innerHTML, /先選一個測試編號並查詢/);
  assert.ok(rows().every(row => row.shownCost === '？'));
  search('B');
  assert.match(result.innerHTML, /共 1 筆/);
  run.click();
  assert.match(result.innerHTML, /預測不同.*再產生一題/);
  assert.equal(prediction.disabled, true);
  assert.equal(passed(), false, 'wrong prediction must leave the step locked');

  get('#g7-data-new').click();
  const cheapest = rows().filter(row => row.blocked).sort((a, b) => a.cost - b.cost)[0].id;
  assert.equal(prediction.disabled, false);
  prediction.value = cheapest;
  run.click();
  assert.equal(passed(), false, 'a previous search does not carry across practice cases');
  search('A');
  run.click();
  assert.match(result.innerHTML, /預測符合條件/);
  assert.equal(passed(), true);
  const threshold = Number(result.innerHTML.match(/門檻為 (\d+)/)[1]);
  assert.equal(rows().length, 4);
  rows().forEach(row => {
    assert.equal(Number(row.shownCost), row.cost);
    assert.equal(row.blocked, row.cost >= threshold);
  });
  get('#g7-data-new').click();
  assert.equal(passed(), false, 'new challenge invalidates the previous result while practising');
}

for (const scenario of [CourseScenarios.active, campus]) {
  const get = loadLab('1150801.html', scenario);
  const state = get('#g8-search-state');
  const trace = get('#g8-search-trace');
  const prompt = get('#g8-search-prompt');
  const advance = get('#g8-search-advance');
  const step = get('#g8-search-step');
  const stop = get('#g8-search-stop');
  const prediction = get('#g8-search-prediction');
  const reason = get('#g8-search-reason');
  const passed = () => get.section['data-lesson-activity'] === '';
  const comparisons = () => (trace.innerHTML.match(/data-compared/g) || []).length;

  assert.match(get('#g8-search-title').textContent, /示範/);
  assert.ok(prompt.textContent.includes(CourseScenarios.inventorySearchPool(scenario)[1]));
  assert.equal(advance.hidden, true);
  step.click();
  assert.equal(comparisons(), 1);
  assert.equal(advance.hidden, true);
  step.click();
  assert.match(state.textContent, /第 2 項符合，搜尋停止/);
  assert.equal(comparisons(), 2);
  assert.equal(step.disabled, true);
  assert.equal(passed(), false);
  advance.click();

  assert.match(get('#g8-search-title').textContent, /第 1 題：預測/);
  const target = prompt.textContent.match(/「([^」]+)」/)[1];
  const items = [...trace.innerHTML.matchAll(/<span>[^<]+<\/span> (.*?) <small>/g)].map(match => match[1]);
  const index = items.indexOf(target) + 1;
  assert.ok(index >= 3);
  step.click();
  assert.match(state.textContent, /請先選預測/);
  assert.equal(comparisons(), 0);
  prediction.value = '1';
  for (let i = 0; i < index; i++) step.click();
  assert.match(state.textContent, /和預測不同/);
  assert.equal(advance.hidden, true);
  assert.equal(passed(), false);
  get('#g8-search-reset').click();
  assert.equal(prediction.value, '');
  assert.equal(comparisons(), 0);
  assert.ok(prompt.textContent.includes(target));
  prediction.value = String(index);
  for (let i = 0; i < index; i++) step.click();
  assert.match(state.textContent, /預測正確/);
  assert.equal(advance.hidden, false);
  advance.click();

  assert.match(get('#g8-search-title').textContent, /第 2 題：接手/);
  assert.ok(!trace.innerHTML.includes(prompt.textContent.match(/「([^」]+)」/)[1]));
  assert.equal(comparisons(), 2);
  stop.click();
  assert.match(state.textContent, /第 3 項還沒檢查/);
  for (let i = 0; i < 3; i++) step.click();
  assert.equal(comparisons(), 5);
  assert.equal(passed(), false);
  stop.click();
  assert.match(state.textContent, /請先選出.*理由/);
  reason.value = 'last';
  stop.click();
  assert.equal(passed(), false);
  reason.value = 'all';
  stop.click();
  assert.match(state.textContent, /全部 5 項.*兩題都通過/);
  assert.equal(passed(), true);
}

{
  const optionOrder = new Set();
  const decks = new Set();
  const parseCards = text => text.match(/［([\d、]+)］/)[1].split('、').map(Number);
  for (const random of [() => 0, () => 0.4, () => 0.8]) {
    const get = loadLab('1150805.html', CourseScenarios.active, random);
    const passed = () => get.sorting['data-lesson-activity'] === '';
    const state = get('#g8-sort-state');
    const choice = get('#g8-shuffle-choice');
    const original = parseCards(get('#g8-shuffle-prompt').textContent);
    decks.add(original.join(','));
    const options = Array.from(choice.innerHTML.matchAll(/<option value="(\w+)">(.*?)<\/option>/g));
    optionOrder.add(options.map(([, value]) => value).join(','));
    for (const [, value, label] of options) {
      const sorted = parseCards(label).sort((a, b) => a - b);
      assert.equal(sorted.join(',') === original.join(','), value === 'valid');
    }

    choice.value = 'extra';
    get('#g8-shuffle-check').click();
    assert.match(get('#g8-shuffle-state').textContent, /總張數相同.*少了一張/);
    assert.equal(get.sorting.hidden, true);
    assert.equal(get.section['data-lesson-activity'], undefined);
    assert.equal(passed(), false);
    choice.value = 'valid';
    get('#g8-shuffle-check').click();
    assert.equal(get.section['data-lesson-activity'], '');
    assert.match(get('#g8-shuffle-state').textContent, /開始洗牌實作/);
    assert.equal(get.sorting.hidden, false);
    assert.equal(passed(), false);
    for (let comparison = 0; comparison < 2; comparison++) {
      const [, left, right] = state.textContent.match(/比較 (\d+) 和 (\d+)/);
      const swap = Number(left) > Number(right);
      get(swap ? '#g8-sort-keep' : '#g8-sort-swap').click();
      assert.match(state.textContent, /再試一次/);
      get(swap ? '#g8-sort-swap' : '#g8-sort-keep').click();
    }
    assert.deepEqual(parseCards(state.textContent), original);
    assert.equal(passed(), false);
    get('#g8-sort-stop').value = 'pair';
    get('#g8-sort-check').click();
    assert.equal(passed(), false);
    get('#g8-sort-stop').value = 'round';
    get('#g8-sort-check').click();
    assert.equal(passed(), true);
    assert.deepEqual(parseCards(get('#g8-sort-report').value), original);
    assert.match(get('#g8-sort-report').value, /完整一輪都沒交換/);
  }
  assert.ok(decks.size > 1);
  assert.ok(optionOrder.size > 1);
}

{
  const get = loadLab('1150706.html', campus);
  get('#g7-data-demo').click();
  get('#g7-data-prediction').value = 'B';
  get('#g7-data-run').click();
  const result = get('#g7-data-result').innerHTML;
  assert.match(result, /緩衝強度門檻為 15/);
  assert.match(result, /<th>攔住測試球<\/th>/);
  assert.match(result, /最省資源的是 B（消耗量 18）.*再產生一題/);
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
