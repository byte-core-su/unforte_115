const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const window = {};
for (const file of ['block-program-tasks.js', 'block-program.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { window });
}
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
      assert.equal(window.BlockProgram.execute(task, program, values).passed, true, file + ' ' + name);
    }
    for (const block of program) {
      const incomplete = program.filter(id => id !== block);
      assert.ok(task.cases.some(({ values }) => !window.BlockProgram.execute(task, incomplete, values).passed),
        file + ' missing ' + block);
    }
  }
});
