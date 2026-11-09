// Alternate copy for tests only; the public site still selects space.
const { active } = require('../../course-scenarios.js');
const campus = structuredClone(active);
campus.grades[7].name = '校園創客實驗室';
campus.grades[7].tagline = '用程式設計幾何圖樣';
campus.grades[7].briefing.title = '情境模擬任務：設計緩衝網';
campus.grades[8].name = '校園資料實驗室';
campus.grades[8].tagline = '用清單理解演算法';
campus.grades[8].intro = '從圖書館借閱流程練習';
campus.grades[8].introByLesson = {};
campus.grades[8].briefing.title = '情境模擬任務：管理圖書館借閱清單';
campus.grades[8].cards[0].title = '圖書館借閱清單';
campus.grades[8].cards[5].title = '數字卡逐項比較';
campus.grades[8].archive = 'examples/campus-grade-8.zip';
Object.assign(campus.defense, {
  project: '緩衝網', tabTitle: '緩衝網實驗', labTitle: '緩衝網資料分析', labResult: '測試結果',
  labThreshold: '緩衝強度門檻', practiceThreshold: '測試門檻',
  outcome: '攔住測試球', shortOutcome: '攔住測試球', advancedCondition: '提高測試標準後'
});
campus.defense.simulation.arena = '緩衝網測試區';
campus.inventory.kind = '借閱用品';
campus.inventory.supplement = '館藏索引';
campus.inventory.items = Object.fromEntries(Object.entries({
  supply: '借書卡', priority: '預約單', repair: '修補膠帶', tool: '掃描器', engine: '推車',
  chip: '分類標籤', signal: '對講機', pack: '書袋', upgrade: '優先借閱單', ore: '圖書章', core: '服務卡'
}).map(([id, name]) => [id, { name, label: `📚 ${name}`, collect: `領取${name}` }]));
campus.inventory.tutorial = [
  { title: '新增借書卡', desc: '把「{supply}」放到清單末端。', button: '新增 {supply}' },
  { title: '插入預約單', desc: '把「{priority}」插入第 1 項。', button: '插入 {priority}' },
  { title: '替換優先借閱單', desc: '將{priorityName}換成「{upgrade}」。', button: '替換為 {upgrade}' },
  { title: '刪除借書卡', desc: '從清單刪除「{supply}」。', button: '刪除 {supply}' }
];
campus.statistics.exampleListNames = ['借閱量', '到館量', '歸還量'];
campus.duel = {
  item: '數字卡', inventory: '數字卡庫', activity: '比較', opponent: 'B 組數字卡', costumeLabel: '數字卡',
  types: ['紅色卡', '藍色卡', '綠色卡', '黃色卡'],
  modules: ['建立數字卡庫', '洗牌數字卡', '分配數字卡', '逐項比較']
};
module.exports = campus;
