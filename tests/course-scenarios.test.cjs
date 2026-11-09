const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const CourseScenarios = require('../course-scenarios.js');
const campus = require('./fixtures/campus-scenario.cjs');
const { createQuestion } = require('../adaptive-practice.js');
const { active, applyPage } = CourseScenarios;
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('all 14 pages load the catalog and preserve their default fallback copy', () => {
  for (const grade of [7, 8]) for (let lesson = 0; lesson <= 6; lesson++) {
    const page = `1150${grade}0${lesson}.html`;
    const html = read(page);
    assert.match(html, /<script src="course-scenarios\.js"><\/script>/);
    assert.ok(html.indexOf('src="course-scenarios.js"') < html.indexOf('<body'), page);
    const nodes = [...html.matchAll(/<([a-z][\w-]*)\b[^>]*\bdata-scenario-text="([\w.]+)"[^>]*>([\s\S]*?)<\/\1>/gi)]
      .map(([, , key, fallback]) => ({ dataset: { scenarioText: key }, fallback: fallback.trim() }));
    const root = { querySelectorAll: selector => selector === '[data-scenario-text]' ? nodes : [] };
    applyPage(root, `/materials/${page}`);
    for (const node of nodes) {
      assert.equal(typeof node.textContent, 'string', `${page}: unknown binding ${node.dataset.scenarioText}`);
      if (node.fallback) assert.equal(node.textContent, node.fallback, `${page}: default copy changed`);
    }
    applyPage(root, `/materials/${page}`, campus);
    assert.equal(nodes.find(node => node.dataset.scenarioText === 'name').textContent, campus.grades[grade].name);
    assert.equal(nodes.find(node => node.dataset.scenarioText === 'tagline').textContent, campus.grades[grade].tagline);
  }
});

test('dynamic grade 8 overview reads alternative cards, briefing and local archive', () => {
  const html = read('1150800.html');
  const inline = html.match(/<script>([\s\S]+?)<\/script>/)[1];
  const app = {};
  const briefing = { dataset: { scenarioText: 'briefing.title' } };
  const link = { setAttribute(name, value) { this[name] = value; } };
  const window = { CourseScenarios: { ...CourseScenarios, active: campus }, location: { pathname: '/1150800.html' } };
  const document = {
    getElementById: () => app,
    querySelectorAll: selector => selector === '[data-scenario-text]' ? [briefing] : [link]
  };
  vm.runInNewContext(inline, { window, document, lucide: { createIcons() {} } });
  window.onload();
  assert.equal(briefing.textContent, campus.grades[8].briefing.title);
  assert.equal(link.href, campus.grades[8].archive);
  assert.match(app.innerHTML, /圖書館借閱清單/);
  assert.match(app.innerHTML, /數字卡逐項比較/);
  assert.equal((app.innerHTML.match(/onclick="openLesson\([1-6]\)"/g) || []).length, 6);
  window.openLesson(6);
  assert.equal(window.location.href, '1150806.html');
  const external = { ...campus, grades: { ...campus.grades, 8: { ...campus.grades[8], archive: 'https://other.example/files.zip' } } };
  applyPage(document, '/1150800.html', external);
  assert.equal(link.href, campus.grades[8].archive, 'invalid destinations must not override the local archive');
});

test('alternate data drives the actual insert, replace and delete tutorial actions', () => {
  const html = read('1150801.html');
  const setup = html.match(/const \{ active: scenario, format \}[\s\S]*?\n        \}\);/)[0];
  const actions = html.match(/const steps = \[[\s\S]+?\n            \];/)[0];
  const window = { CourseScenarios: { ...CourseScenarios, active: campus } };
  const context = { window, list: [], setMessage() {}, setList(value) { context.list = Array.from(value); } };
  const steps = vm.runInNewContext(`${setup}\n${actions}\nsteps;`, context);
  const { supply, priority, upgrade } = campus.inventory.items;
  assert.match(steps[0].btnText, /借書卡/);
  assert.match(steps[1].desc, /預約單/);
  assert.match(steps[2].btnText, /優先借閱單/);
  for (const [index, expected] of [[0, [supply.label]], [1, [priority.label, supply.label]], [2, [upgrade.label, supply.label]], [3, [upgrade.label]]]) {
    steps[index].action();
    assert.deepEqual(context.list, expected);
  }
});

test('the capstone still creates 24 numbered entries with replacement labels', async () => {
  const inline = read('1150806.html').match(/<script>([\s\S]+?)<\/script>/)[1];
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, {});
    return elements.get(id);
  };
  const window = { CourseScenarios: { ...CourseScenarios, active: campus } };
  const context = { window, document: { getElementById: get, addEventListener() {} }, lucide: { createIcons() {} }, setTimeout: callback => callback() };
  vm.runInNewContext(inline, context);
  await context.prepGenerate();
  const cards = get('prep-modal-deck').innerHTML;
  assert.match(cards, /紅色卡 A/);
  assert.match(cards, /黃色卡 F/);
  assert.deepEqual([...cards.matchAll(/戰力 (\d+)/g)].map(match => Number(match[1])), Array.from({ length: 24 }, (_, i) => i + 1));
});

test('alternate scenarios preserve correct answer positions across all lessons and difficulty levels', () => {
  const rng = () => { let seed = 17; return () => (seed = (seed * 48271) % 2147483647) / 2147483647; };
  for (const grade of [7, 8]) for (let lesson = 1; lesson <= 6; lesson++) for (const level of [1, 2, 3]) {
    const page = `1150${grade}0${lesson}.html`;
    const spaceRandom = rng(), campusRandom = rng();
    for (let sample = 0; sample < 25; sample++) {
      const space = createQuestion(page, level, spaceRandom, active);
      const changed = createQuestion(page, level, campusRandom, campus);
      assert.equal(changed.answer, space.answer, `${page} level ${level}: different rule result`);
      assert.equal(new Set(changed.choices).size, 4);
    }
  }
  const examples = [
    ['1150706.html', 3, /測試門檻.*提高測試標準後門檻再增加 5/],
    ['1150801.html', 2, /館藏索引/],
    ['1150803.html', 3, /借閱量/],
    ['1150806.html', 1, /洗牌數字卡/]
  ];
  for (const [page, level, pattern] of examples) assert.match(createQuestion(page, level, () => 0, campus).prompt, pattern);
});
