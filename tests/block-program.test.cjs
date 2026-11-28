const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const window = {};
for (const file of ['block-program-tasks.js', 'block-program.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { window });
}
const execute = (task, program, input) => window.BlockProgram.execute(task, program, input, task.variables);
const compare = (task, program) => window.BlockProgram.compare(task, program, task.variables);
const keys = {
  '1150701.html': ['flag','move'], '1150702.html': ['calculate','branch','loop','report'],
  '1150703.html': ['pen','draw'], '1150704.html': ['start','update','draw'],
  '1150705.html': ['pen','draw'], '1150706.html': ['configure','draw','report'],
  '1150801.html': ['start','compare','report'], '1150802.html': ['notes','play'],
  '1150803.html': ['reset','sum','guard','average'], '1150804.html': ['setup','pick','add','remove'],
  '1150805.html': ['copy','sort','report'], '1150806.html': ['inventory','shuffle','deal','duel']
};
test('all lesson programs run their cases and each required block matters', () => {
  for (const [file, program] of Object.entries(keys)) {
    const task = window.BlockProgramTasks[file];
    for (const { name, values } of task.cases) {
      assert.equal(execute(task, program, values).passed, true, file + ' ' + name);
    }
    for (const block of program) {
      const incomplete = program.filter(id => id !== block);
      assert.ok(task.cases.some(({ values }) => !execute(task, incomplete, values).passed),
        file + ' missing ' + block);
    }
  }
});

test('standalone sequence reads both numbers, then calculates and displays the average', () => {
  const task = window.BlockProgramPractice['seq-block-program'];
  assert.deepEqual(Array.from(task.cases, ({ values }) => execute(task, task.goal, values).text), ['平均數是 19', '平均數是 12.5']);
  assert.ok(compare(task, ['readB', 'readA', 'calculate', 'report']).results.every(({ result }) => result.passed));
  for (const program of [['readA', 'calculate', 'readB', 'report'], ['readA', 'readB', 'report', 'calculate'], ['readA', 'readB', 'calculate']]) {
    assert.ok(compare(task, program).results.every(({ result }) => !result.passed));
  }
  assert.equal(execute(task, task.goal, { a: 0, b: 77 }).text, '平均數是 38.5');
});

test('standalone branch, loop and shuffle execute correctly and need every block', () => {
  const [branch, loop, shuffle] = ['sel', 'rep', 'shuffle'].map(id => window.BlockProgramPractice[id + '-block-program']);
  for (const task of [branch, loop, shuffle]) {
    assert.ok(compare(task, task.goal).results.every(({ result }) => result.passed));
    for (const block of task.goal) {
      const incomplete = task.goal.filter(id => id !== block);
      assert.ok(compare(task, incomplete).results.every(({ result }) => !result.passed), block);
    }
  }
  assert.deepEqual(Array.from(branch.cases, ({ values }) => execute(branch, branch.goal, values).text),
    ['總分 60｜及格', '總分 59｜未及格']);
  assert.equal(execute(loop, loop.goal, { n: 4 }).text, '1 加到 4 的總和是 10');
  assert.deepEqual(Array.from(execute(loop, loop.goal, { n: 4 }).rows, row => row[1]), [1, 3, 6, 10]);
  for (const { values } of shuffle.cases) {
    const before = [...values.data];
    const result = execute(shuffle, shuffle.goal, values);
    assert.deepEqual(Array.from(result.shuffled).sort(), [...before].sort());
    assert.deepEqual(Array.from(values.data), before);
    assert.equal(result.source.length, 0);
    assert.equal(result.rows.length, before.length);
  }
  assert.ok(compare(shuffle, ['setup', 'pick', 'remove', 'add']).results.every(({ result }) => !result.passed));
});

test('comparison reports every case, missing blocks, and valid alternative orders', () => {
  for (const [file, program] of Object.entries(keys)) {
    const task = window.BlockProgramTasks[file];
    assert.deepEqual(Array.from(task.goal), program, file);
    assert.ok(Object.values(task.blocks).every(block => block.view?.length >= 3), file);
    assert.ok(compare(task, program).results.every(({ result }) => result.passed), file);
  }
  const spiral = window.BlockProgramTasks['1150704.html'];
  const alternative = compare(spiral, ['start', 'draw', 'update']);
  assert.equal(alternative.sameOrder, false);
  assert.ok(alternative.results.every(({ result }) => result.passed));

  const statistics = window.BlockProgramTasks['1150803.html'];
  const misplaced = compare(statistics, ['reset', 'sum', 'average', 'guard']);
  assert.equal(misplaced.sameOrder, false);
  assert.equal(misplaced.results[0].result.passed, true);
  assert.match(misplaced.results[2].result.error, /除以 0/);
  assert.deepEqual(Array.from(compare(statistics, ['reset', 'sum', 'average']).missing), ['guard']);
});

test('variable dependencies are enforced by execution and comparison', () => {
  const groups = [window.BlockProgramTasks, window.BlockProgramPractice];
  const prepared = groups.flatMap(group => Object.values(group));
  assert.equal(prepared.filter(task => task.variables?.length).length, 11);
  for (const task of prepared) {
    if (!task.variables?.length) continue;
    for (const name of task.variables) {
      const otherNames = task.variables.filter(variable => variable !== name);
      const execution = window.BlockProgram.execute(task, task.goal, task.cases[0].values, otherNames);
      assert.equal(execution.passed, undefined);
      assert.equal(execution.error, '請先新增變數：' + name + '。');
      const checked = window.BlockProgram.compare(task, task.goal, otherNames);
      assert.ok(checked.results.every(({ result }) => result.error === execution.error));
    }
    assert.ok(compare(task, task.goal).results.every(({ result }) => result.passed));
  }
  for (const file of ['1150701.html', '1150703.html', '1150705.html', '1150805.html', '1150806.html']) {
    assert.equal(window.BlockProgramTasks[file].variables, undefined);
  }
});

test('creating variables unlocks dependent blocks and preserves an existing draft across reload', async () => {
  const task = window.BlockProgramPractice['seq-block-program'];
  let saved;
  function mount(draft) {
    const nodes = new Map();
    const events = new Map();
    const makeNode = () => ({
      value: '0', addEventListener(type, callback) { this[type] = callback; }, replaceChildren() {}, focus() {}
    });
    const get = selector => {
      if (!nodes.has(selector)) nodes.set(selector, makeNode());
      return nodes.get(selector);
    };
    const palette = task.goal.map(id => ({ dataset: { programAdd: id } }));
    get('[data-program-variable-form]').querySelector = get;
    const flags = new Set();
    const root = {
      querySelector: get, querySelectorAll: selector => selector === '[data-program-add]' ? palette : [],
      addEventListener: (type, callback) => events.set(type, callback),
      removeAttribute: name => flags.delete(name),
      toggleAttribute(name, on) { if (on) flags.add(name); else flags.delete(name); }
    };
    window.BlockProgram.mount(root, task, { draft, onSave: next => { saved = next; } });
    const click = attr => events.get('click')({ target: {
      closest: () => ({ dataset: {}, hasAttribute: name => name === attr })
    } });
    const declare = name => {
      get('[data-program-variable-name]').value = name;
      get('[data-program-variable-form]').submit({ preventDefault() {} });
    };
    return { root, palette, flags, click, declare, feedback: get('[data-program-feedback]'), status: get('[data-program-variable-status]') };
  }

  const fresh = mount();
  assert.match(fresh.root.innerHTML, /新增變數/);
  assert.ok(fresh.palette.every(block => block.disabled && !block.draggable));
  fresh.declare('Ｂ');
  assert.equal(fresh.palette[1].disabled, false);
  assert.equal(fresh.palette[1].draggable, true);
  assert.equal(fresh.palette[2].disabled, true);
  fresh.declare('B');
  assert.deepEqual(Array.from(saved.variables), ['B']);
  assert.match(fresh.status.textContent, /已經建立/);
  fresh.declare('不存在');
  assert.match(fresh.status.textContent, /請輸入本題積木上的變數名稱/);
  const legacy = mount({ blocks: task.goal });
  await legacy.click('data-program-compare');
  assert.ok(!legacy.flags.has('data-program-passed'));
  assert.match(legacy.feedback.textContent, /請先新增變數/);
  task.variables.forEach(legacy.declare);
  assert.deepEqual(Array.from(saved.blocks), Array.from(task.goal));
  assert.deepEqual(Array.from(saved.variables), Array.from(task.variables));
  const resumed = mount(saved);
  assert.match(resumed.status.textContent, /已建立的變數：A、B、平均數/);
  await resumed.click('data-program-compare');
  assert.ok(resumed.flags.has('data-program-passed'));
  await resumed.click('data-program-reset');
  assert.deepEqual(Array.from(saved.blocks), []);
  assert.deepEqual(Array.from(saved.variables), Array.from(task.variables));
  assert.ok(resumed.palette.every(block => !block.disabled));
});

test('melody completion counts two successful runs with different third notes', () => {
  const task = window.BlockProgramTasks['1150802.html'];
  const fields = new Map();
  const events = new Map();
  const attributes = new Set();
  const note = {
    dataset: { programValue: 'note' },
    get valueAsNumber() { return Number(this.value); },
    reportValidity: () => true, labels: [{ textContent: '第 3 音' }], addEventListener() {}
  };
  const root = {
    querySelector(selector) {
      if (!fields.has(selector)) fields.set(selector, {
        value: '0', addEventListener() {}, replaceChildren() {}, querySelector: () => ({})
      });
      return fields.get(selector);
    },
    querySelectorAll: selector => selector === '[data-program-value]' ? [note] : [],
    addEventListener: (type, listener) => { events.set(type, listener); },
    removeAttribute: name => { attributes.delete(name); },
    toggleAttribute(name, value) { if (value) attributes.add(name); else attributes.delete(name); }
  };
  window.BlockProgram.mount(root, task, { draft: { blocks: task.goal, variables: task.variables } });
  const click = attr => events.get('click')({ target: {
    closest: () => ({ dataset: {}, hasAttribute: name => name === attr })
  } });
  click('data-program-compare');
  assert.ok(attributes.has('data-program-passed'));
  assert.ok(!attributes.has('data-program-two-runs'));
  click('data-program-run');
  click('data-program-run');
  assert.ok(!attributes.has('data-program-two-runs'));
  note.value = String(Number(note.value) + 1);
  click('data-program-run');
  assert.ok(attributes.has('data-program-two-runs'));
});

test('duel palette reading order cannot pass and its reference appears after a valid program', async () => {
  const math = Object.create(Math);
  math.random = () => 0.999999;
  const target = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'block-program.js'), 'utf8'), { window: target, Math: math });
  const task = window.BlockProgramTasks['1150806.html'];
  function mount() {
    const nodes = new Map();
    const events = {};
    const flags = new Set();
    const root = {
      querySelector(selector) {
        if (!nodes.has(selector)) nodes.set(selector, { value: '0', addEventListener() {}, replaceChildren() {} });
        return nodes.get(selector);
      },
      querySelectorAll: () => [],
      addEventListener: (name, callback) => { events[name] = callback; },
      removeAttribute: name => flags.delete(name),
      toggleAttribute(name, on) { if (on) flags.add(name); else flags.delete(name); }
    };
    target.BlockProgram.mount(root, task);
    const displayed = Array.from(root.innerHTML.matchAll(/data-program-add="([^"]+)"/g), match => match[1]);
    const click = (programAdd, action) => events.click({ detail: 1, target: {
      closest: () => ({ dataset: { programAdd }, hasAttribute: name => name === action })
    } });
    return { root, displayed, flags, click };
  }

  const ui = mount();
  assert.deepEqual([...ui.displayed].sort(), [...task.goal].sort());
  assert.notDeepEqual(ui.displayed, Array.from(task.goal), 'even an identity shuffle must be changed');
  for (const id of ui.displayed) await ui.click(id);
  await ui.click(undefined, 'data-program-compare');
  assert.equal(ui.flags.has('data-program-passed'), false);
  assert.doesNotMatch(ui.root.querySelector('[data-program-comparison]').innerHTML, /查看參考積木順序/);

  math.random = () => 0.5;
  const second = mount();
  assert.notDeepEqual(second.displayed, ui.displayed);
  for (const id of task.goal) await second.click(id);
  await second.click(undefined, 'data-program-compare');
  assert.equal(second.flags.has('data-program-passed'), true);
  assert.match(second.root.querySelector('[data-program-comparison]').innerHTML, /查看參考積木順序/);
});
