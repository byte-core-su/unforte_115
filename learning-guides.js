(() => {
  const guides = {
    '1150700.html': {
      grade: '七年級課程總覽',
      title: '從積木思考到自主創作',
      goal: '用六個任務建立「讀程式、預測結果、動手實作、除錯說明」的完整學習循環。',
      action: '先完成起步診斷，再依序挑戰三大結構、迴圈、變數與自訂積木；最後把它們整合成一個可操作的防禦作品。',
      evidence: '每課保留一張作品截圖或程式說明；完成專題時能指出自己使用的事件、迴圈、變數與自訂積木。',
      check: '我不只會把積木接起來，也能說出每一段程式為什麼要這樣設計。'
    },
    '1150701.html': {
      grade: '七年級｜第 1 課',
      title: '起步診斷：讀懂積木並啟動專案',
      goal: '辨識事件、動作、控制、外觀與變數積木，確認自己已具備進入課程的 Scratch 基礎。',
      action: '完成測驗後，挑一題答錯或猶豫的題目，寫下「這個積木在什麼時候執行、會改變什麼」。',
      evidence: '測驗結果加上一句自己的積木用途說明；若未達標，先回到 Scratch 做一個綠旗啟動的小作品。',
      check: '看到一段程式時，我能先找到開始的事件，再預測角色會做什麼。'
    },
    '1150702.html': {
      grade: '七年級｜第 2 課',
      title: '程式三大結構：先預測，再執行，再除錯',
      goal: '區分循序、選擇與重複結構，並用輸入、處理、輸出描述程式邏輯。',
      action: '每個練習先在執行前寫下預測；結果不同時，圈出第一個造成差異的積木並修正。',
      evidence: '完成三種結構的配對，並能舉出一個「條件不成立」時程式會走向何處的例子。',
      check: '我能用「如果……否則……」解釋分支，也能說明迴圈省下了哪些重複指令。'
    },
    '1150703.html': {
      grade: '七年級｜第 3 課',
      title: '迴圈繪圖：把重複指令變成多邊形',
      goal: '利用重複執行與轉角規律，畫出可預測的正多邊形。',
      action: '先手算邊數與每次轉角，再用迴圈完成圖形；改變邊數後觀察哪些量必須一起改。',
      evidence: '至少完成一個三角形與一個五邊形，並在作品中標註「重複次數」和「轉向角度」。',
      check: '我能解釋為什麼正 N 邊形每次要轉 360 ÷ N 度。'
    },
    '1150704.html': {
      grade: '七年級｜第 4 課',
      title: '變數控制：讓圖形在迴圈中持續改變',
      goal: '理解變數是可記錄、可更新的資料，並用它控制螺旋圖形的邊長或角度。',
      action: '先追蹤前三圈變數的值，再決定更新積木應放在迴圈的前面還是後面，最後比較兩種結果。',
      evidence: '交出一張變數追蹤表與一個螺旋作品，並說明一次「放錯位置」造成的差異。',
      check: '我能指出變數的初始值、更新規則，以及它如何改變每一輪的畫面。'
    },
    '1150705.html': {
      grade: '七年級｜第 5 課',
      title: '自訂積木與參數：把重複工作封裝起來',
      goal: '將重複程式整理成自訂積木，並用參數讓同一段程式能產生不同圖形。',
      action: '先找出重複出現的積木群，替它命名；接著只改參數，不改積木內部，觀察輸出如何改變。',
      evidence: '建立一個至少帶有一個參數的自訂積木，並以兩組不同輸入產生不同結果。',
      check: '我能說明「積木本體不變、參數改變」為什麼能提高程式的可重用性。'
    },
    '1150706.html': {
      grade: '七年級｜第 6 課',
      title: '防禦系統專題：設計、測試、說明',
      goal: '整合事件、迴圈、變數與自訂積木，完成一個有明確規則的互動防禦系統。',
      action: '先畫出程式流程，再完成可操作原型；使用至少三組測試情境，記錄問題與修正方式。',
      evidence: '專題需有可啟動的互動、清楚的勝敗或回饋規則，以及一段 60 秒的作品說明。',
      check: '我能用「功能、程式結構、測試結果」三件事向同學說明我的作品。'
    },
    '1150800.html': {
      grade: '八年級課程總覽',
      title: '把清單當成可追蹤的資料',
      goal: '在每一課都用「執行前、執行中、執行後」追蹤清單狀態，將 Scratch 操作連結到演算法思考。',
      action: '遇到清單操作先畫資料表；遇到隨機或洗牌先寫出演算法步驟與不變條件，再執行程式。',
      evidence: '每課留下至少一張清單狀態追蹤表；專題要提供測試案例，證明資料規則真的成立。',
      check: '我能分辨「資料本身」與「處理資料的步驟」，並用例子驗證程式。'
    },
    '1150801.html': {
      grade: '八年級｜第 1 課',
      title: '清單基本操作：每一步都看得見資料變化',
      goal: '掌握新增、插入、替換、刪除、讀取與長度等操作，並正確理解索引位置。',
      action: '每按一次操作積木，就在紙上或表格寫下清單的更新結果；特別比較「加入最後」與「插入第 N 項」。',
      evidence: '完成至少四種操作的前後對照，並解釋索引值改變時哪個項目受到影響。',
      check: '我能在不執行程式前，正確寫出一次插入或刪除後的清單內容。'
    },
    '1150802.html': {
      grade: '八年級｜第 2 課',
      title: '音符清單：依序走訪資料',
      goal: '理解清單可儲存一連串資料，程式必須依索引順序讀取，才能播放正確旋律。',
      action: '先把四個音符寫成索引與內容的對照表，再預測播放順序；修改其中一項並聽出差異。',
      evidence: '完成一段可播放旋律，並能指出第 N 個音符在清單與程式中的對應位置。',
      check: '我能說明迴圈中的索引值如何讓程式逐項讀取清單。'
    },
    '1150803.html': {
      grade: '八年級｜第 3 課',
      title: '資料統計：追蹤加總與平均的過程',
      goal: '使用累加器與清單走訪，計算總和與平均，並理解每一步的中間值。',
      action: '建立「目前項目、累計總和、已處理筆數」三欄追蹤表，先手算再核對程式輸出。',
      evidence: '用正常資料、單筆資料與空清單三種案例測試，說明哪些情況需要額外處理。',
      check: '我能區分總和與平均，也能解釋空清單為何不能直接拿來除。'
    },
    '1150804.html': {
      grade: '八年級｜第 4 課',
      title: '隨機抽取：建立不重複的選人規則',
      goal: '以「候選清單」與「已選清單」控制隨機抽取，確保同一位同學不會重複被選到。',
      action: '每抽一次都記錄兩個清單的狀態；先說出不變條件，再檢查程式是否真的維持它。',
      evidence: '完成四次不重複抽取，並用資料表證明候選數量每次都少一人。',
      check: '我能說出「抽到後從候選清單移除」為什麼是避免重複的關鍵。'
    },
    '1150805.html': {
      grade: '八年級｜第 5 課',
      title: '洗牌演算法：資料移轉與規則驗證',
      goal: '理解洗牌不是只靠隨機，而是反覆選取、移除與移轉資料的演算法。',
      action: '用 5 張牌手動追蹤每一輪：來源清單、隨機索引、取出的牌與新清單；最後檢查有沒有遺漏或重複。',
      evidence: '提供一次洗牌紀錄，證明輸入與輸出牌數相同、每張牌恰好出現一次。',
      check: '我能用自己的話描述洗牌迴圈的步驟與兩個必須保持成立的規則。'
    },
    '1150806.html': {
      grade: '八年級｜第 6 課',
      title: '星際爭霸戰：用資料與測試完成遊戲',
      goal: '把清單、隨機、走訪與資料更新整合為可測試的遊戲規則。',
      action: '先列出敵人資料、玩家資料與勝敗條件；以至少三組測試案例檢查生命值、分數與清單更新。',
      evidence: '完成可操作遊戲，並附上「正常、極端、錯誤輸入」三種測試結果與一次修正紀錄。',
      check: '我能用資料表與測試結果證明遊戲規則不是剛好成功，而是可重複驗證。'
    }
  };

  const page = window.location.pathname.split('/').pop() || 'index.html';
  const guide = guides[page];
  const main = document.querySelector('main');
  if (!guide || !main) return;

  const style = document.createElement('style');
  style.textContent = `
    .learning-guide { max-width: 72rem; margin: 1.5rem auto 0; padding: 0 1.5rem; font-family: "Noto Sans TC", system-ui, sans-serif; }
    .learning-guide__card { border: 1px solid #bfdbfe; border-radius: 1.25rem; background: linear-gradient(135deg, #eff6ff, #f8fafc); padding: 1.25rem; box-shadow: 0 8px 24px rgba(30, 64, 175, .08); }
    .learning-guide__tag { display: inline-block; margin-bottom: .5rem; color: #1d4ed8; font-size: .75rem; font-weight: 700; letter-spacing: .08em; }
    .learning-guide h2 { margin: 0 0 .5rem; color: #1e3a8a; font-size: clamp(1.25rem, 3vw, 1.6rem); }
    .learning-guide__goal { margin: 0; color: #334155; line-height: 1.65; }
    .learning-guide__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: .75rem; margin-top: 1rem; }
    .learning-guide__item { border-radius: .85rem; background: #fff; padding: .85rem; color: #334155; font-size: .92rem; line-height: 1.6; }
    .learning-guide__item strong { display: block; color: #1d4ed8; margin-bottom: .2rem; }
    .learning-guide__check { margin: .9rem 0 0; padding: .75rem .9rem; border-radius: .75rem; background: #dbeafe; color: #1e3a8a; font-weight: 600; line-height: 1.55; }
  `;
  document.head.appendChild(style);

  const section = document.createElement('section');
  section.className = 'learning-guide';
  section.setAttribute('aria-label', '本課學習導航');
  section.innerHTML = `
    <div class="learning-guide__card">
      <span class="learning-guide__tag">${guide.grade}｜學習導航</span>
      <h2>${guide.title}</h2>
      <p class="learning-guide__goal"><strong>本課目標：</strong>${guide.goal}</p>
      <div class="learning-guide__grid">
        <div class="learning-guide__item"><strong>挑戰任務</strong>${guide.action}</div>
        <div class="learning-guide__item"><strong>完成證據</strong>${guide.evidence}</div>
      </div>
      <p class="learning-guide__check">離堂檢核：${guide.check}</p>
    </div>
  `;
  main.parentNode.insertBefore(section, main);
})();
