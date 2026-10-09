const { test } = require('node:test');
const assert = require('node:assert/strict');
const levels = require('../codegame/levels.js');
const source = require('../codegame/source-levels.json');
const solutions = require('./fixtures/codegame-solutions.json');
const { Machine, run } = require('../codegame/engine.js');
const { ProgressStore, emptyRecord } = require('../codegame/progress.js');

test('all 20 boards match the archived Code Hour level constants', () => {
    assert.deepEqual([1, 2, 3].map(group => levels.filter(level => level.group === group).length), [8, 6, 6]);
    assert.equal(new Set(levels.map(level => level.id)).size, 20);
    levels.forEach((level, index) => {
        const raw = source.levels[index];
        assert.equal(level.sourceName, raw.sourceName);
        assert.equal(level.board.length, raw.r);
        assert.deepEqual(level.capacity, { main: raw.mainmax, p1: raw.p1max, p2: raw.p2max });
        assert.deepEqual(level.start, { row: raw.botx, col: raw.boty, direction: raw.startr });
        const goals = [];
        for (let r = 0; r < raw.r; r++) {
            assert.equal(level.board[r].length, raw.c);
            for (let c = 0; c < raw.c; c++) {
                const offset = r * source.stride + c;
                assert.equal(level.board[r][c], raw.leveltypes[offset] === 6 ? null : raw.levelgrid[offset], `${level.id} (${r},${c})`);
                if (raw.leveltypes[offset] === 1) goals.push([r, c]);
            }
        }
        assert.deepEqual(level.goals, goals);
        assert.notEqual(level.board[level.start.row][level.start.col], null);
    });
});

for (const level of levels) test(`${level.id}: independent witness solves the level within its instruction capacity`, () => {
    const result = run(level, solutions[level.id]);
    assert.equal(result.status, 'won');
    assert.deepEqual(new Set(result.lit), new Set(level.goals.map(([r, c]) => `${r},${c}`)));
    assert.ok(result.steps < 100);
});

const custom = (board, goals = [[0, board[0].length - 1]]) => ({ board, goals, start: { row: 0, col: 0, direction: 0 }, capacity: { main: 12, p1: 8, p2: 8 }, commands: ['forward', 'jump', 'left', 'right', 'light', 'p1', 'p2'] });
test('height and hole rules: blocked movement continues, equal-height jumping is blocked', () => {
    const machine = new Machine(custom([[0, 1, 1, null]]), { main: ['forward', 'jump', 'jump', 'forward', 'forward', 'light'] });
    assert.equal(machine.step().last.blocked, true);
    assert.equal(machine.step().robot.col, 1);
    assert.equal(machine.step().last.blocked, true);
    assert.equal(machine.step().robot.col, 2);
    assert.equal(machine.step().last.blocked, true);
    assert.equal(machine.step().status, 'running');
    assert.equal(machine.step().status, 'ended');
    assert.equal(run(custom([[3, 0]]), { main: ['jump', 'light'] }).status, 'won');
    assert.equal(run(custom([[0, 2]]), { main: ['jump', 'light'] }).lit.length, 0);
});
test('light toggles off and completion stops at the final light', () => {
    const machine = new Machine(custom([[0, 0]], [[0, 0], [0, 1]]), { main: ['light', 'light', 'light', 'forward', 'light', 'light'] });
    assert.equal(machine.step().lit.length, 1); assert.equal(machine.step().lit.length, 0);
    machine.step(); machine.step(); assert.equal(machine.step().status, 'won');
    assert.equal(machine.step().steps, 5); assert.equal(machine.snapshot().lit.length, 2);
});
test('nested calls return, empty calls return, and recursive loops are bounded', () => {
    assert.equal(run(custom([[0, 0]]), { main: ['p1', 'light'], p1: ['p2'], p2: ['forward'] }).status, 'won');
    assert.equal(run(custom([[0, 0]]), { main: ['p1', 'forward', 'light'] }).status, 'won');
    const machine = new Machine(custom([[0, 0]]), { main: ['p1'], p1: ['p1'] });
    for (let i = 0; i < 10001; i++) machine.step();
    assert.equal(machine.status, 'limit'); assert.equal(machine.steps, 10000); assert.ok(machine.stack.length <= 1);
    assert.equal(run(custom([[0, 0]]), { main: ['p1'], p1: ['p1', 'right'] }, { limit: 30 }).status, 'limit');
});
test('rejects unavailable commands and over-capacity programs', () => {
    assert.throws(() => new Machine(levels[0], { main: ['jump'] }), TypeError);
    assert.throws(() => new Machine(levels[0], { main: ['forward', 'forward', 'light', 'light'] }), RangeError);
});
function memoryStorage() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; }
test('student/class records and drafts survive a fresh store without leaking to another student', () => {
    const storage = memoryStorage(), store = new ProgressStore(storage, levels), student = { className: 'A', studentId: '01' };
    const record = emptyRecord(); record.currentLevel = '3-6'; record.levels['1-1'] = { programs: solutions['1-1'], completed: true, attempts: 2, elapsedMs: 4500, bestCommands: 3, bestProgram: solutions['1-1'], completedAt: '2026-10-09T01:00:00Z', lastRun: { status: 'won', steps: 3 } };
    assert.equal(store.save(student, record), true);
    assert.deepEqual(new ProgressStore(storage, levels).load({ ...student, name: '改名' }), record);
    assert.deepEqual(store.load({ ...student, studentId: '02' }), emptyRecord());
    assert.deepEqual(store.load({ ...student, className: 'B' }), emptyRecord());
});
test('malformed saved commands are sanitized and storage failures remain usable', () => {
    const storage = memoryStorage(), store = new ProgressStore(storage, levels), student = { className: 'A', studentId: '01' };
    const record = emptyRecord(); record.levels['1-1'] = { programs: { main: ['jump', 'forward', 'light', 'p1'], p1: ['forward'] }, attempts: -2, elapsedMs: NaN, lastRun: { status: 'won', steps: -1 } };
    store.save(student, record); const loaded = store.load(student).levels['1-1'];
    assert.deepEqual(loaded.programs, { main: ['forward', 'light'], p1: [], p2: [] }); assert.equal(loaded.attempts, 0); assert.equal(loaded.lastRun, null);
    const unavailable = new ProgressStore({ getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } }, levels);
    assert.deepEqual(unavailable.load(student), emptyRecord()); assert.equal(unavailable.available, false); assert.equal(unavailable.save(student, emptyRecord()), false);
});
