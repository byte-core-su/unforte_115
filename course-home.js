'use strict';

const promptBox = document.querySelector('#rewrite-prompt');
const copyButton = document.querySelector('#copy-rewrite-prompt');
const copyStatus = document.querySelector('#rewrite-copy-status');
const rewriteGuide = document.querySelector('#rewrite-course');

function openLinkedGuide() {
  if (location.hash === '#rewrite-course') rewriteGuide.open = true;
}

openLinkedGuide();
window.addEventListener('hashchange', openLinkedGuide);
// Features that need a web address explain themselves only when the page is opened from a folder.
document.querySelectorAll('[data-local-help]').forEach(note => { note.hidden = location.protocol !== 'file:'; });

copyButton.hidden = false;
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(promptBox.value);
    copyStatus.textContent = '已複製改寫指令。';
  } catch {
    promptBox.focus();
    promptBox.select();
    copyStatus.textContent = '已選取指令，可用 Ctrl+C 或裝置的複製功能。';
  }
});

// 教師示範模式：只存在這個分頁（sessionStorage），各課的學習路線、CodeGame、Python Lab 會讀取同一個鍵。
const demoKey = 'unforte115:teacher-demo';
const demoToggle = document.querySelector('#teacher-demo-toggle');
function demoOn() { try { return sessionStorage.getItem(demoKey) === '1'; } catch { return false; } }
function renderDemo() {
  const on = demoOn();
  demoToggle.setAttribute('aria-pressed', String(on));
  demoToggle.textContent = on ? '結束教師示範模式' : '開啟教師示範模式';
  demoToggle.classList.toggle('is-on', on);
}
if (demoToggle) {
  demoToggle.addEventListener('click', () => {
    try { if (demoOn()) sessionStorage.removeItem(demoKey); else sessionStorage.setItem(demoKey, '1'); } catch { /* 無法保存時改用網址參數 ?teacher=1 */ }
    renderDemo();
  });
  renderDemo();
}
