const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadLesson(filename) {
  const html = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).filter(script => script.trim());
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, {
      value: '', textContent: '', innerHTML: '', className: '',
      options: [{ value: '3' }, { value: '4' }, { value: '5' }, { value: '6' }, { value: 'custom' }],
      classList: { add() {}, remove() {} }
    });
    return elements.get(id);
  };
  const context = { document: { getElementById: get, addEventListener() {} }, window: {}, Math, clearInterval() {} };
  scripts.forEach(script => vm.runInNewContext(script, context, { filename }));
  return { context, get };
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

console.log('lesson numeric cases passed');
