const { test } = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../course-scenarios.js');
const registry = require('../course-materials.json');
const { inspectMaterials, openZip } = require('../scripts/check-course-materials.cjs');

test('both capstones link to their real assets and course documents', () => {
  const { checked, errors, warnings } = inspectMaterials();
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(checked.map(item => item.key), ['space/1150706.html', 'space/1150806.html']);
  for (const [index, grade] of [7, 8].entries()) {
    assert.equal(checked[index].archive, catalog.scenarios.space.grades[grade].archive);
    assert.ok(checked[index].assets > 0);
  }
  assert.equal(checked[1].demo, '1150806-demo.sb3');
});

test('a missing nested Scratch entry or an invalid ZIP fails validation', () => {
  const broken = { space: { '1150706.html': structuredClone(registry.space['1150706.html']) } };
  broken.space['1150706.html'].scratch.entry = '11507/missing.sb3';
  assert.match(inspectMaterials({ registry: broken }).errors.join('\n'), /ZIP 內找不到 11507\/missing\.sb3/);
  assert.throws(() => openZip(Buffer.alloc(8)), /找不到 ZIP 中央目錄/);
});

test('missing animation or presentation locations are reported, not silently skipped', () => {
  const broken = { space: { '1150806.html': structuredClone(registry.space['1150806.html']) } };
  broken.space['1150806.html'].animation.hostIds.push('missing-animation');
  broken.space['1150806.html'].presentation.references[0].fragment = 'missing-slide';
  const { errors } = inspectMaterials({ registry: broken });
  assert.ok(errors.some(error => error.includes('#missing-animation')));
  assert.ok(errors.some(error => error.includes('#missing-slide')));
});

test('a changed costume sequence is detected in both Scratch versions', () => {
  const modifiedRegistry = { space: { '1150806.html': structuredClone(registry.space['1150806.html']) } };
  const space = structuredClone(catalog.scenarios.space);
  space.duel.types[0] = '不符造型';
  const { errors, warnings } = inspectMaterials({ registry: modifiedRegistry, scenarios: { space } });
  assert.equal(errors.filter(error => error.includes('示範造型編號未與網頁同步')).length, 2);
  assert.deepEqual(warnings.map(item => item.code), ['costume-order']);
  assert.match(warnings[0].message, /造型 1.*不符造型A/);
});
