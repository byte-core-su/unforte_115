(() => {
  const { active, escapeHtml } = window.CourseScenarios;
  const { defense, inventory, duel } = active;
  const oneMinute = 'https://suyungsheng-kh.github.io/one_minute/docs/';
  const videos = {
    'control-sequence': { title: '循序結構' },
    'control-selection': { title: '選擇結構' },
    'control-repetition': { title: '重複結構' },
    'loop-repeat': { title: '重複幾次？把相同動作交給迴圈' },
    variables: { title: '變數', file: 'series/scratch/videos/scratch-variables-yunjhe-v1.mp4' },
    lists: { title: '清單', file: 'series/scratch/videos/scratch-lists-yunjhe-v1.mp4' },
    'search-linear': { title: '循序搜尋' },
    'bubble-sort': { title: '氣泡排序', file: 'series/sorting/videos/bubble-sort.mp4' },
    'custom-block-jump': { title: '把跳躍，變成一個積木' },
    'custom-block-height': { title: '同一個積木，跳得不一樣' },
    'custom-block-repeat': { title: '高度與次數，各管一件事' }
  };
  const lessonVideos = {
    '1150701.html': [['control-sequence', '點綠旗後，看看積木從哪裡開始執行。回到本課，再預測角色會在什麼時候移動。']],
    '1150702.html': [
      ['control-sequence', '先更新再讀出餐號。想想本課計算平均時，哪一步也得先做。'],
      ['control-selection', '兩種回答會走不同分支。回到本課，看看 60 分與低於 60 分各走哪一條路。'],
      ['control-repetition', '找出每一輪都做的動作，以及輪數做完才做的動作。回到本課，用同樣方法看累加程式。']
    ],
    '1150703.html': [['loop-repeat', '影片中「前進、收星」做完才算一輪。畫多邊形時，一輪做的是「走一段、轉一個角」。']],
    '1150704.html': [['variables', '比較「設為」和「增加」的效果。再想想本課的邊長要在畫線前還是畫線後增加。']],
    '1150705.html': [['custom-block-repeat', '影片把一整次跳躍重複多遍。本課要先完成一個小圖形，再把整個圖形旋轉重畫。']],
    '1150706.html': [['custom-block-height', '同一套積木，改輸入就能跳出不同高度。回到本課，先只改一個參數，比較防禦網有什麼變化。']],
    '1150801.html': [
      ['lists', '看看背包怎麼依順序保留多件道具。刪掉一件後，後面的道具編號會怎麼變？'],
      ['variables', '「設為」會換掉變數原先的值。和清單比較，哪一個能保留每筆登記紀錄？'],
      ['search-linear', '沿著清單從第 1 項逐一比對。回到本課，分別試一次找到和找不到的資料。']
    ],
    '1150802.html': [['lists', '刪除或替換道具會影響清單中的位置與內容。回到本課，先預測改動第 3 項會影響哪一個音。']],
    '1150803.html': [['loop-repeat', '找出迴圈中每輪會做的動作。回到本課，每讀一筆就更新總和，全部讀完才算平均。']],
    '1150804.html': [['lists', '注意道具怎麼從清單移除。抽籤時也要移除已抽到的人，下次才能從剩下的人選。']],
    '1150805.html': [['bubble-sort', '觀察哪一對相鄰數字會交換，哪一對會保留。回到本課，先洗牌，再用這個規則排序。']],
    '1150806.html': [['custom-block-jump', '注意「定義」積木和「呼叫」積木的時機。再看看本課怎麼分開處理庫存、洗牌、分配和對決。']]
  };

  function mountLessonVideos(card, clips, startButton) {
    const details = document.createElement('details');
    details.className = 'learning-guide__video';
    const summary = clips.length === 1 ? videos[clips[0][0]].title : `一分鐘認識（${clips.length} 集）`;
    details.innerHTML = `
      <summary>概念動畫｜${escapeHtml(summary)}</summary>
      ${clips.length > 1 ? `<label>選擇影片 <select>${clips.map(([id], index) =>
        `<option value="${index}">${escapeHtml(videos[id].title)}</option>`).join('')}</select></label>` : ''}
      <p class="learning-guide__video-prompt"></p>
      <video controls playsinline preload="none"></video>
      <p class="learning-guide__video-status" role="status" hidden>影片暫時無法播放。可開啟影片原頁，或繼續本課活動。</p>
      <a target="_blank" rel="noopener">影片原頁、字幕與練習 ↗</a>`;
    const select = details.querySelector('select');
    const video = details.querySelector('video');
    const prompt = details.querySelector('.learning-guide__video-prompt');
    const status = details.querySelector('.learning-guide__video-status');
    const original = details.querySelector('a');

    function loadClip() {
      const [id, takeaway] = clips[select ? Number(select.value) : 0];
      const { title, file = `media/${id}.mp4` } = videos[id];
      const source = `${oneMinute}${file}`;
      if (video.getAttribute('src') === source && !video.error) return;
      video.pause();
      status.hidden = true;
      prompt.textContent = takeaway;
      video.setAttribute('aria-label', `${title}｜一分鐘認識`);
      video.poster = `${oneMinute}posters/${id}.jpg`;
      video.src = source;
      original.href = `${oneMinute}lesson.html?id=${id}`;
    }

    video.addEventListener('error', () => { status.hidden = false; });
    select?.addEventListener('change', loadClip);
    details.addEventListener('toggle', () => {
      if (details.open) loadClip();
      else video.pause();
    });
    startButton.addEventListener('click', () => {
      video.pause();
      details.open = false;
    });
    card.append(details);
  }

  const guides = {
    '1150701.html': {
      grade: '七年級｜第 1 課',
      action: '辨認 積木，練習判斷個資、素材授權和可疑連結。',
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
      action: `比較變數和清單怎麼存同一筆資料，再練習增刪清單，從第 1 項開始逐項找${inventory.kind}。`,
      exit: '換一個目標項目，先猜位置，再記錄找到或找不到的每次比較與停止原因。'
    },
    '1150802.html': {
      grade: '八年級｜第 2 課',
      action: '用清單記下《小星星》的音符，讓變數「第幾個音」指向現在要播的位置。',
      exit: '改動一個音符或交換兩項，預測播放順序並驗證，說明清單索引如何控制旋律。'
    },
    '1150803.html': {
      grade: '八年級｜第 3 課',
      action: '清單保留每筆資料，變數「累計總和」每讀一筆就更新。用這個方法比較多筆、單筆和空清單。',
      exit: '換一組數值，追蹤每輪累計值；再用空清單說明平均值為何不能直接計算。'
    },
    '1150804.html': {
      grade: '八年級｜第 4 課',
      missionGoal: '替先遣隊抽出四名不同的隊員。每輪抽到的座號都要從候選清單移除。',
      action: '先用網頁模擬器試抽，再在積木程式模擬器組裝出抽籤程式。',
      exit: '記錄一次抽取前後兩個清單，指出候選數量與已選數量各變多少，以及避免重複的原因。'
    },
    '1150805.html': {
      grade: '八年級｜第 5 課',
      action: '試著把牌隨機移到新清單，再用 積木程式把數字由小排到大，比較洗牌和排序。',
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
  const planGrade = page.startsWith('11508') ? 8 : 7;
  const lessonNumber = Number(page.slice(6, 7));
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
      </div>
      <h1 id="learning-guide-title">${escapeHtml(heading)}</h1>
      <p>${escapeHtml(guide.missionGoal || guide.action)}</p>
    </div>`;
  section.innerHTML = `
    <div class="learning-guide__card">
      <div class="learning-guide__grid">
        <div class="learning-guide__item"><strong>從哪裡開始</strong>${guide.missionGoal ? `<div>${escapeHtml(guide.action)}</div>` : ''}<button type="button" class="learning-guide__start" data-lesson-start disabled>載入活動中…</button><p class="learning-guide__status" role="status"></p></div>
        <div class="learning-guide__item"><strong>最後交什麼</strong>
          ${guide.evidence?.length ? `<ul class="evidence-list" role="list">${guide.evidence.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p>依老師在班級平台公布的作業要求繳交。</p>'}
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
  mountLessonVideos(mission.querySelector('.learning-guide__card'), lessonVideos[page], section.querySelector('[data-lesson-start]'));
  const story = section.querySelector('.learning-guide__story');
  const header = document.querySelector('body > header');
  if (header) story.append(header);
  else story.remove();
})();
