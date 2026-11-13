(() => {
  const { active, escapeHtml } = window.CourseScenarios;
  const { defense, inventory, duel } = active;
  const guides = {
    '1150700.html': {
      grade: '七年級課程總覽',
      title: '從積木思考到自主創作',
      goal: '用六個任務建立「讀程式、預測結果、動手實作、除錯說明」的完整學習循環。',
      action: `先完成起步診斷與資訊安全判斷，再依序挑戰三大結構、迴圈與變數；自訂積木可作進階體驗，最後用${defense.project}測試與資料分析完成專題。`,
      evidence: '每課保留作品截圖或程式說明；專題附三組參數測試與資料比較理由。',
      check: '我不只會把積木接起來，也能說出每一段程式為什麼要這樣設計。'
    },
    '1150701.html': {
      grade: '七年級｜第 1 課',
      action: '做完積木測驗後，選一塊積木說明何時執行、會改變什麼。可以從答錯或拿不準的題目選。再做個資、授權和可疑連結三題。',
      exit: '選一塊積木，說明何時執行、會改變什麼；再舉一個公開作品前要檢查的資訊安全情境。'
    },
    '1150702.html': {
      grade: '七年級｜第 2 課',
      action: '先寫下你猜程式會怎麼跑，再執行。結果不同時，找出哪一塊積木讓結果開始不一樣，改完再試。',
      exit: '選一段分支或迴圈，先預測更改條件或次數後的結果，再執行並指出第一個差異。'
    },
    '1150703.html': {
      grade: '七年級｜第 3 課',
      action: '選一個邊數，先算要重複幾次、每次轉幾度，再用迴圈畫出來。換一個邊數，看看哪兩個設定要一起改。挑一個圖形把轉角改錯，再改回來，記下差異。',
      exit: '換一個邊數，寫出重複次數與轉角，實際繪圖後說明圖形是否閉合。'
    },
    '1150704.html': {
      grade: '七年級｜第 4 課',
      action: '先記下前三次重複時的長度。把改變長度的積木分別放在「移動」前和後，看看畫出的螺旋有什麼不同。',
      exit: '自選初始值與增加量，預測前三輪數值；移動更新積木後比較第一輪的差異。'
    },
    '1150705.html': {
      grade: '七年級｜第 5 課',
      action: '在 Scratch 用迴圈和變數畫兩組不同設定的曼陀羅。選做時，把反覆用到的程式做成自訂積木，只改參數，看看圖形怎麼變。',
      exit: '比較兩組不同設定，指出哪個數值改變圖形；進階者說明參數如何重複使用積木。'
    },
    '1150706.html': {
      grade: '七年級｜第 6 課',
      action: `先在 Scratch 做出能調整參數的${defense.project}。至少試三組設定，記下結果，再做頁末的搜尋與平均消耗量練習。`,
      exit: '用自己的三組參數測試表，說明哪組有效且較省資源，並指出一次修正與重測。'
    },
    '1150800.html': {
      grade: '八年級課程總覽',
      title: '把清單當成可追蹤的資料',
      goal: '在每一課都用「執行前、執行中、執行後」追蹤清單狀態，將 Scratch 操作連結到演算法思考。',
      action: `遇到清單操作、搜尋、排序或洗牌，先寫出資料狀態與停止條件，再執行程式；最後用自訂積木拆解${duel.activity}流程。`,
      evidence: '每課留下清單或演算法追蹤表；專題提供模組分工與三組測試案例。',
      check: '我能分辨「資料本身」與「處理資料的步驟」，並用例子驗證程式。'
    },
    '1150801.html': {
      grade: '八年級｜第 1 課',
      action: `每操作一次，就記下清單變成什麼樣子。再到「循序搜尋」從第 1 項開始找${inventory.kind}，各試一次找得到和找不到的情況，再到 Scratch 寫搜尋程式並測試。`,
      exit: '換一個目標項目，先猜位置，再記錄找到或找不到的每次比較與停止原因。'
    },
    '1150802.html': {
      grade: '八年級｜第 2 課',
      action: '先猜四個音符會怎麼播，再改其中一個音符，聽聽哪裡不同。最後完成頁末的錄音與素材使用題。',
      exit: '改動一個音符或交換兩項，預測播放順序並驗證，說明清單索引如何控制旋律。'
    },
    '1150803.html': {
      grade: '八年級｜第 3 課',
      action: '用模擬器試多筆、單筆、空清單三種情況。每次按「讀取並加總」，記下目前加到多少、讀了幾筆。',
      exit: '換一組數值，追蹤每輪累計值；再用空清單說明平均值為何不能直接計算。'
    },
    '1150804.html': {
      grade: '八年級｜第 4 課',
      action: '先看網頁示範，再到 Scratch 寫抽籤程式。每抽一次，記下座號及兩份清單的人數變化。',
      exit: '記錄一次抽取前後兩個清單，指出候選數量與已選數量各變多少，以及避免重複的原因。'
    },
    '1150805.html': {
      grade: '八年級｜第 5 課',
      action: '先在網頁記錄洗牌過程。到「排序與洗牌比較」觀察哪兩項會交換，再用 Scratch 做相鄰比較排序。',
      exit: '用新數字牌預測第一次比較是否交換，執行後核對；再說明洗牌與排序的目標差別。'
    },
    '1150806.html': {
      grade: '八年級｜第 6 課',
      action: '先在頁末排好四個自訂積木的呼叫順序，再到 Scratch 做出程式。試試裝備夠用、不夠用的情況，再檢查分出去的裝備有沒有重複。',
      exit: `用一組新的${duel.item}清單，展示自訂積木呼叫順序、邊界測試與一次修正後的結果。`
    }
  };

  const page = window.location.pathname.split('/').pop() || 'index.html';
  const info = guides[page];
  if (!info) return;
  const assessment = window.LessonAssessments?.[page];
  const guide = assessment ? { ...info, ...assessment } : info;
  // Shared with lesson-route.js, which turns the exit task and evidence into route steps.
  window.LearningGuide = { page, ...guide };
  const main = document.querySelector('main');
  if (!main) return;

  const section = document.createElement('section');
  section.id = 'learning-guide';
  const gradeClass = page.startsWith('11508') ? 'site-course--g8' : 'site-course--g7';
  document.body.classList.add('site-course', gradeClass);
  section.className = 'learning-guide';
  section.setAttribute('aria-label', '本課學習導航');
  // Teachers land on student-facing pages; give them a direct way to the matching lesson plan.
  const planGrade = page.startsWith('11508') ? 8 : 7;
  const lessonNumber = Number(page.slice(6, 7));
  const planHref = guide.lessonPlan || `lesson-plan-grade-${planGrade}.html${lessonNumber ? `#lesson-${lessonNumber}` : ''}`;
  const planLabel = lessonNumber ? '教師備課：本課教案' : `教師備課：${planGrade === 7 ? '七' : '八'}年級教案`;
  section.innerHTML = `
    <div class="learning-guide__card">
      <div class="learning-guide__top">
        <span class="learning-guide__tag">${escapeHtml(guide.grade)}｜學習導航${guide.periods ? '｜建議 ' + guide.periods + ' 節' : ''}</span>
        <a class="learning-guide__teacher" href="${planHref}" target="_blank" rel="noopener">${planLabel} ↗</a>
      </div>
      <h2>${escapeHtml(guide.title || '本課學習導航')}</h2>
      <p class="learning-guide__goal"><strong>本課目標：</strong>${escapeHtml(guide.goal || '請參考本課教案。')}</p>
      <div class="learning-guide__grid">
        <div class="learning-guide__item"><strong>${lessonNumber ? '這一課要做什麼' : '上課順序'}</strong>${escapeHtml(guide.action)}</div>
        <div class="learning-guide__item"><strong>${lessonNumber ? '必交項目' : '各課要交的作品與紀錄'}</strong>${escapeHtml(guide.evidence || '請參考本課教案。')}</div>
      </div>
      <p class="learning-guide__check"><strong>${lessonNumber ? '怎樣算達標' : '學完後確認一下'}</strong> ${escapeHtml(guide.successCriteria || guide.check || '請參考本課教案。')}</p>
      ${lessonNumber ? `<p><a href="${escapeHtml(guide.records || 'student-records.html')}" target="_blank" rel="noopener">打開學習紀錄表 ↗</a></p>` : ''}
      ${guide.exit ? `
        <p class="learning-guide__exit">
          <strong>離堂檢核（老師指定時做）</strong> ${escapeHtml(guide.exit)}
          依上方必交項目回班級平台繳交。
          網頁作答用來練習，正式成績依老師說明。
          <a href="#adaptive-practice">換一題練習 →</a>
        </p>
      ` : ''}
    </div>
  `;
  main.parentNode.insertBefore(section, main);
})();
