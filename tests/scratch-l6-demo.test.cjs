const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { openZip } = require('../scripts/check-course-materials.cjs');
const { buildDemo } = require('../scripts/build-scratch-l6-demo.cjs');
const { scenarios } = require('../course-scenarios.js');

const file = path.join(__dirname, '..', '1150806-demo.sb3');

test('the downloadable Scratch demo matches its build source and contains every media asset', () => {
  const artifact = openZip(fs.readFileSync(file));
  const rebuilt = openZip(buildDemo());
  assert.equal(artifact.read('project.json').toString('utf8'), rebuilt.read('project.json').toString('utf8'));
  const project = JSON.parse(artifact.read('project.json').toString('utf8'));
  for (const target of project.targets) for (const media of [...target.costumes, ...target.sounds]) {
    const content = artifact.read(media.md5ext);
    assert.ok(content.equals(rebuilt.read(media.md5ext)), `${media.name}: stale file`);
    assert.equal(createHash('md5').update(content).digest('hex'), media.assetId, `${media.name}: wrong asset bytes`);
  }
});

test('each main Scratch script calls the same four named modules in teaching order', () => {
  const zip = openZip(fs.readFileSync(file));
  const project = JSON.parse(zip.read('project.json').toString('utf8'));
  const { blocks } = project.targets.find(target => target.name === '對決控制台');
  const modules = scenarios.space.duel.modules;
  const prototypes = Object.values(blocks).filter(block => block.opcode === 'procedures_prototype');
  assert.deepEqual(prototypes.map(block => block.mutation.proccode), modules);
  const blockChain = id => {
    const chain = [];
    const visited = new Set();
    while (id) {
      assert.ok(blocks[id] && !visited.has(id), 'broken block link');
      visited.add(id);
      const block = blocks[id];
      chain.push(block);
      id = block.next;
    }
    return chain;
  };
  const events = Object.values(blocks).filter(block => /^event_when(flagclicked|keypressed)$/.test(block.opcode));
  assert.deepEqual(events.map(block => block.fields.KEY_OPTION?.[0] ?? 'flag'), ['flag', '1', '2', '3']);
  for (const event of events) {
    const start = blocks[event.next];
    const body = blockChain(start.inputs.SUBSTACK?.[1] ?? event.next);
    assert.deepEqual(body.filter(block => block.opcode === 'procedures_call').map(block => block.mutation.proccode), modules);
  }
});
