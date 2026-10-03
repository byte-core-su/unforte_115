(() => {
  const page = window.location.pathname.split('/').pop();
  const main = document.querySelector('main');
  if (!main) return;

  const labs = {
    '1150701.html': {
      title: '資訊使用情境判斷',
      codes: '資 H-IV-1／2／3｜運 a-IV-2',
      intro: '完成積木診斷後，再判斷使用 Scratch 與網路資源時，如何保護個資、合理使用素材並維護帳號安全。',
      html: `<div class="curriculum-lab__questions" data-quiz="g7-safety"></div>`
    },
    '1150706.html': {
      title: '防禦資源資料分析',
      codes: '資 T-IV-1｜運 t-IV-4、運 p-IV-1',
      intro: '使用匿名範例資料，先搜尋指定測試、比較防禦結果，再計算平均資源消耗；將結論用於改良防禦網。',
      html: `<div class="curriculum-lab__controls"><label>搜尋測試編號 <select id="g7-data-query"></select></label><label>先預測有效且最省資源的編號 <select id="g7-data-prediction"><option value="">先選答案</option><option>A</option><option>B</option><option>C</option><option>D</option></select></label><button type="button" id="g7-data-run">核對預測並分析</button><button type="button" id="g7-data-new" class="curriculum-lab__secondary">再產生一題</button><button type="button" id="g7-data-demo" class="curriculum-lab__secondary">固定示範</button></div><div id="g7-data-result" class="curriculum-lab__result" aria-live="polite"></div><p class="curriculum-lab__task">Scratch 任務：用清單記錄至少三組「圖形數量、筆跡寬度、是否擋住隕石」，選出通過測試且資源消耗較少的組合，附上表格與理由。新題數值會變，評量看推理與實測，不只看編號。</p>`
    },
    '1150801.html': {
      title: '循序搜尋：逐項檢查清單',
      codes: '資 A-IV-3（搜尋）｜資 P-IV-3｜運 t-IV-4',
      intro: '先預測目標位於第幾項，再逐步執行；找不到時，也要能說出停止條件。',
      html: `<div class="curriculum-lab__controls"><label>尋找裝備 <select id="g8-search-target"></select></label><label>先預測位置 <select id="g8-search-prediction"></select></label><button type="button" id="g8-search-reset">同題重試</button><button type="button" id="g8-search-step">檢查下一項</button><button type="button" id="g8-search-new" class="curriculum-lab__secondary">再產生一題</button><button type="button" id="g8-search-demo" class="curriculum-lab__secondary">固定示範</button></div><div id="g8-search-state" class="curriculum-lab__result" aria-live="polite"></div><p class="curriculum-lab__task">Scratch 任務：以「索引從 1 開始，逐項比較；找到或超過清單長度就停止」實作搜尋，交出找到與找不到各一筆追蹤紀錄。請記錄比較順序，別只背位置。</p>`
    },
    '1150802.html': {
      title: '音訊與作品使用判斷',
      codes: '資 H-IV-1、資 H-IV-2（複習）｜資 H-IV-5（倫理面向部分融入）｜運 a-IV-2',
      intro: '音符清單可用於創作；錄音與現成旋律涉及個資、授權與公開分享，操作前先做判斷。本活動複習個資保護與合理使用，部分融入使用倫理，不涵蓋資 H-IV-4 的網路成癮、網路交友議題。課綱來源與採證範圍見<a href="lesson-plan-grade-8.html#section-1">八年級教案</a>。此頁的錄音比對由瀏覽器端處理，不是教師評分或後端作業系統。',
      html: `<div class="curriculum-lab__questions" data-quiz="g8-ethics"></div>`
    },
    '1150805.html': {
      title: '排序與洗牌比較',
      codes: '資 A-IV-3（排序）｜資 P-IV-3｜運 t-IV-4',
      intro: '洗牌讓順序隨機；排序依明確規則排列。逐步比較相鄰數值，必要時交換，觀察每一輪如何改變清單。',
      html: `<div class="curriculum-lab__controls"><label>先預測第一次比較 <select id="g8-sort-prediction"><option value="">先選答案</option><option value="swap">會交換</option><option value="keep">不交換</option></select></label><button type="button" id="g8-sort-reset">同題重試</button><button type="button" id="g8-sort-step">執行下一次比較</button><button type="button" id="g8-sort-new" class="curriculum-lab__secondary">再產生一題</button><button type="button" id="g8-sort-demo" class="curriculum-lab__secondary">固定示範</button></div><div id="g8-sort-state" class="curriculum-lab__result" aria-live="polite"></div><p class="curriculum-lab__task">Scratch 任務：將四至六張打亂的數字牌由小到大排序；標出每次比較與交換，確認輸出數量與項目和輸入相同。換一組數字後，仍要能解釋交換規則。</p>`
    },
    '1150806.html': {
      title: '用自訂積木分工完成對決',
      codes: '資 P-IV-4／5｜運 t-IV-4、運 p-IV-1',
      intro: '把一大段程式拆成具名的自訂積木。先決定呼叫順序，再到 Scratch 建立並測試各段功能。',
      html: `<div class="curriculum-lab__controls" id="g8-module-options"></div><div id="g8-module-state" class="curriculum-lab__result" aria-live="polite"></div><button type="button" id="g8-module-reset" class="curriculum-lab__secondary">重排呼叫順序</button><p class="curriculum-lab__task">Scratch 任務：建立「建立裝備庫」「洗牌裝備」「分配裝備」「逐一對決」四個自訂積木，分別測試；修改裝備數量後再測一次，交出主程式與一次修正紀錄。</p>`
    }
  };

  const lab = labs[page];
  if (!lab) return;
  const section = document.createElement('section');
  section.className = 'curriculum-lab';
  section.setAttribute('aria-label', '課綱補強實作');
  section.innerHTML = `<div class="curriculum-lab__card"><p class="curriculum-lab__code">課綱補強實作｜${lab.codes}</p><h2>${lab.title}</h2><p>${lab.intro}</p>${lab.html}</div>`;
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
    ['準備分享 Scratch 作品時，哪種做法較合適？', ['在作品說明寫出全班真實姓名', '用角色代號，分享前檢查個資', '公開同學的帳號密碼'], 1, '公開作品不應包含可辨識同學的個人資料。'],
    ['想使用網路上的圖片或音樂，應先做什麼？', ['確認授權並標示來源或改用可使用素材', '只要能下載就直接使用', '刪掉作者名稱再上傳'], 0, '素材的合理使用與授權需要先確認。'],
    ['收到要求輸入 Scratch 密碼的陌生連結，應如何處理？', ['立即輸入，避免帳號失效', '轉傳全班', '不要輸入，向教師確認並使用官方網站'], 2, '不明連結可能是釣魚頁面；不要洩露密碼。']
  ];
  const ethics = [
    ['要用錄音做旋律比對，哪一種資料最適合？', ['包含其他同學談話的錄音', '自己錄製且不含他人個資的短音檔', '未經同意的班級錄影'], 1, '採用自己的短錄音，避免收進他人聲音與個資。'],
    ['打算公開分享改編旋律時，應如何處理來源？', ['先確認授權及可使用範圍', '只要標題不同就不用理會授權', '由系統自動比對就代表可以公開'], 0, '比對功能不會授予作品或錄音的使用權。']
  ];
  const quizRoot = section.querySelector('[data-quiz]');
  if (quizRoot) {
    const questions = quizRoot.dataset.quiz === 'g7-safety' ? safety : ethics;
    quizRoot.innerHTML = questions.map(([question, options], index) => `<fieldset><legend>${index + 1}. ${question}</legend>${options.map((option, choice) => `<label><input type="radio" name="lab-q-${index}" value="${choice}"> ${option}</label>`).join('')}<output aria-live="polite"></output></fieldset>`).join('') + '<button type="button">檢查判斷並閱讀原因</button>';
    quizRoot.querySelector('button').addEventListener('click', () => {
      questions.forEach(([, , answer, explanation], index) => {
        const fieldset = quizRoot.querySelectorAll('fieldset')[index];
        const selected = fieldset.querySelector('input:checked');
        const output = fieldset.querySelector('output');
        output.textContent = !selected ? '請先選擇。' : `${Number(selected.value) === answer ? '正確。' : '再想想。'}${explanation}`;
      });
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
      const rows = records.filter(item => chosen === 'all' || item.id === chosen);
      const average = rows.reduce((total, item) => total + item.count * item.width, 0) / rows.length;
      const valid = rows.filter(item => item.blocked).sort((a, b) => a.count * a.width - b.count * b.width);
      const bestCost = Math.min(...records.filter(item => item.blocked).map(item => item.count * item.width));
      const predicted = records.find(item => item.id === prediction.value);
      const feedback = chosen !== 'all' ? '先選「全部」，才能比較哪筆最省資源。' : !prediction.value ? '下次先選預測，再核對結果。' : predicted?.blocked && predicted.count * predicted.width === bestCost ? '預測符合條件；請說明為何其他通過測試的組合消耗更多。' : '預測不同；先排除未通過門檻的組合，再比較其餘的消耗量，重抽新題驗證。';
      result.innerHTML = `<p>${mode}；本題防護強度門檻為 ${threshold}，圖形數 × 筆跡寬度達到門檻才算擋住隕石。</p><table><caption>測試資料（消耗量＝圖形數 × 筆跡寬度）</caption><thead><tr><th>編號</th><th>圖形數</th><th>寬度</th><th>擋住隕石</th><th>消耗量</th></tr></thead><tbody>${rows.map(item => `<tr><td>${item.id}</td><td>${item.count}</td><td>${item.width}</td><td>${item.blocked ? '是' : '否'}</td><td>${reveal ? item.count * item.width : '？'}</td></tr>`).join('')}</tbody></table><p>${reveal ? `共 ${rows.length} 筆；平均消耗量 ${average.toFixed(1)}。${valid.length ? `目前結果中有效且最省資源的是 ${valid[0].id}（消耗量 ${valid[0].count * valid[0].width}）。` : '目前結果中沒有通過測試的組合。'} ${feedback}` : '先算出各筆消耗量，預測通過測試且最省資源的組合，再按「核對預測並分析」。'}</p>`;
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
    const pool = ['能量電池', '防護罩', '修復劑', '雷射槍', '推進器', '導航晶片', '通訊器', '補給包'];
    let list = [];
    let index = 0;
    let done = false;
    let mode = '練習題';
    let previous = '';
    const state = section.querySelector('#g8-search-state');
    const target = section.querySelector('#g8-search-target');
    const prediction = section.querySelector('#g8-search-prediction');
    const show = message => { state.textContent = `${mode}；清單：[${list.join('、')}]。${message}`; };
    const reset = () => { index = 0; done = false; show('索引從 1 開始，請先預測結果。'); };
    const setCase = (items, chosen, label) => {
      list = [...items];
      mode = label;
      const missing = pool.find(item => !list.includes(item)) || '未知裝備';
      target.innerHTML = [...list, missing].map(item => `<option value="${item}">${item}${item === missing ? '（不在清單）' : ''}</option>`).join('');
      target.value = chosen;
      prediction.innerHTML = '<option value="">先選答案</option>' + list.map((_, position) => `<option value="${position + 1}">第 ${position + 1} 項</option>`).join('') + '<option value="missing">找不到</option>';
      prediction.value = '';
      reset();
    };
    section.querySelector('#g8-search-reset').addEventListener('click', reset);
    section.querySelector('#g8-search-step').addEventListener('click', () => {
      if (done) return;
      const item = list[index];
      index++;
      done = item === target.value || index === list.length;
      const expected = list.includes(target.value) ? String(list.indexOf(target.value) + 1) : 'missing';
      const feedback = done ? !prediction.value ? '下次先預測位置，再逐項驗證。' : prediction.value === expected ? '預測正確；請用比較紀錄說明停止條件。' : '預測不同；從第 1 項重新追蹤，找出索引或停止條件的差異。' : '';
      show(`第 ${index} 次比較：${item} ${item === target.value ? '＝' : '≠'} ${target.value}。${item === target.value ? `找到，位置是第 ${index} 項。` : done ? `已檢查 ${index} 項，沒有找到。` : '繼續檢查下一項。'}${feedback}`);
    });
    target.addEventListener('change', () => { prediction.value = ''; reset(); });
    section.querySelector('#g8-search-new').addEventListener('click', () => {
      let items;
      let chosen;
      let signature;
      let attempts = 0;
      do {
        items = shuffle(pool).slice(0, randomInt(4, 6));
        chosen = Math.random() < 0.25 ? pool.find(item => !items.includes(item)) : items[randomInt(0, items.length - 1)];
        signature = `${items.join(',')}:${chosen}`;
      } while (signature === previous && ++attempts < 12);
      if (signature === previous) items.reverse();
      previous = `${items.join(',')}:${chosen}`;
      setCase(items, chosen, '練習題');
    });
    section.querySelector('#g8-search-demo').addEventListener('click', () => setCase(['能量電池', '防護罩', '修復劑', '雷射槍'], '防護罩', '固定示範'));
    section.querySelector('#g8-search-new').click();
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
      const left = values[index];
      const right = values[index + 1];
      const swapped = left > right;
      const firstFeedback = comparisons === 0 ? !prediction.value ? '下次先預測第一次是否交換。' : prediction.value === (swapped ? 'swap' : 'keep') ? '第一次預測正確；請說明比較規則。' : '第一次預測不同；由小到大排序時，左邊比右邊大才交換。' : '';
      if (swapped) [values[index], values[index + 1]] = [right, left];
      comparisons++;
      index++;
      if (index >= values.length - pass - 1) { index = 0; pass++; }
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
    const order = ['建立裝備庫', '洗牌裝備', '分配裝備', '逐一對決'];
    const chosen = [];
    const options = section.querySelector('#g8-module-options');
    const state = section.querySelector('#g8-module-state');
    options.innerHTML = order.map(name => `<button type="button" data-module="${name}">${name}</button>`).join('');
    const show = () => { state.textContent = `主程式：綠旗 → ${chosen.join(' → ') || '請依序選擇自訂積木'}。${chosen.length === 4 ? (chosen.every((name, index) => name === order[index]) ? '順序正確，接著在 Scratch 製作與測試各積木。' : '順序不合理：分配前要先建立並洗牌，對決前要先分配。') : ''}`; };
    options.addEventListener('click', event => {
      const name = event.target.dataset.module;
      if (!name || chosen.includes(name)) return;
      chosen.push(name);
      event.target.disabled = true;
      show();
    });
    section.querySelector('#g8-module-reset').addEventListener('click', () => { chosen.length = 0; options.querySelectorAll('button').forEach(button => { button.disabled = false; }); show(); });
    show();
  }
})();
