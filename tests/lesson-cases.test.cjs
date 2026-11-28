const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const test = require('node:test');
const CourseScenarios = require('../course-scenarios.js');

function loadLesson(filename) {
  const html = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).filter(script => script.trim());
  const elements = new Map();
  const timers = new Set();
  const node = id => ({
    id, value: '', textContent: '', innerHTML: '', className: '', listeners: {}, children: [],
    options: ['3', '4', '5', '6', 'custom'].map(value => ({ value })),
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; },
    hasAttribute(name) { return Object.hasOwn(this, name); },
    toggleAttribute(name, enabled) { if (enabled) this.setAttribute(name, ''); else this.removeAttribute(name); },
    addEventListener(name, callback) { this.listeners[name] = callback; },
    appendChild() {}, focus() {}, select() {}, cloneNode() { return node(); },
    classList: { add() {}, remove() {}, replace() {} }
  });
  const get = id => {
    if (!elements.has(id)) elements.set(id, node(id));
    return elements.get(id);
  };
  const context = {
    document: { getElementById: get, addEventListener() {}, createElement: () => node(), createElementNS: () => node() },
    window: { CourseScenarios, addEventListener() {} }, Math,
    setInterval(callback) { timers.add(callback); return callback; },
    clearInterval(callback) { timers.delete(callback); },
    setTimeout(callback) { callback(); }
  };
  scripts.forEach(script => vm.runInNewContext(script, context, { filename }));
  const finishDrawing = () => {
    for (let step = 0; timers.size && step < 200; step++) {
      for (const callback of timers) callback();
    }
    assert.equal(timers.size, 0, 'drawing should complete');
  };
  return { context, get, finishDrawing };
}

{
  const { context, get } = loadLesson('1150702.html');
  for (const [kind, ids] of [
    ['seq', ['seq-a', 'seq-b']],
    ['sel', ['sel-hw', 'sel-test', 'sel-daily']],
    ['rep', ['iter-n']]
  ]) {
    context.setNumericExercise(kind);
    const first = ids.map(id => get(id).value).join(',');
    context.setNumericExercise(kind);
    assert.notEqual(ids.map(id => get(id).value).join(','), first, `${kind} should change`);
    context.setNumericExercise(kind, true);
    assert.match(get(kind === 'rep' ? 'iter-out' : `${kind}-out`).textContent, /固定示範/);
  }
  assert.equal(get('seq-a').value, 10);
  assert.equal(get('iter-n').value, 10);
}

{
  const html = fs.readFileSync(path.join(__dirname, '..', '1150702.html'), 'utf8');
  const { context, get } = loadLesson('1150702.html');
  const expected = ['in', 'proc', 'out'];
  const positions = new Set();
  for (const [kind, verify] of [['seq', context.checkSeqIPO], ['sel', context.checkSelIPO], ['rep', context.checkRepIPO]]) {
    assert.ok(html.includes(`body:has(#${kind}-ipo-msg[data-lesson-activity]) #${kind}-ipo-followup`));
    assert.ok(html.includes(`id="${kind}-ipo-followup" class="ipo-followup`));
    const fields = ['input', 'proc', 'out'].map(role => `sel-${kind}-${role}`);
    const orders = fields.map(id => {
      const select = html.match(new RegExp(`<select id="${id}"[^>]*>([\\s\\S]*?)<\\/select>`))[1];
      const choices = Array.from(select.matchAll(/<option value="(in|proc|out)">/g), match => match[1]);
      assert.deepEqual([...choices].sort(), [...expected].sort());
      return choices;
    });
    positions.add(orders.map((choices, index) => choices.indexOf(expected[index])).join(','));
    fields.forEach((id, index) => { get(id).value = orders[index][index]; });
    verify();
    const message = get(`${kind}-ipo-msg`);
    assert.equal(message['data-lesson-activity'], undefined, `${kind}: choosing positions 1, 2, 3 must fail`);
    fields.forEach((id, index) => { get(id).value = expected[index]; });
    verify();
    assert.equal(message['data-lesson-activity'], '', `${kind}: correct IPO categories must pass`);
  }
  assert.equal(positions.size, 3, 'each activity needs a different answer-position pattern');
}

{
  const { context, get } = loadLesson('1150703.html');
  context.newPolygonCase();
  const first = get('poly-n').value;
  context.newPolygonCase();
  assert.notEqual(get('poly-n').value, first);
  assert.equal(get('poly-angle').value, '', 'angle should remain for the student to solve');
  context.setPolygonPreset(4);
  assert.equal(get('poly-n').value, 4);
}

