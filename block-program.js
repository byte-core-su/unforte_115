(() => {
  'use strict';

  function execute(task, program, input) {
    const state = { input, rows: [], text: '' };
    const run = ids => {
      for (const id of ids) {
        if (state.stopped) break;
        task.blocks[id].run(state);
      }
    };
    try {
      if (!program.length) throw new Error('先加入積木，再執行。');
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

  function compare(task, program) {
    const results = task.cases.map(({ name, values }) => ({ name, result: execute(task, program, values) }));
    const sameOrder = task.goal.length === program.length && task.goal.every((id, index) => id === program[index]);
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
    const palette = Object.entries(task.blocks);
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
    const runs = Array.isArray(draft?.runs) ? draft.runs.filter(entry =>
      typeof entry?.key === 'string' && entry.key.length <= 1000 &&
      typeof entry.text === 'string' && entry.text.length <= 16000).slice(-8) : [];
    let audio;
    let result;
    let currentReport = '';
    root.innerHTML = `
      <h3>積木程式模擬器</h3>
      <p>拖曳或點選積木加入程式。要調整順序：先點一塊，再點另一塊，兩塊就會交換位置（也可以直接拖曳）。按「比對檢查」可一次檢查所有預設資料。</p>
      <div class="block-program__cases">
        <label>測試資料 <select data-program-case>${task.cases.map(({ name }, index) => `<option value="${index}">${name}</option>`).join('')}</select></label>
        ${task.fields.map(({ key, label, min, max }) => `<label>${label} <input data-program-value="${key}" type="number" min="${min}" max="${max}" required></label>`).join('')}
      </div>
      <p data-program-input></p>
      <div class="block-program__workspace">
        <div><h4 data-program-palette-heading tabindex="-1">積木區</h4><button type="button" class="block-program__jump" data-program-jump="work">前往程式區</button><div class="block-program__palette">${Object.entries(categories).map(([category, name]) => {
          const group = palette.filter(([, block]) => block.view[0] === category);
          return group.length ? `<div class="block-program__category is-${category}"><h5>${name}</h5>
            ${group.map(([id, block]) => `<button type="button" class="block-program__grab" data-program-add="${id}" draggable="true">${blockMarkup(block.view)}</button>`).join('')}</div>` : '';
        }).join('')}</div></div>
        <div data-program-work><h4 tabindex="-1">程式區・積木放置區</h4>
        <button type="button" class="block-program__jump" data-program-jump="palette">回到積木區</button>
        ${task.loop ? `<p>初始化後，後續積木會放在「重複 ${task.loop.times} 次」中。</p>` : ''}
        <ol data-program-script></ol></div>
      </div>
      <div class="block-program__actions">
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
    const output = root.querySelector('[data-program-output]');
    const inputs = [...root.querySelectorAll('[data-program-value]')];
    const caseSelect = root.querySelector('[data-program-case]');
    const selected = () => task.cases[Number(caseSelect.value)];

    function saveDraft() {
      onSave?.({
        blocks: program, caseIndex: Number(caseSelect.value), runs,
        fields: Object.fromEntries(inputs.map(input => [input.dataset.programValue, input.value]))
      });
    }

    function showRunCount() {
      copyAll.disabled = runs.length === 0;
      copyAll.textContent = runs.length ? `複製多組試跑紀錄（${runs.length} 筆）` : '複製多組試跑紀錄';
      root.toggleAttribute('data-program-three-runs', new Set(runs.filter(entry =>
        entry.passed === true && typeof entry.inputKey === 'string').map(entry => entry.inputKey)).size >= 3);
    }

    async function copyReport(report) {
      if (!report) return;
      output.hidden = true;
      try {
        await navigator.clipboard.writeText(report);
        feedback.textContent = '已複製。請貼到本課作業。';
      } catch {
        output.value = report;
        output.hidden = false;
        output.select();
        feedback.textContent = '請複製下方紀錄，貼到本課作業。';
      }
    }

    // 點選交換：先點一塊（標示為已選），再點另一塊就互換位置；再點同一塊取消。
    let picked = null;

    function invalidate(message = '') {
      root.removeAttribute('data-program-passed');
      picked = null;
      stopAudio();
      result = undefined;
      currentReport = '';
      output.hidden = true;
      stage.replaceChildren();
      comparison.replaceChildren();
      feedback.textContent = message;
      copy.disabled = true;
    }

    function render() {
      const rows = program.map((id, index) =>
        `<li data-program-row="${index}" class="block-program__row">
          <button type="button" class="block-program__grab block-program__pick${picked === index ? ' is-picked' : ''}" data-program-drag="${index}" data-program-pick="${index}" draggable="true" aria-pressed="${picked === index}" aria-label="第 ${index + 1} 塊：${escape(textLabel(task.blocks[id].view[2]))}。${picked === null ? '點選後，再點另一塊即可交換位置' : picked === index ? '已選取，再點一次取消' : `點這裡與第 ${picked + 1} 塊交換`}">${blockMarkup(task.blocks[id].view)}</button>
          <div class="block-program__actions">
            <button type="button" data-program-edit="0" data-index="${index}" aria-label="移除第 ${index + 1} 塊">移除</button>
          </div></li>`);
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
        button.disabled = program.includes(button.dataset.programAdd);
        button.draggable = !button.disabled;
      }
    }

    function showComparison() {
      if (!program.length) {
        feedback.textContent = '先加入積木，再比對檢查。';
        return;
      }
      const { results, sameOrder, missing } = compare(task, program);
      const allPassed = results.every(({ result }) => result.passed);
      root.toggleAttribute('data-program-passed', allPassed);
      const order = sameOrder ? '積木順序與參考程式一致。' :
        allPassed ? '積木順序與參考程式不同，但所有測試都通過。' :
        missing.length ? `請確認是否缺少：${missing.map(id => textLabel(task.blocks[id].view[2])).join('、')}。` :
        task.shufflePalette ? '看下方哪組資料先出錯，再檢查積木順序。' : '請對照參考程式，檢查積木放置順序。';
      feedback.textContent = allPassed ? '所有測試都通過。' : '有測試未通過，請查看下方結果。';
      const reference = !task.shufflePalette || allPassed ? `<details class="lesson-reference"><summary>查看參考積木順序</summary><ol>${task.goal.map(id =>
        `<li>${blockMarkup(task.blocks[id].view)}</li>`).join('')}</ol></details>` : '';
      comparison.innerHTML = `<p>${escape(order)}</p><ul>${results.map(({ name, result }) =>
        `<li><strong>${escape(name)}｜${result.passed ? '通過' : '再檢查'}</strong>
          ${escape(summary(result))}</li>`).join('')}</ul>${reference}`;
    }

    let drag;
    function clearDrop() {
      script.querySelectorAll('[data-drop]').forEach(row => row.removeAttribute('data-drop'));
      script.classList.remove('is-drop-end');
    }
    function destination(event) {
      const row = event.target.closest('[data-program-row]');
      if (!row) return program.length;
      const rect = row.getBoundingClientRect();
      return Number(row.dataset.programRow) + (event.clientY > rect.top + rect.height / 2 ? 1 : 0);
    }
    root.addEventListener('dragstart', event => {
      const source = event.target.closest('[data-program-add], [data-program-drag]');
      if (!source || source.disabled) return;
      const { programAdd, programDrag } = source.dataset;
      drag = programAdd ? { id: programAdd } : { index: Number(programDrag) };
      event.dataTransfer.effectAllowed = programAdd ? 'copy' : 'move';
      event.dataTransfer.setData('text/plain', programAdd || programDrag);
    });
    work.addEventListener('dragover', event => {
      if (!drag) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = drag.id ? 'copy' : 'move';
      clearDrop();
      const position = destination(event);
      const row = script.querySelector(`[data-program-row="${position}"]`);
      if (row) row.setAttribute('data-drop', '');
      else script.classList.add('is-drop-end');
    });
    work.addEventListener('dragleave', event => {
      if (!work.contains(event.relatedTarget)) clearDrop();
    });
    work.addEventListener('drop', event => {
      if (!drag) return;
      event.preventDefault();
      let position = destination(event);
      if (drag.id) program.splice(position, 0, drag.id);
      else {
        const [id] = program.splice(drag.index, 1);
        if (drag.index < position) position--;
        program.splice(position, 0, id);
      }
      invalidate(drag.id ? '已加入積木。' : '已移動積木。');
      saveDraft();
      drag = undefined;
      clearDrop();
      render();
    });
    root.addEventListener('dragend', () => { drag = undefined; clearDrop(); });

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
      if (inputs.some(input => !input.reportValidity())) return;
      const input = { ...selected().values };
      for (const field of inputs) input[field.dataset.programValue] = field.valueAsNumber;
      result = execute(task, program, input);
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
          task.loop ? `前 ${task.loop.before.length} 塊執行一次，後續積木重複 ${task.loop.times} 次。` : '',
          ...program.map((id, index) => `${index + 1}. ${textLabel(task.blocks[id].view[2])}`),
          summary(result),
          task.columns.join('｜'),
          ...result.rows.map(row => row.join('｜'))
        ].filter(Boolean).join('\n');
        const key = JSON.stringify([program, input]);
        const prior = runs.findIndex(entry => entry.key === key);
        if (prior >= 0) runs.splice(prior, 1);
        runs.push({ key, inputKey: JSON.stringify(input), passed: result.passed === true, text: currentReport });
        if (runs.length > 8) runs.shift();
        showRunCount();
        saveDraft();
      }
      if (result.notes?.length) play(result.notes);
    }

    root.addEventListener('click', async event => {
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      const { programAdd, programEdit, programPick, index } = button.dataset;
      if (programPick !== undefined) {
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
          invalidate(`已交換第 ${first + 1} 塊和第 ${target + 1} 塊。`);
          saveDraft();
          render();
        }
        script.querySelector(`[data-program-pick="${target}"]`)?.focus({ preventScroll: true });
      } else if (programAdd) {
        program.push(programAdd);
        invalidate('已加入積木。');
        saveDraft();
        render();
        if (event.detail === 0) {
          (root.querySelector('[data-program-add]:not(:disabled)') || root.querySelector('[data-program-run]')).focus();
        }
      } else if (programEdit !== undefined) {
        const from = Number(index);
        program.splice(from, 1);
        invalidate('已移除積木。');
        saveDraft();
        render();
        const row = script.querySelector(`[data-program-row="${Math.min(from, program.length - 1)}"]`);
        (row?.querySelector('[data-program-edit]') || root.querySelector('[data-program-add]:not(:disabled)')).focus();
      } else if (button.hasAttribute('data-program-run')) run();
      else if (button.hasAttribute('data-program-compare')) showComparison();
      else if (button.hasAttribute('data-program-reset')) {
        program.length = 0;
        invalidate('已清空積木。');
        saveDraft();
        render();
      } else if (button === copy) await copyReport(currentReport);
      else if (button === copyAll) await copyReport(runs.map(({ text }, index) => `試跑 ${index + 1}\n${text}`).join('\n\n'));
    });
    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || picked === null) return;
      const focused = event.target.dataset.programPick;
      picked = null;
      render();
      if (focused !== undefined) script.querySelector(`[data-program-pick="${focused}"]`)?.focus();
      feedback.textContent = '已取消選取。';
    });
    caseSelect.addEventListener('change', () => { changeCase(); saveDraft(); });
    for (const input of inputs) input.addEventListener('input', () => { invalidate(); saveDraft(); });
    if (Number.isInteger(draft?.caseIndex) && task.cases[draft.caseIndex]) caseSelect.value = String(draft.caseIndex);
    changeCase();
    for (const input of inputs) {
      const value = draft?.fields?.[input.dataset.programValue];
      if (typeof value === 'string' && value.length <= 20) input.value = value;
    }
    render();
    showRunCount();
  }

  window.BlockProgram = { mount, execute, compare, graph };
})();
