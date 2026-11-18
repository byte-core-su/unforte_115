async function refresh() {
  const status = document.querySelector('#status');
  try {
    const reply = await chrome.runtime.sendMessage({ action: 'status' });
    if (!reply?.ok) throw new Error(reply?.error || '無法讀取同步區。');
    const { enabled, progress, pending } = reply.value;
    const count = Object.values(progress.completed).filter(record => record.levels[2] || record.levels[3]).length;
    status.textContent = !enabled ? '請先在教材頁啟用進度同步。' : pending ? '進度已保存在本機，等待重新寫入同步區。' : '擴充功能已就緒。跨電腦更新由 Chrome 處理。';
    document.querySelector('#summary').textContent = `已達二星以上 ${count}／12 單元`;
  } catch (error) { status.textContent = error.message; }
}
document.querySelector('#retry').addEventListener('click', () => void refresh());
document.querySelector('#settings').addEventListener('click', () => void chrome.tabs.create({ url: 'chrome://settings/syncSetup' }));
void refresh();
