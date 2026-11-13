export const COURSE_VERSION = 'V-2';
export const DRAFT_KEY = 'unforte115:v2:course-draft';
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function validateCatalog(modules) {
  if (!Array.isArray(modules) || !modules.length) throw new Error('模組目錄是空的。');
  const ids = new Set();
  for (const item of modules) {
    if (!item || !/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id)) throw new Error('模組代碼無效或重複。');
    ids.add(item.id);
    if (![7, 8].includes(item.grade) || !Number.isInteger(item.lesson) || item.lesson < 1 || item.lesson > 6) throw new Error('模組年級或單元編號無效。');
    if (!/^1150[78]0[1-6]\.html$/.test(item.entry) || item.entry !== `1150${item.grade}0${item.lesson}.html`) throw new Error('模組入口必須對應站內單元。');
    if (typeof item.title !== 'string' || !item.title.trim() || typeof item.goal !== 'string' || typeof item.evidence !== 'string') throw new Error('模組缺少名稱、目標或完成證據。');
    if (!item.evidence.trim() || typeof item.successCriteria !== 'string' || !item.successCriteria.trim()) throw new Error(`模組 ${item.id} 缺少必交項目或達標條件。`);
    if (!Array.isArray(item.tags) || item.tags.some(tag => typeof tag !== 'string') || !Array.isArray(item.prerequisites)) throw new Error('模組標籤或先備設定無效。');
    if (!Number.isInteger(item.periods) || item.periods < 1) throw new Error('模組建議節數無效。');
  }
  for (const item of modules) for (const id of item.prerequisites) {
    if (!ids.has(id) || id === item.id) throw new Error(`模組 ${item.id} 的先備代碼無效。`);
  }
  return modules;
}

export async function loadCatalog() {
  if (location.protocol === 'file:') throw new Error('請用本機預覽或網站網址開啟。先在專案資料夾執行 node scripts/preview.cjs，再開啟 http://127.0.0.1:4173/。');
  const getJson = async path => {
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`無法讀取模組檔案：${path}`);
    return response.json();
  };
  const registry = await getJson('modules/registry.json');
  if (registry.schemaVersion !== 1 || !Array.isArray(registry.files) || !registry.files.length || registry.files.some(file => !/^[a-z0-9-]+\.json$/.test(file))) throw new Error('模組登錄檔格式不正確。');
  return validateCatalog(await Promise.all(registry.files.map(file => getJson(`modules/${file}`))));
}

export function validateCourse(raw, modules, { allowEmpty = false } = {}) {
  if (!raw || raw.schemaVersion !== 1 || raw.courseVersion !== COURSE_VERSION) throw new Error('請匯入 V-2 的課程設定（schemaVersion: 1）。');
  if (typeof raw.title !== 'string' || !raw.title.trim() || raw.title.trim().length > 80) throw new Error('課程名稱請填 1～80 字。');
  if (typeof raw.description !== 'string' || raw.description.length > 500) throw new Error('課程說明請填 500 字以內。');
  const known = new Set(modules.map(item => item.id));
  if (!Array.isArray(raw.moduleIds) || (!allowEmpty && !raw.moduleIds.length) || raw.moduleIds.length > modules.length) throw new Error('請至少選一個單元，且不超過模組目錄數量。');
  if (new Set(raw.moduleIds).size !== raw.moduleIds.length || raw.moduleIds.some(id => !known.has(id))) throw new Error('課程包含重複或找不到的模組代碼，請檢查後再匯入。');
  // Retain only supported fields; imported files cannot supply HTML or external entry URLs.
  return { schemaVersion: 1, courseVersion: COURSE_VERSION, title: raw.title.trim(), description: raw.description, moduleIds: [...raw.moduleIds] };
}

export function prerequisiteWarnings(course, modules) {
  const byId = new Map(modules.map(item => [item.id, item]));
  const seen = new Set();
  const warnings = [];
  for (const id of course.moduleIds) {
    const module = byId.get(id);
    for (const required of module.prerequisites) if (!seen.has(required)) {
      warnings.push(`${module.title}：建議先具備「${byId.get(required).title}」的能力。`);
    }
    seen.add(id);
  }
  return warnings;
}

export function encodeCourse(course) {
  return `#course=${encodeURIComponent(JSON.stringify(course))}`;
}

export function decodeCourse(hash, modules) {
  if (hash.length > 16000 || !hash.startsWith('#course=')) throw new Error('課程連結不完整，請回組課頁重新產生或匯入 JSON。');
  try { return validateCourse(JSON.parse(decodeURIComponent(hash.slice(8))), modules); }
  catch (error) {
    if (error instanceof SyntaxError || error instanceof URIError) throw new Error('課程連結格式不正確。');
    throw error;
  }
}

export function saveDraft(course) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(course)); return true; } catch { return false; }
}

export function downloadCourse(course) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(course, null, 2) + '\n'], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'my-course-v2.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