{
  const { context, get } = loadLesson('1150704.html');
  context.newSpiralCase();
  const first = get('spiral-angle').value;
  context.newSpiralCase();
  assert.notEqual(get('spiral-angle').value, first);
  context.setSpiral(90);
  assert.equal(get('spiral-angle').value, 90);
}

{
  const { context, get } = loadLesson('1150705.html');
  const signature = () => `${get('mandala-shape-select').value === 'custom' ? get('mandala-shape-custom').value : get('mandala-shape-select').value},${get('mandala-count').value}`;
  context.newMandalaCase();
  const first = signature();
  context.newMandalaCase();
  assert.notEqual(signature(), first);
  context.setMandalaPreset(4, 12);
  assert.equal(signature(), '4,12');
}

{
  const { context, get } = loadLesson('1150706.html');
  const ids = ['shield-sides-select', 'shield-count', 'shield-spacing', 'shield-thickness'];
  const signature = () => ids.map(id => get(id).value).join(',');
  context.newDefenseCase();
  const first = signature();
  context.newDefenseCase();
  assert.notEqual(signature(), first);
  context.setDefenseCase(5, 5, 50, 3);
  assert.equal(signature(), '5,5,50,3');
}

test('flow hints show the sequence, decision or loop used in the practice', () => {
  const { context } = loadLesson('1150702.html');
  const hint = context.window.structureFlowHint;
  assert.match(hint('seq'), /開始.*輸入 A、B.*平均數 = \(A\+B\)\/2.*輸出平均數.*結束/s);
  assert.match(hint('sel'), /總分 ≥ 60？.*是 → 結果為及格.*否 → 結果為未及格.*輸出總分和結果/s);
  assert.match(hint('rep'), /數字和總和都設為 0.*重複N次.*數字加 1.*把數字加進總和.*輸出總和/s);
});

test('flow puzzles must be completed before standalone practice unlocks', () => {
  const { context, get } = loadLesson('1150702.html');
  for (const [kind, count, next, init, place] of [
    ['seq', 6, '開始平均數實作', context.initSeqGame, context.tryPlaceSeqItem],
    ['sel', 10, '開始及格判斷實作', context.initSelGame, context.tryPlaceSelItem],
    ['rep', 9, '開始累加實作', context.initRepGame, context.tryPlaceRepItem]
  ]) {
    const message = get(`${kind}-flow-msg`);
    init();
    for (let id = 1; id < count; id++) place(id);
    assert.equal(message['data-lesson-activity'], undefined);
    place(count);
    assert.equal(message['data-lesson-activity'], '');
    assert.ok(message.textContent.includes(next));
    init();
    assert.equal(message['data-lesson-activity'], undefined);
  }
});

test('a finished structure reopens its flow after reload and can be replayed without answering IPO again', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', '1150702.html'), 'utf8');
  assert.match(html, /\[data-l2-review\] \.ipo-followup \{ display: block; \}/);
  for (const [id, suffix, count] of [['seq', 'Seq', 6], ['sel', 'Sel', 10], ['rep', 'Rep', 9]]) {
    const { context, get } = loadLesson('1150702.html');
    const view = get('l2-content-' + id);
    const ipo = get(id + '-ipo-msg');
    const flow = get(id + '-flow-msg');
    assert.ok(html.includes('onclick="reset' + suffix + 'Flow()"'));
    assert.equal(view.hasAttribute('data-l2-review'), false);

    context.switchL2Tab(id, false, true);
    assert.equal(view.hasAttribute('data-l2-review'), true);
    assert.equal(ipo.hasAttribute('data-lesson-activity'), false);
    assert.equal(vm.runInNewContext('c' + suffix + '.length', context), count);
    for (let index = 1; index <= count; index++) context['tryPlace' + suffix + 'Item'](index);
    assert.equal(flow.hasAttribute('data-lesson-activity'), true);
    assert.match(flow.textContent, /下方的「重做積木實作」/);

    context.switchL2Tab(id === 'seq' ? 'sel' : 'seq');
    assert.equal(view.hasAttribute('data-l2-review'), false);
    context.switchL2Tab(id, false, true);
    assert.equal(flow.hasAttribute('data-lesson-activity'), true);
    ipo.setAttribute('data-lesson-activity', '');
    context['reset' + suffix + 'Flow']();
    assert.equal(flow.hasAttribute('data-lesson-activity'), false);
    assert.equal(ipo.hasAttribute('data-lesson-activity'), true);
    assert.equal(vm.runInNewContext('c' + suffix + '.length', context), count);
    context.switchL2Tab(id);
    assert.equal(view.hasAttribute('data-l2-review'), false);
    assert.equal(ipo.hasAttribute('data-lesson-activity'), false);
  }
});

