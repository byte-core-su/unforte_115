'use strict';

// Features that need a web address explain themselves only when the page is opened from a folder.
document.querySelectorAll('[data-local-help]').forEach(note => { note.hidden = location.protocol !== 'file:'; });

const demoToggle = document.querySelector('#teacher-demo-toggle');
const teacher = window.TeacherDemo;
function renderDemo() {
  const on = teacher.isOn();
  demoToggle.setAttribute('aria-pressed', String(on));
  demoToggle.textContent = on ? '結束教師示範模式' : '開啟教師示範模式';
  demoToggle.classList.toggle('is-on', on);
}
if (demoToggle) {
  demoToggle.addEventListener('click', () => {
    teacher.toggle();
    renderDemo();
  });
  renderDemo();
}
