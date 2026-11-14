(() => {
  const { active, escapeHtml } = window.CourseScenarios;
  const { defense, inventory, duel } = active;
  const guides = {
    '1150701.html': {
      grade: '七年級｜第 1 課',
      action: '辨認 Scratch 積木，練習判斷個資、素材授權和可疑連結。',
      exit: '選一塊積木，說明何時執行、會改變什麼；再舉一個公開作品前要檢查的資訊安全情境。'
    },
    '1150702.html': {
      grade: '七年級｜第 2 課',
      action: '先預測程式結果，再用循序、選擇和重複三種結構試跑。',
      exit: '選一段分支或迴圈，先預測更改條件或次數後的結果，再執行並指出第一個差異。'
    },
    '1150703.html': {
      grade: '七年級｜第 3 課',
      action: '用迴圈畫三角形和五邊形，試試轉角改變後圖形會怎麼變。',
      exit: '換一個邊數，寫出重複次數與轉角，實際繪圖後說明圖形是否閉合。'
    },
    '1150704.html': {
      grade: '七年級｜第 4 課',
      action: '用變數改變每輪的邊長，比較更新積木放在「移動」前後的螺旋。',
      exit: '自選初始值與增加量，預測前三輪數值；移動更新積木後比較第一輪的差異。'
    },
    '1150705.html': {
      grade: '七年級｜第 5 課',
      action: '用迴圈和變數畫曼陀羅，換兩組設定觀察圖形差異。',
      exit: '比較兩組不同設定，指出哪個數值改變圖形；進階者說明參數如何重複使用積木。'
    },
    '1150706.html': {
      grade: '七年級｜第 6 課',
      action: `做一個可調整參數的${defense.project}，用測試結果找出有效且省資源的設定。`,
      exit: '用自己的三組參數測試表，說明哪組有效且較省資源，並指出一次修正與重測。'
    },
    '1150801.html': {
      grade: '八年級｜第 1 課',
      action: `練習增刪清單項目，再從第 1 項開始逐項找${inventory.kind}。`,
      exit: '換一個目標項目，先猜位置，再記錄找到或找不到的每次比較與停止原因。'
    },
    '1150802.html': {
      grade: '八年級｜第 2 課',
      action: '用清單依序播放《小星星》，改一個音符再聽一次。',
      exit: '改動一個音符或交換兩項，預測播放順序並驗證，說明清單索引如何控制旋律。'
    },
    '1150803.html': {
      grade: '八年級｜第 3 課',
      action: '逐筆累加，比較多筆、單筆和空清單的總和與平均。',
      exit: '換一組數值，追蹤每輪累計值；再用空清單說明平均值為何不能直接計算。'
    },
    '1150804.html': {
      grade: '八年級｜第 4 課',
      missionGoal: '替先遣隊抽出四名不同的隊員。每輪抽到的座號都要從候選清單移除。',
      action: '先用網頁模擬器試抽，再到 Scratch 寫出抽籤程式。',
      exit: '記錄一次抽取前後兩個清單，指出候選數量與已選數量各變多少，以及避免重複的原因。'
    },
    '1150805.html': {
      grade: '八年級｜第 5 課',
      action: '試著把牌隨機移到新清單，再用 Scratch 把數字由小排到大，比較洗牌和排序。',
      exit: '用新數字牌預測第一次比較是否交換，執行後核對；再說明洗牌與排序的目標差別。'
    },
    '1150806.html': {
      grade: '八年級｜第 6 課',
      action: '用四個自訂積木完成對決，再測試裝備夠用、不夠用和會不會重複。',
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
  const planHref = guide.lessonPlan || `lesson-plan-grade-${planGrade}.html#lesson-${lessonNumber}`;
  const { title: missionTitle } = active.grades[planGrade].cards[lessonNumber - 1];
  const title = guide.title || missionTitle;
  const heading = missionTitle === title ? title : `${missionTitle}（${title}）`;
  const mission = document.createElement('section');
  mission.id = 'learning-guide-heading';
  mission.className = 'learning-guide learning-guide--mission';
  mission.setAttribute('aria-labelledby', 'learning-guide-title');
  mission.innerHTML = `
    <div class="learning-guide__card">
      <div class="learning-guide__top">
        <span class="learning-guide__tag">${escapeHtml(guide.grade)}</span>
        <a class="learning-guide__teacher" href="${escapeHtml(planHref)}" target="_blank" rel="noopener">教師備課：本課教案 ↗</a>
      </div>
      <h1 id="learning-guide-title">${escapeHtml(heading)}</h1>
      <p>${escapeHtml(guide.missionGoal || guide.action)}</p>
    </div>`;
  section.innerHTML = `
    <div class="learning-guide__card">
      <div class="learning-guide__grid">
        <div class="learning-guide__item"><strong>從哪裡開始</strong>${guide.missionGoal ? `<div>${escapeHtml(guide.action)}</div>` : ''}<button type="button" class="learning-guide__start" data-lesson-start disabled>載入活動中…</button><p class="learning-guide__status" role="status"></p></div>
        <div class="learning-guide__item"><strong>最後交什麼</strong>
          ${guide.evidence?.length ? `<ul class="evidence-list" role="list">${guide.evidence.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p>請參考本課教案。</p>'}
          <a class="learning-guide__records" href="${escapeHtml(guide.records || 'student-records.html')}" target="_blank" rel="noopener">打開學習紀錄表 ↗</a>
        </div>
      </div>
      <div class="learning-guide__links">
        <a href="${escapeHtml(guide.overview || `1150${planGrade}00.html`)}" data-course-direction="outline">回到課程總覽</a>
        <details class="learning-guide__story"><summary>課程情境</summary></details>
      </div>
    </div>
  `;
  main.parentNode.insertBefore(section, main);
  section.before(mission);
  const story = section.querySelector('.learning-guide__story');
  const header = document.querySelector('body > header');
  if (header) story.append(header);
  else story.remove();
})();
