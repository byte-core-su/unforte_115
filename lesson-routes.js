// 12 個 積木程式單元的學習路線設定。每課固定為：
// 認識任務 → 網頁活動與實作 → 換題練習 → 離堂任務
// 活動以操作結果開啟下一步；閱讀、回顧與離堂任務要先留下作答。
(() => {
  'use strict';
  const page = location.pathname.split('/').pop();
  const guide = window.LearningGuide || {};
  const labels = window.LessonLabels;
  const drawLesson = window.LessonAssessments['1150804.html'];
  const draw = drawLesson.activity;
  const activity = (selector, pending) => ({ selector, pending });
  const achieved = (selector, pending) => activity(`${selector}[data-lesson-activity]`, pending);
  const exitQuestions = {
    '1150701.html': '選一塊積木。它何時執行，會改變什麼？',
    '1150702.html': '你改了哪一個條件或次數？執行結果有什麼變化？',
    '1150703.html': '你畫了幾邊形？重複幾次、每次轉幾度才會閉合？',
    '1150704.html': '把「長度增加」移到「移動」前後，第一輪移動距離有什麼差異？',
    '1150705.html': '你改了哪個數值？圖形有什麼變化？',
    '1150706.html': '三組實測中，哪組有效又最省資源？你改了哪個參數，重測結果如何？',
    '1150801.html': '選一筆搜尋紀錄。程式在第幾次比較後停下來？為什麼？',
    '1150802.html': '你改了清單中的哪一項？播放到哪裡時聽出差異？',
    '1150803.html': '空清單可以直接算平均嗎？請用清單長度說明原因。',
    '1150804.html': '抽到一個座號並刪除後，兩份清單各增減幾人？為什麼下一輪不會再抽到他？',
    '1150805.html': '選一次相鄰比較。哪兩個數有沒有交換？為什麼？',
    '1150806.html': '裝備不足時，你的哪個自訂積木要先做檢查？要檢查什麼？'
  };

  const intro = (extra, warmup) => ({
    title: '認識任務',
    anchors: ['#learning-guide', ...extra],
    entry: warmup,
    todo: warmup ? '登記一筆新資料，看變數和清單怎麼變，再找回第 2 筆。' : '看完今天的任務和繳交項目，就可以開始。'
  });

  function listWarmup() {
    const { tool, chip, pack } = window.CourseScenarios.active.inventory.items;
    return {
      items: [tool.label, chip.label, pack.label],
      correct: 1
    };
  }
  const program = step => ({
    title: '積木程式實作',
    anchors: ['#block-program'],
    activity: activity('#block-program[data-program-passed]', '排好積木後按「比對檢查」，所有預設測試通過就能繼續。'),
    ...step,
    hints: [...(step.hints || []), '做到一半卡住，可以點上方已完成的節點回看參考積木，或舉手請老師幫忙。']
  });
  const practice = (optional = true) => ({
    title: '換題練習',
    anchors: ['#adaptive-practice'],
    optional,
    activity: achieved('#adaptive-practice', optional ? '請先答對一題，或按「略過選做」。' : '答對一題後，就能前往離堂任務。'),
    todo: `先選「標準」（沒把握就選「基礎」）。每題先預測答案，再按「${labels.checkPrediction}」。`,
    checks: ['至少答對一題，並讀完回饋'],
    hints: ['答錯會先給提示，可以同一題再試一次。', '覺得太難就改選「基礎」，選級不影響成績。']
  });
  const exit = () => ({
    title: '離堂任務',
    todo: '打開本課紀錄表，把下列成果整理成一份，交到老師指定的班級平台。',
    submission: true,
    evidence: guide.evidence,
    checks: [guide.successCriteria || '已依老師說明檢查成果'],
    hints: ['有積木程式時，可回到實作步驟複製程式與試跑紀錄，再貼到作業。'],
    link: { href: guide.records || 'student-records.html', label: '打開學習紀錄表 ↗' }
  });
  const route = (introExtra, middle, { warmup, requirePractice = false } = {}) => {
    const steps = [
      intro(introExtra, warmup), ...middle.filter(step => !step.optional),
      ...middle.filter(step => step.optional), practice(!requirePractice), exit()
    ];
    const plannedStart = steps.findIndex(step => step.secondPeriod);
    const secondPeriod = plannedStart >= 0 ? plannedStart : steps.findIndex(step => step.anchors?.includes('#block-program'));
    return steps.map((step, index) => ({ ...step, period: index < secondPeriod ? 1 : 2 }));
  };
  const tab = (name, runs) => ({
    activity: activity(
      `body:has(#${name}-ipo-msg[data-lesson-activity]):has(${runs})`,
      name === 'sel' ? '請試出及格與不及格各一次，再通過 IPO 配對。' : '請先執行計算，再通過 IPO 配對。'
    ),
    enter: () => window.switchL2Tab?.(name),
    review: () => window.switchL2Tab?.(name, false)
  });

  const routes = {
    '1150701.html': route([], [
      { title: '積木大考驗', anchors: [{ up: '#route-scratch-diagnostic' }],
        activity: achieved('#quiz-result-screen', '先完成 10 題，看完作答結果。'),
        todo: '按「開始測驗」完成 10 題積木診斷，看完結果。',
        checks: ['完成 10 題並看完結果', '選一塊積木，寫下何時執行、會改變什麼'],
        hints: ['先看積木顏色：黃色是事件、藍色是動作、橘色是控制、紫色是外觀、橘紅色是變數。', '答錯沒關係，診斷是用來找起點，不影響進入下一課。'] },
      { title: '資訊使用判斷', anchors: ['#curriculum-lab'], secondPeriod: true,
        activity: achieved('#curriculum-lab', '先選完三題，按下檢查，直到每題都答對。'),
        todo: `三個情境各選一個做法，按「${labels.checkJudgment}」。`,
        checks: ['三題都檢查過，並讀完每題的原因'],
        hints: ['想一想：這樣做會不會讓別人知道你的真實姓名、帳號或密碼？', '網路上的圖片、音樂要先確認授權；看不出來就改用可使用的素材。'] },
      program({ title: '綠旗小程式', optional: true,
        todo: '在模擬器排好事件和動作積木，執行後確認角色往前移動。',
        checks: ['執行後角色移動 10 點', '能說出哪塊積木讓程式開始'],
        hints: ['從黃色「當綠旗被點擊」開始，下面接藍色「移動 10 點」。'] })
    ]),
    '1150702.html': route([], [
      { title: '循序結構', anchors: [{ common: ['#l2-tab-seq', '#l2-content-rep'] }], ...tab('seq', '#seq-out[data-lesson-activity]'),
        todo: '先預測平均數再按「計算」，接著依步驟完成 IPO 配對，按「驗證配對」。',
        checks: ['先預測，再按「計算」核對過', 'IPO 配對驗證通過'],
        hints: ['Input 是使用者給的資料，Process 是電腦計算，Output 是顯示結果。', '流程從「開始」到「結束」由上往下，一次做一件事。'] },
      { title: '選擇結構', anchors: [{ common: ['#l2-tab-seq', '#l2-content-rep'] }], ...tab('sel', '#sel-out[data-lesson-activity="both"]'),
        todo: '輸入成績，先預測會不會及格，再依步驟完成配對驗證。',
        checks: ['測過一次及格、一次不及格', '配對驗證通過'],
        hints: ['「如果…那麼…否則」：條件成立走「那麼」，不成立走「否則」。', '故意輸入一組會不及格的成績，看程式走哪一邊。'] },
      { title: '重複結構', anchors: [{ common: ['#l2-tab-seq', '#l2-content-rep'] }], ...tab('rep', '#iter-out[data-lesson-activity]'),
        todo: '先預測 1 加到 N 的總和，再執行並完成配對驗證。',
        checks: ['先預測，再執行核對過', '配對驗證通過'],
        hints: ['重複執行 N 次：框裡的積木會做 N 遍。', 'N 很小時（例如 3），可以先用心算 1+2+3 驗證。'] },
      program({
        todo: '在模擬器組合循序、選擇和重複積木。切換兩組資料，先預測結果再分別執行。',
        checks: ['已組合三種結構並測過兩組資料', '選一段分支或迴圈，記下預測與實際結果；結果不同時，找出第一個造成差異的積木'],
        hints: ['先算平均，再用平均判斷及格。算完 1 到 N 的總和後，再顯示結果。'] })
    ]),
    '1150703.html': route([], [
      { title: '畫出直線', anchors: [{ up: '#route-pen-line' }],
        activity: achieved('#pen-flow-msg', '先把六塊積木依序排好，讓探測車畫出直線。'),
        todo: '照右側的功能說明，把左邊的積木依序點進組裝區；組裝正確會解鎖動畫。',
        checks: ['畫筆積木組裝正確，看到動畫畫出直線'],
        hints: ['順序：先清除舊圖、設定顏色和粗細、下筆、移動、停筆。', '點錯的積木可以再點一下退回。'] },
      { title: '比較兩種正方形程式', anchors: ['#route-square-manual-panel', '#route-square-loop-panel'],
        activity: activity('body:has(#sq-flow-msg[data-lesson-activity]):has(#lesson-3-feedback[data-lesson-activity])', '先用移動和右轉排出正方形，再填好迴圈的次數和角度。'),
        todo: '先排積木畫正方形，再把重複的動作用一個迴圈表示。',
        checks: ['手動程式畫出正方形', '迴圈的重複次數和每次轉角都正確'],
        hints: ['找出一直重複的兩個動作。重複次數等於邊數，每次轉角是 360 ÷ 邊數。'] },
      { title: '畫三角形、五邊形與修正', anchors: [{ up: '#route-polygon' }],
        activity: achieved('#poly-feedback', '先試畫右轉 90 度的三角形，再修到閉合，最後畫出閉合的五邊形。'),
        todo: '三角形先試每次右轉 90 度，看終點在哪裡；修正角度後重畫。接著換成五邊形，算出轉角再畫。',
        checks: ['觀察三角形未閉合，再修正到閉合', '換成五邊形也能畫到閉合'],
        hints: ['每次轉角用 360 ÷ 邊數。'] },
      program({
        todo: '用重複積木畫三角形和五邊形，記下邊數與轉角。附上前一步的修正紀錄。',
        checks: ['三角形與五邊形都閉合，並標出重複次數和轉角', '記下轉角改錯及修正後的差異'],
        hints: ['把三角形的轉角暫改為 90 度，就會看到圖形未閉合。'] })
    ]),
    '1150704.html': route([], [
      { title: '第一階段：手動畫螺旋', anchors: [{ up: '#route-manual-spiral' }],
        activity: achieved('#var-flow-msg', '先排好移動和轉向積木，讓模擬器畫出手動螺旋。'),
        todo: '把積木由短到長（10 → 20 → 30 → 40 點）排好，手動畫出螺旋。',
        checks: ['手動螺旋畫出來'],
        hints: ['每條邊都比上一條長 10 點。', '每畫完一條邊都要右轉 90 度。'] },
      { title: '第二階段：用變數畫螺旋', anchors: [{ up: '#route-variable-spiral' }],
        activity: activity('body:has(#loop-flow-msg[data-lesson-activity]):has(#spiral-feedback[data-lesson-activity])', '先排好迴圈積木，再畫兩種不同角度的螺旋。'),
        todo: '把 4 塊積木排進「重複執行」，讓「長度」變數每次增加；再選一種螺旋（例如三角螺旋）按「啟動螺旋繪圖」。',
        checks: ['變數版螺旋畫出來', '試過另一種角度的螺旋', '能說出前三圈「長度」的值'],
        hints: ['「長度」要先設為 0，再在迴圈裡每次改變 10。', '「改變 10」放在移動之前或之後，第一圈的長度會不一樣。'] },
      program({
        todo: '在模擬器畫螺旋。把增加長度的積木分別放在「移動」前後，各執行一次，比較第一輪移動的長度。',
        checks: ['螺旋作品完成', '追蹤表寫出前三圈的變數值', '說得出更新積木換位置後的差異'],
        hints: ['從執行結果抄下前三輪移動長度。'] })
    ]),
    '1150705.html': route([], [
      { title: '換參數畫曼陀羅', anchors: [{ up: '#route-mandala-parameters' }],
        activity: achieved('#mandala-feedback', '換兩組不同的邊數或圖形數，分別等圖形畫完。'),
        todo: '選兩組邊數 N 與圖形數 X（例如 3 和 12、5 和 10）。每組按「傳遞變數並執行」，比較畫出的圖形。',
        checks: ['畫了兩組不同設定的圖形', '能指出是哪個數值改變了圖形'],
        hints: ['N 決定每個小圖形的邊數，X 決定一圈畫幾個。'] },
      { title: '曼陀羅延伸', anchors: [{ up: '#route-define-polygon' }, { up: '#route-assemble-mandala' },
          { up: '#route-nested-block' }, { up: '#route-rainbow-mandala' }], optional: true,
        response: '記下你選的一項：自訂積木的參數控制什麼，或顏色積木該放在哪裡？',
        todo: '選一項來試：定義多邊形積木、改用自訂積木重複畫圖，或讓每個小圖形換色。',
        checks: ['寫下一項做法與原因'],
        hints: ['N 控制邊數；要讓每個圖形換一次顏色，就把換色放在畫圖形的迴圈裡。'] },
      program({
        todo: '在模擬器用重複積木呼叫「畫正 N 邊形」。執行兩組設定，寫下改了什麼數值，以及圖形怎麼變。',
        checks: ['兩組不同設定的圖形完成', '寫出迴圈或變數如何控制圖形'],
        hints: ['先畫出一個正多邊形，再把它重複並旋轉。'] })
    ]),
    '1150706.html': route([{ up: '#defense-briefing-title' }], [
      { title: '改排防禦網主程式', anchors: [{ up: '#route-defense-program' }],
        activity: achieved('#main-flow-msg', '先排好六塊主程式積木，開啟一鍵啟動。'),
        todo: '先在紙上想好流程，再把積木依序排好，讓防禦網不用詢問就能一鍵啟動。',
        checks: ['積木組裝完成，防禦網能一鍵啟動'],
        hints: ['把「詢問並等待」換成「變數 設為 數字」。', '先設定筆跡寬度、邊數和圖形數量，再下筆、呼叫「畫幾個圖形」，最後停筆。'] },
      { title: '資料分析', anchors: ['#curriculum-lab'],
        activity: achieved('#curriculum-lab', '先選一筆資料搜尋，再回到「全部」，選出預測並核對。'),
        todo: '用匿名測試資料：先搜尋指定測試，再預測哪一組有效又最省資源，按「核對預測並分析」。',
        checks: ['預測並核對過一次', '能說出平均資源消耗怎麼算'],
        hints: ['先刪掉擋不住的組，再從剩下的比消耗量。', '消耗量＝圖形數 × 筆跡寬度。'] },
      program({
        activity: activity('#block-program[data-program-passed][data-program-three-runs]', '請試跑三組不同參數，再按「比對檢查」。'),
        todo: '排好程式，用同一測試點試三組設定。從擋住的設定中選最省的一組，再改一個參數重測。用「複製多組試跑紀錄」整理結果，準備約 60 秒說明。',
        checks: ['作品能一鍵啟動', '三組測試表完成，並修正重測一次', '能用 60 秒說明作品'],
        hints: ['先設定參數，再繪圖，最後用同一個測試點比較各組結果。'] })
    ]),
    '1150801.html': route([], [
      { title: '清單操作任務', anchors: ['#route-list-missions'],
        activity: achieved('#route-list-missions', '先答對刪除預測，再將裝備整理成目標清單。'),
        todo: '比較添加和插入，預測刪除後的結果，再自行用按鈕或積木做出指定清單。記下操作前後的順序和長度。',
        checks: ['答對刪除後的第 2 項和清單長度', '目前清單的項目、順序和數量都與目標一致'],
        hints: ['索引值從 1 開始：第 1 項就是最上面那一個。', '插入會讓後面的項目往後移一格；刪除後，後面的項目往前補。'] },
      { title: '循序搜尋', anchors: ['#curriculum-lab'],
        activity: achieved('#curriculum-lab', '看完示範，答對比對範圍，再接手搜尋並正確回報。'),
        todo: '觀察示範何時停下。接著做兩題，先預測會比到第幾項，再判斷何時能回報找不到。',
        checks: ['預測的比對範圍與逐項核對的結果一致', '接手未完成的搜尋，檢查剩餘項目後才回報找不到'],
        hints: ['循序搜尋從第 1 項開始一項一項比，找到就停。', '全部比完都沒有，才能說「找不到」。'] },
      program({
        todo: '記下前面四種清單操作的結果，再在模擬器排好搜尋積木，分別測找到和找不到。',
        checks: ['有四種操作的前後對照', '搜尋程式能執行，兩筆紀錄都寫出在哪裡停和為什麼'],
        hints: ['從第 1 項開始比，找到或比完才停止。'] })
    ], { warmup: page === '1150801.html' ? listWarmup() : undefined, requirePractice: true }),
    '1150802.html': route([], [
      { title: '讀懂清單點播', anchors: [{ up: '#route-music-pseudocode' }, { up: '#route-music-blocks' },
          { up: '#route-song-library' }, { up: '#song-title' }],
        activity: achieved('#song-title', '按「依序播放清單」，等一首曲目播完。'),
        response: '音符清單記了什麼？變數「第幾個音」開始是多少，每播完一個音又怎麼變？',
        todo: '播放一首曲目時，對照積木與清單亮起的位置。記下前四個音，再寫出「第幾個音」怎麼變。',
        checks: ['完整播放一首，按順序記下前四個音', '說得出「第幾個音」怎麼決定讀哪一項'],
        hints: ['「第幾個音 改變 1」讓下一圈讀下一項。'] },
      { title: '彈奏挑戰', anchors: [{ up: '#route-audio-comparison' }], optional: true,
        activity: achieved('#route-audio-comparison', '試著上傳自己的短錄音，執行一次比對。'),
        todo: '選一段自己的短錄音，和原曲比對。請選沒有他人聲音或個資的檔案。',
        checks: ['完成一次比對，並看懂結果'],
        hints: ['結果會受雜音影響，只是練習回饋，不是評分。'] },
      { title: '錄音與素材判斷', anchors: ['#curriculum-lab'],
        activity: achieved('#curriculum-lab', '選完每個情境的答案並按檢查，直到兩題都答對。'),
        todo: `每個情境選一個做法，按「${labels.checkJudgment}」。`,
        checks: ['每題都檢查過，並讀完原因'],
        hints: ['分享錄音前想一想：裡面有沒有別人的聲音或個資？', '現成的旋律或音檔要先確認授權。'] },
      program({
        todo: '排好積木並播放短旋律。改掉第 3 個音再播一次，比較聽到的差異。',
        checks: ['短旋律能依序播放', '改動一項後，說得出聽到的差異', '寫好索引對照表（第幾項＝哪個音）'],
        hints: ['第一項的索引是 1。改第 3 個音時，記下原本和改後的數值。'] })
    ]),
    '1150803.html': route([], [
      { title: '暖身：變數累加', anchors: [{ up: '#route-accumulator-warmup' }],
        activity: achieved('#btn-warm-next', '通過邏輯配對後，按「執行下一圈」直到暖身結束。'),
        todo: '用下拉選單完成迴圈內的邏輯，按「驗證邏輯」；答對後執行，看「序號」和「累加值」怎麼變。',
        checks: ['驗證通過並執行過', '說得出前三圈的累加值'],
        hints: ['每一圈先讓序號加 1，再把序號加進累加值。'] },
      { title: '能源加總模擬器', anchors: [{ up: '#route-energy-total' }], secondPeriod: true,
        activity: achieved('#sim-btn-next', '請完成多筆、單筆和空清單三組資料的測試。'),
        todo: '按「讀取並加總」一次跑一圈，追蹤「目前項目、累計總和、已處理筆數」；再用「套用」測只有一筆和留空（空清單）。',
        checks: ['多筆資料追蹤到最後', '測過只有一筆的資料', '測過空清單，知道為什麼不能直接算平均'],
        hints: ['總和＝總和＋這一項。', '空清單有 0 筆，除以 0 沒有意義，要先判斷。'] },
      { title: '從計算到程式', anchors: [{ up: '#route-accumulator-loop' }],
        activity: achieved('#btn-reveal-pattern', '先按「找出重複的步驟」，看到索引的改寫。'),
        response: '要讓程式下一圈讀取下一項，「編號」該怎麼變？',
        todo: '按「找出重複的步驟」，看具體的計算怎麼改寫成用「編號」變數的迴圈。',
        checks: ['說得出「第 1 項、第 2 項…」怎麼改寫成「第 編號 項」'],
        hints: ['找出每一行哪個數字在變，那個數字就適合變成變數。'] },
      program({ title: '積木程式：總和與平均', optional: true,
        todo: '排好積木後按「比對檢查」，核對多筆、單筆和空清單三組結果。切換資料後，也可以按「執行本組」看逐筆累計。',
        checks: ['總和與平均正確', '單筆資料結果正確', '空清單時程式不會出錯（有先判斷）'],
        hints: ['算平均前先用「如果 清單的長度 > 0 那麼」判斷。'] })
    ]),
    '1150804.html': route([], [
      { title: '抽籤模擬器', anchors: [{ up: '#route-draw-simulator' }],
        activity: achieved('#route-draw-simulator', '抽滿四輪，每輪都要按「確認刪除」。'),
        todo: draw.preview,
        questions: { before: draw.questions.before, during: draw.questions.during },
        checks: ['已抽完 4 輪，每輪都按了「確認刪除」', '看得出座號和項次的差別，也核對了兩份清單的人數'],
        hints: ['抽到的人如果不刪掉，下一次可能又被抽到。'] },
      { title: '從建立名單到抽籤', anchors: [{ up: '#route-initialize-list' }, { up: '#route-draw-and-remove' }],
        activity: activity('body:has(#route-initialize-list[data-lesson-activity]):has(#scratch-puzzle-container[data-lesson-activity])', '完成建立名單的排序檢查，再排好抽籤積木。'),
        todo: '先排好建立名單的步驟，再組裝隨機抽取與刪除的積木。',
        checks: ['名單從 1 建到 30', '抽籤積木能移除已抽中的人'],
        hints: ['可按「切換為中文」。先清空清單，再重複「座號加 1、加入清單」。'] },
      program({
        todo: draw.practice,
        questions: { after: draw.questions.after },
        link: { href: drawLesson.records, label: '開啟本課學習紀錄表 ↗' },
        checks: [drawLesson.successCriteria],
        hints: ['隨機範圍要用「1 到 清單的長度」，不要寫死 30。'] })
    ]),
    '1150805.html': route([], [
      { title: '洗牌與排序挑戰', anchors: ['#curriculum-lab'],
        activity: achieved('#curriculum-lab', '請通過洗牌的牌數檢查，以及排序的交換和停止判斷。'),
        todo: '先看一輪洗牌怎麼移牌。接著找出正確的洗牌結果，並判斷排序何時交換、何時停止。',
        checks: ['洗牌後，每種數值出現的次數不變', '根據比較結果決定是否交換，並判斷一整輪未交換時可以停止'],
        hints: ['先數每種牌有幾張。排序時，左邊比右邊大才交換。'] },
      program({
        todo: '排好排序積木，執行兩組資料。把排序追蹤和上一個活動的洗牌紀錄貼到本課作業。',
        checks: ['排序程式能執行，並有比較與交換紀錄', '洗牌和排序前後，每個數值出現的次數都相同'],
        hints: ['前項比後項大才交換。比對各數值各有幾筆，例如原來有兩個 3，處理後也要有兩個 3。'] })
    ]),
    '1150806.html': route([], [
      { title: '觀察對決的分工', anchors: [{ up: '#route-duel-simulator' }, { up: '#route-duel-program' }],
        activity: achieved('#arena-status', '完成整備、遭遇敵軍與對決，看到戰鬥結算。'),
        response: '建立、洗牌與提取，這三段各對清單做了什麼？',
        todo: '執行一次對決。看完後對照程式，找出建立、洗牌與分配各自改動了哪份清單。',
        checks: ['看到一次戰鬥結算', '說得出三段程式各自的工作'],
        hints: ['先找出每一段用到哪一個清單。'] },
      { title: '避免抽到重複裝備', anchors: [{ up: '#route-unique-equipment' }], optional: true,
        activity: achieved('#secret-content-screen', '答對練習題就能開啟防止重複抽取的程式。'),
        todo: '做完練習題，看看程式怎麼避免抽到同一件裝備。',
        checks: ['答對練習題並看過程式範例'],
        hints: ['看完後，用自己的話說說程式怎麼避免抽到一樣的裝備。'] },
      { title: '自訂積木分工', anchors: ['#curriculum-lab'],
        activity: achieved('#curriculum-lab', '依序點選四個自訂積木，排出正確的主程式。'),
        todo: '依序選出四個自訂積木的呼叫順序，排出正確的主程式。',
        checks: ['呼叫順序正確'],
        hints: ['先有裝備庫才能洗牌，洗好才能分配，分配完才能對決。'] },
      program({
        todo: '排好四個自訂積木，測「足夠有剩」「數量不足」「剛好分完」。畫清單流程圖，修正一次再重測。',
        checks: ['四個自訂積木能運作，清單流程圖標出各積木的分工', '數量不足就停止；分配成功時，檢查兩隊沒有重複裝備，並記下剩餘數量', '記下修正後的重測結果'],
        hints: ['分配前確認庫存至少是每隊需求的兩倍。'] })
    ])
  };
  for (const [entry, steps] of Object.entries(routes)) steps.at(-1).response = exitQuestions[entry];

  const next = guide.next ? { href: guide.next, label: '前往下一單元' } : null;
  const teacherFinish = guide.overview ? { href: guide.overview, label: '回到課程總覽' } : null;
  const objectives = '#route-lesson-objectives';
  const keyPoints = '#route-lesson-key-points';
  const references = {
    '1150801.html': [objectives],
    '1150802.html': [objectives],
    '1150803.html': [objectives, keyPoints],
    '1150804.html': [keyPoints],
    '1150805.html': [objectives, keyPoints],
    '1150806.html': [objectives, keyPoints]
  };

  window.LessonRoutes = routes;
  if (routes[page] && window.LessonRoute) window.LessonRoute.start({ steps: routes[page], references: references[page], program: window.BlockProgramTasks?.[page], next, teacherFinish });
})();
