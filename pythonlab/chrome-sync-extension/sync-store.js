import { PREFIX, summaryOf, mergeSummaries, readSyncData, same, allowPage } from './progress-core.js';

export function createSyncStore(api, makeId = () => crypto.randomUUID()) {
  const localKey = 'pythonlab-device-v1';
  let queue = Promise.resolve();
  async function load() {
    const saved = (await api.storage.local.get(localKey))[localKey];
    return saved || { deviceId: makeId(), enabled: false, progress: summaryOf(), times: {}, receipts: {}, pending: false };
  }
  async function persist(model) { await api.storage.local.set({ [localKey]: model }); }
  async function write(model, stored) {
    const progress = mergeSummaries(model.progress, readSyncData(stored));
    model.progress = progress;
    const ownTimeKey = `${PREFIX}time:${model.deviceId}`;
    for (let unit = 1; unit <= 12; unit++) model.times[unit] = Math.max(model.times[unit] || 0, stored[ownTimeKey]?.[unit] || 0);
    const desired = { [ownTimeKey]: model.times };
    for (const [unit, record] of Object.entries(progress.completed)) {
      for (const [tier, evidence] of Object.entries(record.levels)) desired[`${PREFIX}star:${unit}:${tier}`] = evidence;
    }
    if (progress.position) desired[`${PREFIX}position`] = progress.position;
    if (model.enabled) desired[`${PREFIX}enabled`] = true;
    const changes = Object.fromEntries(Object.entries(desired).filter(([key, value]) => !same(stored[key], value)));
    model.pending = Object.keys(changes).length > 0;
    await persist(model);
    if (model.pending) {
      try {
        const combined = { ...stored, ...changes };
        const size = (key, value) => new TextEncoder().encode(key + JSON.stringify(value)).length;
        if (Object.keys(combined).length > 512 || Object.entries(changes).some(([key, value]) => size(key, value) > 8192)
          || Object.entries(combined).reduce((sum, [key, value]) => sum + size(key, value), 0) > 102400) {
          throw new Error('Chrome 同步空間不足。進度已留在此個人資料的本機備份。');
        }
        await api.storage.sync.set(changes);
        model.pending = false;
        await persist(model);
      } catch (error) {
        await api.alarms.create('pythonlab-retry', { delayInMinutes: 1 });
        return { enabled: model.enabled, progress: readSyncData({ ...stored, ...desired }), pending: true, error: error.message };
      }
    }
    return { enabled: model.enabled, progress: readSyncData({ ...stored, ...desired }), pending: false };
  }
  async function handle(request) {
    const model = await load();
    const stored = await api.storage.sync.get(null);
    model.enabled ||= stored[`${PREFIX}enabled`] === true;
    if (request.action === 'activate') model.enabled = true;
    if (request.action === 'push') {
      if (!model.enabled) throw new Error('請先在教材頁啟用進度同步。');
      const operation = request.operation;
      if (!operation || !/^[a-zA-Z0-9-]{8,80}$/.test(operation.client) || !Number.isSafeInteger(operation.sequence) || operation.sequence < 1) throw new Error('同步請求格式不正確。');
      if ((model.receipts[operation.client] || 0) < operation.sequence) {
        const local = summaryOf(operation.progress);
        const base = summaryOf(operation.base);
        model.progress = mergeSummaries(model.progress, local);
        for (let unit = 1; unit <= 12; unit++) {
          const delta = Math.max(0, (local.timings[unit]?.elapsedMs || 0) - (base.timings[unit]?.elapsedMs || 0));
          model.times[unit] = (model.times[unit] || 0) + delta;
        }
        model.receipts[operation.client] = operation.sequence;
        await persist(model);
      }
    }
    if (model.enabled) return write(model, stored);
    await persist(model);
    return { enabled: false, progress: readSyncData(stored), pending: false };
  }
  return {
    request(value) {
      const work = queue.then(() => handle(value));
      queue = work.catch(() => {});
      return work;
    },
    validSender(sender) { return sender.id === api.runtime.id && (sender.url?.startsWith(api.runtime.getURL('')) || allowPage(sender.tab?.url || sender.url)); }
  };
}
