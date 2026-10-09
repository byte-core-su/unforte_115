(function (root) {
    'use strict';
    const PREFIX = 'codegame.codehour.v1:';
    const emptyRecord = () => ({ version: 1, currentLevel: '1-1', levels: {} });
    const clone = value => JSON.parse(JSON.stringify(value));
    const studentKey = student => PREFIX + JSON.stringify([student.className, student.studentId]);

    class ProgressStore {
        constructor(storage, levels) { this.storage = storage; this.levels = levels; this.available = true; }
        load(student) {
            this.available = true;
            try {
                const raw = this.storage?.getItem(studentKey(student));
                if (!this.storage) throw new Error('Storage unavailable');
                if (!raw) return emptyRecord();
                const input = JSON.parse(raw);
                const result = emptyRecord();
                if (input.version !== 1 || !input.levels || typeof input.levels !== 'object') return result;
                if (this.levels.some(level => level.id === input.currentLevel)) result.currentLevel = input.currentLevel;
                for (const level of this.levels) {
                    const entry = input.levels[level.id];
                    if (!entry || typeof entry !== 'object') continue;
                    const programs = {};
                    for (const section of ['main', 'p1', 'p2']) {
                        const commands = entry.programs?.[section];
                        programs[section] = Array.isArray(commands) ? commands.slice(0, level.capacity[section]).filter(command => level.commands.includes(command)) : [];
                    }
                    const number = value => Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 1e9) : 0;
                    result.levels[level.id] = {
                        programs, attempts: number(entry.attempts), elapsedMs: number(entry.elapsedMs), completed: entry.completed === true,
                        bestCommands: Number.isSafeInteger(entry.bestCommands) && entry.bestCommands > 0 && entry.bestCommands <= 28 ? entry.bestCommands : null,
                        completedAt: typeof entry.completedAt === 'string' && !Number.isNaN(Date.parse(entry.completedAt)) ? entry.completedAt : null,
                        bestProgram: this.validBest(level, entry.bestProgram),
                        lastRun: this.validRun(entry.lastRun)
                    };
                }
                return result;
            } catch { this.available = false; return emptyRecord(); }
        }
        validBest(level, programs) {
            if (!programs || typeof programs !== 'object') return null;
            const valid = ['main', 'p1', 'p2'].every(section => Array.isArray(programs[section]) && programs[section].length <= level.capacity[section] && programs[section].every(command => level.commands.includes(command)));
            return valid ? clone(programs) : null;
        }
        validRun(run) {
            if (!run || !['won', 'ended', 'limit', 'stopped'].includes(run.status) || !Number.isSafeInteger(run.steps) || run.steps < 0 || run.steps > 10000) return null;
            return { status: run.status, steps: run.steps };
        }
        save(student, record) {
            try {
                if (!this.storage) throw new Error('Storage unavailable');
                this.storage.setItem(studentKey(student), JSON.stringify(record));
                this.available = true;
                return true;
            } catch { this.available = false; return false; }
        }
    }

    const api = { ProgressStore, emptyRecord, studentKey };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.CodeGameProgress = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
