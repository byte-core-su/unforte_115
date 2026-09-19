# 從零復刻教材系統：新手開發手冊

這份手冊說明如何從零建立一套與本專案相同類型的「互動式課程教材網站」。它不要求先會使用框架、資料庫或後端服務；完成後，你會有一個可放到 GitHub Pages 的靜態網站，包含首頁、課程總覽、互動單元、共用外觀與教師資源頁。

本手冊的核心原則是：**先做能教學、能閱讀、能在瀏覽器直接開啟的教材網站；只有在真的需要保存個人資料、帳號或成績時，才另外規劃獨立系統。**

## 你會完成什麼

完成本手冊後，預期專案結構如下：

```text
my-course-site/
├── index.html                    首頁與課程入口
├── grade7-overview.html          七年級總覽
├── grade7-lesson-01.html         七年級第一課
├── grade8-overview.html          八年級總覽
├── grade8-lesson-01.html         八年級第一課
├── learning-guides.js            所有單元共用的學習導航
├── site-theme.css                所有頁面共用的外觀規則
├── imgs/                         圖片與截圖素材
├── downloads/                    Scratch、PDF 或其他教材檔
├── README.md                     課程說明與使用方式
└── DEVELOPMENT.md                開發決策與維護紀錄
```

不必一開始就建立所有檔案。先做首頁、總覽頁與一個完整單元，確認方向正確後再複製擴充。

## 開始前：判斷是否適合做成靜態教材網站

適合使用這種架構的內容：

- 課程說明、閱讀教材、範例程式與下載檔。
- 單頁小測驗、排序、模擬器、點擊式練習等不需要帳號的互動。
- 以瀏覽器 `localStorage` 暫存單一使用者進度的活動。
- 教師操作圖解、資源連結與教學影片。

應另外規劃獨立系統的情況：

- 必須登入、管理學生帳號或保存跨裝置進度。
- 要讀取 Google Classroom、Drive、LMS 或其他外部資料。
- 要保存作業、評分、個資或班級名冊。
- 需要 AI、資料庫、後端 API 或權限管理。

靜態教材網站可以連到外部系統，但不要把需要持續維護的帳號與資料處理功能直接混進教材頁面。

## 第一步：建立最小可運作專案

先建立一個資料夾，放入 `index.html`、`site-theme.css` 與 `README.md`。首頁只需要有網站名稱與一個通往課程總覽的連結。

最小首頁範例：

```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的 Scratch 課程</title>
  <link rel="stylesheet" href="site-theme.css">
</head>
<body class="site-home">
  <main>
    <h1>我的 Scratch 課程</h1>
    <a href="grade7-overview.html">開始第一個課程</a>
  </main>
</body>
</html>
```

在此階段，直接用瀏覽器開啟 `index.html` 即可測試。先確認相對連結正常，再開始加入完整畫面。

## 第二步：先定義課程地圖，不急著寫程式

每個年級或課程模組先完成一張表：

| 單元 | 學習概念 | 互動活動 | 最終成果 |
| --- | --- | --- | --- |
| 1 | 事件與動作 | 預測角色行為 | 小測驗結果 |
| 2 | 重複結構 | 組合迴圈積木 | 可重複的動畫 |
| 3 | 變數 | 追蹤數值變化 | 變數紀錄表 |

每個單元只放一個主要概念。若一課同時教清單、迴圈、變數與隨機，學生很難辨識自己真正學會了什麼。

接著，每課都回答五個問題：

1. 這節課的情境與目標是什麼？
2. 學生要先觀察或預測什麼？
3. 學生要親手操作什麼？
4. 學生最後要完成什麼挑戰？
5. 學生要留下什麼成果，並能解釋什麼？

這五個答案就是單元頁面與學習導航的內容骨架。

## 第三步：建立共用外觀，而不是逐頁重畫

在 `site-theme.css` 定義全站不應每頁重複決定的規則：字型、背景、文字色、卡片、圓角、陰影、焦點狀態與年級主題色。

```css
:root {
  --site-bg: #f8fafc;
  --site-surface: #ffffff;
  --site-text: #1e293b;
  --site-border: #e2e8f0;
  --grade-primary: #4f46e5;
  --grade-soft: #eef2ff;
}

body { margin: 0; background: var(--site-bg); color: var(--site-text); }
.card { border: 1px solid var(--site-border); border-radius: 1rem; background: var(--site-surface); padding: 1.25rem; }
.site-course--g8 { --grade-primary: #0891b2; --grade-soft: #ecfeff; }
```

為每一頁加入：

```html
<link rel="stylesheet" href="site-theme.css">
```

建議固定色彩角色：

- 七年級主題：靛藍。
- 八年級主題：青色。
- 教師資源：紫色。
- 成功：綠色。
- 操作提醒：橘色。
- 錯誤或警示：紅色。

主題色用來讓學生辨識「在哪個課程脈絡」；成功、提醒、錯誤色用來說明「現在發生什麼事」。兩者不要混用。

## 第四步：製作首頁與課程總覽

首頁只做三件事：說明網站用途、區分課程入口、提供教師資源。不要把每一課的細節全部塞進首頁。

每個課程總覽頁應包含：

- 課程名稱與一句話目標。
- 六到八個單元卡片。
- 單元序號、名稱與短說明。
- 可下載的範例檔或補充資源。
- 返回首頁連結。

單元卡片的連結使用相對路徑：

