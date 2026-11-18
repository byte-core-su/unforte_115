const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { openZip } = require('../scripts/check-course-materials.cjs');

(async () => {
  const load = name => import(pathToFileURL(path.resolve(__dirname, '../pythonlab/chrome-sync-extension', name)));
  const { createSyncStore } = await load('sync-store.js');
  const { PREFIX, summaryOf, applySummary, allowPage } = await load('progress-core.js');
  const progress = await import(pathToFileURL(path.resolve(__dirname, '../pythonlab/progress.js')));
  const records = await import(pathToFileURL(path.resolve(__dirname, '../pythonlab/learning-record.js')));
  const clone = value => JSON.parse(JSON.stringify(value));
  const shared = {};
  function device(id) {
    const local = {};
    let fail = false;
    let alarm = false;
    const area = data => ({
      async get(key) { return clone(key === null ? data : { [key]: data[key] ?? null }); },
      async set(values) { Object.assign(data, clone(values)); }
    });
    const api = { runtime: { id: 'extension-id', getURL: value => `chrome-extension://extension-id/${value}` },
      storage: { local: area(local), sync: { ...area(shared), async set(values) { if (fail) throw new Error('quota or temporary error'); Object.assign(shared, clone(values)); } } },
      alarms: { async create() { alarm = true; } } };
    return { store: createSyncStore(api, () => id), api, local, set fail(value) { fail = value; }, get retryScheduled() { return alarm; } };
  }
  const a = device('computer-a');
  const b = device('computer-b');
  assert.equal((await a.store.request({ action: 'status' })).enabled, false);
  await a.store.request({ action: 'activate' });
  assert.equal((await b.store.request({ action: 'status' })).enabled, true, 'a new computer follows the profile activation setting');
  const state = { completed: { 12: { levels: { 3: { code: 'private program', verifiedAt: 100, elapsedMs: 1000 } } } },
    timings: { 12: { elapsedMs: 1000 } }, recent: { unit: 12, stage: 4, updatedAt: 100 }, drafts: { '12-4': { code: 'secret draft' } }, student: { name: 'private name' } };
  const compact = summaryOf(state);
  assert.doesNotMatch(JSON.stringify(compact), /private program|secret draft|private name/);
  const op = (client, sequence, value, base = summaryOf()) => ({ client, sequence, progress: summaryOf(value), base });
  const first = op('page-aaa', 1, state);
  const saved = await a.store.request({ action: 'push', operation: first });
  assert.equal(saved.progress.timings[12].elapsedMs, 1000);
  await a.store.request({ action: 'push', operation: first });
  assert.equal((await b.store.request({ action: 'status' })).progress.timings[12].elapsedMs, 1000, 'replaying a lost acknowledgement must not double time');
  const newState = applySummary({ completed: {}, timings: {}, drafts: {}, student: {} }, saved.progress);
  assert.equal(progress.earnedStars(newState.completed[12]), 3);
  assert.equal(newState.completed[12].levels[3].code, undefined, 'synced progress cannot fabricate a local program');
  assert.equal(newState.completed[12].levels[1], undefined, 'direct tier 3 completion preserves independent tiers');
  assert.deepEqual(newState.drafts, {});
  assert.equal(records.certificateRecord(newState.completed[12]).elapsedMs, 1000);
  const left = clone(saved.progress); left.timings[12].elapsedMs += 500;
  const right = clone(saved.progress); right.timings[12].elapsedMs += 200;
  await Promise.all([
    a.store.request({ action: 'push', operation: op('page-aaa', 2, left, saved.progress) }),
    b.store.request({ action: 'push', operation: op('page-bbb', 1, right, saved.progress) })
  ]);
  assert.equal((await a.store.request({ action: 'status' })).progress.timings[12].elapsedMs, 1700, 'concurrent devices use independent time counters');

  const earlier = clone(left); earlier.completed[12].levels[3].achievedAt = 50;
  const lower = summaryOf({ completed: { 1: { levels: { 1: { code: 'one', verifiedAt: 200 } } } } });
  await b.store.request({ action: 'push', operation: op('page-bbb', 2, earlier, right) });
  await a.store.request({ action: 'push', operation: op('page-aaa', 3, lower, left) });
  const merged = (await a.store.request({ action: 'status' })).progress;
  assert.equal(merged.completed[12].levels[3].achievedAt, 50, 'same-tier metadata converges on the first achievement');
  assert.ok(merged.completed[1].levels[1]);
  const pending = clone(merged); pending.timings[12].elapsedMs += 300;
  a.fail = true;
  const pendingOp = op('page-aaa', 4, pending, merged);
  assert.equal((await a.store.request({ action: 'push', operation: pendingOp })).pending, true);
  assert.equal(a.retryScheduled, true);
  const restarted = createSyncStore(a.api, () => 'must-not-replace-the-device');
  a.fail = false;
  const recovered = await restarted.request({ action: 'push', operation: pendingOp });
  assert.equal(recovered.progress.timings[12].elapsedMs, merged.timings[12].elapsedMs + 300, 'worker restart and replay retain pending work exactly once');
  const activeState = { ...newState, drafts: { '12-4': { code: 'current private code' } }, timings: { 12: { elapsedMs: 1300 } } };
  const accepted = applySummary(activeState, { ...saved.progress, timings: { 12: { elapsedMs: 1500 } } }, saved.progress);
  assert.equal(accepted.timings[12].elapsedMs, 1800, 'time added while a request is running must survive the response');
  assert.equal(accepted.drafts['12-4'].code, 'current private code');
  const legacy = summaryOf({ completed: { 1: { code: 'legacy code', verifiedAt: 1 } } });
  assert.equal(progress.earnedStars(legacy.completed[1]), 1);
  for (const url of ['https://byte-core-su.github.io/unforte_115/pythonlab/', 'http://127.0.0.1:4173/pythonlab/index.html', 'http://localhost:4173/pythonlab/']) assert.equal(allowPage(url), true);
  for (const url of ['https://example.com/pythonlab/', 'https://byte-core-su.github.io/other/pythonlab/', 'http://127.0.0.1:4173/1150801.html']) assert.equal(allowPage(url), false);
  assert.equal(a.store.validSender({ id: 'other-extension', tab: { url: 'http://localhost:4173/pythonlab/' } }), false);
  await assert.rejects(a.store.request({ action: 'push', operation: { client: '__proto__', sequence: 1 } }), /格式/);
  assert.ok(Object.keys(shared).every(key => key.startsWith(PREFIX)));
  assert.ok(Buffer.byteLength(JSON.stringify(shared)) < 10000, 'all representative sync data remain well below the quota');
  const extension = path.resolve(__dirname, '../pythonlab/chrome-sync-extension');
  const zip = openZip(fs.readFileSync(path.resolve(__dirname, '../pythonlab/chrome-sync-extension.zip')));
  for (const file of fs.readdirSync(extension)) assert.deepEqual(zip.read(file), fs.readFileSync(path.join(extension, file)), `download ZIP matches ${file}`);
  console.log('Chrome progress: independent tiers, private-field exclusion, concurrent device counters, first-achievement certificates, idempotent replay, worker restart, live timer merge and trusted origins passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
