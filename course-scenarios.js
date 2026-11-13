// Scenario copy and example data only. Lesson rules, assessment and styling live elsewhere.
(() => {
  const item = (name, icon, variants = {}) => ({ name, label: icon ? `${icon} ${name}` : name, ...variants });
  const space = {
    grades: {
      7: {
        name: '星際防禦工程師',
        tagline: '用程式編織能量防護網',
        intro: '先練習讀積木和排程式，再用迴圈與變數畫圖。最後做出防禦網，換幾組設定測試。',
        archive: '11507.zip',
        briefing: {
          icon: '🚀', title: '星際任務：設計隕石防禦網',
          intro: '隕石正朝基地飛來。請用 Scratch 排出一圈多邊形做成防禦網，再測試隕石會從哪裡穿過。',
          role: '首席防禦系統工程師', roleIcon: '👤',
          practice: '先決定邊數和圖形數量（輸入），再用迴圈重複畫圖（處理），看看畫出的防禦網（輸出）。',
          designTitle: '調整防禦網顏色',
          design: '試著把畫筆改成橙色或琥珀色，看看防禦網在背景上是否清楚。',
          application: '雷達掃描涵蓋範圍、基地台訊號無死角覆蓋網、參數化與幾何演算法設計。'
        },
        cards: [
          { title: '起步診斷：Scratch 積木大考驗', description: '用 10 題看看自己認得哪些 Scratch 積木。想再練可以重做，達 80 分可選做紀念證書。各分數都可以接著上下一課。' },
          { title: '程式三大結構', description: '改一組數字試跑，配對輸入、處理和輸出，再排出循序、選擇和重複的流程圖。' },
          { title: '基礎防禦單元：迴圈多邊形', description: '用迴圈畫正多邊形，試算邊數、重複次數和每次轉角的關係。' },
          { title: '魔法變數：擴張型螺旋力場', lessonTitle: '魔法變數：螺旋圖騰', description: '用變數記住每一段的長度，每畫一段就加長，看看螺旋怎麼畫出來。' },
          { title: '高階防禦：終極曼陀羅陣', lessonTitle: '幾何曼陀羅：自訂積木與參數', description: '重複畫出正多邊形，每畫一次就轉個角度。想多試一題，可以把常用的畫法做成有參數的自訂積木。' },
          { title: '終極挑戰：星際防禦網陣列', description: '用前幾課的畫法做防禦網，至少試三組設定，再比較哪組能擋住隕石又比較省資源。' }
        ]
      },
      8: {
        name: '星際陣列指揮官',
        tagline: '用清單打造星際任務',
        intro: '在六個星際任務中練習',
        introByLesson: { 1: '在星艦裝備的任務中練習' },
        archive: '11508.zip',
        briefing: {
          icon: '🚀', title: '星際任務：用清單管理星艦資料',
          intro: '星艦要記下船員名單和裝備。一個變數一次只存一個值。要把多筆資料按順序放在一起，可以用',
          role: '星艦陣列首席指揮官', roleIcon: '👨‍🚀',
          application: '購物車清單、遊戲排行榜、班級點名系統、大數據資料收集。'
        },
        cards: [
          { title: '星艦資料庫基礎', description: '在星艦裝備庫試試新增、插入、替換和刪除，看看每次操作後，項目的位置和清單長度怎麼變。' },
          { title: '星際通訊', description: '總部傳來了一段名為《小星星》的神秘頻率。我們需要建立清單來儲存這串音符，並依序播放出來。' },
          { title: '能源庫存分析', description: '母艦各艙房的能源指數已匯入清單。請指揮官幫忙計算目前的「總能源量」以及「平均能源」，以確保航行安全。' },
          { title: '招募先遣隊', description: '我們需要從全班同學中隨機選出 4 位優秀隊員執行先遣任務！記住，已經被選中的隊員不能重複被抽到喔。' },
          { title: '武器庫洗牌', description: '為了對抗外星生物，我們必須將武器庫（撲克牌點數）完全打亂，讓發放順序無法被預測！' },
          { title: '星際爭霸戰', description: '警報！敵軍艦隊來襲！運用前五課的清單技巧，建立、洗牌與分配裝備，再逐回合比較雙方戰力並記錄結果。' }
        ]
      }
    },
    defense: {
      project: '防禦網', tabTitle: '星際防禦網', labTitle: '防禦資源資料分析',
      labResult: '防禦結果', labThreshold: '防護強度門檻', practiceThreshold: '防護門檻',
      outcome: '擋住隕石', shortOutcome: '擋住', advancedCondition: '警報升級後',
      simulation: {
        briefingTitle: '防禦網為什麼還沒啟動？',
        launch: '🛡️ 啟動防禦網', arena: '阿爾法基地雷達防禦屏',
        waiting: '等待啟動！請留意防禦網是否存在「孔洞」讓隕石穿透，以及「筆跡寬度」的強度影響。',
        thin: '💥 警告！防禦網太薄 (強度不足)，被高能隕石輕易貫穿了！請增加筆跡寬度。',
        gap: '💥 警告！防禦網存在幾何孔洞，隕石從死角穿透！請增加陣列圖形數量。',
        passed: '這一組設定擋住了這次測試的隕石。', passedDetail: '記下這組設定，再比較能不能用更少資源擋住隕石。',
        finish: '🏆 完成防禦工程，回到總覽'
      }
    },
    inventory: {
      kind: '裝備', supplement: '補給',
      items: {
        supply: item('能量電池', '🔋', { practice: '電池', collect: '收集能量電池' }),
        priority: item('基礎防護罩', '🛡️', { search: '防護罩', practice: '護盾' }),
        repair: item('奈米修復劑', '🔧', { search: '修復劑', collect: '取得修復劑' }),
        tool: item('雷射光槍', '🔫', { search: '雷射槍', practice: '雷射', collect: '裝載雷射槍' }),
        engine: item('推進器', '🚀'),
        chip: item('導航晶片', '', { practice: '晶片' }),
        signal: item('通訊器', '📡'),
        pack: item('補給包', ''),
        upgrade: item('量子力場盾', '✨'),
        ore: item('星際礦石', '💎', { collect: '採集礦石' }),
        core: item('終極核心', '✨')
      },
      tutorial: [
        { title: '🛸 任務一：收集能源 (添加)', desc: '星際旅程即將開始，基地配發了備用能源。請點擊按鈕，把它存入星艦裝備庫中。', button: '存入 {supply}' },
        { title: '🛸 任務二：緊急防禦 (插入)', desc: '警告！偵測到前方有碎星石群！你需要馬上啟動防護。請將「{priority}」【插入】到裝備庫的第 1 個位置，取得最高啟動權限！', button: '將 {priority} 插入第 1 項' },
        { title: '🛸 任務三：裝備升級 (替換)', desc: '太棒了！指揮艦隊遠端傳送了升級數據。請將第 1 項的{priorityName}直接【替換】為「{upgrade}」。', button: '替換第 1 項為 {upgrade}' },
        { title: '🛸 任務四：消耗能源 (刪除)', desc: '穿越碎星石帶消耗了星艦大量能量。請使用掉裝備庫裡的「{supply}」（將它從清單中刪除）。', button: '消耗(刪除) {supply}' }
      ]
    },
    statistics: { exampleListNames: ['能源', '得分', '庫存'] },
    duel: {
      item: '裝備', inventory: '裝備庫', activity: '對決', opponent: '👾 未知戰艦',
      costumeLabel: '武器',
      types: ['🛡️能量盾', '🔫雷射槍', '🚀追蹤彈', '⚔️激光劍'],
      modules: ['建立裝備庫', '洗牌裝備', '分配裝備', '逐一對決']
    }
  };

  const scenarios = { space };
  const activeId = 'space';
  const active = scenarios[activeId];
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const format = (template, values) => template.replace(/\{(\w+)\}/g, (token, key) => Object.hasOwn(values, key) ? values[key] : token);
  const inventorySearchPool = scenario => ['supply', 'priority', 'repair', 'tool', 'engine', 'chip', 'signal', 'pack'].map(key => {
    const entry = scenario.inventory.items[key];
    return entry.search ?? entry.name;
  });

  function applyPage(root, pathname, scenario = active) {
    const match = pathname.split('/').pop().match(/^1150([78])0([0-6])\.html$/);
    if (!match) return;
    const [, grade, lesson] = match;
    const course = scenario.grades[grade];
    const tabTitle = grade === '7'
      ? (lesson === '0' ? `課程首頁 - ${course.name}` : `LESSON 6 - ${scenario.defense.tabTitle}`)
      : (lesson === '1' ? `LESSON 1 ${course.cards[0].title}` : `${course.tagline}${['0', '3'].includes(lesson) ? '' : ` - LESSON ${lesson}`}`);
    const values = {
      ...course,
      intro: course.introByLesson?.[lesson] ?? course.intro,
      footer: `© 演算法與程式設計 - ${course.name}`,
      tabTitle,
      defense: scenario.defense
    };
    for (const node of root.querySelectorAll('[data-scenario-text]')) {
      const value = node.dataset.scenarioText.split('.').reduce((parent, key) => parent && Object.hasOwn(parent, key) ? parent[key] : undefined, values);
      if (typeof value === 'string') node.textContent = value;
    }
    // Archives are local files, not external destinations.
    if (/^[\w-]+(?:\/[\w-]+)*\.zip$/i.test(course.archive)) {
      for (const link of root.querySelectorAll('[data-scenario-download]')) link.setAttribute('href', course.archive);
    }
  }

  const api = { scenarios, activeId, active, applyPage, escapeHtml, format, inventorySearchPool };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    window.CourseScenarios = api;
    document.addEventListener('DOMContentLoaded', () => applyPage(document, window.location.pathname));
  }
})();