```html
<a href="grade7-lesson-01.html">第 1 課：讀懂積木</a>
```

不要把自己網站的完整網域寫進內部連結。相對路徑可讓網站在本機、GitHub Pages 或另一個網域上重複使用。

## 第五步：完成一個單元，再複製擴充

第一個單元建議做成完整範本，包含：

1. 返回課程總覽的連結。
2. 單元名稱、情境故事與核心概念。
3. 一個可直接操作的練習。
4. 正確與錯誤的回饋。
5. 前後單元連結。
6. 可選的下載檔或延伸挑戰。

互動程式應保持小而清楚。例如，點擊按鈕後只改變一個答案區塊，而不是同時改寫整頁內容。這讓新手更容易找到問題，也便於日後複製。

互動的最小 JavaScript 範例：

```html
<button id="check-answer">檢查答案</button>
<p id="feedback" aria-live="polite"></p>

<script>
  document.getElementById('check-answer').addEventListener('click', () => {
    document.getElementById('feedback').textContent = '答對了！你剛剛驗證了重複結構的規則。';
  });
</script>
```

回饋文字要說明學生驗證到的概念，而不只顯示「正確」或「錯誤」。

## 第六步：建立共用的學習導航

當單元變多時，不要在每一個 HTML 重複寫「目標、挑戰、成果、檢核」卡片。可建立 `learning-guides.js`，依頁面檔名讀取資料並插入共用導航。

資料結構可採用：

```javascript
const guides = {
  'grade7-lesson-01.html': {
    grade: '七年級｜第 1 課',
    title: '讀懂積木',
    goal: '辨識事件、動作與控制積木的作用。',
    action: '先預測角色行為，再執行並比較結果。',
    evidence: '完成一張積木用途對照表。',
    check: '我能指出程式從哪個事件開始執行。'
  }
};
```

每個單元只要在 `<head>` 載入：

```html
<script src="learning-guides.js" defer></script>
```

這樣要修改共同版面或增加一項導航內容時，只需改一個檔案。

## 第七步：管理圖片、教材檔與外部連結

建議的資產管理方式：

```text
imgs/
├── grade-7/
├── grade-8/
└── teacher-resources/

downloads/
├── grade-7-examples.zip
└── grade-8-examples.zip
```

規則：

- 圖片檔名使用英文小寫與連字號，例如 `loop-polygon-example.png`。
- 每張資訊性圖片都提供 `alt` 文字。
- 壓縮檔、Scratch 專案檔與圖片一律以相對路徑連結。
- 外部網站才使用完整 URL，並加上 `target="_blank"` 與 `rel="noopener noreferrer"`。

## 第八步：測試，不只看畫面

每做完一課，至少測試：

1. 從首頁可以進到課程總覽，再進到新單元。
2. 返回、上一頁、下一頁與下載連結都存在。
3. 正確操作與錯誤操作都能得到可理解的回饋。
4. 縮小瀏覽器到手機寬度，確認按鈕和文字仍可使用。
5. 重新整理頁面後，互動不會卡在不合理的中間狀態。
6. 開啟瀏覽器開發者工具，確認沒有 JavaScript 錯誤或找不到檔案的訊息。

完整檢查完一個單元後，再複製它做下一課。不要同時建立多個還沒測試的頁面。

## 第九步：用 Git 保存每個可用版本

Git 的目的不是增加流程，而是讓每一次可用的教材修改都有回復點。

建議在以下時機提交：

- 完成首頁與課程總覽。
- 完成一個可操作的單元。
- 加入一批教材圖片或範例檔。
- 調整共用外觀或學習導航。

提交訊息應描述「完成什麼」，例如：

```text
Add grade 7 loop lesson
Create shared learning guide
Unify course visual theme
```

不要在提交中放入帳號密碼、API 金鑰、學生名冊或個人資料。這些資料即使之後刪除，也可能留在版本紀錄中。

## 第十步：發布到 GitHub Pages

這個架構不需要編譯。完成後可將專案推送至 GitHub，並在儲存庫設定中啟用 GitHub Pages，選擇 `main` 分支的根目錄作為發布來源。

發布後請重新測試：

- 首頁、課程總覽與單元頁網址。
- 圖片、ZIP 與 Scratch 教材下載。
- 站內相對連結。
- 手機版閱讀與互動。

若本機正常、發布後失敗，最常見原因是檔名大小寫不同，或檔案沒有一起提交到 Git。

## 何時開始做另一套系統

當你需要帳號、資料同步、作業繳交或自動評分時，請把它視為下一個獨立專案，而不是在教材 HTML 中逐步加上功能。新系統應先回答：

1. 誰可以登入？
2. 要保存哪些資料？保存多久？
3. 學生資料由誰管理？
4. 哪些功能需要教師權限？
5. 資料庫、後端 API 與外部服務失效時，教材是否仍能使用？

將教材與服務系統分開後，教材可以保持簡單、公開與長期可閱讀；需要權限的系統也能獨立測試與維護。

## 建議的學習順序

1. 先閱讀本文件，建立一個首頁與一個單元。
2. 參考 [新增教材單元指南](UNIT_AUTHORING_GUIDE.md)，擴充第二、第三個單元。
3. 參考 [系統開發過程](DEVELOPMENT.md)，理解為何要維持靜態教材定位、相對路徑與共用主題。
4. 完成一個學期教材後，再評估是否真的需要獨立的登入或作業系統。
