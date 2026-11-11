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
