// Scenario copy and example data only. Lesson rules, assessment and styling live elsewhere.
(() => {
  const item = (name, icon, variants = {}) => ({ name, label: icon ? `${icon} ${name}` : name, ...variants });
  const space = {
    grades: {
      7: {
        name: '星際防禦工程師',
        tagline: '用程式編織能量防護網',
        intro: '結合「IPO 思維」與「重複結構」，循序漸進建立邏輯思維與幾何繪圖能力，並透過實作防禦網任務，體驗程式設計的強大魔力。',
        archive: '11507.zip',
        briefing: {
          icon: '🚀', title: '情境模擬任務：星際隕石防禦網建設',
          intro: '地球總部發出緊急警報！密集的星際隕石群正朝著我們的核心基地襲來。為了保護基地，我們必須立刻啟動「防護網發生器」，在隕石墜落前，利用幾何陣列編織出毫無死角的能量防禦罩。',
          role: '首席防禦系統工程師', roleIcon: '👤',
          practice: '運用 IPO 思維（輸入、處理、輸出）與「重複結構」積木，寫出能產生多個正方形（或正多邊形）陣列的控制程式，建構出堅堅防護網。',
          designTitle: '視覺心理防護',
          design: '為了安定基地內部人員的心情，請修改畫筆參數，將防護網設定為暖琥珀色和橙色系，透過色彩向夥伴傳達出溫暖且安全的庇護感。',
          application: '雷達掃描涵蓋範圍、基地台訊號無死角覆蓋網、參數化與幾何演算法設計。'
        },
        cards: [
          { title: '起步診斷：Scratch 積木大考驗', description: '用 10 題核心與進階練習了解 Scratch 起點；可反覆挑戰並取得紀念證書。這是診斷練習，不是下一課的通行門檻。' },
          { title: '邏輯的大腦：程式三大結構', description: '防護網系統校準：透過數值實驗與重組流程圖，精準掌握循序、選擇與重複三大邏輯結構，建立堅不可摧的系統大腦。' },
          { title: '基礎防禦單元：迴圈多邊形', description: '透過「重複結構」，了解邊長與外角（360度法則）的數學關係，畫出完美對稱的基礎能量盾圖形。' },
          { title: '魔法變數：擴張型螺旋力場', lessonTitle: '魔法變數：螺旋圖騰', description: '導入「變數」概念，讓電腦記住會隨時間長大的數值，畫出能彈開隕石、無限延伸的漸變螺旋力場。' },
          { title: '高階防禦：終極曼陀羅陣', lessonTitle: '幾何曼陀羅 (進階參數函式)', description: '結合變數變化與雙層重複結構，編織出如藝術品般複雜且華麗的高階多邊形曼陀羅防禦圖騰。' },
          { title: '終極挑戰：星際防禦網陣列', description: '綜合應用：陣列繪圖與座標位移，指揮探測車完成終極防禦網大面積的自動架設任務！' }
        ]
      },
      8: {
        name: '星際陣列指揮官',
        tagline: '用清單打造星際任務',
        intro: '化身星際指揮官，透過六大任務關卡，循序漸進建立邏輯思維，完整掌握',
        introByLesson: { 1: '化身星際指揮官，透過任務關卡循序漸進建立邏輯思維，完整掌握' },
        archive: '11508.zip',
        briefing: {
          icon: '🚀', title: '情境模擬任務：啟動星艦數據陣列',
          intro: '在浩瀚的宇宙中航行，母艦的電腦必須要記錄數百名船員的資料、記錄每一個跳躍座標，甚至是敵方戰機的血量。一般的「變數」一次只能裝一個資料，早就無法負荷了！這時候，我們就需要動用星艦系統的核心技術——',
          role: '星艦陣列首席指揮官', roleIcon: '👨‍🚀',
          application: '購物車清單、遊戲排行榜、班級點名系統、大數據資料收集。'
        },
        cards: [
          { title: '星艦資料庫基礎', description: '在建立複雜的系統前，我們必須先了解星艦資料庫的最基本單位：數據陣列（清單）。認識什麼是「索引值」，並學會基本操作。' },
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
        briefingTitle: '基地遭重創！防禦系統啟動太慢？',
        launch: '🛡️ 一鍵瞬間啟動防禦網', arena: '阿爾法基地雷達防禦屏',
        waiting: '等待啟動！請留意防禦網是否存在「孔洞」讓隕石穿透，以及「筆跡寬度」的強度影響。',
        thin: '💥 警告！防禦網太薄 (強度不足)，被高能隕石輕易貫穿了！請增加筆跡寬度。',
        gap: '💥 警告！防禦網存在幾何孔洞，隕石從死角穿透！請增加陣列圖形數量。',
        passed: '🎉 盲測結束：完美防禦！毫無死角且強度足夠！', passedDetail: '基地安全無虞！任務大成功！',
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
