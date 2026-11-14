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

test('grade overviews keep alternative scenarios and local archives with static lesson links', () => {
  for (const grade of [7, 8]) {
    const page = `1150${grade}00.html`;
    const html = read(page);
    const story = html.match(/<details class="course-overview__story">[\s\S]*?<\/details>/)[0];
    const nodes = [...story.matchAll(/data-scenario-text="([\w.]+)"/g)]
      .map(([, key]) => ({ dataset: { scenarioText: key } }));
    assert.match(html, /<a data-scenario-download href="[^"]+"/);
    const link = { setAttribute(name, value) { this[name] = value; } };
    const root = { querySelectorAll: selector => selector === '[data-scenario-text]' ? nodes : [link] };
    applyPage(root, page, campus);
    const text = key => nodes.find(node => node.dataset.scenarioText === key)?.textContent;
    assert.equal(text('briefing.title'), campus.grades[grade].briefing.title);
    assert.equal(link.href, campus.grades[grade].archive);
    for (const [index, card] of campus.grades[grade].cards.entries()) {
      assert.equal(text(`cards.${index}.title`), card.title);
      assert.equal(text(`cards.${index}.description`), card.description);
    }
    assert.deepEqual([...html.matchAll(/class="course-overview__card" href="([^"]+)"/g)].map(([, href]) => href),
      Array.from({ length: 6 }, (_, index) => `1150${grade}0${index + 1}.html`));
    const external = { ...campus, grades: { ...campus.grades, [grade]: { ...campus.grades[grade], archive: 'https://other.example/files.zip' } } };
    applyPage(root, page, external);
    assert.equal(link.href, campus.grades[grade].archive, 'invalid destinations must not override the local archive');
  }
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
