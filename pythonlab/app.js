import { lessons, dictionary } from './course-data.js';
import { verificationTests } from './challenge-data.js';
import { migrateCompletion, earnedStars, canAttemptTier, awardTier } from './progress.js';
import { errors, extensions } from './helper-data.js';
import { characterInfo, parseCodePoint } from './encoding.js';
import { createLearningClock, formatDuration, normalizeStudent, validStudent, certificateRecord } from './learning-record.js';
import { operationStep } from './operation-guide.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const storageKey = 'pythonlab-v1';
const emptyState = () => ({ drafts: {}, completed: {}, reflections: {}, timings: {}, certificates: {}, student: {} });
let state = emptyState();
let canSave = true;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (saved && typeof saved === 'object') {
    for (const key of Object.keys(state)) if (saved[key] && typeof saved[key] === 'object' && !Array.isArray(saved[key])) state[key] = saved[key];
  }
} catch { canSave = false; }
state.completed = migrateCompletion(state.completed);
let learningClock = createLearningClock(state.timings);
let certificateLesson = null;
let certificateReturnFocus;
let lockedMessage = '';
let currentLesson;
let currentStage = 0;
let worker;
let ready = false;
let busy = false;
let pending;
let loadTimer;
let runTimer;
let sequence = 0;
let runtimeMessage = '準備 Python 執行環境…';
let runtimeState = 'loading';
const main = $('#main');
const practiceAttempts = new Map();

