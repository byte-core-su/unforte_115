const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const { operationStep } = await import(pathToFileURL(path.resolve(__dirname, '../pythonlab/operation-guide.js')));
  const { lessons } = await import(pathToFileURL(path.resolve(__dirname, '../pythonlab/course-data.js')));
  let checked = 0;
  for (const lesson of lessons) {
    for (const [stage, activity] of lesson.activities.entries()) {
      const base = { stage, activity, code: activity.solution, input: activity.input, ready: true, busy: false, runtimeState: 'ready' };
      const get = overrides => operationStep({ ...base, ...overrides });
      assert.equal(get({}).action, stage === 0 ? 'run' : 'edit');
      assert.equal(get({ ready: false }).action, 'edit');
      assert.equal(get({ busy: true }).action, 'stop', 'busy state must never prompt another run or verification');
      assert.equal(get({ ready: false, runtimeState: 'error' }).action, 'retry');
      if (/\binput\s*\(/.test(activity.solution)) {
        assert.equal(get({ input: '' }).action, 'input', 'missing trial input should offer a direct way to fill or restore the example');
        assert.equal(get({ input: '' }).secondary.action, 'load-input');
      }
      const execution = { code: base.code, input: base.input, ok: true };
      assert.equal(get({ execution }).action, stage === 0 ? 'output' : 'check', 'a successful run must never award a star');
      assert.notEqual(get({ execution: { ...execution, input: 'different input' } }).action, 'check', 'changing test input requires a fresh run suggestion');
      assert.equal(get({ execution: { ...execution, ok: false } }).action, 'feedback');
      const verification = { code: base.code, ok: false };
      assert.equal(get({ verification }).action, 'feedback');
      assert.notEqual(get({ verification, code: 'new code' }).action, 'feedback', 'stale failures must not be shown for edited code');
      if (stage > 0) {
        assert.equal(get({ verification: { ...verification, ok: true } }).action, stage === 1 ? 'next' : 'certificate');
        assert.notEqual(get({ verification: { ...verification, ok: true }, code: 'changed after passing' }).action, 'certificate', 'changed code must not be shown as freshly verified');
      }
      if (activity.tier) {
        if (stage === 4) assert.equal(get({ verification: { code: base.code, ok: true }, isLastUnit: lesson.id === lessons.at(-1).id }).secondary.label, lesson.id === lessons.at(-1).id ? '返回課程總覽 →' : '前往下一單元 →');
        const completed = { levels: { [activity.tier]: { code: base.code } } };
        assert.equal(get({ completed }).action, 'certificate');
        assert.notEqual(get({ completed, code: 'changed' }).action, 'certificate');
        assert.equal(get({ completed, verification }).action, 'feedback', 'a current failed recheck must override the historic success suggestion');
        assert.equal(get({ completed, execution: { ...execution, ok: false }, lastAction: 'run' }).action, 'feedback', 'current input errors must be explained even for historically verified code');
        assert.equal(get({ completed, execution: { ...execution, ok: false }, verification: { code: base.code, ok: true }, lastAction: 'check' }).action, 'certificate', 'a new successful verification supersedes an earlier failed trial');
        assert.equal(get({ verification: { code: base.code, ok: true }, input: 'custom input' }).action, 'certificate', 'verification does not depend on trial input');
      }
      checked++;
    }
  }
  console.log(`Student operation guide: ${checked} activities checked for loading, busy/stop, run versus verification, stale results, error recovery, saved achievements and certificate continuation.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
