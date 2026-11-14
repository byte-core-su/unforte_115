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

  function graph(state) {
    const points = state.points;
    if (!points?.length) return '';
    const [xs, ys] = [0, 1].map(axis => [...points, ...(state.marker ? [state.marker] : [])].map(point => point[axis]));
    const [left, top] = [xs, ys].map(values => Math.min(...values) - 12);
    const [width, height] = [Math.max(...xs) - left + 12, Math.max(...ys) - top + 12];
    const [x, y] = points.at(-1);
    const stroke = state.width ? `stroke-width="${state.width}"` : 'stroke-width="2" vector-effect="non-scaling-stroke"';
    return `<svg viewBox="${left} ${top} ${width} ${height}" role="img" aria-label="程式執行後的移動路徑">
      <polyline fill="none" stroke="#2563eb" ${stroke} points="${points.map(point => point.join(',')).join(' ')}"/>
      <circle cx="${x}" cy="${y}" r="3" fill="#1d4ed8"/>
      ${state.marker ? `<circle cx="${state.marker[0]}" cy="${state.marker[1]}" r="3" fill="#b91c1c"/>` : ''}
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

  function mount(root, task) {
    const program = [];
    let audio;
    let result;
    root.innerHTML = `
      <h3>積木程式模擬器</h3>
      <p>拖曳或點選積木加入程式。可拖曳調整順序，也可用 ↑ ↓ 按鈕。按「比對檢查」可一次檢查所有預設資料。</p>
      <div class="block-program__cases">
        <label>測試資料 <select data-program-case>${task.cases.map(({ name }, index) => `<option value="${index}">${name}</option>`).join('')}</select></label>
        ${task.fields.map(({ key, label, min, max }) => `<label>${label} <input data-program-value="${key}" type="number" min="${min}" max="${max}" required></label>`).join('')}
      </div>
      <p data-program-input></p>
      <div class="block-program__workspace">
        <div><h4>積木區</h4><div class="block-program__palette">${Object.entries(categories).map(([category, name]) => {
          const group = Object.entries(task.blocks).filter(([, block]) => block.view[0] === category);
          return group.length ? `<div class="block-program__category is-${category}"><h5>${name}</h5>
            ${group.map(([id, block]) => `<button type="button" class="block-program__grab" data-program-add="${id}" draggable="true">${blockMarkup(block.view)}</button>`).join('')}</div>` : '';
        }).join('')}</div></div>
        <div><h4>程式區</h4>${task.loop ? `<p>初始化後，後續積木會放在「重複 ${task.loop.times} 次」中。</p>` : ''}
        <ol data-program-script></ol></div>
      </div>
      <div class="block-program__actions">
        <button type="button" data-program-run>執行本組</button>
        <button type="button" data-program-compare>比對檢查</button>
        <button type="button" data-program-reset>清空積木</button>
        <button type="button" data-program-copy disabled>複製程式與結果</button>
      </div>
      <p role="status" data-program-feedback></p>
      <div data-program-comparison></div>
      <div data-program-result></div>`;
    const script = root.querySelector('[data-program-script]');
    const feedback = root.querySelector('[data-program-feedback]');
    const stage = root.querySelector('[data-program-result]');
    const comparison = root.querySelector('[data-program-comparison]');
    const copy = root.querySelector('[data-program-copy]');
    const inputs = [...root.querySelectorAll('[data-program-value]')];
    const caseSelect = root.querySelector('[data-program-case]');
    const selected = () => task.cases[Number(caseSelect.value)];

    function invalidate(message = '') {
      stopAudio();
      result = undefined;
      stage.replaceChildren();
      comparison.replaceChildren();
      feedback.textContent = message;
      copy.disabled = true;
    }

    function render() {
      const rows = program.map((id, index) =>
        `<li data-program-row="${index}" class="block-program__row">
          <span class="block-program__grab" data-program-drag="${index}" draggable="true">${blockMarkup(task.blocks[id].view)}</span>
          <div class="block-program__actions">
            <button type="button" data-program-edit="-1" data-index="${index}" aria-label="上移第 ${index + 1} 塊" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" data-program-edit="1" data-index="${index}" aria-label="下移第 ${index + 1} 塊" ${index === program.length - 1 ? 'disabled' : ''}>↓</button>
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
      const order = sameOrder ? '積木順序與參考程式一致。' :
        allPassed ? '積木順序與參考程式不同，但所有測試都通過。' :
        missing.length ? `請確認是否缺少：${missing.map(id => textLabel(task.blocks[id].view[2])).join('、')}。` :
        '請對照參考程式，檢查積木放置順序。';
      feedback.textContent = allPassed ? '所有測試都通過。' : '有測試未通過，請查看下方結果。';
      comparison.innerHTML = `<p>${escape(order)}</p><ul>${results.map(({ name, result }) =>
        `<li><strong>${escape(name)}｜${result.passed ? '通過' : '再檢查'}</strong>
          ${escape(summary(result))}</li>`).join('')}</ul>
        <details class="lesson-reference"><summary>查看參考積木順序</summary><ol>${task.goal.map(id =>
          `<li>${blockMarkup(task.blocks[id].view)}</li>`).join('')}</ol></details>`;
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
    script.addEventListener('dragover', event => {
      if (!drag) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = drag.id ? 'copy' : 'move';
      clearDrop();
      const position = destination(event);
      const row = script.querySelector(`[data-program-row="${position}"]`);
      if (row) row.setAttribute('data-drop', '');
      else script.classList.add('is-drop-end');
    });
    script.addEventListener('dragleave', event => {
      if (!script.contains(event.relatedTarget)) clearDrop();
    });
    script.addEventListener('drop', event => {
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
      if (result.notes?.length) play(result.notes);
    }

    root.addEventListener('click', async event => {
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      const { programAdd, programEdit, index } = button.dataset;
      if (programAdd) {
        program.push(programAdd);
        invalidate('已加入積木。');
        render();
        (root.querySelector('[data-program-add]:not(:disabled)') || root.querySelector('[data-program-run]')).focus();
      } else if (programEdit !== undefined) {
        const from = Number(index);
        const offset = Number(programEdit);
        const [id] = program.splice(from, 1);
        if (offset) program.splice(from + offset, 0, id);
        invalidate(offset ? '已移動積木。' : '已移除積木。');
        render();
        const row = script.querySelector(`[data-program-row="${Math.min(from + offset, program.length - 1)}"]`);
        (row?.querySelector(`[data-program-edit="${offset}"]:not(:disabled)`) ||
          row?.querySelector('[data-program-edit="0"]') || root.querySelector('[data-program-add]:not(:disabled)')).focus();
      } else if (button.hasAttribute('data-program-run')) run();
      else if (button.hasAttribute('data-program-compare')) showComparison();
      else if (button.hasAttribute('data-program-reset')) {
        program.length = 0;
        invalidate('已清空積木。');
        render();
      } else if (button === copy && result) {
        const evidence = [
          selected().name,
          ...inputs.map(input => `${input.labels[0].textContent.trim()}：${input.value}`),
          root.querySelector('[data-program-input]').textContent,
          task.loop ? `前 ${task.loop.before.length} 塊執行一次，後續積木重複 ${task.loop.times} 次。` : '',
          ...program.map((id, index) => `${index + 1}. ${textLabel(task.blocks[id].view[2])}`),
          summary(result),
          task.columns.join('｜'),
          ...result.rows.map(row => row.join('｜'))
        ].filter(Boolean).join('\n');
        try {
          await navigator.clipboard.writeText(evidence);
          feedback.textContent = '已複製積木順序與本次結果。';
        } catch {
          const output = document.createElement('textarea');
          output.setAttribute('aria-label', '積木順序與結果');
          output.readOnly = true;
          output.value = evidence;
          stage.replaceChildren(output);
          output.select();
          feedback.textContent = '請複製下方的積木順序與結果。';
        }
      }
    });
    caseSelect.addEventListener('change', changeCase);
    for (const input of inputs) input.addEventListener('input', () => invalidate());
    changeCase();
    render();
  }

  window.BlockProgram = { mount, execute, compare };
})();
