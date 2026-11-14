(() => {
  'use strict';

  const blocks = {
    reset: { label: '將總能源設為 0', color: 'variable', run: state => { state.total = 0; } },
    sum: {
      label: '依清單長度重複：把目前項目加進總能源',
      color: 'loop',
      run(state) {
        state.data.forEach((value, index) => {
          state.total += value;
          state.trace.push([index + 1, value, state.total]);
        });
      }
    },
    guard: {
      label: '如果清單是空的：說「沒有資料，無法計算平均」，然後停止',
      color: 'loop',
      run: state => { if (!state.data.length) state.stopped = true; }
    },
    average: {
      label: '說出總能源 ÷ 清單長度',
      color: 'output',
      run: state => { state.average = state.total / state.data.length; }
    },
    first: {
      label: '把清單的第 1 項加進總能源',
      color: 'variable',
      run: state => { state.total += state.data[0] ?? 0; }
    }
  };
  const examples = [
    { name: '多筆資料', data: [120, 80, 150], total: 350, average: 350 / 3 },
    { name: '只有一筆', data: [80], total: 80, average: 80 },
    { name: '空清單', data: [], total: 0, average: null }
  ];

  function execute(program, example) {
    const state = { data: example.data, total: 0, average: null, stopped: false, trace: [] };
    for (const id of program) {
      blocks[id].run(state);
      if (state.stopped) break;
    }
    const passed = program.includes('reset') && state.total === example.total && state.average === example.average &&
      state.stopped === !example.data.length && state.trace.length === example.data.length;
    return { ...state, passed };
  }

  function mount(root) {
    const program = [];
    let results = [];
    const palette = root.querySelector('[data-stat-palette]');
    const script = root.querySelector('[data-stat-script]');
    const feedback = root.querySelector('[data-stat-feedback]');
    const stage = root.querySelector('[data-stat-stage]');
    const input = root.querySelector('[data-stat-case]');

    palette.innerHTML = Object.entries(blocks).map(([id, block]) =>
      `<button type="button" class="statistics-block is-${block.color}" data-stat-add="${id}">＋ ${block.label}</button>`
    ).join('');
    input.innerHTML = examples.map(({ name, data }, index) =>
      `<option value="${index}">${name}${data.length ? '（' + data.join('、') + '）' : ''}</option>`
    ).join('');

    function renderProgram() {
      script.innerHTML = program.length ? program.map((id, index) =>
        `<li><span class="statistics-block is-${blocks[id].color}">${blocks[id].label}</span>
          <div class="statistics-move">
            <button type="button" data-stat-edit="up" data-index="${index}" aria-label="上移第 ${index + 1} 塊" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" data-stat-edit="down" data-index="${index}" aria-label="下移第 ${index + 1} 塊" ${index === program.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" data-stat-edit="remove" data-index="${index}" aria-label="移除第 ${index + 1} 塊">移除</button>
          </div></li>`
      ).join('') : '<li>從積木區加入第一塊。</li>';
      palette.querySelectorAll('button').forEach(button => {
        button.disabled = program.includes(button.dataset.statAdd);
      });
    }

    function renderStage() {
      const example = examples[Number(input.value)];
      const result = results[Number(input.value)];
      const data = example.data.join('、') || '空清單';
      if (!result) {
        stage.innerHTML = `<p>艙房能源：${data}</p>`;
        return;
      }
      const output = result.average !== null && !Number.isFinite(result.average) ? '平均無法計算（除以 0）' :
        result.stopped ? '沒有資料，無法計算平均' :
        result.average === null ? '程式沒有算出平均' :
        `平均能源：${Number(result.average.toFixed(2))}`;
      stage.innerHTML = `<p>艙房能源：${data}｜總能源：${result.total}</p>
        <p><strong>${output}</strong>｜${result.passed ? '通過' : '再檢查'}</p>
        ${result.trace.length ? `<table><thead><tr><th scope="col">項次</th><th scope="col">讀到的值</th><th scope="col">累計總和</th></tr></thead>
          <tbody>${result.trace.map(row => `<tr>${row.map(value => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}`;
    }

    function editProgram(message) {
      results = [];
      renderProgram();
      renderStage();
      feedback.textContent = message;
    }

    root.addEventListener('click', event => {
      const add = event.target.closest('[data-stat-add]');
      if (add && !add.disabled) {
        program.push(add.dataset.statAdd);
        editProgram('已加入積木。');
        (palette.querySelector('button:not([disabled])') || root.querySelector('[data-stat-run]')).focus();
        return;
      }
      const edit = event.target.closest('[data-stat-edit]');
      if (edit && !edit.disabled) {
        const index = Number(edit.dataset.index);
        const action = edit.dataset.statEdit;
        let destination = index;
        if (action === 'remove') program.splice(index, 1);
        else {
          destination += action === 'up' ? -1 : 1;
          [program[index], program[destination]] = [program[destination], program[index]];
        }
        editProgram(action === 'remove' ? '已移除積木。' : '已移動積木。');
        const controls = script.children[Math.min(destination, program.length - 1)];
        (controls?.querySelector(`[data-stat-edit="${action}"]:not([disabled])`) ||
          controls?.querySelector('[data-stat-edit="remove"]') || palette.querySelector('button:not([disabled])'))?.focus();
        return;
      }
      if (event.target.closest('[data-stat-reset]')) {
        program.length = 0;
        editProgram('已清空程式。');
        return;
      }
      if (event.target.closest('[data-stat-run]')) {
        if (!program.length) {
          feedback.textContent = '先從積木區加入積木。';
          return;
        }
        results = examples.map(example => execute(program, example));
        renderStage();
        const failures = examples.filter((_, index) => !results[index].passed).map(example => example.name);
        feedback.textContent = !program.includes('reset') ? '每次執行都要先把總能源設為 0，才能換資料重算。' :
          failures.length ? `再檢查：${failures.join('、')}。可切換資料看執行結果。` :
          '三組資料都通過。切換資料可查看各組的執行結果。';
      }
    });
    input.addEventListener('change', renderStage);
    renderProgram();
    renderStage();
  }

  window.mountScratchStatistics = mount;
})();
