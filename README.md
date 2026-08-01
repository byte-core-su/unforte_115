# unforte_115

以 Scratch 為主的互動式程式設計教學網站，包含兩組課程、Scratch 範例教材，以及供教師批改與學生繳交作業使用的頁面。

## 課程內容

- **11507 課程**：程式流程、畫筆與幾何圖形、重複結構、變數、函式與參數等 Scratch 核心概念。
- **11508 課程**：清單、音樂、資料處理、隨機與排序等延伸主題，採用任務與模擬方式進行練習。
- 每組課程均有 6 個互動單元；活動包含概念說明、積木排序、即時模擬與小測驗。

## 網站頁面

| 頁面 | 用途 |
| --- | --- |
| `index.html` | 課程與工具入口首頁 |
| `1150700.html`～`1150706.html` | 11507 課程單元 |
| `1150800.html`～`1150806.html` | 11508 課程單元 |
| `easy-classroom.html` | 教師端：解析範例、建立批改規則、讀取與批改 Google Classroom 作業 |
| `easy-student.html` | 學生端：上傳 `.sb3` 檔案並取得批改結果 |
| `11507.zip`、`11508.zip` | 可下載的 Scratch `.sb3` 教材範例 |

## 使用方式

直接以瀏覽器開啟 `index.html`，或部署至靜態網站服務（例如 GitHub Pages）。教材頁面可離線瀏覽，但外部 CDN 的圖示與樣式需要網路連線。

教師與學生批改功能另外依賴外部批改 API、Google Apps Script、Google Classroom 與 Google Drive 授權；這些後端服務不包含在本倉庫中。

## 技術概況

- 靜態 HTML、CSS、原生 JavaScript 為主
- 使用 Tailwind CSS、Lucide、Font Awesome 等 CDN 資源
- `1150801.html` 使用 React 與 Babel 的瀏覽器端版本
- 學習活動進度以瀏覽器 `localStorage` 保存