function save() {
  learningClock.checkpoint();
  try { localStorage.setItem(storageKey, JSON.stringify(state)); canSave = true; }
  catch { canSave = false; }
  const label = $('#save-state');
  if (label) label.textContent = canSave ? '草稿已保存在此瀏覽器' : '無法自動保存，請下載程式';
}
function draftKey() { return `${currentLesson.id}-${currentStage}`; }
function getDraft() {
  const activity = currentLesson.activities[currentStage];
  const draft = state.drafts[draftKey()];
  return draft && typeof draft.code === 'string' ? draft : { code: activity.starter, input: activity.input, prediction: '', solutionSeen: false };
}
function capture() {
  if (!currentLesson || !$('#code')) return;
  const previous = getDraft();
  const draft = { ...previous, code: $('#code').value, input: $('#stdin').value, prediction: $('#prediction').value };
  if (previous.code !== draft.code || previous.input !== draft.input) {
    practiceAttempts.delete(draftKey());
    if ($('#feedback')) $('#feedback').hidden = true;
  }
  state.drafts[draftKey()] = draft;
  save();
  updateOperationGuide();
}
function clearTimers() { clearTimeout(loadTimer); clearTimeout(runTimer); }
function cancelExecution(message = '已停止執行。草稿仍保留，可修改後重新執行。', restart = true) {
  clearTimers();
  worker?.terminate();
  worker = null;
  ready = false;
  busy = false;
  if (pending) { pending.reject(new Error(message)); pending = null; }
  if (restart && currentLesson) startWorker();
  else { runtimeState = 'idle'; runtimeMessage = '開啟單元後準備執行環境'; }
  updateRuntime();
}
function updateRuntime() {
  const panel = $('#runtime-status');
  if (panel) { panel.dataset.state = runtimeState; $('#runtime-text').textContent = runtimeMessage; }
  if (!$('#run')) return;
  $('#run').disabled = !ready || busy;
  $('#check').disabled = !ready || busy;
  $('#stop').disabled = !busy;
  $('#retry-runtime').hidden = runtimeState !== 'error';
  $('#code').readOnly = busy;
  $('#stdin').readOnly = busy;
  for (const element of document.querySelectorAll('[data-stage], #reset-code, #use-input')) {
    const stage = Number(element.dataset.stage);
    element.disabled = busy || (element.hasAttribute('data-stage') && stage >= 3 && !canAttemptTier(state.completed[currentLesson.id], stage - 1));
  }
  updateOperationGuide();
}
function startWorker() {
  if (worker) return;
  runtimeState = 'loading'; runtimeMessage = '首次使用需下載 Python；載入期間可以閱讀與修改程式。';
  updateRuntime();
  try {
    const localWorker = new Worker(new URL('./python-worker.js', import.meta.url), { type: 'module' });
    worker = localWorker;
    const failLoad = message => {
      if (worker !== localWorker) return;
      clearTimers(); localWorker.terminate(); worker = null; ready = false; busy = false;
      runtimeState = 'error'; runtimeMessage = message;
      if (pending) { pending.reject(new Error(message)); pending = null; }
      updateRuntime();
    };
    loadTimer = setTimeout(() => failLoad('Python 載入逾時，請檢查網路後重試。草稿仍保留。'), 90000);
    localWorker.onmessage = ({ data }) => {
      if (worker !== localWorker) return;
      if (data.type === 'ready') {
        clearTimeout(loadTimer); ready = true;
        runtimeState = 'ready'; runtimeMessage = 'Python 已就緒 · 可以執行'; updateRuntime();
      } else if (data.type === 'load-error') {
        failLoad('Python 尚未載入，請檢查網路後重試。');
      } else if (pending && data.id === pending.id) {
        clearTimeout(runTimer); busy = false;
        runtimeState = 'ready'; runtimeMessage = 'Python 已就緒 · 每次執行重新開始';
        const request = pending; pending = null; updateRuntime();
        if (data.type === 'result') request.resolve(data.result);
        else {
          localWorker.terminate(); worker = null; ready = false;
          runtimeState = 'error'; runtimeMessage = '執行環境發生錯誤，請重新載入後再試。'; updateRuntime();
          request.reject(new Error(runtimeMessage));
        }
      }
    };
    localWorker.onerror = () => failLoad('執行環境無法載入，請從網站網址開啟並檢查網路後重試。');
  } catch { runtimeState = 'error'; runtimeMessage = '此瀏覽器無法啟動 Python，請使用新版 Chrome、Edge 或 Firefox。'; updateRuntime(); }
}
function execute(action, code, input, tests = []) {
  if (!ready || busy) return Promise.reject(new Error('請稍候，Python 尚未準備完成。'));
  busy = true; runtimeMessage = action === 'check' ? '正在用多組資料驗證…' : '程式執行中…'; updateRuntime();
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending = { id, resolve, reject };
    runTimer = setTimeout(() => cancelExecution('程式執行超過 8 秒，已停止。請檢查迴圈停止條件。'), 8000);
    worker.postMessage({ id, action, code, input, tests });
  });
}
function setFeedback(html, kind = '') {
  const panel = $('#feedback');
  if (!panel) return;
  panel.className = `feedback ${kind}`; panel.innerHTML = html; panel.hidden = false;
}
function errorText(error) {
  const hints = {
    SyntaxError: '檢查冒號、括號與半形引號是否完整。',
    IndentationError: '檢查縮排；同一層使用一致的四個空格。',
    TabError: '請統一使用空格縮排，避免混用 Tab 與空格。',
    NameError: '檢查變數拼字，以及是否先指定值再使用。',
    TypeError: '檢查資料型態；input() 回傳字串，數值運算前可能需要轉型。',
    ValueError: '輸入內容無法轉成指定型態；小數使用 float()。',
    ZeroDivisionError: '除數是 0。空清單要先判斷，再計算平均。',
    IndexError: '索引超過清單範圍；第一項索引是 0。',
    KeyError: '字典中沒有這個名稱；先用 in 檢查鍵，並核對輸入文字。',
    EOFError: '輸入行數不足；補上資料或檢查是否忘記停止值。',
    ModuleNotFoundError: '此執行區提供 Python 標準工具；Tkinter 不適用於瀏覽器。',
    SystemExit: '程式要求結束執行。'
  };
  return `${error.line ? `第 ${error.line} 行 · ` : ''}${error.type}: ${error.message}\n${hints[error.type] || '請依錯誤訊息檢查程式，必要時縮小範例再測試。'}`;
}
async function runCode(check = false) {
  capture();
  const lesson = currentLesson;
  const stage = currentStage;
  const activity = lesson.activities[stage];
  const code = $('#code').value;
  const input = $('#stdin').value;
  const tier = activity.tier || 0;
  if (check && tier && !canAttemptTier(state.completed[lesson.id], tier)) { setFeedback('請先通過前一星級。', 'error'); return; }
  $('#feedback').hidden = true;
  $('#output').textContent = check ? '正在驗證…' : '正在執行…';
  try {
    const tests = check ? verificationTests(lesson, activity) : [];
    const result = await execute(check ? 'check' : 'run', code, input, tests);
    if (currentLesson !== lesson || currentStage !== stage) return;
    if (!check) {
      rememberAttempt({ execution: { code, input, ok: !result.error } });
      $('#output').textContent = result.output || '（沒有輸出）';
      if (result.error) setFeedback(`<strong>程式需要修正</strong><pre>${escape(errorText(result.error))}</pre>`, 'error');
      else setFeedback('執行完成。和你的預測相同嗎？試著改一個值，再觀察差異。');
      updateOperationGuide();
      return;
    }
    const allPassed = tests.length > 0 && result.results.length === tests.length && result.results.every(item => item.passed);
    rememberAttempt({ verification: { code, ok: allPassed } });
    $('#output').textContent = '驗證會分別使用下方的測試資料，每一組都從新的程式狀態開始。';
    const passed = result.results.filter(item => item.passed).length;
    const structuralNames = { For: 'for 迴圈', While: 'while 迴圈', Break: 'break', FunctionDef: 'def 函式', List: '清單' };
    const rows = [...result.results].sort((a, b) => Number(a.passed) - Number(b.passed)).map(item => `<details class="test-row" ${item.passed ? '' : 'open'}><summary>${item.passed ? '✓' : '✕'} ${escape(item.name)}</summary><pre>輸入：\n${escape(item.input || '（不需輸入）')}\n\n預期輸出：\n${escape(item.expected || '（沒有輸出）')}\n\n你的輸出：\n${escape(item.output || '（沒有輸出）')}${item.callResults?.length ? `\n\n函式檢查：\n${escape([...item.callResults].sort((a, b) => Number(a.passed) - Number(b.passed)).map(call => `${call.passed ? "✓" : "✕"} ${call.function}(${JSON.stringify(call.args).slice(1, -1)})\n預期回傳：${call.expected}\n實際回傳：${call.actual}`).join("\n\n"))}` : ""}${item.error ? `\n\n${escape(errorText(item.error))}` : ''}${item.missing?.length ? `\n\n此任務還需要：${escape(item.missing.map(name => structuralNames[name] || name).join('、'))}` : ''}</pre></details>`).join('');
    let message = allPassed ? `全部 ${passed} 組資料驗證通過！請再用自己的話說明程式。` : `通過 ${passed} / ${result.results.length} 組。比較第一個失敗案例，找出需要修改的地方。`;
    let nextLink = '';
    let newStar = false;
    if (tier && allPassed) {
      const assisted = Boolean(getDraft().solutionSeen);
      const before = earnedStars(state.completed[lesson.id]);
      const previous = state.completed[lesson.id]?.levels?.[tier];
      const verifiedAt = Date.now();
      const evidence = { assisted, code, verifiedAt, achievedAt: previous?.achievedAt || previous?.verifiedAt || verifiedAt,
        elapsedMs: previous ? previous.elapsedMs : learningClock.elapsed(),
        timingPartial: previous ? previous.timingPartial : Boolean(state.timings[lesson.id]?.partial) };
      state.completed[lesson.id] = awardTier(state.completed[lesson.id], tier, evidence); save();
      newStar = earnedStars(state.completed[lesson.id]) > before;
      message += ` 已取得${'★'.repeat(tier)} ${['', '初階一星', '進階二星', '終極三星'][tier]}！`;
      if (tier === 1) message += ' 一星允許參考解答；接著修改新規則，挑戰進階二星。';
      if (tier === 2) message += ' 本課核心學習已完成，三星終極挑戰可自由選做。';
      $('#lesson-completion').textContent = progressText(lesson);
      $('#unit-stars').textContent = starDisplay(lesson);
      updateRuntime();
      $('#open-certificate').disabled = false;
      if (tier < 3) nextLink = ` <a class="next-tier" href="#unit=${lesson.id}&stage=${stage + 1}">${tier === 1 ? '前往進階二星 →' : '選做終極三星 →'}</a>`;
    }
    setFeedback(`<p><strong>${escape(message)}</strong>${nextLink}</p>${rows}`, allPassed ? 'success' : 'error');
    updateOperationGuide();
    if (newStar) openCertificate(lesson);
  } catch (error) {
    if (currentLesson !== lesson || currentStage !== stage) return;
    $('#output').textContent = '（本次執行已停止）';
    setFeedback(escape(error.message), 'error');
    rememberAttempt(check ? { verification: { code, ok: false } } : { execution: { code, input, ok: false } });
    updateOperationGuide();
  }
}

