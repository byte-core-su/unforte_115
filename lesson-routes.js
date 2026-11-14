// 12 個 Scratch 單元的學習路線設定。每課固定為：
// 認識任務 → 網頁活動與實作 → 換題練習（選做）→ 離堂任務
// 標為 optional 的步驟是「選做」，可以略過；其他步驟要勾完完成標準才會開啟下一步。
(() => {
  'use strict';
  const page = location.pathname.split('/').pop();
  const guide = window.LearningGuide || {};
  const labels = window.LessonLabels;
  const drawLesson = window.LessonAssessments['1150804.html'];
  const draw = drawLesson.activity;

  const intro = (extra = []) => ({
    title: '認識任務',
    anchors: ['#learning-guide', ...extra],
    todo: '看完今天的任務和繳交項目，按「從哪裡開始」下方的按鈕。'
  });
  const scratch = step => ({
    title: '到 Scratch 動手做',
    ...step,
    hints: [...(step.hints || []), '做到一半卡住，可以往上看前面的參考積木，或舉手請老師幫忙。']
  });
  const practice = {
    title: '換題練習',
    anchors: ['#adaptive-practice'],
    optional: true,
    todo: `先選「標準」（沒把握就選「基礎」）。每題先預測答案，再按「${labels.checkPrediction}」。`,
    checks: ['我做過一題並看過回饋'],
    hints: ['答錯會先給提示，可以同一題再試一次。', '覺得太難就改選「基礎」，選級不影響成績。']
  };
  const exit = () => ({
    title: '離堂任務',
    todo: '把下列成果交到老師指定的班級平台。',
    evidence: guide.evidence,
    checks: [guide.successCriteria || '已依老師說明檢查成果', '已到班級平台繳交'],
    hints: ['可以打開本課學習紀錄表，照欄位填寫。', ...(guide.exit ? [`老師若指定離堂檢核：${guide.exit}`] : [])],
    link: { href: guide.records || 'student-records.html', label: '打開學習紀錄表 ↗' }
  });
  const route = (introExtra, middle) => [intro(introExtra), ...middle, practice, exit()];
  const tab = name => ({
    enter: () => window.switchL2Tab?.(name),
    review: () => window.switchL2Tab?.(name, false)
  });

  const routes = {
    '1150701.html': route([], [
      { title: '積木大考驗', anchors: [{ up: '#route-scratch-diagnostic' }],
        todo: '按「開始測驗」完成 10 題積木診斷，看完結果。',
        checks: ['完成 10 題並看完結果', '選一塊積木，寫下何時執行、會改變什麼'],
        hints: ['先看積木顏色：黃色是事件、藍色是動作、橘色是控制、紫色是外觀、橘紅色是變數。', '答錯沒關係，診斷是用來找起點，不影響進入下一課。'] },
      { title: '資訊使用判斷', anchors: ['#curriculum-lab'],
        todo: `三個情境各選一個做法，按「${labels.checkJudgment}」。`,
        checks: ['三題都檢查過，並讀完每題的原因'],
        hints: ['想一想：這樣做會不會讓別人知道你的真實姓名、帳號或密碼？', '網路上的圖片、音樂要先確認授權；看不出來就改用可使用的素材。'] },
      scratch({ title: '到 Scratch：綠旗小作品', optional: true,
        todo: '開啟 Scratch，做一個「按綠旗後角色開始移動」的小程式。',
        checks: ['按綠旗後角色會動', '已存檔'],
        hints: ['從黃色「當綠旗被點擊」開始，下面接藍色「移動 10 點」。'] })
    ]),
    '1150702.html': route([], [
      { title: '循序結構', anchors: [{ common: ['#l2-tab-seq', '#l2-content-rep'] }], ...tab('seq'),
        todo: '先預測平均數再按「計算」，接著依步驟完成 IPO 配對，按「驗證配對」。',
        checks: ['先預測，再按「計算」核對過', 'IPO 配對驗證通過'],
        hints: ['Input 是使用者給的資料，Process 是電腦計算，Output 是顯示結果。', '流程從「開始」到「結束」由上往下，一次做一件事。'] },
      { title: '選擇結構', anchors: [{ common: ['#l2-tab-seq', '#l2-content-rep'] }], ...tab('sel'),
        todo: '輸入成績，先預測會不會及格，再依步驟完成配對驗證。',
        checks: ['測過一次及格、一次不及格', '配對驗證通過'],
        hints: ['「如果…那麼…否則」：條件成立走「那麼」，不成立走「否則」。', '故意輸入一組會不及格的成績，看程式走哪一邊。'] },
      { title: '重複結構', anchors: [{ common: ['#l2-tab-seq', '#l2-content-rep'] }], ...tab('rep'),
        todo: '先預測 1 加到 N 的總和，再執行並完成配對驗證。',
        checks: ['先預測，再執行核對過', '配對驗證通過'],
        hints: ['重複執行 N 次：框裡的積木會做 N 遍。', 'N 很小時（例如 3），可以先用心算 1+2+3 驗證。'] },
      scratch({
        todo: '開啟 Scratch，各做一小段循序、選擇（如果…否則）和重複的程式，執行前先寫下預測。',
        checks: ['三種結構各做了一段', '選一段分支或迴圈，記下預測與實際結果；結果不同時，找出第一個造成差異的積木'],
        hints: ['選擇結構可以用「如果 碰到邊緣 那麼 … 否則 …」。'] })
    ]),
    '1150703.html': route([], [
      { title: '第一階段：畫出直線', anchors: [{ up: '#route-pen-line' }],
        todo: '照右側的功能說明，把左邊的積木依序點進組裝區；組裝正確會解鎖動畫。',
        checks: ['畫筆積木組裝正確，看到動畫畫出直線'],
        hints: ['順序：先清除舊圖、設定顏色和粗細、下筆、移動、停筆。', '點錯的積木可以再點一下退回。'] },
      { title: '第二階段：手動畫正方形', anchors: [{ up: '#route-manual-square' }],
        todo: '把「移動、右轉」積木依序排好，手動畫出正方形。',
        checks: ['正方形畫出來並且閉合', '數過「移動 → 右轉」重複了幾次'],
        hints: ['正方形每畫一條邊就右轉 90 度，共 4 條邊。', '排完看一看：是不是同樣兩塊積木一直重複？'] },
      { title: '第三階段：用重複精簡', anchors: [{ up: '#route-repeat-square' }],
        todo: '在 Pseudo Code 的空格填入重複次數與角度，按「驗證答案」。',
        checks: ['重複次數與角度驗證正確'],
        hints: ['重複次數＝邊數。', '每次轉角＝360 ÷ 邊數。'] },
      { title: '第四階段：多邊形實戰', anchors: [{ up: '#route-polygon' }],
        todo: '選三角形、五邊形等圖形，填入重複次數與轉角，按「啟動探測車繪圖」，看圖形是否閉合。',
        checks: ['畫出閉合的三角形', '畫出閉合的五邊形'],
        hints: ['三角形每次轉 120 度，五邊形每次轉 72 度。', '圖形沒有閉合，通常是轉角算錯：再算一次 360 ÷ 邊數。'] },
      scratch({
        todo: '到 Scratch 用「重複執行」畫出三角形和五邊形，標註重複次數與轉角。挑一個圖形改錯一次轉角，再改回來。',
        checks: ['三角形與五邊形都閉合，並標出重複次數和轉角', '記下轉角改錯及修正後的差異'],
        hints: ['可以用「說出」積木或程式註解標註數字。把三角形的轉角暫時改為 90 度，就能看到不閉合的例子。'] })
    ]),
    '1150704.html': route([], [
      { title: '第一階段：手動畫螺旋', anchors: [{ up: '#route-manual-spiral' }],
        todo: '把積木由短到長（10 → 20 → 30 → 40 點）排好，手動畫出螺旋。',
        checks: ['手動螺旋畫出來'],
        hints: ['每條邊都比上一條長 10 點。', '每畫完一條邊都要右轉 90 度。'] },
      { title: '第二階段：用變數畫螺旋', anchors: [{ up: '#route-variable-spiral' }],
        todo: '把 4 塊積木排進「重複執行」，讓「長度」變數每次增加；再選一種螺旋（例如三角螺旋）按「啟動螺旋繪圖」。',
        checks: ['變數版螺旋畫出來', '試過另一種角度的螺旋', '能說出前三圈「長度」的值'],
        hints: ['「長度」要先設為 0，再在迴圈裡每次改變 10。', '「改變 10」放在移動之前或之後，第一圈的長度會不一樣。'] },
      scratch({
        todo: '到 Scratch 用變數和迴圈畫螺旋。在迴圈內，把更新積木分別放在「移動」前和後，比較第一輪移動的長度。',
        checks: ['螺旋作品完成', '追蹤表寫出前三圈的變數值', '說得出更新積木換位置後的差異'],
        hints: ['先在紙上畫「圈數｜長度」的表格，寫三列再執行。'] })
    ]),
    '1150705.html': route([], [
      { title: '第一階段：正 N 邊形積木', anchors: [{ up: '#route-define-polygon' }], optional: true,
        todo: '把含有參數 N 的積木排進「定義」積木裡，做出能畫任意正 N 邊形的自訂積木。',
        checks: ['自訂積木組裝正確'],
        hints: ['重複 N 次，每次移動後右轉 360 ÷ N 度。', '參數 N 就像一個空格，呼叫時填幾就畫幾邊形。'] },
      { title: '第二階段：組裝曼陀羅', anchors: [{ up: '#route-assemble-mandala' }], optional: true,
        todo: '把下筆、重複、呼叫「畫一個正N邊形 5」、旋轉、停筆排好，畫出五邊形曼陀羅。',
        checks: ['曼陀羅畫出來', '能說出旋轉角度和重複次數的關係'],
        hints: ['重複 12 次、每次右轉 30 度，剛好轉滿一圈（12 × 30 = 360）。'] },
      { title: '第三階段：再包一層', anchors: [{ up: '#route-nested-block' }], optional: true,
        todo: '把「重複呼叫加旋轉」再包成「畫幾個圖形 (X)」自訂積木。',
        checks: ['「畫幾個圖形」組裝正確'],
        hints: ['每畫一個圖形右轉 360 ÷ X 度，重複 X 次。'] },
      { title: '換參數畫曼陀羅', anchors: [{ up: '#route-mandala-parameters' }],
        todo: '選兩組邊數 N 與圖形數 X（例如 3 和 12、5 和 10）。每組按「傳遞變數並執行」，比較畫出的圖形。',
        checks: ['畫了兩組不同設定的圖形', '能指出是哪個數值改變了圖形'],
        hints: ['N 決定每個小圖形的邊數，X 決定一圈畫幾個。'] },
      { title: '第五階段：彩虹曼陀羅', anchors: [{ up: '#route-rainbow-mandala' }], optional: true,
        todo: '想一想「筆跡顏色設為隨機」放在哪裡，每個小圖形才會換顏色。',
        checks: ['說出顏色積木的位置與理由'],
        hints: ['放在「畫一個正N邊形」之前，每畫一個圖形就換一次顏色。'] },
      scratch({
        todo: '開啟 Scratch，用迴圈與變數畫出兩組不同設定的曼陀羅，寫下哪個數值改變了圖形；想多試一題，可以改用有參數的自訂積木。',
        checks: ['兩組不同設定的圖形完成', '寫出迴圈或變數如何控制圖形'],
        hints: ['先畫出一個正多邊形，再把它重複並旋轉。'] })
    ]),
    '1150706.html': route([{ up: '#defense-briefing-title' }], [
      { title: '改排防禦網主程式', anchors: [{ up: '#route-defense-program' }],
        todo: '先在紙上想好流程，再把積木依序排好，讓防禦網不用詢問就能一鍵啟動。',
        checks: ['積木組裝完成，防禦網能一鍵啟動'],
        hints: ['把「詢問並等待」換成「變數 設為 數字」。', '先設定筆跡寬度、邊數和圖形數量，再下筆、呼叫「畫幾個圖形」，最後停筆。'] },
      { title: '測試防禦網', anchors: [{ up: '#route-defense-test' }],
        todo: '改變數欄的邊數、圖形數量或筆跡寬度。至少測三組設定，每組按「啟動防禦網」看結果。',
        checks: ['測了至少三組參數', '記下哪一組擋住、哪一組沒擋住'],
        hints: ['先試很少的圖形數，再慢慢增加，找出剛好擋住的數量。', '把每組數字和結果寫進測試表，等一下會用到。'] },
      { title: '選出最省的方案', anchors: [{ up: '#route-defense-cost' }],
        todo: '從能擋住隕石的設定中，找出消耗最少的一組，寫下理由。',
        checks: ['寫下你選的參數組合與理由'],
        hints: ['「能過關的最少資源」通常比「越多越粗」更好，想想為什麼。'] },
      { title: '資料分析', anchors: ['#curriculum-lab'],
        todo: '用匿名測試資料：先搜尋指定測試，再預測哪一組有效又最省資源，按「核對預測並分析」。',
        checks: ['預測並核對過一次', '能說出平均資源消耗怎麼算'],
        hints: ['先刪掉擋不住的組，再從剩下的比消耗量。', '消耗量＝圖形數 × 筆跡寬度。'] },
      scratch({
        todo: '在 Scratch 完成可調參數的防禦網，用三組參數測試、修正一次，準備 60 秒作品說明。',
        checks: ['Scratch 作品能一鍵啟動', '三組測試表完成，並修正重測一次', '能用 60 秒說明作品'],
        hints: ['網頁模擬器不能代替自己的作品，請一定要在 Scratch 做一次。'] })
    ]),
    '1150801.html': route(['#route-lesson-objectives'], [
      { title: '清單操作任務', anchors: ['#route-list-missions'],
        todo: '跟著左邊的任務一步步按按鈕，觀察右邊裝備庫的項目和長度怎麼變，走完五個航點；完成後再自己試新增、插入、替換、刪除。',
        checks: ['走完星際航線五個航點', '每次操作後，說得出清單的項目與長度'],
        hints: ['索引值從 1 開始：第 1 項就是最上面那一個。', '插入會讓後面的項目往後移一格；刪除後，後面的項目往前補。'] },
      { title: '循序搜尋', anchors: ['#curriculum-lab'],
        todo: '選一個要找的裝備，先預測在第幾項，再按「檢查下一項」逐項比對；也試一次清單裡沒有的裝備。',
        checks: ['做過一次「找到」', '做過一次「找不到」，說得出什麼時候停止'],
        hints: ['循序搜尋從第 1 項開始一項一項比，找到就停。', '全部比完都沒有，才能說「找不到」。'] },
      scratch({
        todo: '記下新增、插入、替換、刪除前後的清單。再用 Scratch 寫循序搜尋，分別測找到和找不到。',
        checks: ['有四種操作的前後對照', 'Scratch 搜尋程式能執行，兩筆紀錄都寫出在哪裡停和為什麼'],
        hints: ['清單在「變數」分類，按「建立一個清單」。搜尋時用索引從第 1 項開始比，找到或比完就停。'] })
    ]),
    '1150802.html': route(['#route-lesson-objectives'], [
      { title: '讀懂播放程式', anchors: [{ up: '#route-music-pseudocode' }, { up: '#route-music-blocks' }],
        todo: '對照左邊的虛擬碼和右邊的 Scratch 積木，找出「第幾個音」從 1 開始、每圈加 1 的地方。',
        checks: ['說得出「第幾個音」怎麼決定要播哪一個音'],
        hints: ['重複次數＝清單的長度，所以每個音都會播到。', '「第幾個音 改變 1」讓下一圈讀下一項。'] },
      { title: '聽清單依序播放', anchors: [{ up: '#route-song-library' }, { up: '#song-title' }],
        todo: '按「依序播放清單」播放《小星星》，看清單一項一項被讀取；想練習再按「再抽一首」。',
        checks: ['完整播放一首，看到每一項依序被讀取', '能說出第 1 到第 4 項分別是哪個音'],
        hints: ['打開「Scratch 數值」可以看到每個音對應的數字。'] },
      { title: '彈奏挑戰', anchors: [{ up: '#route-audio-comparison' }], optional: true,
        todo: '選一段自己的短錄音，和原曲比對。請選沒有他人聲音或個資的檔案。',
        checks: ['完成一次比對，並看懂結果'],
        hints: ['結果會受雜音影響，只是練習回饋，不是評分。'] },
      { title: '錄音與素材判斷', anchors: ['#curriculum-lab'],
        todo: `每個情境選一個做法，按「${labels.checkJudgment}」。`,
        checks: ['每題都檢查過，並讀完原因'],
        hints: ['分享錄音前想一想：裡面有沒有別人的聲音或個資？', '現成的旋律或音檔要先確認授權。'] },
      scratch({
        todo: '在 Scratch 建立音符清單，用重複和「第幾個音」依序播放短旋律；改一個音再播一次，比較差異。',
        checks: ['短旋律能依序播放', '改動一項後，說得出聽到的差異', '寫好索引對照表（第幾項＝哪個音）'],
        hints: ['音樂積木要先從左下角「擴充功能」加入。'] })
    ]),
    '1150803.html': route(['#route-lesson-objectives', '#route-lesson-key-points'], [
      { title: '暖身：變數累加', anchors: [{ up: '#route-accumulator-warmup' }],
        todo: '用下拉選單完成迴圈內的邏輯，按「驗證邏輯」；答對後執行，看「序號」和「累加值」怎麼變。',
        checks: ['驗證通過並執行過', '說得出前三圈的累加值'],
        hints: ['每一圈先讓序號加 1，再把序號加進累加值。'] },
      { title: '能源加總模擬器', anchors: [{ up: '#route-energy-total' }],
        todo: '按「讀取並加總」一次跑一圈，追蹤「目前項目、累計總和、已處理筆數」；再用「套用」測只有一筆和留空（空清單）。',
        checks: ['多筆資料追蹤到最後', '測過只有一筆的資料', '測過空清單，知道為什麼不能直接算平均'],
        hints: ['總和＝總和＋這一項。', '空清單有 0 筆，除以 0 沒有意義，要先判斷。'] },
      { title: '從計算到程式', anchors: [{ up: '#route-accumulator-loop' }],
        todo: '按「找出重複的步驟」，看具體的計算怎麼改寫成用「編號」變數的迴圈。',
        checks: ['說得出「第 1 項、第 2 項…」怎麼改寫成「第 編號 項」'],
        hints: ['找出每一行哪個數字在變，那個數字就適合變成變數。'] },
      scratch({ title: '到 Scratch：統計程式', optional: true,
        todo: '想多練習時，用 Scratch 清單、迴圈和變數算總和與平均，再測多筆、單筆和空清單。必交的追蹤表可用網頁模擬器完成。',
        checks: ['總和與平均正確', '單筆資料結果正確', '空清單時程式不會出錯（有先判斷）'],
        hints: ['算平均前先用「如果 清單的長度 > 0 那麼」判斷。'] })
    ]),
    '1150804.html': route(['#route-lesson-key-points'], [
      { title: '抽籤模擬器', anchors: [{ up: '#route-draw-simulator' }],
        todo: draw.preview,
        questions: { before: draw.questions.before, during: draw.questions.during },
        checks: ['已抽完 4 輪，每輪都按了「確認刪除」', '看得出座號和項次的差別，也核對了兩份清單的人數'],
        hints: ['抽到的人如果不刪掉，下一次可能又被抽到。'] },
      { title: '建立初始資料', anchors: [{ up: '#route-initialize-list' }],
        todo: '把虛擬碼片段依正確順序點進組合區，按「檢查順序並解鎖積木」。英文看不懂可以按「切換為中文」。',
        checks: ['順序檢查通過'],
        hints: ['先按「切換為中文」比較好讀。', '先清空清單、把座號設為 0，再重複 30 次「座號加 1、加入清單」。'] },
      { title: '隨機抽籤與刪除', anchors: [{ up: '#route-draw-and-remove' }],
        todo: '完成第一關虛擬碼排序，再完成第二關 Scratch 積木組裝。',
        checks: ['第一關順序檢查通過', '第二關積木組裝完成'],
        hints: ['先抽出座號存進變數，再用這個座號找到它在清單的位置並刪掉。'] },
      scratch({
        todo: draw.practice,
        questions: { after: draw.questions.after },
        link: { href: drawLesson.records, label: '開啟本課學習紀錄表 ↗' },
        checks: [drawLesson.successCriteria],
        hints: ['隨機範圍要用「1 到 清單的長度」，不要寫死 30。'] })
    ]),
    '1150805.html': route(['#route-lesson-objectives', '#route-lesson-key-points'], [
      { title: '洗牌模擬器', anchors: [{ up: '#route-shuffle-simulator' }],
        todo: '一直按「執行洗牌步驟」直到牌堆變空，觀察每次從牌堆抽一張移到洗牌清單。',
        checks: ['牌堆抽到空', '說得出兩個清單的長度每次怎麼變'],
        hints: ['每一步：牌堆少 1、洗牌多 1，總張數不變。'] },
      { title: '洗牌邏輯排序', anchors: [{ up: '#route-shuffle-logic' }],
        todo: '把虛擬碼片段排好順序，按「檢查順序並解鎖第二關」。',
        checks: ['順序檢查通過'],
        hints: ['先按「切換為中文」比較好讀。', '最前面要先清空「洗牌」清單，避免舊資料混進來。'] },
      { title: '洗牌積木組裝', anchors: [{ up: '#route-shuffle-blocks' }],
        todo: '依 STEP 1～5 的題目，選出正確的 Scratch 積木，完成洗牌程式。',
        checks: ['五個 STEP 都完成'],
        hints: ['每一題下方的 💡 會提示要找哪一類積木。'] },
      { title: '複習：建立牌堆', anchors: [{ up: '#route-initial-deck' }],
        todo: '閱讀逐行積木解析，弄懂洗牌前怎麼自動建立 1～13 的牌堆。',
        checks: ['說得出建立牌堆的步驟：清空、設變數、重複加入'],
        hints: ['變數從 0 開始，每圈加 1 再加入清單，重複 13 次。'] },
      { title: '發放手牌', anchors: [{ up: '#route-deal-cards' }], optional: true,
        todo: '把洗好的牌前 13 張發到「分牌」清單。',
        checks: ['分牌清單有 13 張，而且沒有重複'],
        hints: ['每發一張：加到分牌，再從洗牌清單刪掉第 1 項。'] },
      { title: '排序與洗牌比較', anchors: ['#curriculum-lab'],
        todo: '先預測第一次比較會不會交換，再按「執行下一次比較」一步步看排序。',
        checks: ['完成一次完整排序', '說得出排序什麼時候可以停'],
        hints: ['相鄰兩個數，前面比後面大就交換。', '網頁會跑完指定的輪數。若 Scratch 程式有記錄是否交換，也可在整輪都沒交換時提早結束。'] },
      scratch({
        todo: '在 Scratch 把 4～6 筆數值用相鄰比較由小到大排序。記下每次比較與交換，連同網頁上的洗牌紀錄一起交。',
        checks: ['Scratch 排序程式能執行，並有比較與交換紀錄', '洗牌和排序前後，每個數值出現的次數都相同'],
        hints: ['前項比後項大才交換。比對各數值各有幾筆，例如原來有兩個 3，處理後也要有兩個 3。'] })
    ]),
    '1150806.html': route(['#route-lesson-objectives', '#route-lesson-key-points'], [
      { title: '對決模擬器', anchors: [{ up: '#route-duel-simulator' }],
        todo: '按「整備清單」並依按鈕提示一步步執行，觀察三個清單怎麼建立、洗牌、分配與對決。',
        checks: ['模擬器完整跑完一次對決'],
        hints: ['每按一次，按鈕文字會告訴你下一步要做什麼。'] },
      { title: '程式教學', anchors: [{ up: '#route-duel-program' }],
        todo: '閱讀逐段程式教學，弄清楚「建立、洗牌、提取」三段各在做什麼。',
        checks: ['說得出三段程式各自的工作'],
        hints: ['先找出每一段用到哪一個清單。'] },
      { title: '避免抽到重複裝備', anchors: [{ up: '#route-unique-equipment' }], optional: true,
        todo: '做完練習題，看看程式怎麼避免抽到同一件裝備。',
        checks: ['答對練習題並看過程式範例'],
        hints: ['看完後，用自己的話說說程式怎麼避免抽到一樣的裝備。'] },
      { title: '自訂積木分工', anchors: ['#curriculum-lab'],
        todo: '依序選出四個自訂積木的呼叫順序，排出正確的主程式。',
        checks: ['呼叫順序正確'],
        hints: ['先有裝備庫才能洗牌，洗好才能分配，分配完才能對決。'] },
      scratch({
        todo: '到 Scratch 用四個自訂積木完成對決，畫出各積木用到的清單。測試足夠、不足和抽取後不重複，修正一次並重測。',
        checks: ['四個自訂積木都能運作，並畫出清單流程圖', '完成三種測試，記下一次修正和重測結果'],
        hints: ['頁面上方可以下載 Scratch 範例對照。'] })
    ])
  };

  const next = guide.next ? { href: guide.next, label: '前往下一單元' } : null;
  const teacherFinish = guide.overview ? { href: guide.overview, label: '回到課程總覽' } : null;

  window.LessonRoutes = routes;
  if (routes[page] && window.LessonRoute) window.LessonRoute.start({ steps: routes[page], next, teacherFinish });
})();
