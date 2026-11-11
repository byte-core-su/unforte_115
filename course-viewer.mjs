import { escapeHtml as e, loadCatalog, decodeCourse, encodeCourse, prerequisiteWarnings, resolveCourseNavigation, downloadCourse } from './course-kit.mjs';
const $ = id => document.getElementById(id);
let modules, course, selected, position = 0, navigationObserver;
const status = message => { $('status').textContent = message; };

function showOutline() { $('course-outline').scrollIntoView({ behavior: 'smooth', block: 'start' }); status('請從這門課的學習地圖選擇單元。'); }
function go(index) {
  if (index < 0 || index >= selected.length) { showOutline(); return; }
  navigationObserver?.disconnect();
  position = index;
  const module = selected[position];
  $('current-position').textContent = `第 ${position + 1} / ${selected.length} 個單元 · ${module.grade === 7 ? '七' : '八'}年級原第 ${module.lesson} 課`;
  $('current-title').textContent = module.title;
  $('standalone-module').href = module.entry;
  $('previous-module').disabled = position === 0;
  $('next-module').disabled = position === selected.length - 1;
  for (const button of document.querySelectorAll('[data-start]')) {
    if (Number(button.dataset.start) === position) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
  $('lesson-frame').title = `${module.title}：互動教材`;
  $('lesson-frame').src = module.entry;
  status(`目前為「${module.title}」。單元內的互動與測驗保留原規則。`);
}

// Adapt only course navigation inside this same-origin lesson view.
// The source lessons and their independent mode are not changed.
function attachCourseNavigation() {
  const doc = $('lesson-frame').contentDocument;
  if (!doc || !selected) return;
  const module = selected[position];
  function navigationFor(control) {
    if (control?.dataset.courseDirection) return control.dataset.courseDirection;
    return control ? resolveCourseNavigation({ href: control.getAttribute('href'), onclick: control.getAttribute('onclick') || '', tagName: control.tagName, textContent: control.textContent }, module, modules) : null;
  }
  function adapt() {
    for (const control of doc.querySelectorAll('a,button')) {
      const direction = navigationFor(control);
      if (!direction) continue;
      // React owns these child nodes. Keep that tree intact; use the outer course toolbar.
      if (module.entry === '1150801.html' && control.closest('#app-container')) { control.hidden = true; continue; }
      const label = direction === 'outline' ? '查看本課程地圖 ↑' : direction === 'next' ? (position === selected.length - 1 ? '本課程最後一個單元，查看地圖 ↑' : '下一個選課單元 →') : (position === 0 ? '查看本課程地圖 ↑' : '← 上一個選課單元');
      control.dataset.courseDirection = direction;
      if (control.textContent !== label) control.textContent = label;
    }
  }
  doc.addEventListener('click', event => {
    const control = event.target.closest('a,button');
    const direction = navigationFor(control);
    if (!direction) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (direction === 'outline') showOutline();
    else go(position + (direction === 'next' ? 1 : -1));
  }, true);
  adapt();
  navigationObserver = new MutationObserver(adapt);
  navigationObserver.observe(doc.body, { childList: true, subtree: true });
}

async function start() {
  modules = await loadCatalog();
  course = decodeCourse(location.hash, modules);
  selected = course.moduleIds.map(id => modules.find(item => item.id === id));
  document.title = `${course.title}｜V-2 組合課程`;
  $('course-name').textContent = course.title;
  $('course-description').textContent = course.description || `共 ${selected.length} 個單元，依下方地圖順序學習。`;
  $('edit-course').href = 'course-builder.html' + encodeCourse(course);
  $('course-modules').innerHTML = selected.map((module, index) => `<li><button type="button" data-start="${index}"><span class="step-number">${index + 1}</span><span><span class="small">${module.grade === 7 ? '七' : '八'}年級 · 原第 ${module.lesson} 課</span><strong>${e(module.title)}</strong><span class="small">${e(module.tags.join(' · '))}</span></span></button></li>`).join('');
  const warnings = prerequisiteWarnings(course, modules);
  $('prerequisite-notes').hidden = !warnings.length;
  $('prerequisite-notes').innerHTML = `<b>建議先備能力（不鎖課）</b><ul>${warnings.map(warning => `<li>${e(warning)}</li>`).join('')}</ul>`;
  $('course-modules').addEventListener('click', event => { const button = event.target.closest('[data-start]'); if (button) go(Number(button.dataset.start)); });
  $('previous-module').addEventListener('click', () => go(position - 1));
  $('next-module').addEventListener('click', () => go(position + 1));
  $('lesson-frame').addEventListener('load', attachCourseNavigation);
  $('download-config').disabled = $('copy-link').disabled = false;
  $('download-config').addEventListener('click', () => downloadCourse(course));
  $('copy-link').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); status('已複製課程連結。連結包含課程名稱與選課順序，收到的人可直接開啟。'); }
    catch { $('share-fallback').hidden = false; $('share-url').value = location.href; $('share-url').select(); status('請複製下方完整網址。'); }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) status('已準備課程連結。本機預覽網址只適用這台電腦；跨電腦請分享已部署網站的連結，或提供 JSON 讓對方匯入自己的 V-2。');
  });
  $('viewer').hidden = false;
  go(0);
}
window.addEventListener('hashchange', () => location.reload());
start().catch(error => { $('course-name').textContent = '尚未載入組合課程'; status(error.message + ' 請回組課工具選課。'); });
