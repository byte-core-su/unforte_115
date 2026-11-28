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
      title: '洗牌前後有哪些牌？',
      intro: '洗牌會打亂順序。每種牌的張數都應和原來一樣。',
      html: `
        <div id="g8-shuffle-task">
        <details class="lesson-reference" open>
          <summary>示範：從牌堆移走一張牌</summary>
          <div class="curriculum-lab__result">
            <p>操作前：牌堆 ［1、2、3、3］，洗牌清單是空的。</p>
            <p>抽到第 3 項。把這張 3 加到洗牌清單，再從牌堆刪掉第 3 項。</p>
            <p>操作後：牌堆 ［1、2、3］，洗牌清單 ［3］。原牌堆空了就停止。</p>
          </div>
        </details>
        <h3>找出正確的洗牌結果</h3>
        <p id="g8-shuffle-prompt"></p>
        <div class="curriculum-lab__controls">
          <label>洗牌結果 <select id="g8-shuffle-choice">
            <option value="">請選一個結果</option>
          </select></label>
          <button type="button" id="g8-shuffle-check">檢查牌數</button>
        </div>
        <p id="g8-shuffle-state" class="curriculum-lab__result" role="status"></p>
        </div>`,
      sortingHtml: `
          <h2 id="g8-sort-title">比較相鄰兩項</h2>
          <p id="g8-sort-state" class="curriculum-lab__result" role="status"></p>
          <div id="g8-sort-actions">
            <div class="curriculum-lab__controls">
              <button type="button" id="g8-sort-swap">交換</button>
              <button type="button" id="g8-sort-keep">不交換</button>
            </div>
          </div>
          <div id="g8-sort-stop-task" hidden>
            <div id="g8-sort-trace" class="curriculum-lab__result"></div>
            <div class="curriculum-lab__controls">
              <label>哪個情況可以提早停止？ <select id="g8-sort-stop">
                <option value="">請選停止條件</option>
              </select></label>
              <button type="button" id="g8-sort-check">檢查停止條件</button>
            </div>
          </div>
          <div id="g8-sort-evidence" class="curriculum-lab__result" hidden>
            <button type="button" id="g8-sort-copy">複製洗牌與排序紀錄</button>
            <p id="g8-sort-copy-status" role="status"></p>
            <textarea id="g8-sort-report" aria-label="洗牌與排序紀錄" rows="3" readonly hidden></textarea>
          </div>`
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

  const optionsHtml = choices => shuffle(choices).map(([value, label]) =>
    `<option value="${value}">${label}</option>`).join('');

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
    let questionIndex = 0;
    function showQuestion() {
      const [question, options, answer, explanation] = questions[questionIndex];
      const choices = shuffle(options.map((label, value) => ({ label, value })));
      quizRoot.innerHTML = `<fieldset>
        <legend>${questionIndex + 1} / ${questions.length}　${question}</legend>
        ${choices.map(({ label, value }) => `<label><input type="radio" name="lab-q-${questionIndex}" value="${value}"> ${label}</label>`).join('')}
      </fieldset>
      <div class="curriculum-lab__controls">
        <button type="button" data-quiz-check>${window.LessonLabels.checkJudgment}</button>
        <button type="button" data-quiz-next hidden>下一題</button>
      </div>
      <p class="curriculum-lab__result" role="status"></p>`;
      const fieldset = quizRoot.querySelector('fieldset');
      const check = quizRoot.querySelector('[data-quiz-check]');
      const next = quizRoot.querySelector('[data-quiz-next]');
      const result = quizRoot.querySelector('[role="status"]');
      check.addEventListener('click', () => {
        const selected = fieldset.querySelector('input:checked');
        const correct = selected && Number(selected.value) === answer;
        result.textContent = !selected ? '請先選擇。' : `${correct ? '正確。' : '再想想。'}${explanation}`;
        if (!correct) return;
        fieldset.disabled = check.disabled = true;
        if (questionIndex + 1 === questions.length) {
          section.setAttribute('data-lesson-activity', '');
          return;
        }
        next.hidden = false;
      });
      next.addEventListener('click', () => {
        questionIndex++;
        showQuestion();
        quizRoot.querySelector('input').focus();
      });
    }
    showQuestion();
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
    let checked = false;
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
      resetCase();
    };
    const resetCase = (reveal = false) => {
      searched = false;
      checked = false;
      query.value = 'all';
      prediction.value = '';
      prediction.disabled = false;
      section.removeAttribute('data-lesson-activity');
      run(reveal);
    };
    const run = (reveal = true) => {
      const chosen = query.value;
      const all = chosen === 'all';
      const demo = mode === '固定示範';
      const rows = records.filter(item => chosen === 'all' || item.id === chosen);
      if (reveal && !all && rows.length) searched = true;
      const cost = item => item.count * item.width;
      const average = rows.reduce((total, item) => total + cost(item), 0) / rows.length;
      const bestCost = Math.min(...rows.filter(item => item.blocked).map(cost));
      const best = rows.filter(item => item.blocked && cost(item) === bestCost);
      const predicted = records.find(item => item.id === prediction.value);
      const correct = best.includes(predicted);
      if (reveal && all && !demo && searched && predicted && !checked) {
        checked = true;
        prediction.disabled = true;
        if (correct) section.setAttribute('data-lesson-activity', '');
      }
      const showResults = (reveal && (demo || !all)) || (all && checked);
      const feedback = !all ? '回到「全部」，再比較各組。'
        : demo ? '看完固定示範後，按「再產生一題」完成練習。'
        : checked ? (correct ? '預測符合條件，可以完成這一步。' : '預測不同。對照表格的門檻與消耗量，再按「再產生一題」試一次。')
        : searched ? '先選出達到門檻且消耗量最小的一組，再核對。' : '先選一個測試編號並查詢，再回到「全部」預測。';
      const comparison = best.length ? `有效且最省資源的是 ${best.map(item => item.id).join('、')}（消耗量 ${bestCost}）。` : '目前結果中沒有通過測試的組合。';
      const summary = showResults && rows.length ? `共 ${rows.length} 筆；平均消耗量 ${average.toFixed(1)}。${all ? comparison : ''}` : '';
      result.innerHTML = `<p>${mode}；本題${escapeHtml(defense.labThreshold)}為 ${threshold}，圖形數 × 筆跡寬度達到門檻才算${escapeHtml(defense.outcome)}。</p><table><caption>測試資料（消耗量＝圖形數 × 筆跡寬度）</caption><thead><tr><th>編號</th><th>圖形數</th><th>寬度</th><th>${escapeHtml(defense.outcome)}</th><th>消耗量</th></tr></thead><tbody>${rows.map(item => `<tr><td>${item.id}</td><td>${item.count}</td><td>${item.width}</td><td>${item.blocked ? '是' : '否'}</td><td>${showResults ? cost(item) : '？'}</td></tr>`).join('')}</tbody></table><p>${summary}${feedback}</p>`;
    };
    section.querySelector('#g7-data-run').addEventListener('click', () => run());
    section.querySelector('#g7-data-new').addEventListener('click', newCase);
    section.querySelector('#g7-data-demo').addEventListener('click', () => {
      records = demoRecords.map(item => ({ ...item }));
      threshold = 15;
      mode = '固定示範';
      resetCase(true);
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
    reason.innerHTML += optionsHtml([
      ['some', '已經比到不符合的項目'],
      ['all', '每一項都比過，而且都不符合'],
      ['last', '只要比過最後一個項目就好']
    ]);
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
    const sorting = document.createElement('section');
    sorting.id = 'sorting-lab';
    sorting.className = 'curriculum-lab';
    sorting.hidden = true;
    sorting.setAttribute('aria-labelledby', 'g8-sort-title');
    sorting.innerHTML = `<div class="curriculum-lab__card">${lab.sortingHtml}</div>`;
    section.after(sorting);

    const get = id => (id.startsWith('sort-') ? sorting : section).querySelector(`#g8-${id}`);
    const asList = items => `［${items.join('、')}］`;
    const [first, second, repeated] = shuffle([2, 3, 4, 5, 6, 7]).slice(0, 3);
    const deck = [first, second, repeated, repeated].sort((a, b) => a - b);
    const shuffled = shuffle(deck);
    if (shuffled.every((card, index) => card === deck[index])) shuffled.push(shuffled.shift());
    const values = [...shuffled];
    const counts = `${first} 和 ${second} 各一張，${repeated} 有兩張`;
    get('shuffle-prompt').textContent = `原牌堆是 ${asList(deck)}。哪個結果保留了每張牌？`;
    const trace = [];
    let index = 0;
    let sortFinished = false;

    function compare(position, round) {
      const before = asList(values);
      const [left, right] = [values[position], values[position + 1]];
      const swap = left > right;
      if (swap) [values[position], values[position + 1]] = [right, left];
      trace.push([round, before, `${left} 和 ${right}`, swap ? '交換' : '不交換', asList(values)]);
      return swap;
    }

    function askComparison(message = '') {
      get('sort-state').textContent = `${message}目前順序 ${asList(values)}。比較 ${values[index]} 和 ${values[index + 1]}，要交換嗎？`;
    }

    const shuffleChoice = get('shuffle-choice');
    shuffleChoice.innerHTML += optionsHtml([
      ['extra', asList(shuffle([first, second, second, repeated]))],
      ['valid', asList(shuffled)],
      ['missing', asList(shuffle([first, second, repeated]))]
    ]);
    const shuffleCheck = get('shuffle-check');
    shuffleCheck.addEventListener('click', () => {
      const feedback = {
        extra: `總張數相同，但數字 ${second} 多了一張，數字 ${repeated} 少了一張。`,
        missing: `數字 ${repeated} 原本有兩張，這裡只剩一張。`,
        valid: `正確。${counts}，與原牌堆相同。`
      };
      get('shuffle-state').textContent = feedback[shuffleChoice.value] || '請先選一個結果。';
      if (shuffleChoice.value !== 'valid') return;
      shuffleCheck.disabled = shuffleChoice.disabled = true;
      get('shuffle-state').textContent += ' 按「開始洗牌實作」，試著用積木做出洗牌程式。';
      askComparison();
      sorting.hidden = false;
      section.setAttribute('data-lesson-activity', '');
    });

    function answerComparison(swap) {
      if (!shuffleCheck.disabled || index >= 2) return;
      if (swap !== (values[index] > values[index + 1])) {
        askComparison('再試一次。左邊比右邊大才交換。');
        return;
      }
      compare(index++, 1);
      if (index < 2) {
        askComparison('答對了。');
        return;
      }
      compare(2, 1);
      for (let round = 2; round < values.length; round++) {
        let changed = false;
        for (let position = 0; position < values.length - round; position++) {
          if (compare(position, round)) changed = true;
        }
        if (!changed) break;
      }
      sortFinished = true;
      get('sort-actions').hidden = true;
      get('sort-state').textContent = `前兩次判斷正確。其餘比較已完成，結果是 ${asList(values)}。`;
      get('sort-trace').innerHTML = `<details class="lesson-reference"><summary>看每次比較的紀錄</summary>
        <ol>${trace.map(([round, before, pair, action, after]) => `<li>第 ${round} 輪：${before} 比較 ${pair}，${action} → ${after}</li>`).join('')}</ol></details>`;
      get('sort-stop-task').hidden = false;
      get('sort-stop').focus();
    }

    get('sort-swap').addEventListener('click', () => answerComparison(true));
    get('sort-keep').addEventListener('click', () => answerComparison(false));
    const stopChoice = get('sort-stop');
    stopChoice.innerHTML += optionsHtml([
      ['pair', '有一對相鄰的牌沒交換'],
      ['round', '完整一輪都沒交換'],
      ['equal', '遇到兩張數值相同的牌']
    ]);
    const sortCheck = get('sort-check');
    const report = get('sort-report');
    sortCheck.addEventListener('click', () => {
      if (!sortFinished) return;
      if (stopChoice.value !== 'round') {
        get('sort-state').textContent = '請再判斷。只比完一對，後面仍可能有需要交換的牌。';
        return;
      }
      sortCheck.disabled = stopChoice.disabled = true;
      get('sort-state').textContent = '正確。完整一輪都沒交換，就可以提早停止。';
      report.value = [
        `洗牌：${asList(deck)} → ${asList(shuffled)}。${counts}。`,
        '輪次\t操作前清單\t比較的項目\t動作\t操作後清單',
        ...trace.map(row => row.join('\t')),
        '停止條件：完整一輪都沒交換，可以提早停止。'
      ].join('\n');
      get('sort-evidence').hidden = false;
      sorting.setAttribute('data-lesson-activity', '');
      get('sort-copy').focus();
    });
    get('sort-copy').addEventListener('click', async () => {
      if (!report.value) return;
      try {
        await navigator.clipboard.writeText(report.value);
        get('sort-copy-status').textContent = '已複製。請貼到本課作業。';
      } catch {
        report.hidden = false;
        report.select();
        get('sort-copy-status').textContent = '請複製下方紀錄，貼到本課作業。';
      }
    });
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
