(() => {
  'use strict';

  function missingVariables(task, program, declared) {
    const names = new Set(program.flatMap(id => task.blocks[id]?.variables || []));
    return [...names].filter(name => !declared.has(name));
  }

  const declarationMessage = names => '請先新增變數：' + names.join('、') + '。';

  function execute(task, program, input, variables = [], branchChoices) {
    const state = { input, rows: [], text: '' };
    const run = ids => {
      for (const id of ids) {
        if (state.stopped) break;
        task.blocks[id].run(state, branchChoices);
      }
    };
    try {
      if (!program.length) throw new Error('先加入積木，再執行。');
      const missing = missingVariables(task, program, new Set(variables));
      if (missing.length) throw new Error(declarationMessage(missing));
      if (task.loop) {
        const { before, times } = task.loop;
        const first = program.slice(0, before.length);
        if (!before.every((id, index) => first[index] === id)) throw new Error('先把初始化積木放在迴圈之前。');
        run(first);
        for (let index = 0; index < times; index++) run(program.slice(first.length));
      } else run(program);
      state.passed = task.pass(state);
    } catch (error) {
      state.error = error.message;
    }
    return state;
  }

  function graph(state, labels = []) {
    const points = state.points;
    if (!points?.length) return '';
    const extent = [...points, ...(state.marker ? [state.marker] : []), ...labels.map(({ x, y }) => [x, y])];
    const [xs, ys] = [0, 1].map(axis => extent.map(point => point[axis]));
    const [left, top] = [xs, ys].map(values => Math.min(...values) - 12);
    const [width, height] = [Math.max(...xs) - left + 12, Math.max(...ys) - top + 12];
    const [x, y] = points.at(-1);
    const stroke = state.width ? `stroke-width="${state.width}"` : 'stroke-width="2" vector-effect="non-scaling-stroke"';
    return `<svg viewBox="${left} ${top} ${width} ${height}" role="img" aria-label="程式執行後的移動路徑">
      <polyline fill="none" stroke="#2563eb" pathLength="1" ${stroke} points="${points.map(point => point.join(',')).join(' ')}"/>
      <circle cx="${x}" cy="${y}" r="3" fill="#1d4ed8"/>
      ${state.marker ? `<circle cx="${state.marker[0]}" cy="${state.marker[1]}" r="3" fill="#b91c1c"/>` : ''}
      ${labels.map(({ x, y, value, at }) =>
        `<text class="lesson-preview__dimension" data-draw-label="${at}" x="${x}" y="${y}" font-size="${Math.max(width, height) * .1}" text-anchor="middle" dominant-baseline="central">${escape(value)}</text>`).join('')}
    </svg>`;
  }

  const categories = {
    motion: '動作', looks: '外觀', event: '事件', control: '控制', variable: '變數',
    list: '清單', custom: '函式積木', pen: '畫筆', music: '音樂'
  };
  const escape = value => String(value).replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const textLabel = label => label.replace(/[{}\[\]<>]/g, '');

  function labelMarkup(label) {
    return label.split(/(\{[^}]+\}|\[[^\]]+\]|<[^>]+>|⚑)/).map(part => {
      if (part === '⚑') return '<span class="block-program__flag" aria-label="綠旗">⚑</span>';
      const shape = { '{': 'value', '[': 'menu', '<': 'condition' }[part[0]];
      return shape ? `<span class="block-program__field is-${shape}">${escape(part.slice(1, -1))}</span>` : escape(part);
    }).join('');
  }

  function blockMarkup([category, shape, label, inside, otherwise]) {
    const tile = (kind, form, name) =>
      `<span class="block-program__tile is-${kind} is-${form}">${labelMarkup(name)}</span>`;
    if (!inside) return tile(category, shape, label);
    const body = entries => `<span class="block-program__c-body">${entries.map(([kind, name]) => tile(kind, 'stack', name)).join('')}</span>`;
    return `<span class="block-program__c is-${category}">${tile(category, 'stack', label)}${body(inside)}
      ${otherwise ? tile(category, 'stack', '否則') + body(otherwise) : ''}
      <span class="block-program__tile is-${category} block-program__c-foot" aria-hidden="true">${label.startsWith('重複') ? '↶' : ''}</span></span>`;
  }

  const branchNames = ['那麼', '否則'];
  const outcomeLabel = value => `變數 [結果] 設為 {${value}}`;
  const outcomeMarkup = value => blockMarkup(['variable', 'stack', outcomeLabel(value)]);

  function compare(task, program, variables, branchChoices) {
    const results = task.cases.map(({ name, values }) => ({ name, result: execute(task, program, values, variables, branchChoices) }));
    const sameBranch = !task.branch || task.branch.solution.every((id, index) => branchChoices?.[index] === id);
    const sameOrder = sameBranch && task.goal.length === program.length && task.goal.every((id, index) => id === program[index]);
    const missing = task.goal.filter(id => !program.includes(id));
    return { results, sameOrder, missing };
  }

  function summary(result) {
    if (result.error || result.text) return result.error || result.text;
    if (result.points) return `移動 ${result.points.length - 1} 次。`;
    if (result.rows.length) return `執行紀錄共 ${result.rows.length} 筆。`;
    return '沒有輸出。';
  }

  function mount(root, task, { draft, onSave } = {}) {
    const branch = task.branch;
    const palette = Object.entries(task.blocks);
    const variableNames = task.variables || [];
    const savedVariables = Array.isArray(draft?.variables) ? draft.variables : [];
    const declared = new Set(savedVariables.filter(name => variableNames.includes(name)));
    if (task.shufflePalette) {
      for (let i = palette.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [palette[i], palette[j]] = [palette[j], palette[i]];
      }
      if (palette.every(([id], index) => id === task.goal[index])) palette.push(palette.shift());
    }
    const program = Array.isArray(draft?.blocks)
      ? [...new Set(draft.blocks.filter(id => typeof id === 'string' && Object.hasOwn(task.blocks, id)))]
      : [];
    const branchChoices = branchNames.map((_, index) => {
      const id = draft?.branchChoices?.[index];
      return branch && program.includes(branch.id) && typeof id === 'string' && Object.hasOwn(branch.outcomes, id) ? id : null;
    });
    if (branchChoices[0] === branchChoices[1]) branchChoices[1] = null;
    const runs = Array.isArray(draft?.runs) ? draft.runs.filter(entry =>
      typeof entry?.key === 'string' && entry.key.length <= 1000 &&
      typeof entry.text === 'string' && entry.text.length <= 16000).slice(-8) : [];
    let audio;
    let result;
    let checked;
    let copiedReport = '';
    let currentReport = '';
    const { requiredRuns, runTarget = requiredRuns || 1, change = '換一組測試資料', compareEdits, compareFirst, copy: copyMode,
      copyBeforeCheck } = task.toolbar || {};
    root.innerHTML = `
      <h3>${escape(task.title || '積木程式模擬器')}</h3>
      <p>拖曳或點選積木加入程式。可拖曳排序，也可以點選兩塊交換。把積木拖出放置區後放開即可移除。按「比對檢查」可檢查所有預設資料。</p>
      <div class="block-program__cases">
        <label>測試資料 <select data-program-case>${task.cases.map(({ name }, index) => `<option value="${index}">${name}</option>`).join('')}</select></label>
        ${task.fields.map(({ key, label, min, max }) => `<label>${label} <input data-program-value="${key}" type="number" min="${min}" max="${max}" required></label>`).join('')}
      </div>
      <p data-program-input></p>
      ${variableNames.length ? `<form class="block-program__variables" data-program-variable-form>
        <h4>建立變數</h4>
        <p>依積木上的名稱逐一新增。建立後，再用積木存入或讀取數值。</p>
        <p>本題會用到：${variableNames.map(escape).join('、')}</p>
        <div class="block-program__actions">
          <label>變數名稱 <input type="text" data-program-variable-name maxlength="40" autocomplete="off" required></label>
          <button type="submit">新增變數</button>
        </div>
        <p data-program-variable-status role="status"></p>
      </form>` : ''}
      <div class="block-program__workspace">
        <div><h4 data-program-palette-heading tabindex="-1">積木區</h4><button type="button" class="block-program__jump" data-program-jump="work">前往程式區</button><div class="block-program__palette">${Object.entries(categories).map(([category, name]) => {
          const group = palette.filter(([, block]) => block.view[0] === category);
          return group.length ? `<div class="block-program__category is-${category}"><h5>${name}</h5>
            ${group.map(([id, block]) => `<button type="button" class="block-program__grab" data-program-add="${id}" draggable="true">${blockMarkup(block.view)}</button>`).join('')}</div>` : '';
        }).join('')}${branch ? `<div class="block-program__category is-variable"><h5>分支結果</h5>
          <p>拖入分支，或先點結果積木，再點放置位置。</p>
          ${Object.entries(branch.outcomes).map(([id, label]) => `<button type="button" class="block-program__grab" data-program-outcome="${id}" draggable="true" disabled aria-pressed="false">${outcomeMarkup(label)}</button>`).join('')}
        </div>` : ''}</div></div>
        <div data-program-work><h4 tabindex="-1">程式區・積木放置區</h4>
        <button type="button" class="block-program__jump" data-program-jump="palette">回到積木區</button>
        ${task.loop ? `<p>初始化後，後續積木會放在「重複 ${task.loop.times} 次」中。</p>` : ''}
        <ol data-program-script></ol></div>
      </div>
      <p class="block-program__toolbar-note">執行本組看一組結果，比對檢查測所有預設資料。清空可重排，複製可把單次或多次結果貼到作業。</p>
      <p class="block-program__toolbar-hint" role="status"><strong>現在要做的事</strong> <span data-program-next></span></p>
      <div class="block-program__actions" data-program-toolbar>
        <button type="button" data-program-run>執行本組</button>
        <button type="button" data-program-compare>比對檢查</button>
        <button type="button" data-program-reset>清空積木</button>
        <button type="button" data-program-copy disabled>複製程式與結果</button>
        <button type="button" data-program-copy-all disabled>複製多組試跑紀錄</button>
      </div>
      <p role="status" data-program-feedback></p>
      <textarea data-program-output aria-label="可複製的積木程式試跑紀錄" rows="5" readonly hidden></textarea>
      <div data-program-comparison></div>
      <div data-program-result></div>`;
    const script = root.querySelector('[data-program-script]');
    const work = root.querySelector('[data-program-work]');
    root.querySelector('h3').tabIndex = -1;
    const jumpTo = heading => {
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ behavior: 'instant', block: 'start' });
    };
    root.querySelector('[data-program-jump="work"]').addEventListener('click', () => jumpTo(work.querySelector('h4')));
    root.querySelector('[data-program-jump="palette"]').addEventListener('click', () => jumpTo(root.querySelector('[data-program-palette-heading]')));
    const feedback = root.querySelector('[data-program-feedback]');
    const stage = root.querySelector('[data-program-result]');
    const comparison = root.querySelector('[data-program-comparison]');
    const copy = root.querySelector('[data-program-copy]');
    const copyAll = root.querySelector('[data-program-copy-all]');
    const toolbar = root.querySelector('[data-program-toolbar]');
    const nextHint = root.querySelector('[data-program-next]');
    const output = root.querySelector('[data-program-output]');
    const inputs = [...root.querySelectorAll('[data-program-value]')];
    const caseSelect = root.querySelector('[data-program-case]');
    const selected = () => task.cases[Number(caseSelect.value)];
    const currentInput = () => ({ ...selected().values,
      ...Object.fromEntries(inputs.map(field => [field.dataset.programValue, field.valueAsNumber])) });
    const runKey = input => JSON.stringify(branch ? [program, input, branchChoices] : [program, input]);
    const variableForm = variableNames.length ? root.querySelector('[data-program-variable-form]') : null;

    function saveDraft() {
      onSave?.({
        blocks: program, caseIndex: Number(caseSelect.value), runs, variables: [...declared],
        ...(branch ? { branchChoices: [...branchChoices] } : {}),
        fields: Object.fromEntries(inputs.map(input => [input.dataset.programValue, input.value]))
      });
    }

    const recordedInputs = passedOnly => new Set(runs.filter(entry =>
      !passedOnly || (entry.passed === true && typeof entry.inputKey === 'string'))
      .map(entry => typeof entry.inputKey === 'string' ? entry.inputKey : entry.key));
    const allReports = () => runs.map(({ text }, index) => `試跑 ${index + 1}\n${text}`).join('\n\n');

    function showRunCount() {
      copyAll.disabled = runs.length === 0;
      copyAll.textContent = runs.length ? `複製多組試跑紀錄（${runs.length} 筆）` : '複製多組試跑紀錄';
      const count = recordedInputs(true).size;
      if (requiredRuns === 2) root.toggleAttribute('data-program-two-runs', count >= 2);
      root.toggleAttribute('data-program-three-runs', count >= 3);
    }

    function updateToolbar() {
      const show = (message, button) => {
        if (nextHint.textContent !== message) nextHint.textContent = message;
        toolbar.className = `block-program__actions${button ? ' is-' + button : ''}`;
      };
      const missing = missingVariables(task, task.goal, declared);
      if (missing.length) return show(declarationMessage(missing));
      if (!program.length) return show('先從積木區加入積木。');
      if (branch && program.includes(branch.id) && branchChoices.includes(null)) {
        return show('把兩塊「分支結果」積木分別放入「那麼」和「否則」。');
      }
      if (checked === false) return show('看下方的比對結果，修正積木後再檢查。');
      if (result && !result.passed && checked !== true) return show('看下方結果，調整積木或測試資料，再按「執行本組」重試。', 'run');
      if (!result && checked === undefined && task.goal.some(id => !program.includes(id))) {
        return show('繼續排積木。排好後再測試。');
      }
      const inputsRun = recordedInputs(requiredRuns);
      const count = compareEdits ? runs.length : inputsRun.size;
      const needsMore = count < runTarget && (checked !== true || runTarget > 1 || copyMode);
      const input = currentInput();
      const trialKey = runKey(input);
      const inputKey = JSON.stringify(input);
      const triedHere = runs.some(entry => entry.key === trialKey);
      const alreadyTried = compareEdits ? triedHere : inputsRun.has(inputKey);
      const needsExample = checked === undefined && !triedHere;
      const needsCopyResult = copyMode === 'copy' && !currentReport && copiedReport === '';
      if (!compareFirst && (needsMore || needsExample || needsCopyResult)) {
        const progress = runTarget > 1 ? `（${Math.min(count, runTarget)}／${runTarget}${requiredRuns ? ' 組通過' : ' 次已記錄'}）` : '';
        const repeat = needsMore && alreadyTried ? `先${change}，再` : '';
        return show(`${repeat}按「執行本組」看結果${progress}。`, 'run');
      }
      const report = copyMode === 'copy-all' ? allReports() : currentReport;
      if (copyMode && (copyBeforeCheck || checked === true) && report && report !== copiedReport) {
        const label = copyMode === 'copy-all' ? '複製多組試跑紀錄' : '複製程式與結果';
        return show(`按「${label}」，把紀錄貼到作業。`, copyMode);
      }
      if (checked === true) return show('比對已通過。可按下方的下一步。');
      return show('按「比對檢查」，確認預設測試是否全部通過。', 'compare');
    }

    async function copyReport(report) {
      if (!report) return;
      output.hidden = true;
      try {
        await navigator.clipboard.writeText(report);
        copiedReport = report;
        feedback.textContent = '已複製。請貼到本課作業。';
        updateToolbar();
      } catch {
        output.value = report;
        output.hidden = false;
        output.select();
        feedback.textContent = '請複製下方紀錄，貼到本課作業。';
      }
    }

    // 點選交換：先點一塊（標示為已選），再點另一塊就互換位置；再點同一塊取消。
    let picked = null;
    let pickedOutcome = null;

    function invalidate(message = '') {
      root.removeAttribute('data-program-passed');
      picked = null;
      pickedOutcome = null;
      checked = undefined;
      stopAudio();
      result = undefined;
      currentReport = '';
      output.hidden = true;
      stage.replaceChildren();
      comparison.replaceChildren();
      feedback.textContent = message;
      copy.disabled = true;
      updateToolbar();
    }

    function render() {
      const rows = program.map((id, index) => {
        const isBranch = id === branch?.id;
        return `<li data-program-row="${index}" class="block-program__row${isBranch ? ' block-program__c is-control block-program__branch' : ''}">
          <button type="button" class="block-program__grab block-program__pick${picked === index ? ' is-picked' : ''}" data-program-drag="${index}" data-program-pick="${index}" draggable="true" aria-pressed="${picked === index}" aria-keyshortcuts="Delete Backspace" aria-label="第 ${index + 1} 塊：${escape(textLabel(task.blocks[id].view[2]))}。${picked === null ? '點選後，再點另一塊即可交換位置' : picked === index ? '已選取，再點一次取消' : `點這裡與第 ${picked + 1} 塊交換`}。鍵盤可按 Delete 移除">${blockMarkup(task.blocks[id].view)}</button>
          ${isBranch ? `${branchNames.map((name, slot) => `${slot ? blockMarkup(['control', 'stack', name]) : ''}
            <div class="block-program__c-body">
              <button type="button" data-program-branch-slot="${slot}" draggable="${Boolean(branchChoices[slot])}"
                ${branchChoices[slot] ? `aria-pressed="${pickedOutcome === branchChoices[slot]}"` : ''} aria-keyshortcuts="Delete Backspace"
                aria-label="${name}：${branchChoices[slot] ? escape(textLabel(outcomeLabel(branch.outcomes[branchChoices[slot]]))) : '空的放置位置'}">
                ${branchChoices[slot] ? outcomeMarkup(branch.outcomes[branchChoices[slot]]) : '放入結果積木'}
              </button>
            </div>`).join('')}
            <span class="block-program__tile is-control block-program__c-foot" aria-hidden="true"></span>` : ''}
        </li>`;
      });
      if (task.loop && rows.length > task.loop.before.length) {
        const split = task.loop.before.length;
        script.innerHTML = rows.slice(0, split).join('') +
          `<li class="block-program__c is-control">
            <span class="block-program__tile is-control is-stack">${labelMarkup(`重複 {${task.loop.times}} 次`)}</span>
            <ol class="block-program__c-body">${rows.slice(split).join('')}</ol>
            <span class="block-program__tile is-control block-program__c-foot" aria-hidden="true">↶</span>
          </li>`;
      } else script.innerHTML = rows.join('') || '<li>把第一塊積木拖到這裡，或從積木區點選加入。</li>';
      for (const button of root.querySelectorAll('[data-program-add]')) {
        const id = button.dataset.programAdd;
        const missing = missingVariables(task, [id], declared);
        button.disabled = program.includes(id) || missing.length > 0;
        button.draggable = !button.disabled;
        button.title = missing.length ? declarationMessage(missing) : '';
      }
      if (branch) for (const button of root.querySelectorAll('[data-program-outcome]')) {
        button.disabled = !program.includes(branch.id) || branchChoices.includes(button.dataset.programOutcome);
        button.draggable = !button.disabled;
        button.setAttribute('aria-pressed', String(pickedOutcome === button.dataset.programOutcome));
      }
    }

    function checkVariables() {
      const missing = missingVariables(task, program.length ? program : task.goal, declared);
      if (!missing.length) return true;
      feedback.textContent = declarationMessage(missing);
      return false;
    }

    function showComparison() {
      if (!checkVariables()) return;
      if (!program.length) {
        feedback.textContent = '先加入積木，再比對檢查。';
        return;
      }
      const { results, sameOrder, missing } = compare(task, program, declared, branchChoices);
      const allPassed = results.every(({ result }) => result.passed);
      checked = allPassed;
      root.toggleAttribute('data-program-passed', allPassed);
      const order = sameOrder ? '積木順序與參考程式一致。' :
        allPassed ? '積木順序與參考程式不同，但所有測試都通過。' :
        missing.length ? `請確認是否缺少：${missing.map(id => textLabel(task.blocks[id].view[2])).join('、')}。` :
        branch ? '看下方兩組的結果，檢查「那麼」和「否則」放的積木。' :
        task.shufflePalette ? '看下方哪組資料先出錯，再檢查積木順序。' : '請對照參考程式，檢查積木放置順序。';
      feedback.textContent = allPassed ? '所有測試都通過。' : '有測試未通過，請查看下方結果。';
      const reference = allPassed || (!task.shufflePalette && !branch) ? `<details class="lesson-reference"><summary>查看參考積木順序</summary><ol>${task.goal.map(id => {
        const view = task.blocks[id].view;
        const complete = id === branch?.id ? [...view, ...branch.solution.map(choice => [['variable', outcomeLabel(branch.outcomes[choice])]])] : view;
        return `<li>${blockMarkup(complete)}</li>`;
      }).join('')}</ol></details>` : '';
      comparison.innerHTML = `<p>${escape(order)}</p><ul>${results.map(({ name, result }) =>
        `<li><strong>${escape(name)}｜${result.passed ? '通過' : '再檢查'}</strong>
          ${escape(summary(result))}</li>`).join('')}</ul>${reference}`;
      updateToolbar();
    }

    function saveEdit(message) {
      invalidate(message);
      saveDraft();
      render();
    }

    function removeBlock(index) {
      if (program[index] === branch?.id) branchChoices.fill(null);
      program.splice(index, 1);
      saveEdit('已移除積木。');
    }

    function placeOutcome(id, slot) {
      if (!branch || !program.includes(branch.id) || !Object.hasOwn(branch.outcomes, id) || !branchNames[slot]) return;
      const previous = branchChoices.indexOf(id);
      if (previous >= 0) branchChoices[previous] = branchChoices[slot];
      branchChoices[slot] = id;
      saveEdit(`已將「${branch.outcomes[id]}」放入「${branchNames[slot]}」。`);
    }

    function removeOutcome(slot) {
      branchChoices[slot] = null;
      saveEdit('已移除分支結果積木。');
    }

    function clearDrop() {
      script.querySelectorAll('[data-drop]').forEach(row => row.removeAttribute('data-drop'));
      if (branch) script.querySelectorAll('[data-branch-drop]').forEach(slot => slot.removeAttribute('data-branch-drop'));
      script.classList.remove('is-drop-end');
      work.classList.remove('is-drop-outside');
    }
    function destination(target, y) {
      const row = target.closest('[data-program-row]');
      if (!row) return program.length;
      const rect = row.getBoundingClientRect();
      return Number(row.dataset.programRow) + (y > rect.top + rect.height / 2 ? 1 : 0);
    }
    function showDrop(drag, target, y) {
      clearDrop();
      if (drag.outcome) {
        if (work.contains(target)) target.closest('[data-program-branch-slot]')?.setAttribute('data-branch-drop', '');
        else if (drag.slot !== undefined) work.classList.add('is-drop-outside');
        return;
      }
      if (!work.contains(target)) {
        if (drag.index !== undefined) work.classList.add('is-drop-outside');
        return;
      }
      const position = destination(target, y);
      const row = script.querySelector(`[data-program-row="${position}"]`);
      if (row) row.setAttribute('data-drop', '');
      else script.classList.add('is-drop-end');
    }
    function finishDrop(drag, target, y) {
      if (!target) return false;
      if (drag.outcome) {
        if (!work.contains(target)) {
          if (drag.slot === undefined) return false;
          removeOutcome(drag.slot);
          return true;
        }
        const slot = target.closest('[data-program-branch-slot]');
        if (!slot || Number(slot.dataset.programBranchSlot) === drag.slot) return false;
        placeOutcome(drag.outcome, Number(slot.dataset.programBranchSlot));
        return true;
      }
      if (!work.contains(target)) {
        if (drag.index === undefined) return false;
        removeBlock(drag.index);
        return true;
      }
      const position = destination(target, y);
      if (drag.id) {
        program.splice(position, 0, drag.id);
        saveEdit('已加入積木。');
      } else {
        const next = position > drag.index ? position - 1 : position;
        if (next === drag.index) return false;
        const [id] = program.splice(drag.index, 1);
        program.splice(next, 0, id);
        saveEdit('已移動積木。');
      }
      return true;
    }

    let touch;
    function dragFrom(source) {
      const { programAdd, programDrag, programOutcome, programBranchSlot } = source.dataset;
      if (programBranchSlot !== undefined) {
        const slot = Number(programBranchSlot);
        return branchChoices[slot] ? { outcome: branchChoices[slot], slot } : null;
      }
      if (programOutcome) return { outcome: programOutcome };
      return programAdd ? { id: programAdd } : { index: Number(programDrag) };
    }

    root.addEventListener('dragstart', event => {
      const source = event.target.closest('[data-program-add], [data-program-drag], [data-program-outcome], [data-program-branch-slot]');
      if (!source || source.disabled) return;
      if (touch?.source === source) { event.preventDefault(); return; }
      const drag = dragFrom(source);
      if (!drag || (drag.id && missingVariables(task, [drag.id], declared).length)) return;
      const page = root.ownerDocument;
      const listeners = new AbortController();
      const options = { capture: true, signal: listeners.signal };
      const stop = () => { listeners.abort(); clearDrop(); };
      // Accept drops elsewhere on this page so that cancelling the native drag never deletes a block.
      const fromPalette = drag.id || (drag.outcome && drag.slot === undefined);
      const accepts = target => {
        if (!source.isConnected || source.disabled) return false;
        if (!work.contains(target)) return !fromPalette;
        return !drag.outcome || Boolean(target.closest('[data-program-branch-slot]'));
      };
      const effect = fromPalette ? 'copy' : 'move';
      event.dataTransfer.effectAllowed = effect;
      event.dataTransfer.setData('text/plain', drag.outcome || drag.id || String(drag.index));
      page.addEventListener('dragover', event => {
        showDrop(drag, event.target, event.clientY);
        if (!accepts(event.target)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = effect;
      }, options);
      page.addEventListener('drop', event => {
        stop();
        if (!accepts(event.target)) return;
        event.preventDefault();
        finishDrop(drag, event.target, event.clientY);
      }, options);
      page.addEventListener('dragend', stop, options);
    });

    root.addEventListener('pointerdown', event => {
      const source = event.target.closest('[data-program-drag], [data-program-branch-slot][draggable="true"]');
      if (!source || !event.isPrimary || event.pointerType === 'mouse' || event.button !== 0) return;
      const drag = dragFrom(source);
      if (!drag) return;
      touch = { ...drag, source, pointer: event.pointerId, x: event.clientX, y: event.clientY };
      source.setPointerCapture(event.pointerId);
    });
    root.addEventListener('pointermove', event => {
      if (touch?.pointer !== event.pointerId) return;
      if (!touch.preview) {
        if (Math.hypot(event.clientX - touch.x, event.clientY - touch.y) < 8) return;
        touch.preview = touch.source.firstElementChild.cloneNode(true);
        touch.preview.classList.add('block-program__drag-preview');
        touch.preview.setAttribute('aria-hidden', 'true');
        touch.source.classList.add('is-dragging');
        root.append(touch.preview);
      }
      touch.preview.style.left = `${event.clientX + 14}px`;
      touch.preview.style.top = `${event.clientY + 14}px`;
      showDrop(touch, root.ownerDocument.elementFromPoint(event.clientX, event.clientY), event.clientY);
    });
    function endTouch(event) {
      if (touch?.pointer !== event.pointerId) return;
      const drag = touch;
      touch = undefined;
      if (!drag.preview) return;
      drag.preview.remove();
      drag.source.classList.remove('is-dragging');
      clearDrop();
      if (event.type === 'pointerup' && drag.source.isConnected) {
        const target = root.ownerDocument.elementFromPoint(event.clientX, event.clientY);
        // Replace the source even on a no-op drop so the gesture can't turn into a tile click.
        if (!finishDrop(drag, target, event.clientY)) render();
      }
    }
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) root.addEventListener(event, endTouch);

    function changeCase() {
      const { values } = selected();
      for (const input of inputs) input.value = values[input.dataset.programValue];
      root.querySelector('[data-program-input]').textContent = Array.isArray(values.data)
        ? `清單：${values.data.join('、') || '空清單'}${values.target === undefined ? '' : `｜目標：${values.target}`}`
        : '';
      invalidate();
    }

    function stopAudio() {
      if (audio) void audio.close().catch(() => {});
      audio = undefined;
    }

    function play(notes) {
      if (!window.AudioContext) {
        feedback.textContent += ' 此瀏覽器無法播放音符，可查看下方索引表。';
        return;
      }
      stopAudio();
      audio = new AudioContext();
      const context = audio;
      const now = context.currentTime;
      notes.forEach((note, index) => {
        const oscillator = audio.createOscillator();
        const volume = audio.createGain();
        const time = now + index * 0.4;
        oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
        volume.gain.setValueAtTime(0.12, time);
        volume.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
        oscillator.connect(volume).connect(audio.destination);
        oscillator.start(time);
        oscillator.stop(time + 0.34);
        if (index === notes.length - 1) oscillator.onended = () => {
          if (audio === context) stopAudio();
        };
      });
    }

    function run() {
      if (!checkVariables()) return;
      if (inputs.some(input => !input.reportValidity())) return;
      const input = currentInput();
      result = execute(task, program, input, declared, branchChoices);
      feedback.textContent = result.error || (result.passed ? '這組測試通過。' : '結果還未達標，請檢查積木與順序。');
      stage.innerHTML = `<p></p>${graph(result)}${result.rows.length ?
        `<div class="block-program__table"><table><thead><tr>${task.columns.map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead>
        <tbody>${result.rows.map(row => `<tr>${row.map(value => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}`;
      stage.querySelector('p').textContent = result.text;
      copy.disabled = !program.length;
      if (program.length) {
        currentReport = [
          selected().name,
          ...inputs.map(field => `${field.labels[0].textContent.trim()}：${field.value}`),
          root.querySelector('[data-program-input]').textContent,
          declared.size ? '已建立的變數：' + [...declared].join('、') : '',
          task.loop ? `前 ${task.loop.before.length} 塊執行一次，後續積木重複 ${task.loop.times} 次。` : '',
          ...program.flatMap((id, index) => {
            const line = `${index + 1}. ${textLabel(task.blocks[id].view[2])}`;
            return id === branch?.id ? [line, ...branchNames.map((name, slot) => {
              const outcome = branch.outcomes[branchChoices[slot]];
              return `   ${name}：${outcome === undefined ? '（空白）' : textLabel(outcomeLabel(outcome))}`;
            })] : [line];
          }),
          summary(result),
          task.columns.join('｜'),
          ...result.rows.map(row => row.join('｜'))
        ].filter(Boolean).join('\n');
        const key = runKey(input);
        const prior = runs.findIndex(entry => entry.key === key);
        if (prior >= 0) runs.splice(prior, 1);
        runs.push({ key, inputKey: JSON.stringify(input), passed: result.passed === true, text: currentReport });
        if (runs.length > 8) runs.shift();
        showRunCount();
        saveDraft();
      }
      if (result.notes?.length) play(result.notes);
      updateToolbar();
    }

    root.addEventListener('click', async event => {
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      const { programAdd, programPick, programOutcome, programBranchSlot } = button.dataset;
      if (programOutcome) {
        picked = null;
        pickedOutcome = pickedOutcome === programOutcome ? null : programOutcome;
        render();
        feedback.textContent = pickedOutcome ? `已選「${branch.outcomes[pickedOutcome]}」，點「那麼」或「否則」的放置位置。` : '已取消選取。';
        if (pickedOutcome && event.detail === 0) script.querySelector('[data-program-branch-slot="0"]')?.focus();
        return;
      }
      if (programBranchSlot !== undefined) {
        const slot = Number(programBranchSlot);
        const placed = branchChoices[slot];
        if (pickedOutcome) {
          if (pickedOutcome === placed) {
            pickedOutcome = null;
            render();
            feedback.textContent = '已取消選取。';
          } else placeOutcome(pickedOutcome, slot);
        } else if (placed) {
          picked = null;
          pickedOutcome = placed;
          render();
          feedback.textContent = '再點另一個分支即可移動或交換積木。';
        } else feedback.textContent = '先從積木區選一塊「分支結果」積木。';
        script.querySelector(`[data-program-branch-slot="${slot}"]`)?.focus({ preventScroll: true });
        return;
      }
      if (programPick !== undefined) {
        pickedOutcome = null;
        const target = Number(programPick);
        if (picked === null) {
          picked = target;
          render();
          feedback.textContent = `已選第 ${target + 1} 塊。再點另一塊即可交換位置；再點同一塊取消。`;
        } else if (picked === target) {
          picked = null;
          render();
          feedback.textContent = '已取消選取。';
        } else {
          const first = picked;
          [program[first], program[target]] = [program[target], program[first]];
          saveEdit(`已交換第 ${first + 1} 塊和第 ${target + 1} 塊。`);
        }
        script.querySelector(`[data-program-pick="${target}"]`)?.focus({ preventScroll: true });
      } else if (programAdd) {
        if (missingVariables(task, [programAdd], declared).length) return;
        program.push(programAdd);
        saveEdit('已加入積木。');
        if (event.detail === 0) {
          (root.querySelector('[data-program-add]:not(:disabled)') || root.querySelector('[data-program-run]')).focus();
        }
      } else if (button.hasAttribute('data-program-run')) run();
      else if (button.hasAttribute('data-program-compare')) showComparison();
      else if (button.hasAttribute('data-program-reset')) {
        program.length = 0;
        branchChoices.fill(null);
        saveEdit('已清空積木。');
      } else if (button === copy) await copyReport(currentReport);
      else if (button === copyAll) await copyReport(allReports());
    });
    root.addEventListener('keydown', event => {
      const { programPick: focused, programBranchSlot: slot } = event.target.dataset;
      const deleting = event.key === 'Delete' || event.key === 'Backspace';
      if (deleting && slot !== undefined) {
        event.preventDefault();
        if (branchChoices[slot]) {
          removeOutcome(slot);
          script.querySelector(`[data-program-branch-slot="${slot}"]`)?.focus({ preventScroll: true });
        }
        return;
      }
      if (deleting && focused !== undefined) {
        event.preventDefault();
        const index = Number(focused);
        const id = program[index];
        removeBlock(index);
        (script.querySelector(`[data-program-pick="${Math.min(index, program.length - 1)}"]`) ||
          root.querySelector(`[data-program-add="${id}"]`)).focus({ preventScroll: true });
        return;
      }
      if (event.key !== 'Escape' || (picked === null && pickedOutcome === null)) return;
      picked = null;
      pickedOutcome = null;
      render();
      if (focused !== undefined) script.querySelector(`[data-program-pick="${focused}"]`)?.focus();
      if (slot !== undefined) script.querySelector(`[data-program-branch-slot="${slot}"]`)?.focus();
      feedback.textContent = '已取消選取。';
    });
    if (variableForm) {
      const field = variableForm.querySelector('[data-program-variable-name]');
      const status = variableForm.querySelector('[data-program-variable-status]');
      const showDeclarations = (message = '') => {
        const names = declared.size ? [...declared].join('、') : '尚未建立';
        status.textContent = (message ? message + ' ' : '') + '已建立的變數：' + names + '。';
      };
      showDeclarations();
      variableForm.addEventListener('submit', event => {
        event.preventDefault();
        const typed = field.value.trim().normalize('NFKC').toUpperCase();
        const name = variableNames.find(candidate => candidate.toUpperCase() === typed);
        if (!name) {
          showDeclarations('請輸入本題積木上的變數名稱。');
        } else if (declared.has(name)) {
          showDeclarations('「' + name + '」已經建立。');
        } else {
          declared.add(name);
          field.value = '';
          invalidate();
          showDeclarations('已新增「' + name + '」。');
          saveDraft();
          render();
        }
        field.focus();
      });
    }
    caseSelect.addEventListener('change', () => { changeCase(); saveDraft(); });
    for (const input of inputs) input.addEventListener('input', () => { invalidate(); saveDraft(); });
    output.addEventListener('copy', () => {
      if (output.selectionStart !== 0 || output.selectionEnd !== output.value.length) return;
      copiedReport = output.value;
      updateToolbar();
    });
    if (Number.isInteger(draft?.caseIndex) && task.cases[draft.caseIndex]) caseSelect.value = String(draft.caseIndex);
    changeCase();
    for (const input of inputs) {
      const value = draft?.fields?.[input.dataset.programValue];
      if (typeof value === 'string' && value.length <= 20) input.value = value;
    }
    render();
    showRunCount();
    updateToolbar();
  }

  window.BlockProgram = { mount, execute, compare, graph };
})();
