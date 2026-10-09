const { test } = require('node:test');
const assert = require('node:assert/strict');
const { editPlan, removePlan } = require('../codegame/cards.js');
const level = { capacity: { main: 3, p1: 2, p2: 0 }, commands: ['forward', 'light', 'left', 'p1'] };
const draft = () => ({ main: ['forward', 'light'], p1: ['left'], p2: [] });

test('palette insertion shifts existing cards and does not mutate the saved draft', () => {
    const input = draft(); const plan = editPlan(level, input, { kind: 'palette', command: 'p1' }, { section: 'main', index: 1 });
    assert.deepEqual(plan.programs.main, ['forward', 'p1', 'light']); assert.deepEqual(input, draft());
    assert.deepEqual(plan.moves.find(move => move.from.section === 'main' && move.from.index === 1).to, { section: 'main', index: 2 });
});
test('palette replacement in a full program stays within capacity', () => {
    const input = draft(); input.main.push('left');
    assert.equal(editPlan(level, input, { kind: 'palette', command: 'p1' }, { section: 'main', index: 1 }), null);
    const plan = editPlan(level, input, { kind: 'palette', command: 'p1' }, { section: 'main', index: 1, replace: true });
    assert.deepEqual(plan.programs.main, ['forward', 'p1', 'left']); assert.equal(plan.mode, '替換');
});
test('reorder boundaries allow both directions and track duplicate cards separately', () => {
    const input = { main: ['forward', 'light', 'forward'], p1: [], p2: [] };
    const end = editPlan(level, input, { kind: 'program', section: 'main', index: 0 }, { section: 'main', index: 3 });
    assert.deepEqual(end.programs.main, ['light', 'forward', 'forward']);
    assert.deepEqual(end.moves.find(move => move.from.index === 0).to, { section: 'main', index: 2 });
    assert.deepEqual(end.moves.find(move => move.from.index === 2).to, { section: 'main', index: 1 });
    const start = editPlan(level, input, { kind: 'program', section: 'main', index: 2 }, { section: 'main', index: 0 });
    assert.deepEqual(start.programs.main, ['forward', 'forward', 'light']);
});
test('cross-procedure move removes exactly one source card; a full target preserves the source', () => {
    const input = draft(); const source = { kind: 'program', section: 'main', index: 1 };
    const plan = editPlan(level, input, source, { section: 'p1', index: 1 });
    assert.deepEqual(plan.programs, { main: ['forward'], p1: ['left', 'light'], p2: [] });
    input.p1.push('p1'); assert.equal(editPlan(level, input, source, { section: 'p1', index: 0, replace: true }), null);
    assert.deepEqual(input.main, ['forward', 'light']);
});
test('trash removes only program cards, and the remaining cards slide into their new positions', () => {
    const input = draft(), plan = removePlan(input, { kind: 'program', section: 'main', index: 0 });
    assert.deepEqual(plan.programs.main, ['light']); assert.deepEqual(input, draft());
    assert.deepEqual(plan.moves[0], { from: { section: 'main', index: 1 }, to: { section: 'main', index: 0 } });
    assert.equal(removePlan(input, { kind: 'palette', command: 'light' }), null);
});
test('rejects missing sources, unavailable instructions, closed procedures and invalid targets', () => {
    const input = draft();
    assert.equal(editPlan(level, input, { kind: 'palette', command: 'jump' }, { section: 'main', index: 0 }), null);
    assert.equal(editPlan(level, input, { kind: 'program', section: 'main', index: 9 }, { section: 'main', index: 0 }), null);
    for (const target of [{ section: 'p2', index: 0 }, { section: 'main', index: -1 }, { section: 'main', index: 4 }, { section: 'other', index: 0 }]) assert.equal(editPlan(level, input, { kind: 'palette', command: 'light' }, target), null);
});