test('polygon transfer is needed after the worked shapes', () => {
  const { context, get, finishDrawing } = loadLesson('1150703.html');
  const draw = angle => {
    get('poly-angle').value = angle;
    context.runPolygonLab();
    finishDrawing();
  };
  context.setPolygonPreset(3);
  draw(90);
  draw(120);
  context.setPolygonPreset(5);
  draw(72);
  const feedback = get('poly-feedback');
  assert.equal(feedback['data-lesson-activity'], undefined);
  context.newPolygonCase();
  const sides = Number(get('poly-n').value);
  draw(360 / sides + 1);
  assert.equal(feedback['data-lesson-activity'], undefined);
  draw(360 / sides);
  assert.equal(feedback['data-lesson-activity'], '');
});

test('spiral requires an accurate prediction with the new increment', () => {
  const { context, get, finishDrawing } = loadLesson('1150704.html');
  context.setSpiral(90);
  context.runSpiralLab();
  finishDrawing();
  context.newSpiralCase();
  const increment = get('spiral-increment').textContent;
  const round = Number(get('spiral-prediction-prompt').textContent.match(/第 (\d+) 次/)[1]);
  const feedback = get('spiral-feedback');
  get('spiral-prediction').value = increment;
  context.runSpiralLab();
  assert.match(feedback.textContent, /再試一次/);
  assert.equal(feedback['data-lesson-activity'], undefined);
  get('spiral-prediction').value = round * increment;
  context.runSpiralLab();
  finishDrawing();
  assert.equal(feedback['data-lesson-activity'], '');
});

test('mandala changes one parameter and verifies total edges', () => {
  const { context, get, finishDrawing } = loadLesson('1150705.html');
  context.setMandalaPreset(4, 12);
  context.runLabAnimation();
  finishDrawing();
  context.newMandalaCase();
  const sides = context.getMandalaShape();
  const count = Number(get('mandala-count').value);
  assert.notEqual(sides === 4, count === 12);
  const feedback = get('mandala-feedback');
  get('mandala-prediction').value = 48;
  context.runLabAnimation();
  assert.match(feedback.textContent, /再試一次/);
  assert.equal(feedback['data-lesson-activity'], undefined);
  get('mandala-prediction').value = sides * count;
  context.runLabAnimation();
  finishDrawing();
  assert.equal(feedback['data-lesson-activity'], '');
});

test('draw deletion checks current position even when it differs from the seat', async () => {
  const { context, get } = loadLesson('1150804.html');
  vm.runInNewContext('classList = [2, 7, 11, 23]', context);
  const draw = context.drawClassData();
  for (let i = 0; i < 20 && !get('draw-delete-form').listeners.submit; i++) await Promise.resolve();
  if (!get('draw-delete-form').listeners.submit) await draw;
  const selected = Number(get('sim-status-text').textContent.match(/座號 (\d+)/)[1]);
  const position = [2, 7, 11, 23].indexOf(selected) + 1;
  assert.doesNotMatch(get('sim-modal-overlay').innerHTML, /value="/);
  const submit = get('draw-delete-form').listeners.submit;
  get('draw-delete-position').value = position === 1 ? 2 : 1;
  submit({ preventDefault() {} });
  assert.match(get('draw-delete-feedback').textContent, /項次的座號不同/);
  assert.equal(vm.runInNewContext('classList.length', context), 4);
  get('draw-delete-position').value = position;
  submit({ preventDefault() {} });
  await draw;
  assert.equal(vm.runInNewContext(`classList.includes(${selected})`, context), false);
  assert.equal(vm.runInNewContext('classList.length', context), 3);
});

test('draw block questions keep choices available and withhold answers', () => {
  const { context, get } = loadLesson('1150804.html');
  context.initScratchPuzzle2();
  const task = get('scratch-puzzle-container');
  for (let id = 0; id < 7; id++) {
    assert.equal(Array.from(task.innerHTML.matchAll(/clickScratchPoolItem\(\d\)/g)).length, 7);
    const explanation = vm.runInNewContext(`Q_FLOW[${id}].explanation`, context);
    assert.ok(!task.innerHTML.includes(explanation));
    context.window.clickScratchPoolItem((id + 1) % 7);
    assert.match(get('sp-feedback').textContent, /再試一次/);
    context.window.clickScratchPoolItem(id);
    assert.ok(task.innerHTML.includes(explanation));
  }
  assert.equal(task['data-lesson-activity'], '');
});

console.log('lesson numeric cases passed');
