(() => {
  const path = location.pathname;
  const valid = location.origin === 'https://byte-core-su.github.io'
    ? /^\/unforte_115\/pythonlab\/(?:index\.html)?$/.test(path)
    : ['127.0.0.1', 'localhost'].includes(location.hostname) && /^\/pythonlab\/(?:index\.html)?$/.test(path);
  if (!valid || window.top !== window) return;
  window.addEventListener('message', async event => {
    const data = event.data;
    if (event.source !== window || event.origin !== location.origin || data?.channel !== 'pythonlab-page-v1'
      || typeof data.id !== 'string' || !['status', 'activate', 'push'].includes(data.action)) return;
    if (JSON.stringify(data).length > 50000) return;
    try {
      const response = await chrome.runtime.sendMessage({ action: data.action, operation: data.operation });
      window.postMessage({ channel: 'pythonlab-extension-v1', id: data.id, ...response }, location.origin);
    } catch {
      window.postMessage({ channel: 'pythonlab-extension-v1', id: data.id, ok: false, error: '擴充功能連線中斷，請重新整理教材頁。' }, location.origin);
    }
  });
})();
