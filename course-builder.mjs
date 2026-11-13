import { COURSE_VERSION, DRAFT_KEY, escapeHtml as e, loadCatalog, validateCourse, prerequisiteWarnings, decodeCourse, encodeCourse, saveDraft, downloadCourse } from './course-kit.mjs';

const $ = id => document.getElementById(id);
let modules, course;
const status = message => { $('status').textContent = message; };

function currentCourse(allowEmpty = true) {
  return validateCourse({ ...course, title: $('course-title').value, description: $('course-description').value }, modules, { allowEmpty });
}

function persist() {
  try {
    course = currentCourse();
    if (!saveDraft(course)) status('瀏覽器無法保存草稿，請下載 JSON 留存。');
  } catch (error) { status(error.message); }
}

function renderSelection() {
  const byId = new Map(modules.map(module => [module.id, module]));
  const periods = course.moduleIds.reduce((sum, id) => sum + byId.get(id).periods, 0);
  $('course-summary').textContent = `已選 ${course.moduleIds.length} 個單元 · 建議 ${periods} 節（可依程度調整）`;
  $('selected-modules').innerHTML = course.moduleIds.map((id, index) => {
    const item = byId.get(id);
    return `<li><div><span class="small">${item.grade === 7 ? '七' : '八'}年級 · 原第 ${item.lesson} 課</span><strong>${e(item.title)}</strong></div><div class="order-buttons"><button type="button" data-move="-1" data-id="${id}" aria-label="將${e(item.title)}上移" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-move="1" data-id="${id}" aria-label="將${e(item.title)}下移" ${index === course.moduleIds.length - 1 ? 'disabled' : ''}>↓</button><button type="button" data-remove="${id}" aria-label="移除${e(item.title)}">移除</button></div></li>`;
  }).join('') || '<li class="empty-state">還沒有選單元。從左側課程地圖勾選，這裡會依序排好。</li>';
  for (const checkbox of document.querySelectorAll('[data-module]')) checkbox.checked = course.moduleIds.includes(checkbox.dataset.module);
  const warnings = prerequisiteWarnings(course, modules);
  $('prerequisite-notes').hidden = !warnings.length;
  $('prerequisite-notes').innerHTML = `<strong>先備能力提醒</strong><p>若學生已具備這些能力，可直接開課；也可補選或調整順序。</p><ul>${warnings.map(message => `<li>${e(message)}</li>`).join('')}</ul>`;
  $('open-course').disabled = $('export-course').disabled = !course.moduleIds.length;
}

function renderCatalog() {
  $('module-catalog').innerHTML = [7, 8].map(grade => `<section class="grade-map grade-${grade}" aria-labelledby="grade-${grade}-title"><h3 id="grade-${grade}-title">${grade === 7 ? '七年級｜程式思維與幾何創作' : '八年級｜清單與資料演算法'}</h3><p class="map-route">${grade === 7 ? '讀懂積木 → 三大結構 → 迴圈繪圖 → 變數 → 幾何創作 → 專題測試' : '清單操作 → 音符走訪 → 資料統計 → 隨機抽取 → 洗牌與排序 → 模組化專題'}</p><div class="module-grid">${modules.filter(item => item.grade === grade).sort((a,b) => a.lesson-b.lesson).map(item => `<article class="module-card"><label class="module-pick"><input type="checkbox" data-module="${item.id}"><span><span class="small">單元 ${item.lesson} · 建議 ${item.periods} 節</span><strong>${e(item.title)}</strong></span></label><p>${e(item.goal)}</p><div class="tags">${item.tags.map(tag => `<span>${e(tag)}</span>`).join('')}</div><details><summary>必交項目、達標條件與先備能力</summary><p><b>必交項目</b> ${e(item.evidence)}</p><p><b>怎樣算達標</b> ${e(item.successCriteria)}</p><p><b>建議先備：</b>${item.prerequisites.length ? item.prerequisites.map(id => e(modules.find(module => module.id === id).title)).join('、') : e(item.priorKnowledge)}</p></details><a href="${item.entry}" target="_blank" rel="noopener">預覽原單元 ↗</a></article>`).join('')}</div></section>`).join('');
}

