import { lessons, dictionary } from './course-data.js';
import { errors, extensions } from './helper-data.js';
import { characterInfo, parseCodePoint } from './encoding.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const storageKey = 'pythonlab-v1';
let state = { drafts: {}, completed: {}, reflections: {} };
let canSave = true;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (saved && typeof saved === 'object') {
    for (const key of Object.keys(state)) if (saved[key] && typeof saved[key] === 'object' && !Array.isArray(saved[key])) state[key] = saved[key];
  }
} catch { canSave = false; }
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

function save() {
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
  state.drafts[draftKey()] = { ...getDraft(), code: $('#code').value, input: $('#stdin').value, prediction: $('#prediction').value };
  save();
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
  for (const element of document.querySelectorAll('[data-stage], #reset-code, #use-input')) element.disabled = busy;
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
  $('#feedback').hidden = true;
  $('#output').textContent = check ? '正在驗證…' : '正在執行…';
  try {
    const result = await execute(check ? 'check' : 'run', code, $('#stdin').value, activity.tests);
    if (currentLesson !== lesson || currentStage !== stage) return;
    if (!check) {
      $('#output').textContent = result.output || '（沒有輸出）';
      if (result.error) setFeedback(`<strong>程式需要修正</strong><pre>${escape(errorText(result.error))}</pre>`, 'error');
      else setFeedback('執行完成。和你的預測相同嗎？試著改一個值，再觀察差異。');
      return;
    }
    const allPassed = result.results.length > 0 && result.results.every(item => item.passed);
    $('#output').textContent = '驗證會分別使用下方的測試資料，每一組都從新的程式狀態開始。';
    const passed = result.results.filter(item => item.passed).length;
    const structuralNames = { For: 'for 迴圈', While: 'while 迴圈', Break: 'break', FunctionDef: 'def 函式' };
    const rows = result.results.map(item => `<details class="test-row" ${item.passed ? '' : 'open'}><summary>${item.passed ? '✓' : '✕'} ${escape(item.name)}</summary><pre>輸入：\n${escape(item.input || '（不需輸入）')}\n\n預期輸出：\n${escape(item.expected || '（沒有輸出）')}\n\n你的輸出：\n${escape(item.output || '（沒有輸出）')}${item.error ? `\n\n${escape(errorText(item.error))}` : ''}${item.missing?.length ? `\n\n此任務還需要：${escape(item.missing.map(name => structuralNames[name] || name).join('、'))}` : ''}</pre></details>`).join('');
    let message = allPassed ? `全部 ${passed} 組資料驗證通過！請再用自己的話說明程式。` : `通過 ${passed} / ${result.results.length} 組。比較第一個失敗案例，找出需要修改的地方。`;
    if (stage === 2 && allPassed) {
      const assisted = Boolean(getDraft().solutionSeen);
      state.completed[lesson.id] = { assisted, code, verifiedAt: Date.now() }; save();
      message += assisted ? ' 本次標記為「參考解答後驗證」，仍請完成離堂說明。' : ' 已記錄本課挑戰通過。';
      $('#lesson-completion').textContent = assisted ? '✓ 挑戰已驗證（參考解答）' : '✓ 挑戰已驗證';
    }
    setFeedback(`<p><strong>${escape(message)}</strong></p>${rows}`, allPassed ? 'success' : 'error');
  } catch (error) {
    if (currentLesson !== lesson || currentStage !== stage) return;
    $('#output').textContent = '（本次執行已停止）';
    setFeedback(escape(error.message), 'error');
  }
}

