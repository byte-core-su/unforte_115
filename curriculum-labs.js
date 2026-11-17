(() => {
  const { active, escapeHtml, inventorySearchPool } = window.CourseScenarios;
  const { defense, duel } = active;
  const page = window.location.pathname.split('/').pop();
  const main = document.querySelector('main');
  if (!main) return;

  const labs = {
    '1150701.html': {
      title: '資訊使用情境判斷',
      intro: '想一想，使用積木程式和網路素材時，怎麼保護個資與帳號，並確認素材能不能使用？',
      html: `<div class="curriculum-lab__questions" data-quiz="g7-safety"></div>`
    },
    '1150706.html': {
      title: escapeHtml(defense.labTitle),
      intro: `使用匿名範例資料，先搜尋指定測試、比較${escapeHtml(defense.labResult)}，再計算平均資源消耗；將結論用於改良${escapeHtml(defense.project)}。`,
      html: `<div class="curriculum-lab__controls"><label>搜尋測試編號 <select id="g7-data-query"></select></label><label>先預測有效且最省資源的編號 <select id="g7-data-prediction"><option value="">先選答案</option><option>A</option><option>B</option><option>C</option><option>D</option></select></label><button type="button" id="g7-data-run">核對預測並分析</button><button type="button" id="g7-data-new" class="curriculum-lab__secondary">再產生一題</button><button type="button" id="g7-data-demo" class="curriculum-lab__secondary">固定示範</button></div><div id="g7-data-result" class="curriculum-lab__result" aria-live="polite"></div><p class="curriculum-lab__task">積木程式測試提示：在自己的作品試不同的邊數、圖形數量和筆跡寬度。把參數及是否${escapeHtml(defense.outcome)}的結果填進本課紀錄表，再比較通過測試的組合。</p>`
    },
    '1150801.html': {
      title: '循序搜尋：逐項檢查清單',
      intro: '看完示範後，先預測比對範圍，再接手一個還沒查完的搜尋。',
      html: `
        <h3 id="g8-search-title" tabindex="-1"></h3>
        <p id="g8-search-prompt"></p>
        <div class="curriculum-lab__result">
          <ol id="g8-search-trace" aria-label="清單與已比對項目"></ol>
          <p id="g8-search-state" role="status"></p>
        </div>
        <div class="curriculum-lab__controls">
          <label id="g8-search-prediction-label" hidden>從第 1 項比到第幾項？
            <select id="g8-search-prediction"></select>
          </label>
          <label id="g8-search-reason-label" hidden>為什麼可以回報找不到？
            <select id="g8-search-reason">
              <option value="">先選理由</option>
              <option value="some">已經比到不符合的項目</option>
              <option value="all">每一項都比過，而且都不符合</option>
              <option value="last">比到最後一項，結果一定是找不到</option>
            </select>
          </label>
          <button type="button" id="g8-search-step">檢查下一項</button>
          <button type="button" id="g8-search-stop" class="curriculum-lab__secondary" hidden>停止，回報找不到</button>
          <button type="button" id="g8-search-reset" class="curriculum-lab__secondary" hidden>重新預測</button>
          <button type="button" id="g8-search-advance" hidden></button>
        </div>`
    },
    '1150802.html': {
      title: '音訊與作品使用判斷',
      intro: '先判斷錄音和旋律能不能使用或分享。錄音比對會在你的瀏覽器中完成。',
      html: `<div class="curriculum-lab__questions" data-quiz="g8-ethics"></div>`
    },
    '1150805.html': {
      title: '排序與洗牌比較',
      intro: '洗牌讓順序隨機；排序依明確規則排列。逐步比較相鄰數值，必要時交換，觀察每一輪如何改變清單。',
      html: `<div class="curriculum-lab__controls"><label>先預測第一次比較 <select id="g8-sort-prediction"><option value="">先選答案</option><option value="swap">會交換</option><option value="keep">不交換</option></select></label><button type="button" id="g8-sort-reset">同題重試</button><button type="button" id="g8-sort-step">執行下一次比較</button><button type="button" id="g8-sort-new" class="curriculum-lab__secondary">再產生一題</button><button type="button" id="g8-sort-demo" class="curriculum-lab__secondary">固定示範</button></div><div id="g8-sort-state" class="curriculum-lab__result" aria-live="polite"></div><p class="curriculum-lab__task">積木程式任務：將四至六張打亂的數字牌由小到大排序；標出每次比較與交換，確認輸出數量與項目和輸入相同。換一組數字後，仍要能解釋交換規則。</p>`
    },
    '1150806.html': {
      title: `用自訂積木分工完成${escapeHtml(duel.activity)}`,
      intro: '把一大段程式拆成具名的自訂積木。先決定呼叫順序，再到 積木程式建立並測試各段功能。',
      html: `<div class="curriculum-lab__controls" id="g8-module-options"></div><div id="g8-module-state" class="curriculum-lab__result" aria-live="polite"></div><button type="button" id="g8-module-reset" class="curriculum-lab__secondary">重排呼叫順序</button><p class="curriculum-lab__task">積木程式實作提示：建立${duel.modules.map(name => `「${escapeHtml(name)}」`).join('')}四個自訂積木，分別測試。改變${escapeHtml(duel.item)}數量，看看裝備不足時程式怎麼處理。</p>`
    }
  };

  const lab = labs[page];
  if (!lab) return;
  const section = document.createElement('section');
  section.id = 'curriculum-lab';
  section.className = 'curriculum-lab';
  section.setAttribute('aria-labelledby', 'curriculum-lab-title');
  section.innerHTML = `<div class="curriculum-lab__card"><h2 id="curriculum-lab-title">${lab.title}</h2><p>${lab.intro}</p>${lab.html}</div>`;
  // Dynamic lessons replace app-container contents; keep the lab outside that render root.
  if (main.id === 'app-container') main.insertAdjacentElement('afterend', section);
  else main.appendChild(section);

  const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const shuffle = items => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const safety = [
    ['準備分享 積木程式時，哪種做法較合適？', ['在作品說明寫出全班真實姓名', '用角色代號，分享前檢查個資', '公開同學的帳號密碼'], 1, '公開作品不應包含可辨識同學的個人資料。'],
    ['想使用網路上的圖片或音樂，應先做什麼？', ['確認授權並標示來源或改用可使用素材', '只要能下載就直接使用', '刪掉作者名稱再上傳'], 0, '素材的合理使用與授權需要先確認。'],
    ['收到要求輸入 積木程式密碼的陌生連結，應如何處理？', ['立即輸入，避免帳號失效', '轉傳全班', '不要輸入，向教師確認並使用官方網站'], 2, '不明連結可能是釣魚頁面；不要洩露密碼。']
  ];
  const ethics = [
    ['要用錄音做旋律比對，哪一種資料最適合？', ['包含其他同學談話的錄音', '自己錄製且不含他人個資的短音檔', '未經同意的班級錄影'], 1, '採用自己的短錄音，避免收進他人聲音與個資。'],
    ['打算公開分享改編旋律時，應如何處理來源？', ['先確認授權及可使用範圍', '只要標題不同就不用理會授權', '由系統自動比對就代表可以公開'], 0, '比對功能不會授予作品或錄音的使用權。']
  ];
  const quizRoot = section.querySelector('[data-quiz]');
  if (quizRoot) {
    const questions = quizRoot.dataset.quiz === 'g7-safety' ? safety : ethics;
    quizRoot.innerHTML = questions.map(([question, options], index) => `<fieldset><legend>${index + 1}. ${question}</legend>${options.map((option, choice) => `<label><input type="radio" name="lab-q-${index}" value="${choice}"> ${option}</label>`).join('')}<output aria-live="polite"></output></fieldset>`).join('') + '<button type="button">${window.LessonLabels.checkJudgment}</button>';
    quizRoot.querySelector('button').addEventListener('click', () => {
      const answers = questions.map(([, , answer, explanation], index) => {
        const fieldset = quizRoot.querySelectorAll('fieldset')[index];
        const selected = fieldset.querySelector('input:checked');
        const output = fieldset.querySelector('output');
        const correct = selected && Number(selected.value) === answer;
        output.textContent = !selected ? '請先選擇。' : `${correct ? '正確。' : '再想想。'}${explanation}`;
        return correct;
      });
      if (answers.every(Boolean)) section.setAttribute('data-lesson-activity', '');
    });
  }

  if (page === '1150706.html') {
    const demoRecords = [
      { id: 'A', count: 4, width: 1, blocked: false },
      { id: 'B', count: 6, width: 3, blocked: true },
      { id: 'C', count: 8, width: 5, blocked: true },
      { id: 'D', count: 5, width: 4, blocked: true }
    ];
    let records = [];
    let threshold = 15;
    let mode = '練習題';
    let previous = '';
    let searched = false;
    const result = section.querySelector('#g7-data-result');
    const query = section.querySelector('#g7-data-query');
    const prediction = section.querySelector('#g7-data-prediction');
    query.innerHTML = '<option value="all">全部</option>' + demoRecords.map(item => `<option value="${item.id}">${item.id}</option>`).join('');
    const signature = () => `${threshold}:${records.map(item => `${item.count}-${item.width}`).join(',')}`;
    const newCase = () => {
      let attempts = 0;
      do {
        threshold = randomInt(12, 22);
        const pairs = shuffle([
          [randomInt(2, 4), randomInt(1, 2)], // 明確未通過
          [randomInt(7, 10), randomInt(4, 5)], // 明確通過
          [randomInt(3, 9), randomInt(1, 5)],
          [randomInt(3, 9), randomInt(1, 5)]
        ]);
        records = pairs.map(([count, width], index) => ({ id: demoRecords[index].id, count, width, blocked: count * width >= threshold }));
      } while (signature() === previous && ++attempts < 12);
      if (signature() === previous) threshold = threshold === 22 ? 12 : threshold + 1;
      records.forEach(item => { item.blocked = item.count * item.width >= threshold; });
      previous = signature();
      mode = '練習題';
      query.value = 'all';
      prediction.value = '';
      run(false);
    };
    const run = (reveal = true) => {
      const chosen = query.value;
      if (reveal && chosen !== 'all') searched = true;
      if (reveal && searched && chosen === 'all' && prediction.value) section.setAttribute('data-lesson-activity', '');
      const rows = records.filter(item => chosen === 'all' || item.id === chosen);
      const average = rows.reduce((total, item) => total + item.count * item.width, 0) / rows.length;
      const valid = rows.filter(item => item.blocked).sort((a, b) => a.count * a.width - b.count * b.width);
      const bestCost = Math.min(...records.filter(item => item.blocked).map(item => item.count * item.width));
      const predicted = records.find(item => item.id === prediction.value);
      const feedback = chosen !== 'all' ? '先選「全部」，才能比較哪筆最省資源。' : !prediction.value ? '下次先選預測，再核對結果。' : predicted?.blocked && predicted.count * predicted.width === bestCost ? '預測符合條件；請說明為何其他通過測試的組合消耗更多。' : '預測不同；先排除未通過門檻的組合，再比較其餘的消耗量，重抽新題驗證。';
      result.innerHTML = `<p>${mode}；本題${escapeHtml(defense.labThreshold)}為 ${threshold}，圖形數 × 筆跡寬度達到門檻才算${escapeHtml(defense.outcome)}。</p><table><caption>測試資料（消耗量＝圖形數 × 筆跡寬度）</caption><thead><tr><th>編號</th><th>圖形數</th><th>寬度</th><th>${escapeHtml(defense.outcome)}</th><th>消耗量</th></tr></thead><tbody>${rows.map(item => `<tr><td>${item.id}</td><td>${item.count}</td><td>${item.width}</td><td>${item.blocked ? '是' : '否'}</td><td>${reveal ? item.count * item.width : '？'}</td></tr>`).join('')}</tbody></table><p>${reveal ? `共 ${rows.length} 筆；平均消耗量 ${average.toFixed(1)}。${valid.length ? `目前結果中有效且最省資源的是 ${valid[0].id}（消耗量 ${valid[0].count * valid[0].width}）。` : '目前結果中沒有通過測試的組合。'} ${feedback}` : '先算出各筆消耗量，預測通過測試且最省資源的組合，再按「核對預測並分析」。'}</p>`;
    };
    section.querySelector('#g7-data-run').addEventListener('click', () => run());
    section.querySelector('#g7-data-new').addEventListener('click', newCase);
    section.querySelector('#g7-data-demo').addEventListener('click', () => {
      records = demoRecords.map(item => ({ ...item }));
      threshold = 15;
      mode = '固定示範';
      query.value = 'all';
      prediction.value = '';
      run(false);
    });
    newCase();
  }

  if (page === '1150801.html') {
    const pool = inventorySearchPool(active);
    const found = shuffle(pool).slice(0, randomInt(4, 6));
    const missing = shuffle(pool).slice(0, 5);
    const cases = [
      { title: '示範：找到就停止', list: pool.slice(0, 4), target: pool[1], checked: 0 },
      { title: '第 1 題：預測比對範圍', list: found, target: found[randomInt(2, found.length - 1)], checked: 0 },
      { title: '第 2 題：接手搜尋到最後', list: missing, target: pool.find(item => !missing.includes(item)), checked: 2 }
    ];
    const title = section.querySelector('#g8-search-title');
    const prompt = section.querySelector('#g8-search-prompt');
    const trace = section.querySelector('#g8-search-trace');
    const state = section.querySelector('#g8-search-state');
    const prediction = section.querySelector('#g8-search-prediction');
    const predictionLabel = section.querySelector('#g8-search-prediction-label');
    const reason = section.querySelector('#g8-search-reason');
    const reasonLabel = section.querySelector('#g8-search-reason-label');
    const step = section.querySelector('#g8-search-step');
    const stop = section.querySelector('#g8-search-stop');
    const retry = section.querySelector('#g8-search-reset');
    const advance = section.querySelector('#g8-search-advance');
    let stage = 0;
    let checked = 0;
    let passed = false;
    const current = () => cases[stage];

    function showTrace() {
      const { list, target } = current();
      trace.innerHTML = list.map((item, index) => {
        const checkedItem = index < checked;
        const result = checkedItem ? (item === target ? '符合' : '不符') : '未比對';
        return `<li${checkedItem ? ' data-compared' : ''}><span>第 ${index + 1} 項</span> ${escapeHtml(item)} <small>${result}</small></li>`;
      }).join('');
    }

    function begin() {
      const lessonCase = current();
      checked = lessonCase.checked;
      passed = false;
      title.textContent = lessonCase.title;
      const task = ['按「檢查下一項」，看搜尋停在哪裡。', '先選比對範圍，再逐項核對。', '隊員只比過前兩項就回報找不到。請接手，決定何時才能停止。'][stage];
      prompt.textContent = `尋找「${lessonCase.target}」。${task}`;
      predictionLabel.hidden = stage !== 1;
      prediction.innerHTML = '<option value="">先選答案</option>' + lessonCase.list.map((_, index) =>
        `<option value="${index + 1}">第 ${index + 1} 項</option>`).join('');
      prediction.value = '';
      prediction.disabled = false;
      reasonLabel.hidden = true;
      step.hidden = false;
      step.disabled = false;
      stop.hidden = stage !== 2;
      stop.disabled = false;
      retry.hidden = true;
      advance.hidden = true;
      advance.textContent = stage === 0 ? '開始第 1 題' : '進入第 2 題';
      state.textContent = stage === 2 ? '前兩項已比過，都不符合。' : '從第 1 項開始比對。';
      showTrace();
    }

    step.addEventListener('click', () => {
      const { list, target } = current();
      if (passed || checked >= list.length) return;
      if (stage === 1 && !prediction.value) {
        state.textContent = '請先選預測會比到第幾項。';
        prediction.focus();
        return;
      }
      prediction.disabled = true;
      const item = list[checked++];
      showTrace();
      if (item === target) {
        passed = stage === 0 || Number(prediction.value) === checked;
        state.textContent = `第 ${checked} 項符合，搜尋停止。${stage === 1 ? (passed ? '預測正確。' : '實際停下的位置和預測不同。看完比對紀錄後，再試一次。') : '後面的項目不用再比。'}`;
        step.disabled = true;
        advance.hidden = !passed;
        retry.hidden = passed;
        (passed ? advance : retry).focus();
        return;
      }
      const atEnd = checked === list.length;
      state.textContent = `第 ${checked} 項不符。${atEnd ? '清單已比完，請回報結果。' : `還有 ${list.length - checked} 項未比對。`}`;
      if (atEnd) {
        step.disabled = true;
        reasonLabel.hidden = false;
        reason.focus();
      }
    });
    stop.addEventListener('click', () => {
      if (stage !== 2 || passed) return;
      if (checked < current().list.length) {
        state.textContent = `還沒比完。第 ${checked + 1} 項還沒檢查，現在不能回報找不到。`;
        return;
      }
      if (reason.value !== 'all') {
        state.textContent = reason.value
          ? '再對照紀錄：如果最後一項剛好符合，就要回報找到。請選出這次回報找不到的理由。'
          : '請先選出回報找不到的理由。';
        reason.focus();
        return;
      }
      passed = true;
      stop.disabled = true;
      reason.disabled = true;
      state.textContent = `已檢查全部 ${checked} 項，沒有符合的項目。回報正確，兩題都通過了。`;
      section.setAttribute('data-lesson-activity', '');
    });
    retry.addEventListener('click', () => {
      begin();
      prediction.focus();
    });
    advance.addEventListener('click', () => {
      if (!passed || stage === 2) return;
      stage++;
      begin();
      title.focus();
    });
    begin();
  }

  if (page === '1150805.html') {
    let values;
    let initialValues;
    let pass;
    let index;
    let comparisons;
    let mode = '練習題';
    let previous = '';
    const state = section.querySelector('#g8-sort-state');
    const prediction = section.querySelector('#g8-sort-prediction');
    const show = message => { state.textContent = `${mode}；清單：[${values.join('、')}]；比較 ${comparisons} 次。${message}`; };
    const reset = () => { values = [...initialValues]; pass = 0; index = 0; comparisons = 0; show('預測第一次要比較哪兩項。'); };
    const setCase = (items, label) => { initialValues = [...items]; mode = label; prediction.value = ''; reset(); };
    section.querySelector('#g8-sort-reset').addEventListener('click', reset);
    section.querySelector('#g8-sort-step').addEventListener('click', () => {
      if (pass >= values.length - 1) return;
      if (comparisons === 0 && !prediction.value) { show('請先選第一次比較是否交換。'); return; }
      const left = values[index];
      const right = values[index + 1];
      const swapped = left > right;
      const firstFeedback = comparisons === 0 ? prediction.value === (swapped ? 'swap' : 'keep') ? '第一次預測正確；請說明比較規則。' : '第一次預測不同；由小到大排序時，左邊比右邊大才交換。' : '';
      if (swapped) [values[index], values[index + 1]] = [right, left];
      comparisons++;
      index++;
      if (index >= values.length - pass - 1) { index = 0; pass++; }
      if (pass >= values.length - 1) section.setAttribute('data-lesson-activity', '');
      show(`比較 ${left} 與 ${right}：${swapped ? '交換' : '不交換'}。${firstFeedback}${pass >= values.length - 1 ? '排序完成。' : `目前完成 ${pass} 輪。`}`);
    });
    section.querySelector('#g8-sort-new').addEventListener('click', () => {
      let items;
      let attempts = 0;
      do {
        items = Array.from({ length: randomInt(4, 6) }, () => randomInt(1, 19));
      } while ((items.join(',') === previous || items.every((value, index) => index === 0 || items[index - 1] <= value)) && ++attempts < 12);
      if (items.join(',') === previous || items.every((value, index) => index === 0 || items[index - 1] <= value)) {
        items = previous === '7,3,5,1,9' ? [8, 2, 6, 1, 4] : [7, 3, 5, 1, 9];
      }
      previous = items.join(',');
      setCase(items, '練習題');
    });
    section.querySelector('#g8-sort-demo').addEventListener('click', () => setCase([7, 3, 5, 1], '固定示範'));
    section.querySelector('#g8-sort-new').click();
  }

  if (page === '1150806.html') {
    const order = duel.modules;
    const chosen = [];
    const options = section.querySelector('#g8-module-options');
    const state = section.querySelector('#g8-module-state');
    const choices = shuffle(order);
    if (choices.every((name, index) => name === order[index])) choices.push(choices.shift());
    options.innerHTML = choices.map(name => `<button type="button" data-module="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join('');
    const show = () => { state.textContent = `主程式：綠旗 → ${chosen.join(' → ') || '請依序選擇自訂積木'}。${chosen.length === order.length ? (chosen.every((name, index) => name === order[index]) ? '順序正確，接著在積木程式模擬器製作與測試各積木。' : `順序不合理：分配前要先建立並洗牌，${duel.activity}前要先分配。`) : ''}`; };
    options.addEventListener('click', event => {
      const name = event.target.dataset.module;
      if (!name || chosen.includes(name)) return;
      chosen.push(name);
      event.target.disabled = true;
      if (chosen.length === order.length && chosen.every((item, index) => item === order[index])) section.setAttribute('data-lesson-activity', '');
      show();
    });
    section.querySelector('#g8-module-reset').addEventListener('click', () => { chosen.length = 0; options.querySelectorAll('button').forEach(button => { button.disabled = false; }); show(); });
    show();
  }
})();