function starDisplay(lesson) {
  const stars = earnedStars(state.completed[lesson.id]);
  return '★'.repeat(stars) + '☆'.repeat(3 - stars) + ` ${stars} / 3 星`;
}
function progressText(lesson) {
  const stars = earnedStars(state.completed[lesson.id]);
  return stars === 3 ? '★★★ 三星已取得・終極挑戰完成' : stars === 2 ? '★★☆ 二星已取得・核心學習完成，三星選做' : stars === 1 ? '★☆☆ 一星已取得・可參考解答，接著挑戰進階二星' : '☆☆☆ 通過初階取得一星，再完成修改任務取得二星。三星選做。';
}
function rememberAttempt(update) {
  practiceAttempts.set(draftKey(), { ...practiceAttempts.get(draftKey()), ...update, lastAction: update.verification ? 'check' : 'run' });
}
function updateOperationGuide() {
  const panel = $('#task-guide');
  if (!panel || !currentLesson || !$('#code')) return;
  const activity = currentLesson.activities[currentStage];
  const step = operationStep({ stage: currentStage, activity, code: $('#code').value, input: $('#stdin').value,
    ...practiceAttempts.get(draftKey()), completed: state.completed[currentLesson.id], ready, busy, runtimeState, isLastUnit: currentLesson.id === lessons.at(-1).id });
  const focused = document.activeElement?.closest('#task-guide [data-guide-action]')?.dataset.guideAction;
  const button = item => `<button type="button" class="button ${item === step ? 'blue' : 'quiet'}" data-guide-action="${item.action}" ${(['run', 'check'].includes(item.action) && (!ready || busy)) || (busy && item.action !== 'stop') ? 'disabled' : ''}>${escape(item.label)}</button>`;
  panel.innerHTML = `<div class="guide-heading"><span class="eyebrow">${['示範・先觀察', '引導・動手修改', '初階・取得一星', '進階・取得二星', '終極・三星選做'][currentStage]}</span><div><button type="button" class="helper-inline" data-guide-action="task">看本題任務</button><button type="button" class="helper-inline" data-operation-help>操作說明</button></div></div><h2 id="task-guide-title">${escape(step.title)}</h2><p>${escape(step.text)}</p><div class="guide-actions">${button(step)}${step.secondary ? button(step.secondary) : ''}</div>`;
  const feedback = $('#feedback');
  if (feedback && !feedback.hidden && !busy) {
    let actions = feedback.querySelector('.feedback-next');
    if (!actions) { actions = document.createElement('div'); actions.className = 'feedback-next'; feedback.prepend(actions); }
    actions.innerHTML = `<strong>下一步：${escape(step.title)}</strong><div class="guide-actions">${button(step)}${step.secondary ? button(step.secondary) : ''}</div>`;
  }
  if (focused) (panel.querySelector(`[data-guide-action="${focused}"]`) || panel.querySelector('.guide-actions [data-guide-action]'))?.focus({ preventScroll: true });
}
function focusPractice(id) {
  const target = $(`#${id}`);
  if (!target) return;
  target.scrollIntoView({ block: id === 'feedback' ? 'start' : 'center', behavior: 'auto' });
  target.focus({ preventScroll: true });
  target.classList.add('guide-focus');
  setTimeout(() => target.classList.remove('guide-focus'), 1800);
}
function guideAction(action) {
  if (busy && action !== 'stop') return;
  if (action === 'run' || action === 'check') { if (ready) runCode(action === 'check'); return; }
  if (action === 'stop') { cancelExecution(); return; }
  if (action === 'edit') focusPractice('code');
  if (action === 'input') focusPractice('stdin');
  if (action === 'load-input') { $('#use-input').click(); focusPractice('stdin'); }
  if (action === 'predict') focusPractice('prediction');
  if (action === 'task') focusPractice('task-instructions');
  if (action === 'output') focusPractice('output');
  if (action === 'hints') {
    $('.hints-card details')?.setAttribute('open', '');
    $('.hints-card summary')?.scrollIntoView({ block: 'center' });
    $('.hints-card summary')?.focus({ preventScroll: true });
  }
  if (action === 'feedback') focusPractice('feedback');
  if (action === 'helper') openDictionary();
  if (action === 'retry') { worker?.terminate(); worker = null; startWorker(); }
  if (action === 'certificate') openCertificate(currentLesson);
  if (action === 'next') location.hash = currentStage < 4 ? `unit=${currentLesson.id}&stage=${currentStage + 1}` : currentLesson.id < lessons.length ? `unit=${currentLesson.id + 1}&stage=0` : '';
}
let operationReturnFocus;
function openOperationHelp() {
  operationReturnFocus = document.activeElement;
  $('#operation-dialog').showModal();
  $('#close-operation').focus();
}
$('#close-operation').addEventListener('click', () => $('#operation-dialog').close());
$('#operation-dialog').addEventListener('close', () => { if (operationReturnFocus?.isConnected) operationReturnFocus.focus(); });
function syncLearningClock() {
  learningClock.setRunning(Boolean(currentLesson) && !document.hidden && !$('#certificate-dialog').open);
  updateLearningClock();
}
function updateLearningClock() {
  if (!$('#learning-time')) return;
  $('#learning-time').textContent = formatDuration(learningClock.elapsed());
  $('#timer-toggle').textContent = learningClock.isPaused() ? '繼續計時' : '暫停計時';
  $('#timer-toggle').setAttribute('aria-pressed', String(learningClock.isPaused()));
  $('#timer-state').textContent = learningClock.isRunning() ? '計時中' : '已暫停';
}
function timerPanel() {
  return `<section class="learning-timer" aria-label="單元學習計時"><div><span class="small-label">本單元累計學習時間</span><strong id="learning-time">${formatDuration(learningClock.elapsed())}</strong><span id="timer-state">計時中</span></div><div class="timer-actions"><button type="button" id="timer-toggle" class="button quiet">暫停計時</button><button type="button" id="open-certificate" class="button" ${earnedStars(state.completed[currentLesson.id]) ? '' : 'disabled'}>查看通關證書</button></div><p>切換題目會接續；背景分頁與證書畫面暫停。一星即可領證，之後可繼續升星。</p></section>`;
}
function openCertificate(lesson) {
  if (!certificateRecord(state.completed[lesson.id])) return;
  certificateReturnFocus = document.activeElement;
  certificateLesson = lesson;
  const student = normalizeStudent(state.certificates[lesson.id] || state.student);
  $('#certificate-class').value = student.className;
  $('#certificate-seat').value = student.seat;
  $('#certificate-name').value = student.name;
  for (const input of $('#certificate-form').querySelectorAll('input')) input.setCustomValidity('');
  $('#certificate-form').hidden = false;
  $('#certificate-view').hidden = true;
  $('#certificate-edit').hidden = true;
  $('#certificate-dialog-title').textContent = `第 ${lesson.id} 單元・通關證書`;
  $('#certificate-intro').textContent = `已取得 ${earnedStars(state.completed[lesson.id])} 星！填寫資料後即可顯示證書、擷取畫面。資料只保存在此瀏覽器。`;
  $('#certificate-continue').textContent = earnedStars(state.completed[lesson.id]) < 3 ? '稍後領證，繼續挑戰 →' : '回到本單元';
  $('#certificate-dialog').showModal();
  syncLearningClock(); save();
  $('#certificate-class').focus();
}
function renderCertificate() {
  const lesson = certificateLesson;
  const record = certificateRecord(state.completed[lesson.id]);
  const student = normalizeStudent(state.certificates[lesson.id]);
  const date = record.achievedAt ? new Date(record.achievedAt).toLocaleString('zh-TW', { hour12: false }) : '未記錄';
  const level = ['', '初階通關', '核心學習完成', '終極挑戰完成'][record.stars];
  $('#certificate-view').innerHTML = `<article class="certificate-sheet" aria-label="通關證書"><div class="certificate-brand"><span class="brand-mark" aria-hidden="true">Py</span><span>Python Lab<span class="certificate-kicker">從積木，走向程式碼</span></span></div><p class="certificate-kicker">每一次修改，都是一次成長</p><h3>通關證書</h3><div class="certificate-stars" aria-label="${record.stars} 星">${'★'.repeat(record.stars)}<span>${'☆'.repeat(3 - record.stars)}</span></div><p class="certificate-level">${level} · ${record.stars} / 3 星</p><p class="certificate-student">${escape(student.name)}</p><p class="certificate-class">${escape(student.className)}　${escape(student.seat)} 號</p><div class="certificate-unit"><span>UNIT ${String(lesson.id).padStart(2, '0')}</span><h4>${escape(lesson.title)}</h4><p>已通過本星級的全部驗證測資</p></div><dl class="certificate-facts"><div><dt>累計學習時間</dt><dd>${record.elapsedMs === null ? '未記錄' : formatDuration(record.elapsedMs)}</dd></div><div><dt>取得星級時間</dt><dd>${escape(date)}</dd></div></dl><p class="certificate-footnote">${record.elapsedMs === null ? '此星級於加入計時前取得，沒有完整計時紀錄。' : record.partial ? '計時自功能啟用起累計，不含更早的練習時間。' : '時間累計至取得本星級；不含暫停、背景分頁與查看證書。'}<br>此證書為本站學習紀錄。一星可參考解答；二星完成核心；三星選做。</p></article>`;
  $('#certificate-view').hidden = false;
  $('#certificate-form').hidden = true;
  $('#certificate-edit').hidden = false;
  $('#certificate-intro').textContent = '證書已就緒，可直接擷取下方畫面。繼續挑戰取得更多星數後，會產生新版證書。';
  const next = record.stars < 3 ? record.stars + 2 : null;
  $('#certificate-continue').textContent = next === 3 ? '繼續挑戰二星 →' : next === 4 ? '選做三星挑戰 →' : '回到本單元';
  $('#certificate-view').scrollIntoView({ block: 'nearest' });
  $('#certificate-continue').focus({ preventScroll: true });
}
$('#certificate-form').addEventListener('submit', event => {
  event.preventDefault();
  const student = normalizeStudent({ className: $('#certificate-class').value, seat: $('#certificate-seat').value, name: $('#certificate-name').value });
  $('#certificate-seat').setCustomValidity(Number(student.seat) >= 1 ? '' : '座號請填 1～999。');
  if (!validStudent(student)) { $('#certificate-form').reportValidity(); return; }
  state.student = student;
  state.certificates[certificateLesson.id] = { ...student };
  save(); renderCertificate();
});
$('#certificate-form').addEventListener('input', event => event.target.setCustomValidity(''));
$('#certificate-edit').addEventListener('click', () => {
  $('#certificate-form').hidden = false; $('#certificate-view').hidden = true; $('#certificate-edit').hidden = true; $('#certificate-name').focus();
});
$('#close-certificate').addEventListener('click', () => $('#certificate-dialog').close());
$('#certificate-continue').addEventListener('click', () => {
  const lesson = certificateLesson;
  const stars = earnedStars(state.completed[lesson.id]);
  $('#certificate-dialog').close();
  if (stars < 3) location.hash = `unit=${lesson.id}&stage=${stars + 2}`;
});
$('#certificate-dialog').addEventListener('close', () => {
  certificateLesson = null; syncLearningClock(); save();
  if (certificateReturnFocus?.isConnected) certificateReturnFocus.focus();
});
function solutionPanel(activity) {
  if (activity.tier >= 2) return '<p class="challenge-note">本關提供起始程式、語法與提示。請完成新規則；驗證依題目檢查格式、邊界或新情境。本關不顯示完整解答。</p>';
  return `<details id="solution-details"><summary>${activity.tier === 1 ? '參考解答・初階可參考' : '參考解答'}</summary><p>一星允許參考完整解答；要取得二星，還需要完成進階的新規則。</p><pre class="solution-code">${escape(activity.solution)}</pre></details>`;
}
function renderHome() {
  const count = lessons.filter(lesson => earnedStars(state.completed[lesson.id]) >= 2).length;
  const totalStars = lessons.reduce((sum, lesson) => sum + earnedStars(state.completed[lesson.id]), 0);
  const next = lessons.find(lesson => earnedStars(state.completed[lesson.id]) < 2) || lessons.find(lesson => earnedStars(state.completed[lesson.id]) < 3) || lessons[0];
  const nextStars = earnedStars(state.completed[next.id]);
  const nextStage = nextStars === 1 ? 3 : nextStars === 2 ? 4 : 0;
  main.innerHTML = `<section class="hero"><div><p class="eyebrow">PYTHON INTERACTIVE LEARNING</p><h1>從積木思考，<br>走向你的<span>第一行程式。</span></h1><p class="description">帶著 Scratch 的基礎，從修改範例開始。${lessons.length} 個循序漸進的任務，陪你讀懂、寫出，也驗證自己的 Python。</p><div class="hero-tags"><span>${lessons.length} 個引導單元</span><span>直接執行 Python</span><span>隨時查語法</span></div><a class="button primary" href="#unit=${next.id}&stage=${nextStage}">${count === lessons.length ? totalStars === lessons.length * 3 ? '回到課程複習' : '選做三星挑戰' : totalStars ? '繼續學習' : '開始第一個單元'} <span aria-hidden="true">→</span></a></div><div class="hero-code"><div class="window-bar"><span class="dots" aria-hidden="true">●●●</span><span>my_first_python.py</span></div><pre><span class="code-comment"># 從改一句話開始</span>\nname = <span class="code-string">"小安"</span>\nprint(<span class="code-string">"哈囉"</span>, name)\n\n<span class="code-comment"># 每一次修改，都是一次探索</span>\nprint(<span class="code-string">"今天，我用 Python 寫程式！"</span>)</pre><div class="hero-console">&gt; 哈囉 小安<br>&gt; 今天，我用 Python 寫程式！</div></div></section><div class="home-content"><div class="path-strip" aria-label="學習路徑"><div class="path-step"><strong><b>01</b> 選一個單元</strong><span>先從「示範」開始</span></div><div class="path-step"><strong><b>02</b> 修改程式</strong><span>範例已放好，從一處開始</span></div><div class="path-step"><strong><b>03</b> 執行後驗證</strong><span>先試跑，再檢查全部測資</span></div><div class="path-step"><strong><b>04</b> 領證再升星</strong><span>一星可領證，三星自由挑戰</span></div></div><div class="home-operation"><p><strong>第一次使用？</strong>「執行程式」是試跑；「驗證任務」全部通過才會通關。每題上方都有下一步提示。</p><button type="button" class="button" data-operation-help>查看學生操作說明</button></div><div class="section-heading"><div><p class="eyebrow">YOUR LEARNING PATH</p><h2>${lessons.length} 個單元，一步一步往前</h2><p>每課先示範與引導，再取得初階一星、進階二星。終極三星自由選做。</p></div><div class="progress-summary">二星已達成 <strong>${count} / ${lessons.length}</strong><br>已取得 ${totalStars} / ${lessons.length * 3} 星・三星選做</div></div><section class="lesson-grid" aria-label="課程單元">${lessons.map(lesson => `<a class="lesson-card" href="#unit=${lesson.id}"><div class="card-top"><span class="unit-number">${String(lesson.id).padStart(2, '0')}</span><span class="level-tag">${escape(lesson.level)}</span></div><h3>${escape(lesson.title)}</h3><p>${escape(lesson.subtitle)}</p><div class="card-bottom"><span class="star-score ${earnedStars(state.completed[lesson.id]) >= 2 ? 'done' : ''}">${starDisplay(lesson)}</span><span class="card-arrow" aria-hidden="true">↗</span></div></a>`).join('')}</section><section class="star-explainer"><h3>一星會做，二星會改，三星再探索</h3><p>★ 初階可參考完整解答；★★ 進階要調整規則並通過新測資，完成核心學習；★★★ 終極加深整合與邊界處理，可自由選做。</p></section><section class="course-note"><div><h3>遇到問題，小幫手陪你找線索</h3><p>本課語法、Scratch 對照、錯誤排查與編碼工具都在本站。查完就能接著練習，不用另開網頁。</p></div><button type="button" class="button" data-dictionary>開啟參考小幫手</button></section><div class="home-actions"><span>首次執行需網路載入 Python。進度是練習紀錄，並非正式成績。</span><button type="button" class="button quiet" id="reset-progress">重設本機學習紀錄</button></div></div>`;
  document.title = 'Python Lab｜Python 互動學習';
  $('#reset-progress').addEventListener('click', () => confirmAction('重設學習紀錄', '將清除此瀏覽器的程式草稿、預測、離堂說明、星級、計時與證書資料。需要的作品請先下載。', () => {
    state = emptyState(); practiceAttempts.clear(); learningClock = createLearningClock(state.timings); save(); renderHome();
  }));
}
function renderLesson() {
  const lesson = currentLesson;
  const activity = lesson.activities[currentStage];
  const draft = getDraft();
  practiceAttempts.delete(draftKey());
  main.innerHTML = `<section class="course-bar"><div><p class="eyebrow">UNIT ${String(lesson.id).padStart(2, '0')} / ${lessons.length} · ${escape(lesson.level)}</p><h1>${escape(lesson.title)}</h1><p>${escape(lesson.subtitle)}</p></div><a class="button quiet" href="#">返回課程總覽</a></section><div class="course-shell"><aside class="lesson-nav"><h2>學習路徑</h2><nav aria-label="單元切換">${lessons.map(item => `<a href="#unit=${item.id}" class="${item.id === lesson.id ? 'active' : ''}" ${item.id === lesson.id ? 'aria-current="page"' : ''}><span>${String(item.id).padStart(2, '0')}</span><span>${escape(item.title)}</span></a>`).join('')}</nav><p class="local-note">按建議順序學習，也可以自由複習。<br>草稿只保存在此瀏覽器。</p></aside><div class="lesson-reading"><section class="reading-card overview-card"><div class="unit-star-heading"><strong id="unit-stars">${starDisplay(lesson)}</strong><span>二星完成核心・三星選做</span></div><p class="eyebrow">這一課，你將學會</p><h2>${escape(lesson.goal)}</h2><div class="bridge">${escape(lesson.bridge)}</div><ul class="concept-list">${lesson.concepts.map(([title, text]) => `<li><strong>${escape(title)}</strong><p>${escape(text)}</p></li>`).join('')}</ul><div class="syntax-links">${[...new Set([...lesson.syntax, ...(activity.syntax || [])])].map(id => `<button type="button" data-syntax="${id}">${escape(dictionary.find(item => item.id === id)?.name.split('・')[0] || id)} ↗</button>`).join('')}</div></section><div class="stage-tabs" role="group" aria-label="練習與星級挑戰">${['示範', '引導', '★ 初階', '★★ 進階', '★★★ 終極・選做'].map((name, index) => `<button type="button" data-stage="${index}" aria-pressed="${index === currentStage}" ${index >= 3 && !canAttemptTier(state.completed[lesson.id], index - 1) ? 'disabled title="先通過前一星級即可解鎖"' : ''}>${name}</button>`).join('')}</div><section class="reading-card task-card" id="task-instructions" tabindex="-1"><div class="task-label">${activity.tier ? '★'.repeat(activity.tier) + (activity.optional ? ' 終極選做' : activity.tier === 1 ? ' 初階・可參考解答' : ' 進階・修改新規則') : currentStage === 0 ? '先看懂，再動手' : '引導練習'}</div><h2>${escape(activity.title)}</h2><p class="task">${escape(activity.task)}</p>${lockedMessage ? `<p class="notice">${escape(lockedMessage)}</p>` : ''}${activity.tier ? `<p class="challenge-note">${activity.tier === 1 ? '完成本題取得一星，可先參考解答再觀察。' : activity.tier === 2 ? '二星需要修改程式以符合新規則；資料題另含固定邊界和每次新產生的情境。' : '三星為選做；可隨時回到課程總覽或前往下一單元。'}</p>` : ''}<label class="small-label prediction-label" for="prediction">執行前，先預測結果（可選）</label><textarea class="prediction" id="prediction" placeholder="我預測會出現……">${escape(draft.prediction)}</textarea>${activity.expected ? `<details class="expected-box"><summary>查看原始範例的預期輸出</summary><pre>${escape(activity.expected)}</pre></details>` : ''}</section><section class="reading-card hints-card hints"><h2>需要一點線索？</h2>${activity.hints.map((hint, index) => `<details><summary>提示 ${index + 1}${index === 0 ? ' · 想法' : ' · 語法線索'}</summary><p>${escape(hint)}</p></details>`).join('')}${solutionPanel(activity)}</section><section class="reading-card exit-question"><p class="eyebrow">用自己的話說明</p><h2>離堂小檢核</h2><p>${escape(lesson.exit)}</p><label class="small-label" for="reflection">我的解釋或修改紀錄</label><textarea id="reflection" class="prediction" placeholder="我發現……因為……">${escape(state.reflections[lesson.id] || '')}</textarea><p id="lesson-completion" class="small-label">${progressText(lesson)}</p><p class="small-label">這是學習練習紀錄，並非正式成績。</p></section><nav class="next-links" aria-label="前後單元">${lesson.id > 1 ? `<a href="#unit=${lesson.id - 1}">← 上一單元</a>` : '<a href="#">← 課程總覽</a>'}${lesson.id < lessons.length ? `<a href="#unit=${lesson.id + 1}">下一單元 →</a>` : '<a href="#">回到課程總覽 →</a>'}</nav><p class="sources">本課重整自原教材第 ${lesson.source.join("、")} 篇。所需解說已收進站內。<button type="button" class="helper-inline" data-dictionary>查看參考小幫手</button></p></div><section class="workspace" aria-label="Python 練習區"><section class="task-guide" id="task-guide" aria-labelledby="task-guide-title"></section>${timerPanel()}<div class="runtime-status" id="runtime-status" role="status"><span id="runtime-text"></span><button id="retry-runtime" type="button" hidden>重新載入</button></div><div class="editor-panel"><div class="editor-toolbar"><label for="code" class="file-name">程式區 · unit_${String(lesson.id).padStart(2, '0')}.py</label><span class="save-state" id="save-state">${canSave ? '草稿保存在此瀏覽器' : '無法自動保存，請下載程式'}</span></div><div class="editor-wrap"><pre id="line-numbers" class="line-numbers" aria-hidden="true"></pre><textarea id="code" class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-describedby="editor-help">${escape(draft.code)}</textarea></div><div class="editor-actions"><button type="button" id="run" class="button primary">▶ 執行程式</button><button type="button" id="stop" class="button quiet" disabled>■ 停止</button>${activity.tests.length ? '<button type="button" id="check" class="button blue">✓ 驗證任務</button>' : '<button type="button" id="check" hidden>驗證</button>'}</div><div class="editor-bottom"><span id="editor-help">Tab 縮排四格 · Ctrl / ⌘ + Enter 執行 · Esc 讓 Tab 離開編輯器</span><span>執行上限 8 秒</span></div></div><div class="editor-tools"><button type="button" id="reset-code">↺ 還原起始程式</button><button type="button" id="download">↓ 下載 .py</button></div><section class="io-panel"><div class="io-heading"><label for="stdin">輸入資料 · 每行對應一次 input()</label><button type="button" id="use-input">載入範例輸入</button></div><textarea id="stdin" class="input-area" spellcheck="false" aria-describedby="input-help" placeholder="${activity.input ? '每一行放一筆資料' : '這個任務不需要輸入資料'}">${escape(draft.input)}</textarea><p class="io-note" id="input-help">${/\binput\s*\(/.test(activity.solution) ? '範例輸入已填好。每一行對應一次 input()，不用在執行結果裡打字；修改資料後再按「執行程式」。' : '這個任務不需要輸入資料，可以直接執行程式。'}「驗證任務」使用本站測資，不使用這裡的資料。</p></section><section class="io-panel"><div class="io-heading"><span>執行結果</span><span>輸出會顯示在這裡</span></div><pre id="output" class="output-area" tabindex="-1" aria-live="polite">先預測，再按「執行程式」。</pre></section><div id="feedback" class="feedback" role="status" tabindex="-1" hidden></div></section></div>`;
  document.title = `第 ${lesson.id} 單元 ${lesson.title}｜Python Lab`;
  updateLines(); updateRuntime(); updateLearningClock(); updateOperationGuide();
  $('#timer-toggle').addEventListener('click', () => { learningClock.setPaused(!learningClock.isPaused()); syncLearningClock(); save(); });
  $('#open-certificate').addEventListener('click', () => openCertificate(lesson));
  $('#run').addEventListener('click', () => runCode());
  $('#check').addEventListener('click', () => runCode(true));
  $('#stop').addEventListener('click', () => cancelExecution());
  $('#retry-runtime').addEventListener('click', () => { worker?.terminate(); worker = null; startWorker(); });
  $('#code').addEventListener('input', () => { updateLines(); capture(); $('#feedback').hidden = true; if (activity.tier && state.completed[lesson.id]?.levels?.[activity.tier]?.code !== $('#code').value) $('#lesson-completion').textContent = '目前程式尚未驗證，請按「驗證任務」檢查。'; });
  $('#code').addEventListener('scroll', () => { $('#line-numbers').scrollTop = $('#code').scrollTop; });
  $('#code').addEventListener('keydown', editorKeys);
  $('#stdin').addEventListener('input', capture);
  $('#prediction').addEventListener('input', capture);
  $('#reflection').addEventListener('input', () => { state.reflections[lesson.id] = $('#reflection').value; save(); });
  $('#use-input').addEventListener('click', () => { $('#stdin').value = activity.input; capture(); });
  $('#reset-code').addEventListener('click', () => confirmAction('還原起始程式', '這個練習的目前程式與輸入將被起始範例取代。其他練習的草稿會保留。', () => {
    $('#code').value = activity.starter; $('#stdin').value = activity.input; capture(); updateLines(); $('#feedback').hidden = true; $('#output').textContent = '已還原，可重新觀察與修改。';
  }));
  $('#solution-details')?.addEventListener('toggle', () => {
    if ($('#solution-details')?.open) { capture(); state.drafts[draftKey()].solutionSeen = true; save(); }
  });
  $('#download').addEventListener('click', () => {
    capture(); const url = URL.createObjectURL(new Blob([$('#code').value], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `pythonlab-unit-${String(lesson.id).padStart(2, '0')}-${currentStage + 1}.py`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  for (const button of document.querySelectorAll('[data-stage]')) button.addEventListener('click', () => {
    capture(); lockedMessage = ''; currentStage = Number(button.dataset.stage); history.replaceState(null, '', `#unit=${lesson.id}&stage=${currentStage}`); renderLesson();
  });
  startWorker();
}
function updateLines() {
  $('#line-numbers').textContent = Array.from({ length: $('#code').value.split('\n').length }, (_, i) => i + 1).join('\n');
}
let tabMayLeave = false;
function editorKeys(event) {
  const code = event.currentTarget;
  if (event.key === 'Escape') { tabMayLeave = true; return; }
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); if (ready && !busy) runCode(); return; }
  if (busy) return;
  if (event.key === 'Tab') {
    if (tabMayLeave) { tabMayLeave = false; return; }
    event.preventDefault();
    const start = code.selectionStart;
    if (event.shiftKey) {
      const lineStart = code.value.lastIndexOf('\n', start - 1) + 1;
      const spaces = Math.min(4, (code.value.slice(lineStart).match(/^ */) || [''])[0].length);
      code.setRangeText('', lineStart, lineStart + spaces, 'preserve');
    } else code.setRangeText('    ', code.selectionStart, code.selectionEnd, 'end');
    updateLines(); capture();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const before = code.value.slice(0, code.selectionStart).split('\n').pop();
    const indent = before.match(/^ */)[0] + (before.trimEnd().endsWith(':') ? '    ' : '');
    code.setRangeText(`\n${indent}`, code.selectionStart, code.selectionEnd, 'end'); updateLines(); capture();
  } else tabMayLeave = false;
}
function confirmAction(title, message, action) {
  const dialog = document.createElement('dialog'); dialog.className = 'reset-dialog';
  dialog.innerHTML = `<h2>${escape(title)}</h2><p>${escape(message)}</p><div class="editor-tools"><button type="button" class="button" data-cancel>保留目前內容</button><button type="button" class="button" data-confirm>確認重設</button></div>`;
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-confirm]').addEventListener('click', () => { action(); dialog.close(); });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
}
let helperSection = 'lesson';
let helperReturnFocus;
const helperSections = [['lesson', '本課語法'], ['syntax', '語法字典'], ['scratch', 'Scratch 對照'], ['errors', '常見錯誤'], ['encoding', '編碼工具'], ['extensions', '延伸概念']];
function renderDictionary(query = '') {
  const text = query.toLocaleLowerCase().trim();
  const matches = entry => Object.values(entry).filter(value => typeof value === 'string').join(' ').toLocaleLowerCase().includes(text);
  $('#helper-nav').innerHTML = helperSections.map(([id, name]) => `<button type="button" data-helper-section="${id}" aria-pressed="${helperSection === id}">${name}</button>`).join('');
  $('#helper-context').textContent = helperSection === 'lesson' ? (currentLesson ? `第 ${currentLesson.id} 課・${currentLesson.title}：先查這幾個就夠了。搜尋會查全部語法。` : '先從第一課的語法開始；也可以查詢其他分類。') : '資料已整理在本站。查完按「回到練習」，接著寫原本的程式。';
  $('#dictionary-search').hidden = helperSection === 'encoding';
  $('label[for="dictionary-search"]').hidden = helperSection === 'encoding';
  const container = $('#dictionary-results');
  if (helperSection === 'encoding') {
    container.innerHTML = `<article class="dictionary-entry"><h3>字元與數字，原來可以互相轉換</h3><p>ASCII 使用 0～127；中文字與表情符號使用更大的 Unicode 碼位。十進位、十六進位與二進位是同一個數字的不同寫法。</p><div class="encoding-controls"><div><label for="encoding-char">一個字元（空格也算）</label><input id="encoding-char" value="A" autocomplete="off"></div><div><label for="encoding-number">碼位：十進位 / 0x / 0b</label><input id="encoding-number" value="65" autocomplete="off" spellcheck="false"></div></div><div id="encoding-result" role="status" aria-live="polite"></div><p class="mistake">Unicode 碼位是字元編號；UTF-8 位元組是儲存時的編碼。ord("中") 的結果不能當成一個 UTF-8 位元組。</p></article>`;
    updateEncoding('char');
    return;
  }
  if (helperSection === 'errors' || helperSection === 'extensions') {
    const entries = (helperSection === 'errors' ? errors : extensions).filter(matches);
    container.innerHTML = entries.map(entry => `<article class="dictionary-entry"><h3>${escape(entry.name)}</h3><p>${escape(entry.desc)}</p>${entry.bad ? `<h4>先找找哪裡不對</h4><pre>${escape(entry.bad)}</pre><h4>修正方式</h4><pre>${escape(entry.good)}</pre>` : ''}${entry.code ? `<h4>參考範例</h4><pre>${escape(entry.code)}</pre>` : ''}${entry.output ? `<h4>預期輸出</h4><pre>${escape(entry.output)}</pre>` : ''}<p class="mistake">${escape(entry.tip)}</p>${entry.demo ? '<div class="event-demo"><p id="event-label" aria-live="polite">準備好了</p><button class="button" type="button" id="event-greet">打招呼</button><button class="button quiet" type="button" id="event-reset">重設示意</button><p class="scratch">這是網頁事件示意，並非在瀏覽器執行 Tkinter。</p></div>' : ''}</article>`).join('');
  } else {
    const ids = currentLesson ? [...currentLesson.syntax, ...(currentLesson.activities[currentStage].syntax || [])] : lessons[0].syntax;
    const entries = dictionary.filter(entry => matches(entry) && (helperSection !== 'lesson' || text || ids.includes(entry.id)));
    container.innerHTML = entries.map(entry => `<article class="dictionary-entry"><h3>${escape(entry.name)}</h3><p class="scratch">Scratch 對照：${escape(entry.scratch)}</p><p>${escape(entry.desc)}</p><h4>${helperSection === 'scratch' ? '對應的 Python 寫法' : '語法格式'}</h4><pre>${escape(entry.format)}</pre><h4>短範例${entry.input ? `（輸入：${escape(entry.input)}）` : ''}</h4><pre>${escape(entry.example)}</pre><h4>預期輸出</h4><pre>${escape(entry.output)}</pre><p class="mistake">常見提醒：${escape(entry.mistake)}</p><p class="scratch">相關單元：${lessons.filter(lesson => lesson.syntax.includes(entry.id) || lesson.activities.some(activity => activity.syntax?.includes(entry.id))).map(lesson => `第 ${lesson.id} 課`).join(' · ') || '選讀延伸'}</p></article>`).join('');
  }
  if (!container.innerHTML) container.innerHTML = '<p class="empty-state">這個分類沒有相符內容，試試其他關鍵字或分類。</p>';
}
function updateEncoding(source) {
  try {
    const info = source === 'char' ? characterInfo($('#encoding-char').value) : parseCodePoint($('#encoding-number').value);
    if (source === 'char') $('#encoding-number').value = info.decimal;
    else $('#encoding-char').value = info.character;
    $('#encoding-result').innerHTML = `<dl class="encoding-values">${[['字元', info.control ? '控制字元（不直接顯示）' : JSON.stringify(info.character)], ['十進位・ord()', info.decimal], ['十六進位・hex()', info.hex], ['二進位・bin()', info.binary], ['Unicode 碼位', info.unicode], ['ASCII 範圍', info.ascii ? '是（0～127）' : '否，這是 Unicode 字元'], ['UTF-8 位元組（十進位）', info.bytes.join(' · ')]].map(([label, value]) => `<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl><h4>在 Python 裡試試看</h4><pre>${escape(`print(ord(${JSON.stringify(info.character)}))\nprint(chr(${info.decimal}))\nprint(hex(${info.decimal}))\nprint(bin(${info.decimal}))`)}</pre>`;
  } catch (error) { $('#encoding-result').innerHTML = `<p class="mistake">${escape(error.message)}</p>`; }
}
function openDictionary(id) {
  helperReturnFocus = document.activeElement;
  const entry = dictionary.find(item => item.id === id);
  helperSection = entry ? 'syntax' : 'lesson';
  $('#dictionary-search').value = entry ? entry.name : '';
  renderDictionary($('#dictionary-search').value);
  $('#dictionary-dialog').showModal(); $('#dictionary-dialog').scrollTop = 0;
  $('#close-dictionary').focus();
}
document.addEventListener('click', event => {
  if (event.target.closest('[data-operation-help]')) openOperationHelp();
  const guideButton = event.target.closest('[data-guide-action]');
  if (guideButton) guideAction(guideButton.dataset.guideAction);
  if (event.target.closest('[data-dictionary]')) openDictionary();
  const syntax = event.target.closest('[data-syntax]');
  if (syntax) openDictionary(syntax.dataset.syntax);
  const section = event.target.closest('[data-helper-section]');
  if (section) { $('#dictionary-search').value = ''; helperSection = section.dataset.helperSection; renderDictionary($('#dictionary-search').value); $('#helper-nav').querySelector(`[data-helper-section="${helperSection}"]`).focus(); }
  if (event.target.closest('#event-greet')) $('#event-label').textContent = '哈囉，小安！';
  if (event.target.closest('#event-reset')) $('#event-label').textContent = '準備好了';
});
$('#close-dictionary').addEventListener('click', () => $('#dictionary-dialog').close());
$('#dictionary-search').addEventListener('input', event => renderDictionary(event.target.value));
$('#dictionary-results').addEventListener('input', event => {
  if (event.target.id === 'encoding-char') updateEncoding('char');
  if (event.target.id === 'encoding-number') updateEncoding('number');
});
$('#dictionary-dialog').addEventListener('close', () => { if (helperReturnFocus?.isConnected) helperReturnFocus.focus(); });
$('.skip-link').addEventListener('click', event => { event.preventDefault(); main.focus(); main.scrollIntoView(); });
function route() {
  capture();
  if (busy) cancelExecution('已切換單元，本次執行已停止。', false);
  if ($('#certificate-dialog').open) $('#certificate-dialog').close();
  if ($('#operation-dialog').open) $('#operation-dialog').close();
  const params = new URLSearchParams(location.hash.slice(1));
  const id = Number(params.get('unit'));
  currentLesson = lessons.find(lesson => lesson.id === id);
  learningClock.select(currentLesson?.id ?? null);
  if (currentLesson && state.timings[id].partial === undefined) state.timings[id].partial = earnedStars(state.completed[id]) > 0;
  syncLearningClock(); save();
  const stage = Number(params.get('stage'));
  currentStage = Number.isInteger(stage) ? Math.min(4, Math.max(0, stage)) : 0;
  lockedMessage = '';
  if (currentLesson && currentStage >= 3 && !canAttemptTier(state.completed[currentLesson.id], currentStage - 1)) {
    currentStage = Math.min(4, earnedStars(state.completed[currentLesson.id]) + 2);
    lockedMessage = '先通過目前星級，再挑戰下一級。終極三星為選做。';
    history.replaceState(null, '', `#unit=${currentLesson.id}&stage=${currentStage}`);
  }
  tabMayLeave = false;
  if (currentLesson) renderLesson(); else renderHome();
  window.scrollTo({ top: 0, behavior: 'instant' });
  main.focus({ preventScroll: true });
}
window.addEventListener('hashchange', route);
document.addEventListener('visibilitychange', () => { syncLearningClock(); save(); });
window.addEventListener('pagehide', () => { capture(); learningClock.setRunning(false); save(); });
window.addEventListener('pageshow', syncLearningClock);
setInterval(updateLearningClock, 1000);
setInterval(() => { if (learningClock.isRunning()) save(); }, 5000);
route();
