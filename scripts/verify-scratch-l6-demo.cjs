// Optional end-to-end Scratch VM check. Resolve the official VM from an external test directory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

async function verify(vmDirectory) {
  const load = name => require(require.resolve(name, { paths: [vmDirectory] }));
  const VirtualMachine = load('scratch-vm');
  const { ScratchStorage } = load('scratch-storage');
  const vm = new VirtualMachine();
  vm.attachStorage(new ScratchStorage());
  try {
    await vm.loadProject(fs.readFileSync(path.join(__dirname, '..', '1150806-demo.sb3')));
    const stage = vm.runtime.getTargetForStage();
    const value = id => stage.variables[id].value;
    const numbers = id => value(id).map(Number);
    const range = count => Array.from({ length: count }, (_, index) => index + 1);
    const sorted = values => [...values].sort((a, b) => a - b);
    const weapons = ['地球防衛武器', '外星人太空武器'].map(name => vm.runtime.getSpriteTargetByName(name));
    const roundLines = () => value('trace').filter(line => line.startsWith('回合 '));
    const wait = async () => {
      const deadline = Date.now() + 20000;
      while (vm.runtime.threads.length) {
        assert.ok(Date.now() < deadline, 'Scratch VM execution timed out');
        await delay(25);
      }
      assert.equal(Number(value('busy')), 0);
    };
    const key = number => vm.runtime.startHats('event_whenkeypressed', { KEY_OPTION: String(number) });
    const checkRounds = count => {
      const left = numbers('squad'), right = numbers('enemy'), rest = numbers('shuffled');
      assert.equal(left.length, 6);
      assert.equal(right.length, 6);
      assert.equal(rest.length, count - 12);
      assert.deepEqual(sorted([...left, ...right, ...rest]), range(count), 'items must be conserved without duplicates');
      assert.deepEqual(numbers('seen'), left.flatMap((item, index) => [item, right[index]]));
      assert.deepEqual(roundLines(), left.map((item, index) => `回合 ${index + 1}｜我方 ${item}：外星 ${right[index]} → ${item > right[index] ? '勝' : item < right[index] ? '敗' : '平手'}`));
      assert.equal(Number(value('wins')), left.filter((item, index) => item > right[index]).length);
      assert.equal(Number(value('losses')), left.filter((item, index) => item < right[index]).length);
      assert.equal(Number(value('ties')), 0);
      assert.equal(Number(value('duplicate')), 0);
      assert.equal(weapons[0].currentCostume, left.at(-1) - 1);
      assert.equal(weapons[1].currentCostume, right.at(-1) - 1);
      assert.ok(weapons.every(weapon => weapon.visible));
      assert.match(value('trace').at(-1), /兩隊裝備沒有重複/);
    };
    vm.start();
    vm.greenFlag();
    await wait();
    assert.match(value('trace')[0], /數量足夠/);
    checkRounds(24);
    console.log('Scratch VM 綠旗：24 件分配 12 件、保留 12 件，6 回合結果與造型正確。');

    key(2);
    await wait();
    assert.match(value('trace')[0], /數量不足/);
    assert.deepEqual(sorted(numbers('shuffled')), range(8));
    assert.deepEqual(numbers('squad'), []);
    assert.deepEqual(numbers('enemy'), []);
    assert.deepEqual(roundLines(), []);
    assert.equal(Number(value('ready')), 0);
    assert.ok(weapons.every(weapon => !weapon.visible));
    assert.match(value('trace').join('\n'), /不足：需要 12，目前 8；不分配/);
    console.log('Scratch VM 按 2：庫存不足時保留 8 件，不分配、不對決。');

    key(3);
    await wait();
    assert.match(value('trace')[0], /修正後重測不重複/);
    checkRounds(12);
    console.log('Scratch VM 按 3：修正庫存為 12，兩隊不重複、待分配清單歸零。');

    key(1);
    await wait();
    checkRounds(24);
    console.log('Scratch VM 按 1：連續操作可重置上一組資料，重新完成足夠案例。');
  } finally { vm.quit(); }
}

if (require.main === module) verify(path.resolve(process.argv[2] || '.')).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
