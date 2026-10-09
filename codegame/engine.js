(function (root) {
    'use strict';
    const DIRECTIONS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const key = (row, col) => `${row},${col}`;
    const copyPrograms = programs => Object.fromEntries(['main', 'p1', 'p2'].map(section => [section, [...(programs[section] || [])]]));

    function validatePrograms(level, programs) {
        if (!programs || typeof programs !== 'object') throw new TypeError('需要主程式與程序資料。');
        for (const section of ['main', 'p1', 'p2']) {
            const commands = programs[section] || [];
            if (!Array.isArray(commands) || commands.length > level.capacity[section]) throw new RangeError(`${section.toUpperCase()} 超過指令格數。`);
            if (commands.some(command => !level.commands.includes(command))) throw new TypeError('包含本關不可使用的指令。');
        }
        return copyPrograms(programs);
    }

    class Machine {
        constructor(level, programs, options = {}) {
            this.level = level;
            this.programs = validatePrograms(level, programs);
            this.robot = { ...level.start };
            this.lit = new Set();
            this.goals = new Set(level.goals.map(([row, col]) => key(row, col)));
            this.stack = [{ section: 'main', index: 0 }];
            this.steps = 0;
            this.limit = options.limit || 10000;
            this.status = 'ready';
            this.last = null;
        }

        height(row, col) { return this.level.board[row]?.[col] ?? null; }

        step() {
            if (['won', 'ended', 'limit'].includes(this.status)) return this.snapshot();
            // Return from completed procedures iteratively; self-calls never use the JS call stack.
            while (this.stack.length) {
                const frame = this.stack[this.stack.length - 1];
                if (frame.index < this.programs[frame.section].length) break;
                this.stack.pop();
            }
            if (!this.stack.length) {
                this.status = 'ended';
                this.last = null;
                return this.snapshot();
            }
            if (this.steps >= this.limit) {
                this.status = 'limit';
                this.last = null;
                return this.snapshot();
            }
            const frame = this.stack[this.stack.length - 1];
            const index = frame.index++;
            const command = this.programs[frame.section][index];
            const last = { section: frame.section, index, command, blocked: false, reason: '' };
            this.steps += 1;
            this.status = 'running';
            const robot = this.robot;
            if (command === 'left') robot.direction = (robot.direction + 3) % 4;
            else if (command === 'right') robot.direction = (robot.direction + 1) % 4;
            else if (command === 'forward' || command === 'jump') {
                const [dr, dc] = DIRECTIONS[robot.direction];
                const row = robot.row + dr;
                const col = robot.col + dc;
                const from = this.height(robot.row, robot.col);
                const to = this.height(row, col);
                // Code Hour: blocked commands leave the robot in place and execution continues.
                const movable = to !== null && (command === 'forward' ? to === from : to < from || to === from + 1);
                if (movable) Object.assign(robot, { row, col });
                else {
                    last.blocked = true;
                    last.reason = to === null ? '前方是邊界或空洞，機器人留在原位。' : command === 'forward' ? '前進需要相同高度，機器人留在原位。' : '跳躍只能向上一步或跳至較低處，機器人留在原位。';
                }
            } else if (command === 'light') {
                const tile = key(robot.row, robot.col);
                if (this.goals.has(tile)) {
                    if (this.lit.has(tile)) this.lit.delete(tile);
                    else this.lit.add(tile);
                } else last.reason = '目前是一般方格，點燈沒有改變目標。';
            } else if (command === 'p1' || command === 'p2') {
                const current = this.stack[this.stack.length - 1];
                // Tail calls can replace their frame, keeping unbounded loops memory bounded.
                if (current.index >= this.programs[current.section].length) this.stack.pop();
                this.stack.push({ section: command, index: 0 });
                if (!this.programs[command].length) last.reason = `${command.toUpperCase()} 尚未放入指令，會直接返回。`;
            }
            this.last = last;
            // Stop immediately at the final light, even within a recursive loop.
            if (this.goals.size > 0 && this.lit.size === this.goals.size) this.status = 'won';
            return this.snapshot();
        }

        snapshot() {
            return { robot: { ...this.robot }, lit: [...this.lit], steps: this.steps, status: this.status, last: this.last ? { ...this.last } : null };
        }
    }

    function run(level, programs, options) {
        const machine = new Machine(level, programs, options);
        do { machine.step(); } while (machine.status === 'running' || machine.status === 'ready');
        return machine.snapshot();
    }

    const api = { Machine, run, validatePrograms, copyPrograms, DIRECTIONS };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.CodeGameEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
