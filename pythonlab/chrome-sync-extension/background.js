import { createSyncStore } from './sync-store.js';

const store = createSyncStore(chrome);
chrome.runtime.onMessage.addListener((request, sender, reply) => {
  if (!store.validSender(sender) || !['status', 'activate', 'push'].includes(request?.action)) return false;
  store.request(request).then(value => reply({ ok: true, value }), error => reply({ ok: false, error: error.message }));
  return true;
});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'pythonlab-retry') void store.request({ action: 'status' }).catch(() => {});
});
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === 'sync') void store.request({ action: 'status' }).catch(() => {});
});
