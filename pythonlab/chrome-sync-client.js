import { summaryOf, applySummary, same } from './chrome-sync-extension/progress-core.js';

export function mountChromeSync({ readState, replaceState, switchStorage, isSyncStorage }) {
  const $ = selector => document.querySelector(selector);
  const metaKey = 'pythonlab-chrome-meta-v1';
  const client = crypto.randomUUID();
  let sequence = 0;
  let meta;
  try { meta = JSON.parse(localStorage.getItem(metaKey) || 'null'); } catch { /* Keep local progress available. */ }
  meta ||= { base: summaryOf(), pending: null, imported: false };
  let connected = false;
  let active = false;
  let flight = null;
  let timer;
  let lastWrite = 0;
  let latest = null;
  const requests = new Map();
  const persist = () => localStorage.setItem(metaKey, JSON.stringify(meta));
  function report(kind, text) {
    $('#chrome-progress').dataset.state = kind;
    $('#chrome-progress-status').textContent = text;
    $('#chrome-progress-enable').hidden = active;
    $('#chrome-progress-enable').disabled = !connected;
    $('#chrome-progress-now').hidden = !active;
    $('#chrome-progress-note').textContent = isSyncStorage()
      ? '星級、位置與時間使用此 Chrome 個人資料的同步區。程式草稿保存在這台電腦。'
      : '目前保存在這台電腦。啟用後可合併既有進度。';
    if ($('#reset-progress') && isSyncStorage()) $('#reset-progress').textContent = '重新讀取 Chrome 同步進度';
  }
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.channel !== 'pythonlab-extension-v1') return;
    const pending = requests.get(event.data.id);
    if (!pending) return;
    clearTimeout(pending.timeout); requests.delete(event.data.id);
    if (event.data.ok) pending.resolve(event.data.value);
    else pending.reject(new Error(event.data.error || '擴充功能尚未回應，請重新整理後再試。'));
  });
  function request(action, operation) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timeout = setTimeout(() => { requests.delete(id); reject(new Error('未連接進度同步擴充功能。可按「安裝與同步說明」查看安裝方式。')); }, 6000);
      requests.set(id, { resolve, reject, timeout });
      window.postMessage({ channel: 'pythonlab-page-v1', id, action, operation }, location.origin);
    });
  }
  function schedule(value) {
    if (value) latest = summaryOf(value);
    if (!active || flight || timer || (!meta.pending && same(latest, meta.base))) return;
    if (latest && !same({ ...latest, timings: {} }, { ...meta.base, timings: {} })) report('pending', '進度已保存在這台電腦，等待寫入 Chrome 同步區。');
    timer = setTimeout(() => { timer = null; void syncNow(); }, Math.max(1500, lastWrite + 30000 - Date.now()));
  }
  function accept(reply, submitted) {
    const next = applySummary(readState(), reply.progress, submitted);
    meta.base = summaryOf(reply.progress); meta.pending = null;
    persist();
    replaceState(next);
    latest = summaryOf(next);
    lastWrite = Date.now();
    report(reply.pending ? 'error' : 'saved', reply.pending
      ? `已保存在擴充功能的本機備份，等待重試。${reply.error || ''}`
      : '已寫入 Chrome 同步區。跨電腦更新由 Chrome 處理。');
  }
  async function perform() {
    clearTimeout(timer); timer = null;
    try {
      if (!connected) {
        const status = await request('status');
        connected = true;
        if (!status.enabled) { active = false; report('ready', '已連接擴充功能，請先啟用此個人資料的進度同步。'); return; }
        active = true;
        if (!isSyncStorage()) {
          switchStorage(false);
          if (!meta.pending && same(summaryOf(readState()), summaryOf())) {
            accept(status, summaryOf()); return;
          }
        }
      }
      if (!active) return;
      report('saving', '正在寫入 Chrome 同步區…');
      const current = summaryOf(readState());
      if (!meta.pending && !same(current, meta.base)) {
        meta.pending = { client, sequence: ++sequence, progress: current, base: meta.base };
        persist();
      }
      const operation = meta.pending;
      const reply = await request(operation ? 'push' : 'status', operation);
      accept(reply, operation?.progress || current);
    } catch (error) {
      report('error', error.message || '同步未完成，進度已留在這台電腦。');
      if (active) timer = setTimeout(() => { timer = null; void syncNow(); }, 30000);
    }
  }
  function syncNow() {
    if (flight) return flight;
    flight = perform().finally(() => { flight = null; schedule(); });
    return flight;
  }
  async function activate(importLocal) {
    if (flight) return;
    flight = (async () => {
      try {
        const original = summaryOf(readState());
        const reply = await request('activate');
        connected = true; active = true;
        switchStorage(importLocal);
        let current = readState();
        current = applySummary(current, reply.progress, meta.base);
        if (importLocal && !meta.imported) {
          current = applySummary(current, original, summaryOf());
          meta.imported = true;
        }
        meta.base = summaryOf(reply.progress);
        replaceState(current); persist();
      } catch (error) { report('error', error.message); }
    })().finally(() => { flight = null; });
    await flight;
    if (active) await syncNow();
  }
  $('#chrome-progress-enable').addEventListener('click', () => {
    $('#chrome-import-local').disabled = meta.imported;
    $('#chrome-activate-dialog').showModal();
  });
  $('#chrome-load-progress').addEventListener('click', () => { $('#chrome-activate-dialog').close(); void activate(false); });
  $('#chrome-import-local').addEventListener('click', () => { $('#chrome-activate-dialog').close(); void activate(true); });
  $('#chrome-activate-cancel').addEventListener('click', () => $('#chrome-activate-dialog').close());
  $('#chrome-progress-now').addEventListener('click', () => void syncNow());
  $('#chrome-progress-help').addEventListener('click', () => $('#chrome-help-dialog').showModal());
  $('#chrome-help-close').addEventListener('click', () => $('#chrome-help-dialog').close());
  $('#chrome-progress-retry').addEventListener('click', () => { $('#chrome-help-dialog').close(); connected = false; void syncNow(); });
  window.addEventListener('online', () => { if (active) void syncNow(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && active) void syncNow(); });
  report('checking', '正在連接 Chrome 進度同步擴充功能…');
  void syncNow();
  return { schedule, syncNow, refresh() { $('#chrome-progress-note').textContent = isSyncStorage()
    ? '星級、位置與時間使用此 Chrome 個人資料的同步區。程式草稿保存在這台電腦。' : '目前保存在這台電腦。啟用後可合併既有進度。';
    if ($('#reset-progress') && isSyncStorage()) $('#reset-progress').textContent = '重新讀取 Chrome 同步進度'; } };
}