function setCourse(next) {
  course = next;
  $('course-title').value = course.title;
  $('course-description').value = course.description;
  renderSelection();
  persist();
}

async function start() {
  modules = await loadCatalog();
  course = { schemaVersion: 1, courseVersion: COURSE_VERSION, title: '我的資訊科技課程', description: '', moduleIds: [] };
  let initialMessage = '先挑選單元，再調整順序；也可以先套用快速起點。';
  try {
    if (location.hash) course = decodeCourse(location.hash, modules);
    else {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) { course = validateCourse(JSON.parse(saved), modules, { allowEmpty: true }); initialMessage = '已接續上次的組課草稿。'; }
    }
  } catch (error) { initialMessage = `未載入既有設定：${error.message} 可重新選課或匯入 JSON。`; }
  renderCatalog();
  setCourse(course);
  $('composer').hidden = false;
  status(initialMessage);
  $('module-catalog').addEventListener('change', event => {
    const id = event.target.dataset.module;
    if (!id) return;
    persist();
    course.moduleIds = event.target.checked ? [...course.moduleIds, id] : course.moduleIds.filter(value => value !== id);
    renderSelection(); persist(); status('已更新選課，順序顯示在右側。');
  });
  $('selected-modules').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.remove) course.moduleIds = course.moduleIds.filter(id => id !== button.dataset.remove);
    else if (button.dataset.move) {
      const index = course.moduleIds.indexOf(button.dataset.id), next = index + Number(button.dataset.move);
      if (index < 0 || next < 0 || next >= course.moduleIds.length) return;
      [course.moduleIds[index], course.moduleIds[next]] = [course.moduleIds[next], course.moduleIds[index]];
    }
    renderSelection(); persist(); status('已更新上課順序。');
    if (button.dataset.id) document.querySelector(`[data-id="${button.dataset.id}"][data-move="${button.dataset.move}"]`)?.focus();
  });
  for (const id of ['course-title', 'course-description']) $(id).addEventListener('input', persist);
  $('apply-preset').addEventListener('click', () => {
    const presets = {
      g7: ['七年級程式思維與幾何創作', modules.filter(item => item.grade === 7).map(item => item.id)],
      g8: ['八年級清單與資料演算法', modules.filter(item => item.grade === 8).map(item => item.id)],
      geometry: ['幾何創作課程', ['g7-02', 'g7-03', 'g7-04', 'g7-05']],
      data: ['資料與演算法課程', ['g8-01', 'g8-03', 'g8-04', 'g8-05', 'g8-06']]
    };
    const [title, ids] = presets[$('preset').value];
    setCourse({ schemaVersion: 1, courseVersion: COURSE_VERSION, title, description: '', moduleIds: ids });
    status('已套用快速起點，可繼續增刪與排序。');
  });
  $('open-course').addEventListener('click', () => { try { course = currentCourse(false); saveDraft(course); location.href = 'course.html' + encodeCourse(course); } catch (error) { status(error.message); } });
  $('export-course').addEventListener('click', () => { try { downloadCourse(currentCourse(false)); status('已下載課程設定。其他教師可在組課頁匯入相同 JSON。'); } catch (error) { status(error.message); } });
  $('import-course').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 65536) throw new Error('課程設定檔請小於 64 KB。');
      const next = validateCourse(JSON.parse(await file.text()), modules);
      setCourse(next);
      history.replaceState(null, '', location.pathname + location.search);
      status('已匯入課程，可調整順序或直接開課。');
    } catch (error) { status(`匯入失敗：${error.message}；目前選課保留。`); }
    event.target.value = '';
  });
}
start().catch(error => status(error.message));
