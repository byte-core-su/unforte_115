// Rule-based practice for the twelve lessons. No account, network request or saved score.
(() => {
  const lessonPages = /^1150[78]0[1-6]\.html$/;
  const labels = ['基礎', '標準', '挑戰'];
  const rand = (min, max, random) => min + Math.floor(random() * (max - min + 1));
  const shuffle = (items, random) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = rand(0, i, random);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const question = (prompt, options, answer, hints, explanation, random) => {
    const unique = [...new Set(options.map(String))];
    if (unique.length !== 4 || !unique.includes(String(answer))) throw new Error(`Invalid practice question: ${prompt}`);
    const choices = shuffle(unique, random);
    return { prompt, choices, answer: choices.indexOf(String(answer)), hints, explanation, key: `${prompt}|${unique.join('|')}` };
  };
  const numeric = (prompt, answer, hints, explanation, random) => {
    const choices = [answer, answer + 1, answer + 2, answer - 1];
    return question(prompt, choices, answer, hints, explanation, random);
  };

  function createQuestion(page, level, random = Math.random) {
    const n = rand(3, level === 3 ? 8 : 6, random);
    const step = rand(2, 6, random);
    const start = rand(2, 12, random);
    switch (page) {
      case '1150701.html': {
        if (level === 1) {
          const scenes = [
            ['按下綠旗後開始執行', '當綠旗被點擊'],
            ['按下空白鍵後開始執行', '當空白鍵被按下'],
            ['角色碰到邊緣後才移動', '如果碰到邊緣']
          ];
          const [scene, answer] = scenes[rand(0, scenes.length - 1, random)];
          return question(`想要「${scene}」，應先找哪種積木？`, [answer, '移動 10 點', '將分數設為 0', '重複 10 次'], answer, ['先找出什麼事件會觸發程式。', '啟動時機與移動或記錄資料不同。'], `「${answer}」對應這個啟動或判斷時機。`, random);
        }
        if (level === 2) return question(`上一局結束時分數是 ${start}，新一局要從 0 開始。應先執行哪個積木？`, ['將分數設為 0', '將分數改變 0', '顯示分數', '等待 1 秒'], '將分數設為 0', ['比較「設為」與「改變」的差別。', '新的一局需要指定確定的初始值。'], '初始化要使用「將分數設為 0」；改變 0 不會清掉舊值。', random);
        return numeric(`分數從 ${start} 分開始，每次答對增加 ${step} 分，連續答對 ${n} 題後是多少分？`, start + step * n, ['先算每次增加的總量。', `增加量是 ${step} × ${n}，再加上初始分數。`], `初始值 ${start} 加上 ${n} 次各 ${step} 分。`, random);
      }
      case '1150702.html':
        if (level === 1) return numeric(`依序執行「加 ${step}」再「乘 ${n}」，初始值 ${start} 的結果是多少？`, (start + step) * n, ['請依程式順序，不能先乘。', `先算 ${start} + ${step}，再乘 ${n}。`], '循序結構必須按照積木的先後順序計算。', random);
        if (level === 2) return numeric(`初始值 ${start}，把「增加 ${step}」重複 ${n} 次，最後是多少？`, start + step * n, ['重複的是「增加」，不是設定初始值。', `總共增加 ${step} × ${n}。`], '迴圈每次更新一次，共更新指定次數。', random);
        const score = start + step;
        const limit = score + rand(-2, 2, random);
        const branch = score > limit ? '如果成立' : '否則';
        return question(`分數是 ${score}；條件為「分數大於 ${limit}」。會走哪一支？`, ['否則', '如果成立', '兩支都走', '兩支都不走'], branch, ['注意是「大於」，不是「大於或等於」。', '比較分數與門檻後，只會走其中一支。'], `${score} ${score > limit ? '大於' : '沒有大於'} ${limit}，因此走「${branch}」。`, random);
      case '1150703.html': {
        const sides = [3, 4, 5, 6, 8, 9, 10, 12][rand(0, 7, random)];
        if (level === 1) return numeric(`畫正 ${sides} 邊形，重複「前進、轉彎」需要幾次？`, sides, ['每次重複完成一條邊。', '邊數與重複次數相同。'], '正多邊形有幾條邊，就執行幾次。', random);
        if (level === 2) return numeric(`畫正 ${sides} 邊形，每次應轉幾度才閉合？`, 360 / sides, ['一圈共 360 度。', `用 360 ÷ ${sides}。`], `外角為 360 ÷ ${sides} 度。`, random);
        const other = sides === 3 ? 6 : 3;
        return numeric(`正 ${sides} 邊形的外角，比正 ${other} 邊形的外角相差幾度？`, Math.abs(360 / sides - 360 / other), ['先分別算兩個外角。', `分別用 360 ÷ ${sides} 與 360 ÷ ${other}，再取差。`], '先求各圖形外角，再比較差值。', random);
      }
      case '1150704.html':
        if (level === 1) return numeric(`變數從 ${start} 開始，執行一次「改變 ${step}」後是多少？`, start + step, ['「改變」要加在目前數值上。', `算 ${start} + ${step}。`], '更新後的值是原值加增加量。', random);
        if (level === 2) return numeric(`變數從 ${start} 開始，每輪畫完才增加 ${step}；第 ${n} 輪畫線時使用多少？`, start + (n - 1) * step, ['第一輪尚未增加。', `畫第 ${n} 輪前只更新 ${n - 1} 次。`], '更新在畫線之後，所以第 n 輪使用初始值加 n−1 次增加量。', random);
        return numeric(`變數從 ${start} 開始，每輪先增加 ${step} 再畫線；第 ${n} 輪畫線時使用多少？`, start + n * step, ['第一輪畫之前就已增加一次。', `畫第 ${n} 輪前已更新 ${n} 次。`], '更新在畫線之前，所以第 n 輪使用初始值加 n 次增加量。', random);
      case '1150705.html': {
        const copies = [4, 6, 8, 9, 12][rand(0, 4, random)];
        if (level === 1) return numeric(`將同一個圖形旋轉繪製 ${copies} 次，每次應旋轉幾度才繞完一圈？`, 360 / copies, ['完整一圈是 360 度。', `用 360 ÷ ${copies}。`], '每次旋轉角度乘上次數應等於 360 度。', random);
        if (level === 2) return numeric(`每次繪製 ${n} 條邊，共繪製 ${copies} 個圖形，總共執行幾次畫邊動作？`, n * copies, ['每個圖形都要完成所有邊。', `算 ${n} × ${copies}。`], '重複的圖形數乘上每個圖形的邊數。', random);
        return numeric(`自訂積木的「旋轉角度」設為 ${360 / copies} 度。重複呼叫幾次才會繞完一圈？`, copies, ['角度總和要達到 360 度。', `算 360 ÷ ${360 / copies}。`], '參數不同時，呼叫次數也要跟著調整。', random);
      }
      case '1150706.html': {
        const threshold = rand(12, 20, random);
        const costs = [threshold - rand(2, 5, random), threshold + rand(1, 3, random), threshold + rand(5, 8, random), threshold + rand(10, 14, random)];
        const shuffled = shuffle(costs, random);
        const labelsByIndex = ['A', 'B', 'C', 'D'];
        const detail = shuffled.map((cost, index) => `${labelsByIndex[index]}：消耗量 ${cost}`).join('；');
        if (level === 1) return question(`防護門檻 ${threshold}，${detail}。哪組消耗量最少且能擋住？`, labelsByIndex, labelsByIndex[shuffled.indexOf(costs[1])], ['先排除低於門檻的組合。', '再比較剩下通過門檻的消耗量。'], `消耗量達到 ${threshold} 才有效；最小有效值為 ${costs[1]}。`, random);
        const base = rand(2, 4, random);
        const pairs = shuffle([0, 1, 2, 3].map(offset => ({ count: base + offset, width: offset + 2 })), random);
        const actualCosts = pairs.map(item => item.count * item.width);
        const required = level === 3 ? threshold + 5 : threshold;
        const viable = actualCosts.map((cost, index) => ({ cost, index })).filter(item => item.cost >= required).sort((a, b) => a.cost - b.cost);
        const best = viable[0];
        const options = labelsByIndex.map(label => `${label} 組`);
        const rows = labelsByIndex.map((label, index) => `${label}：${pairs[index].count} 個圖形 × 寬度 ${pairs[index].width}`).join('；');
        return question(`防護門檻 ${threshold}${level === 3 ? '，警報升級後門檻再增加 5' : ''}；${rows}。哪組有效且消耗量最少？`, options, `${labelsByIndex[best.index]} 組`, ['每組消耗量＝圖形數 × 寬度。', '先找出達到目前門檻的組合，再比較消耗量。'], `目前門檻是 ${required}，有效組合的最小消耗量是 ${best.cost}。`, random);
      }
      case '1150801.html': {
        const items = shuffle(['電池', '護盾', '雷射', '晶片'], random);
        if (level === 1) return question(`清單是 [${items.join('、')}]，第 2 項是什麼？`, items, items[1], ['Scratch 清單索引從 1 開始。', '從左邊數第 2 個項目。'], '清單第 2 項對應第二個位置。', random);
        if (level === 2) return question(`清單是 [${items.join('、')}]，在第 2 項插入「補給」。插入後第 3 項是什麼？`, [...items.slice(0, 3), '補給'], items[1], ['插入會讓原本第 2 項往後移。', '插入後第 2 項是補給，第 3 項是原第 2 項。'], '插入會改變後續項目的索引。', random);
        return question(`清單是 [${items.join('、')}]，刪掉第 2 項後，新的第 2 項是什麼？`, items, items[2], ['刪除後，後面的項目往前移。', '原本第 3 項會變成第 2 項。'], '刪除一項後，後續索引往前移一格。', random);
      }
      case '1150802.html': {
        const notes = shuffle(['Do', 'Re', 'Mi', 'Sol'], random);
        if (level === 1) return question(`音符清單 [${notes.join('、')}] 依索引播放，第 3 個音是什麼？`, notes, notes[2], ['索引 1 對應第一個音。', '由左到右數第 3 項。'], '逐項走訪時，播放順序與清單索引一致。', random);
        if (level === 2) return question(`音符清單 [${notes.join('、')}]，交換第 1、4 項後，第一個音是什麼？`, notes, notes[3], ['交換只改變兩個位置。', '原本第 4 項會移到第 1 項。'], '交換後應依新順序讀取清單。', random);
        return question(`音符清單 [${notes.join('、')}]，把第 2 項改為「La」，播放到索引 2 時是哪個音？`, [...notes.filter((_, index) => index !== 1), 'La'], 'La', ['替換不改變清單長度。', '第 2 項的新資料會取代原音符。'], '依索引讀取時會讀到替換後的音符。', random);
      }
      case '1150803.html': {
        const values = [rand(2, 8, random), rand(3, 9, random), rand(2, 8, random)];
        if (level === 1) return numeric(`清單 [${values.join('、')}] 的總和是多少？`, values.reduce((sum, value) => sum + value, 0), ['逐項加到累加器。', '不要把清單長度當作資料值。'], '總和是所有項目的累計結果。', random);
        if (level === 2) {
          const even = [rand(2, 6, random) * 2, rand(2, 6, random) * 2];
          return numeric(`清單 [${even.join('、')}] 的平均是多少？`, (even[0] + even[1]) / 2, ['先求總和，再除以筆數。', '此清單有 2 筆資料。'], '平均＝總和 ÷ 筆數。', random);
        }
        const listName = ['能源', '得分', '庫存'][rand(0, 2, random)];
        return question(`「${listName}」清單是空的，要計算平均時程式應如何處理？`, ['先檢查筆數是否為 0，再顯示無法計算', '直接用總和除以 0', '直接顯示平均為 0', '複製上一筆平均'], '先檢查筆數是否為 0，再顯示無法計算', ['平均需要非零筆數。', '除法前先檢查清單長度。'], '空清單沒有可作為除數的筆數，應先處理邊界情況。', random);
      }
      case '1150804.html': {
        const length = rand(5, 9, random);
        const draws = rand(1, Math.min(length - 2, level === 1 ? 3 : 5), random);
        if (level === 1) return numeric(`候選清單有 ${length} 人，不重複抽出 ${draws} 人後，候選清單剩幾人？`, length - draws, ['每抽出一人，就從候選清單移除一人。', `計算 ${length} − ${draws}。`], '移除後候選數量逐次減一。', random);
        if (level === 2) return numeric(`原本 ${length} 張不同的牌，已選清單有 ${draws} 張且不重複。兩個清單合計仍有幾張？`, length, ['抽取是在兩個清單間移動資料。', '候選變少多少，已選就增加多少。'], '不重複抽取不會憑空增加或遺失項目。', random);
        return question(`原本 ${length} 人，已不重複抽出 ${draws} 人。下一次抽取要如何保證不重複？`, ['只從剩餘候選清單選，選後移除', '每次都從原始名單重新抽', '抽到同一人時仍加入已選', '只檢查已選數量'], '只從剩餘候選清單選，選後移除', ['想想候選清單應包含誰。', '已選過的人不能留在下一輪候選中。'], '每次從剩餘候選抽取並移除，才能維持不重複。', random);
      }
      case '1150805.html': {
        const a = rand(1, 12, random);
        const otherNumbers = Array.from({ length: 12 }, (_, index) => index + 1).filter(value => value !== a);
        const b = otherNumbers[rand(0, otherNumbers.length - 1, random)];
        const remaining = Array.from({ length: 12 }, (_, index) => index + 1).filter(value => value !== a && value !== b);
        const c = remaining[rand(0, remaining.length - 1, random)];
        if (level === 1) return question(`由小到大排序，第一次比較 ${a} 和 ${b}，應該怎麼做？`, ['交換', '不交換', '刪除左邊', '新增一項'], a > b ? '交換' : '不交換', ['比較左邊和右邊的大小。', '只有左邊較大時才交換。'], `${a} ${a > b ? '大於' : '小於'} ${b}，因此${a > b ? '交換' : '不交換'}。`, random);
        if (level === 2) {
          const correct = a > b ? `[${b}、${a}、${c}]` : `[${a}、${b}、${c}]`;
          return question(`由小到大排序 [${a}、${b}、${c}]，只比較前兩項後，清單為何？`, [`[${b}、${a}、${c}]`, `[${a}、${b}、${c}]`, `[${a}、${c}、${b}]`, `[${c}、${b}、${a}]`], correct, ['只比較前兩項，第三項不變。', '左邊大於右邊時才交換前兩項。'], '一次相鄰比較只會檢查被比較的兩個位置。', random);
        }
        const values = [a, b, c];
        if (values[0] > values[1]) [values[0], values[1]] = [values[1], values[0]];
        if (values[1] > values[2]) [values[1], values[2]] = [values[2], values[1]];
        const correct = `[${values.join('、')}]`;
        const options = [
          [a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]
        ].map(items => `[${items.join('、')}]`).filter(value => value !== correct).slice(0, 3).concat(correct);
        return question(`由小到大排序 [${a}、${b}、${c}]，完成第一輪兩次相鄰比較後，清單為何？`, options, correct, ['先比較第 1、2 項，再比較當時的第 2、3 項。', '每一步都在更新後的清單上繼續比較。'], '第一輪會把當時的最大值逐步移向右端。', random);
      }
      case '1150806.html':
        if (level === 1) {
          const before = ['洗牌裝備', '分配裝備', '逐一對決'][rand(0, 2, random)];
          const prior = { 洗牌裝備: '建立裝備庫', 分配裝備: '洗牌裝備', 逐一對決: '分配裝備' };
          return question(`主程式要執行「${before}」，緊接在它之前應完成哪個自訂積木？`, ['建立裝備庫', '洗牌裝備', '分配裝備', '逐一對決'], prior[before], ['想想每一步需要前一步產生什麼資料。', '建立、洗牌、分配、對決有先後依賴。'], `「${prior[before]}」應在「${before}」之前完成。`, random);
        }
        if (level === 2) return numeric(`裝備庫有 ${n * 2 + step} 件，兩隊各分 ${n} 件後還剩幾件？`, step, ['兩隊各取相同數量。', `總共分出 ${n} × 2 件。`], '剩餘量＝原庫存 − 兩隊分配總量。', random);
        return question(`兩隊各需要 ${n} 件裝備，但庫存只有 ${n * 2 - 1} 件。分配積木應先做什麼？`, ['檢查庫存是否足夠並處理不足情況', '照常抽取直到清單為空', '重複使用最後一件裝備', '直接開始對決'], '檢查庫存是否足夠並處理不足情況', ['先比較需求量與庫存量。', '不能讓抽取次數超過候選清單長度。'], '模組應先處理資料不足的邊界案例，再執行分配。', random);
      default:
        return null;
    }
  }

  function gradeAttempt(state, correct) {
    if (state.resolved) return state;
    if (correct) {
      const streak = state.attempts === 0 ? state.streak + 1 : 0;
      return { ...state, level: streak >= 2 ? Math.min(3, state.level + 1) : state.level, streak: streak >= 2 ? 0 : streak, resolved: true };
    }
    const attempts = state.attempts + 1;
    return { ...state, attempts, streak: 0, level: attempts >= 2 ? Math.max(1, state.level - 1) : state.level, resolved: attempts >= 2 };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { createQuestion, gradeAttempt };
  if (typeof document === 'undefined') return;
  const page = window.location.pathname.split('/').pop();
  if (!lessonPages.test(page)) return;
  const main = document.querySelector('main');
  if (!main) return;
  const section = document.createElement('section');
  section.id = 'adaptive-practice';
  section.className = 'adaptive-practice';
  section.setAttribute('aria-label', '本課自適應練習');
  section.innerHTML = `<div class="adaptive-practice__card"><p class="adaptive-practice__tag">本課自適應練習・不計分</p><h2>換一題，練習同一個規則</h2><p>先預測再檢查；答錯可看提示並同題重試。連續兩道新題首次答對會提高難度；兩次答錯會提供詳解並降低難度。可自行選級或跳題，重新整理後即重置，不保存作答資料。</p><div class="adaptive-practice__levels" role="group" aria-label="手動選擇練習難度"><button type="button" data-level="1">基礎</button><button type="button" data-level="2">標準</button><button type="button" data-level="3">挑戰</button></div><p class="adaptive-practice__status" aria-live="polite"></p><fieldset><legend class="adaptive-practice__prompt"></legend><div class="adaptive-practice__choices"></div></fieldset><div class="adaptive-practice__actions"><button type="button" class="adaptive-practice__check">檢查預測</button><button type="button" class="adaptive-practice__next">換一題（跳過不升級）</button></div><p class="adaptive-practice__feedback" role="status" aria-live="polite"></p><p class="adaptive-practice__note">這是形成性練習，不能取代作品、資料追蹤與教師評量；請在離堂任務中寫下自己的推理。</p></div>`;
  main.parentNode.insertBefore(section, main.nextSibling);

  const prompt = section.querySelector('.adaptive-practice__prompt');
  const choices = section.querySelector('.adaptive-practice__choices');
  const status = section.querySelector('.adaptive-practice__status');
  const feedback = section.querySelector('.adaptive-practice__feedback');
  const check = section.querySelector('.adaptive-practice__check');
  const next = section.querySelector('.adaptive-practice__next');
  let state = { level: 1, streak: 0, attempts: 0, resolved: false };
  let current;
  let previous = '';
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const updateStatus = () => {
    status.textContent = `目前：${labels[state.level - 1]}｜連續新題首次答對 ${state.streak}／2`;
    section.querySelectorAll('[data-level]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.level) === state.level));
    });
  };
  const newQuestion = () => {
    let attempts = 0;
    do { current = createQuestion(page, state.level); } while (current.key === previous && ++attempts < 15);
    previous = current.key;
    state = { ...state, attempts: 0, resolved: false };
    prompt.textContent = current.prompt;
    choices.innerHTML = current.choices.map((choice, index) => `<label><input type="radio" name="adaptive-choice" value="${index}"><span>${escapeHtml(choice)}</span></label>`).join('');
    feedback.textContent = '先選擇並說出理由，再檢查。';
    check.disabled = false;
    next.textContent = '換一題（跳過不升級）';
    updateStatus();
  };
  section.querySelector('.adaptive-practice__levels').addEventListener('click', event => {
    const level = Number(event.target.dataset.level);
    if (![1, 2, 3].includes(level)) return;
    state = { level, streak: 0, attempts: 0, resolved: false };
    newQuestion();
  });
  check.addEventListener('click', () => {
    if (state.resolved) return;
    const selected = choices.querySelector('input:checked');
    if (!selected) { feedback.textContent = '請先選一個答案，再說出理由。'; return; }
    const correct = Number(selected.value) === current.answer;
    const nextState = gradeAttempt(state, correct);
    if (correct) feedback.textContent = `${state.attempts ? '修正後答對。' : '首次答對。'}${current.explanation} ${nextState.level > state.level ? '已提高難度。' : '換一道新題，確認不是只記住答案。'}`;
    else if (nextState.resolved) feedback.textContent = `這題先停下來整理：${current.hints[1]} ${current.explanation} 正確答案是「${current.choices[current.answer]}」。下一題改用較基礎的資料；請重新預測。`;
    else feedback.textContent = `先不要看答案：${current.hints[0]}可修改選擇後再檢查一次。`;
    state = nextState;
    if (state.resolved) { check.disabled = true; next.textContent = '練習下一題'; }
    updateStatus();
  });
  next.addEventListener('click', () => {
    if (!state.resolved) state = { ...state, streak: 0 };
    newQuestion();
  });
  newQuestion();
})();
