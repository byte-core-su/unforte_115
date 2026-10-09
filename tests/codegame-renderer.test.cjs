const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const runtime = vm.createContext({ performance: { now: () => 0 }, requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
vm.runInContext(fs.readFileSync(require.resolve('../codegame/renderer.js'), 'utf8'), runtime);
const { Renderer } = runtime.CodeGameRenderer;

// Record actual paint order without a browser or pixel/font-dependent image snapshots.
function frame(renderer, progress, animate = true) {
    const events = [];
    let path = [];
    const ctx = {
        createLinearGradient: () => ({ addColorStop() {} }),
        save() {}, restore() {}, translate() {}, scale() {}, fillRect() {}, stroke() {}, fillText() {}, roundRect() {},
        beginPath() { path = []; }, moveTo(x, y) { path.push([x, y]); }, lineTo(x, y) { path.push([x, y]); }, closePath() {},
        fill() { if (this.fillStyle === '#eff5fc') events.push({ type: 'floor', x: path[0][0], y: path[0][1] + 26 }); }
    };
    renderer.paintRobot = (_, x, y) => events.push({ type: 'robot', x, y });
    renderer.paintHeading = () => {};
    renderer.lastMove.started = -1000 * progress;
    renderer.paint(ctx, 900, 560, animate);
    return events;
}

function scene(direction, rotation, fromHeight, toHeight) {
    const [dr, dc] = [[0, 1], [1, 0], [0, -1], [-1, 0]][direction];
    const from = { row: 1, col: 1, direction }, to = { row: 1 + dr, col: 1 + dc, direction };
    const board = Array.from({ length: 3 }, () => [0, 0, 0]);
    board[from.row][from.col] = fromHeight; board[to.row][to.col] = toHeight;
    const renderer = Object.assign(Object.create(Renderer.prototype), {
        rotation, level: { board, goals: [] }, snapshot: { robot: to, lit: [], last: { command: fromHeight === toHeight ? 'forward' : 'jump' } },
        lastMove: { from, to, started: 0, duration: 1000, jump: fromHeight !== toHeight, turn: 0 }, raf: null
    });
    return { renderer, from, to };
}

const floorIndex = (events, position) => events.findIndex(event => event.type === 'floor' && Math.abs(event.x - position.x) < 1e-8 && Math.abs(event.y - position.y) < 1e-8);

for (const [label, fromHeight, toHeight] of [['walk', 0, 0], ['jump up', 0, 1], ['jump down', 3, 0]]) {
    for (let direction = 0; direction < 4; direction++) test(`${label}, direction ${direction}: crossing floors never overpaint the robot in any view`, () => {
        for (let rotation = 0; rotation < 4; rotation++) {
            const { renderer, from, to } = scene(direction, rotation, fromHeight, toHeight);
            for (const progress of [0, .01, .1, .49, .5, .51, .9, .99]) {
                const events = frame(renderer, progress), robotIndex = events.findIndex(event => event.type === 'robot');
                assert.equal(events.filter(event => event.type === 'robot').length, 1);
                assert.ok(events.every((event, index) => event.type !== 'floor' || index < robotIndex), 'no floor or high platform may hide the robot');
                for (const [point, height] of [[from, fromHeight], [to, toHeight]]) {
                    const index = floorIndex(events, renderer.project(point.row, point.col, height));
                    assert.ok(index >= 0 && index < robotIndex, `${label}, view ${rotation}, progress ${progress}: support floor must be painted before feet`);
                }
                const ease = progress * progress * (3 - 2 * progress);
                const position = renderer.project(from.row + (to.row - from.row) * ease, from.col + (to.col - from.col) * ease, fromHeight + (toHeight - fromHeight) * ease);
                const lift = fromHeight !== toHeight ? Math.sin(progress * Math.PI) * 30 : 0;
                assert.ok(Math.abs(events[robotIndex].x - position.x) < 1e-8);
                assert.ok(Math.abs(events[robotIndex].y - (position.y - lift)) < 1e-8);
            }
        }
    });
}

test('foreground high platforms cannot hide the robot; finished and exported frames use its current tile', () => {
    const { renderer, to } = scene(0, 0, 0, 0);
    renderer.level.board[2][2] = 3;
    for (const [progress, animate] of [[.5, true], [1, true], [.5, false]]) {
        const events = frame(renderer, progress, animate), robotIndex = events.findIndex(event => event.type === 'robot');
        assert.ok(floorIndex(events, renderer.project(to.row, to.col, 0)) < robotIndex);
        const foreground = floorIndex(events, renderer.project(2, 2, 3));
        assert.ok(foreground >= 0 && foreground < robotIndex);
        if (progress === 1 || !animate) {
            const position = renderer.project(to.row, to.col, 0);
            assert.equal(events[robotIndex].x, position.x);
            assert.equal(events[robotIndex].y, position.y);
        }
    }
});