function renderHome() {
  const count = Object.keys(state.completed).filter(id => lessons.some(lesson => String(lesson.id) === id)).length;
  const next = lessons.find(lesson => !state.completed[lesson.id]) || lessons[0];
  main.innerHTML = `<section class="hero"><div><p class="eyebrow">PYTHON INTERACTIVE LEARNING</p><h1>從積木思考，<br>走向你的<span>第一行程式。</span></h1><p class="description">帶著 Scratch 的基礎，從修改範例開始。10 個循序漸進的任務，陪你讀懂、寫出，也驗證自己的 Python。</p><div class="hero-tags"><span>10 個引導單元</span><span>直接執行 Python</span><span>隨時查語法</span></div><a class="button primary" href="#unit=${next.id}">${count ? '繼續學習' : '開始第一個單元'} <span aria-hidden="true">→</span></a></div><div class="hero-code"><div class="window-bar"><span class="dots" aria-hidden="true">●●●</span><span>my_first_python.py</span></div><pre><span class="code-comment"># 從改一句話開始</span>\nname = <span class="code-string">"小安"</span>\nprint(<span class="code-string">"哈囉"</span>, name)\n\n<span class="code-comment"># 每一次修改，都是一次探索</span>\nprint(<span class="code-string">"今天，我用 Python 寫程式！"</span>)</pre><div class="hero-console">&gt; 哈囉 小安<br>&gt; 今天，我用 Python 寫程式！</div></div></section><div class="home-content"><div class="path-strip" aria-label="學習路徑"><div class="path-step"><strong><b>01</b> 觀察範例</strong><span>先看懂，再預測</span></div><div class="path-step"><strong><b>02</b> 動手修改</strong><span>從一行、一個值開始</span></div><div class="path-step"><strong><b>03</b> 執行驗證</strong><span>用結果檢查自己的想法</span></div><div class="path-step"><strong><b>04</b> 完成挑戰</strong><span>一步步建立小作品</span></div></div><div class="section-heading"><div><p class="eyebrow">YOUR LEARNING PATH</p><h2>10 個單元，一步一步往前</h2><p>每課都有起始程式、提示與語法解說，隨時可以回頭複習。</p></div><div class="progress-summary">挑戰已驗證 <strong>${count} / 10</strong></div></div><section class="lesson-grid" aria-label="課程單元">${lessons.map(lesson => `<a class="lesson-card" href="#unit=${lesson.id}"><div class="card-top"><span class="unit-number">${String(lesson.id).padStart(2, '0')}</span><span class="level-tag">${escape(lesson.level)}</span></div><h3>${escape(lesson.title)}</h3><p>${escape(lesson.subtitle)}</p><div class="card-bottom"><span class="${state.completed[lesson.id] ? 'done' : ''}">${state.completed[lesson.id] ? (state.completed[lesson.id].assisted ? '✓ 參考解答後驗證' : '✓ 挑戰已驗證') : '示範 → 引導 → 挑戰'}</span><span class="card-arrow" aria-hidden="true">↗</span></div></a>`).join('')}</section><section class="course-note"><div><h3>遇到問題，小幫手陪你找線索</h3><p>本課語法、Scratch 對照、錯誤排查與編碼工具都在本站。查完就能接著練習，不用另開網頁。</p></div><button type="button" class="button" data-dictionary>開啟參考小幫手</button></section><div class="home-actions"><span>首次執行需網路載入 Python。進度是練習紀錄，並非正式成績。</span><button type="button" class="button quiet" id="reset-progress">重設本機學習紀錄</button></div></div>`;
  document.title = 'Python Lab｜Python 互動學習';
  $('#reset-progress').addEventListener('click', () => confirmAction('重設學習紀錄', '將清除此瀏覽器的程式草稿、預測、離堂說明與驗證紀錄。需要的作品請先下載。', () => {
    state = { drafts: {}, completed: {}, reflections: {} }; save(); renderHome();
  }));
}
function renderLesson() {
  const lesson = currentLesson;
  const activity = lesson.activities[currentStage];
  const draft = getDraft();
  main.innerHTML = `<section class="course-bar"><div><p class="eyebrow">UNIT ${String(lesson.id).padStart(2, '0')} / 10 · ${escape(lesson.level)}</p><h1>${escape(lesson.title)}</h1><p>${escape(lesson.subtitle)}</p></div><a class="button quiet" href="#">返回課程總覽</a></section><div class="course-shell"><aside class="lesson-nav"><h2>學習路徑</h2><nav aria-label="單元切換">${lessons.map(item => `<a href="#unit=${item.id}" class="${item.id === lesson.id ? 'active' : ''}" ${item.id === lesson.id ? 'aria-current="page"' : ''}><span>${String(item.id).padStart(2, '0')}</span><span>${escape(item.title)}</span></a>`).join('')}</nav><p class="local-note">按建議順序學習，也可以自由複習。<br>草稿只保存在此瀏覽器。</p></aside><div class="lesson-reading"><section class="reading-card overview-card"><p class="eyebrow">這一課，你將學會</p><h2>${escape(lesson.goal)}</h2><div class="bridge">${escape(lesson.bridge)}</div><ul class="concept-list">${lesson.concepts.map(([title, text]) => `<li><strong>${escape(title)}</strong><p>${escape(text)}</p></li>`).join('')}</ul><div class="syntax-links">${lesson.syntax.map(id => `<button type="button" data-syntax="${id}">${escape(dictionary.find(item => item.id === id)?.name.split('・')[0] || id)} ↗</button>`).join('')}</div></section><div class="stage-tabs" role="group" aria-label="練習階段">${['① 示範', '② 引導', '③ 挑戰'].map((name, index) => `<button type="button" data-stage="${index}" aria-pressed="${index === currentStage}">${name}</button>`).join('')}</div><section class="reading-card task-card"><div class="task-label">${currentStage === 0 ? '先看懂，再動手' : '你的任務'}</div><h2>${escape(activity.title)}</h2><p class="task">${escape(activity.task)}</p><label class="small-label prediction-label" for="prediction">執行前，先預測結果（可選）</label><textarea class="prediction" id="prediction" placeholder="我預測會出現……">${escape(draft.prediction)}</textarea>${activity.expected ? `<details class="expected-box"><summary>查看原始範例的預期輸出</summary><pre>${escape(activity.expected)}</pre></details>` : ''}</section><section class="reading-card hints-card hints"><h2>需要一點線索？</h2>${activity.hints.map((hint, index) => `<details><summary>提示 ${index + 1}${index === 0 ? ' · 想法' : ' · 語法線索'}</summary><p>${escape(hint)}</p></details>`).join('')}<details id="solution-details"><summary>參考解答 · 想過之後再看</summary><p>先比較自己的程式，找出差異，再回編輯器修正。直接觀看不會自動完成挑戰。</p><pre class="solution-code">${escape(activity.solution)}</pre></details></section><section class="reading-card exit-question"><p class="eyebrow">用自己的話說明</p><h2>離堂小檢核</h2><p>${escape(lesson.exit)}</p><label class="small-label" for="reflection">我的解釋或修改紀錄</label><textarea id="reflection" class="prediction" placeholder="我發現……因為……">${escape(state.reflections[lesson.id] || '')}</textarea><p id="lesson-completion" class="small-label">${state.completed[lesson.id] ? `✓ 挑戰已驗證${state.completed[lesson.id].assisted ? '（參考解答）' : ''}` : '完成挑戰驗證後，會記錄在課程總覽。'}</p><p class="small-label">這是學習練習紀錄，並非正式成績。</p></section><nav class="next-links" aria-label="前後單元">${lesson.id > 1 ? `<a href="#unit=${lesson.id - 1}">← 上一單元</a>` : '<a href="#">← 課程總覽</a>'}${lesson.id < 10 ? `<a href="#unit=${lesson.id + 1}">下一單元 →</a>` : '<a href="#">回到課程總覽 →</a>'}</nav><p class="sources">本課重整自原教材第 ${lesson.source.join("、")} 篇。所需解說已收進站內。<button type="button" class="helper-inline" data-dictionary>查看參考小幫手</button></p></div><section class="workspace" aria-label="Python 練習區"><div class="runtime-status" id="runtime-status" role="status"><span id="runtime-text"></span><button id="retry-runtime" type="button" hidden>重新載入</button></div><div class="editor-panel"><div class="editor-toolbar"><label for="code" class="file-name">unit_${String(lesson.id).padStart(2, '0')}.py</label><span class="save-state" id="save-state">${canSave ? '草稿保存在此瀏覽器' : '無法自動保存，請下載程式'}</span></div><div class="editor-wrap"><pre id="line-numbers" class="line-numbers" aria-hidden="true"></pre><textarea id="code" class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-describedby="editor-help">${escape(draft.code)}</textarea></div><div class="editor-actions"><button type="button" id="run" class="button primary">▶ 執行程式</button><button type="button" id="stop" class="button quiet" disabled>■ 停止</button>${activity.tests.length ? '<button type="button" id="check" class="button blue">✓ 驗證任務</button>' : '<button type="button" id="check" hidden>驗證</button>'}</div><div class="editor-bottom"><span id="editor-help">Tab 縮排四格 · Ctrl / ⌘ + Enter 執行 · Esc 讓 Tab 離開編輯器</span><span>執行上限 8 秒</span></div></div><div class="editor-tools"><button type="button" id="reset-code">↺ 還原起始程式</button><button type="button" id="download">↓ 下載 .py</button></div><section class="io-panel"><div class="io-heading"><label for="stdin">輸入資料 · 每行對應一次 input()</label><button type="button" id="use-input">載入範例輸入</button></div><textarea id="stdin" class="input-area" spellcheck="false" aria-describedby="input-help" placeholder="${activity.input ? '每一行放一筆資料' : '這個任務不需要輸入資料'}">${escape(draft.input)}</textarea><p class="io-note" id="input-help">執行前先準備好資料。程式讀到 input() 時，會依序讀取這裡的各行；驗證任務則使用內建測試資料。</p></section><section class="io-panel"><div class="io-heading"><span>執行結果</span><span>輸出會顯示在這裡</span></div><pre id="output" class="output-area" aria-live="polite">先預測，再按「執行程式」。</pre></section><div id="feedback" class="feedback" role="status" hidden></div></section></div>`;
  document.title = `第 ${lesson.id} 單元 ${lesson.title}｜Python Lab`;
  updateLines(); updateRuntime();
  $('#run').addEventListener('click', () => runCode());
  $('#check').addEventListener('click', () => runCode(true));
  $('#stop').addEventListener('click', () => cancelExecution());
  $('#retry-runtime').addEventListener('click', () => { worker?.terminate(); worker = null; startWorker(); });
  $('#code').addEventListener('input', () => { updateLines(); capture(); $('#feedback').hidden = true; if (currentStage === 2 && state.completed[lesson.id]?.code !== $('#code').value) $('#lesson-completion').textContent = '目前程式尚未驗證，請按「驗證任務」檢查。'; });
  $('#code').addEventListener('scroll', () => { $('#line-numbers').scrollTop = $('#code').scrollTop; });
  $('#code').addEventListener('keydown', editorKeys);
  $('#stdin').addEventListener('input', capture);
  $('#prediction').addEventListener('input', capture);
  $('#reflection').addEventListener('input', () => { state.reflections[lesson.id] = $('#reflection').value; save(); });
  $('#use-input').addEventListener('click', () => { $('#stdin').value = activity.input; capture(); });
  $('#reset-code').addEventListener('click', () => confirmAction('還原起始程式', '這個練習的目前程式與輸入將被起始範例取代。其他練習的草稿會保留。', () => {
    $('#code').value = activity.starter; $('#stdin').value = activity.input; capture(); updateLines(); $('#feedback').hidden = true; $('#output').textContent = '已還原，可重新觀察與修改。';
  }));
  $('#solution-details').addEventListener('toggle', () => {
    if ($('#solution-details')?.open) { capture(); state.drafts[draftKey()].solutionSeen = true; save(); }
  });
  $('#download').addEventListener('click', () => {
    capture(); const url = URL.createObjectURL(new Blob([$('#code').value], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `pythonlab-unit-${String(lesson.id).padStart(2, '0')}-${currentStage + 1}.py`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  for (const button of document.querySelectorAll('[data-stage]')) button.addEventListener('click', () => {
    capture(); currentStage = Number(button.dataset.stage); history.replaceState(null, '', `#unit=${lesson.id}&stage=${currentStage}`); renderLesson();
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
    const ids = currentLesson?.syntax || lessons[0].syntax;
    const entries = dictionary.filter(entry => matches(entry) && (helperSection !== 'lesson' || text || ids.includes(entry.id)));
    container.innerHTML = entries.map(entry => `<article class="dictionary-entry"><h3>${escape(entry.name)}</h3><p class="scratch">Scratch 對照：${escape(entry.scratch)}</p><p>${escape(entry.desc)}</p><h4>${helperSection === 'scratch' ? '對應的 Python 寫法' : '語法格式'}</h4><pre>${escape(entry.format)}</pre><h4>短範例${entry.input ? `（輸入：${escape(entry.input)}）` : ''}</h4><pre>${escape(entry.example)}</pre><h4>預期輸出</h4><pre>${escape(entry.output)}</pre><p class="mistake">常見提醒：${escape(entry.mistake)}</p><p class="scratch">相關單元：${lessons.filter(lesson => lesson.syntax.includes(entry.id)).map(lesson => `第 ${lesson.id} 課`).join(' · ') || '選讀延伸'}</p></article>`).join('');
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
  const params = new URLSearchParams(location.hash.slice(1));
  const id = Number(params.get('unit'));
  currentLesson = lessons.find(lesson => lesson.id === id);
  const stage = Number(params.get('stage'));
  currentStage = Number.isInteger(stage) ? Math.min(2, Math.max(0, stage)) : 0;
  tabMayLeave = false;
  if (currentLesson) renderLesson(); else renderHome();
  window.scrollTo({ top: 0, behavior: 'instant' });
  main.focus({ preventScroll: true });
}
window.addEventListener('hashchange', route);
window.addEventListener('pagehide', capture);
route();
