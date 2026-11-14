# V-2 課程模組維護指南

七、八年級各六個 Scratch 單元。每課用一份模組描述檔維護課名、節數、目標、必交項目與達標條件，供單元頁、課程地圖和教案使用。

## 檔案分工

| 檔案 | 責任 |
| --- | --- |
| `modules/registry.json` | 登錄各課模組的描述檔。 |
| `modules/g7-01.json` ～ `g7-06.json` | 七年級六個單元，各一個模組。 |
| `modules/g8-01.json` ～ `g8-06.json` | 八年級六個單元，各一個模組。 |
| `1150701.html` ～ `1150806.html` | 各單元的實際互動內容，依年級與課號選取，兩個 `00` 總覽不算單元模組。 |
| `index.html`、`teacher-resources.html`、`course-map.css` | 上課首頁、教師備課頁及兩頁共用的樣式。 |
| `curriculum-map.html`、`curriculum-map.css`、`curriculum-map.js` | 課程地圖頁：分年級的概念關聯圖與成果卡片，單元名稱與順序須與 `modules/` 一致。 |

共用的 `course-scenarios.js`、`learning-guides.js`、`curriculum-labs.js`、`adaptive-practice.js`、`site-theme.css` 及圖片仍由原單元引用，不複製成十二套。模組的正式名稱以程式概念命名；單元內的故事名稱由情境設定控制。改主題時要檢查模組描述中是否仍有舊情境用語。

## 一份模組描述檔

以 `modules/g8-03.json` 為例，主要欄位如下：

```json
{
  "id": "g8-03",
  "grade": 8,
  "lesson": 3,
  "title": "清單統計：總和與平均",
  "entry": "1150803.html",
  "periods": 2,
  "goal": "用清單走訪計算總和與平均，追蹤每一步的中間值。",
  "evidence": [
    "多筆、單筆、空清單三種案例的追蹤表，記下每輪累計值、總和、筆數和平均"
  ],
  "successCriteria": "多筆與單筆的累計值和平均正確。空清單記為 0 筆，說明除數是 0，所以不能直接算平均。",
  "priorKnowledge": "Scratch 事件、變數與迴圈基礎",
  "prerequisites": ["g8-01"],
  "tags": ["累加", "平均", "空清單"],
  "resources": {
    "lessonPlan": "lesson-plan-grade-8.html#lesson-3",
    "records": "student-record-g8-03.html",
    "scratchArchive": "11508.zip"
  }
}
```

`id` 用於對應單元與學習紀錄。改課名或情境時請保留既有 ID。`prerequisites` 記錄先備單元的 ID。`resources` 是維護索引，現有 ZIP 仍含同年級完整範例，不是只含這一課。

`evidence` 是必交項目陣列，每個項目寫成一個字串。`successCriteria` 是達標條件。改好該課的 JSON 後，執行 `npm run build:lesson-plans`，更新課程總覽、學生導航、教案、學習紀錄和課程地圖的成果卡片。若要調整紀錄表欄位，可在 `STUDENT_RECORDS.md` 找該課，保留 `<!-- assessment:g8-03 -->` 等標記。教師從紀錄頁按「複製本課紀錄與要求」即可貼到班級平台。`npm test` 會檢查產出的頁面和腳本是否已更新。

八年級第 4 課可作為整理活動的範本。`modules/g8-04.json` 的 `activity` 保存網頁示範、Scratch 實作和操作前、中、後的提問。`lesson-routes.js` 把提問放進對應步驟，教案和紀錄頁在建置時引用相同提問。教師的追問保留在教案，填寫欄位保留在 `STUDENT_RECORDS.md`。

目前目錄驗證對應既有七、八年級各六課。新增第七課或其他課程類型時，除了新增描述檔，還需擴充建置、地圖、情境頁碼及測試；不能只改 registry 就宣稱新類型已支援。Python Lab 與 CodeGame 仍獨立，不在這次十二模組內。

## 驗證與發布

- 執行 `npm test`，檢查模組目錄、課程地圖、單元導覽及教材功能。
- 執行 `npm run check:materials`，檢查已登錄的 Scratch 等教材資源。
- 在瀏覽器實測年級入口、前後單元導覽及修改過的活動。
- V-1 保留不變；發布 V-2 時須包含根目錄整個 `modules/`，以及原本的單元與共用資源。
- 課程地圖是可直接閱讀的 HTML。改課名、標籤或建議節數後，執行 `npm run build:lesson-plans` 更新課程地圖與教案。概念關聯圖的箭頭表達教學概念，依課程設計維護。

單元 HTML 會讀取共用腳本與素材，請以完整教材資料夾開啟。
