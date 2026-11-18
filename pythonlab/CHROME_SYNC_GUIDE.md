# Chrome 個人資料進度同步

同步內容包括各單元通過的星級、通關日期、通關當時的時間、累計學習時間與最近練習位置。完整程式草稿、預測、離堂說明與學生姓名保存在原電腦。學生仍可自由選擇全部單元與星級。

## 本機測試

1. 下載並解壓縮 [進度同步擴充功能 ZIP](chrome-sync-extension.zip)，確認資料夾內有 `manifest.json`。
2. 在電腦版 Chrome 開啟 `chrome://extensions`，啟用「開發人員模式」，按「載入未封裝項目」，選擇解壓縮的資料夾。
3. 開啟 Python Lab 網站，或在專案執行 `npm run preview` 後開啟 `http://127.0.0.1:4173/pythonlab/index.html`。已經開著的教材頁需重新整理。
4. 按「啟用進度同步」，選擇「載入 Chrome 進度」。若這台電腦的舊紀錄也屬於自己，可選「合併這台電腦的舊進度」。舊本機紀錄會保留在原儲存區，同步模式使用另一份本機快取。
5. 完成題目後，按「立即寫入同步區」。頁面顯示「已寫入 Chrome 同步區」表示擴充功能已接受資料。Google 伺服器的跨裝置傳輸由 Chrome 處理，頁面無法確認另一台電腦何時收到。

跨電腦測試需在兩台電腦登入同一個 Chrome 個人資料，並在 Chrome 設定開啟「擴充功能」同步。擴充功能 ID 也必須一致。本機開發版本的 ID 可能受資料夾路徑影響，上架後可依下一節取得固定 ID。

在電腦 A 通過一個星級，確認已寫入同步區。在電腦 B 安裝相同 ID 的擴充功能並開啟教材，等待 Chrome 同步後按「立即寫入同步區」，核對星級與時間。首頁的主要按鈕會連回最近練習的位置。新電腦的程式區載入該題起始程式，完整程式可在原電腦下載 `.py`。

## 上架 Chrome 線上應用程式商店

1. 在 [Chrome 開發人員後台](https://chrome.google.com/webstore/devconsole/) 建立項目並上傳 `chrome-sync-extension.zip`。
2. 若需要在上架前以相同 ID 測試，從後台套件頁取得 public key，填入 `manifest.json` 的 `key` 欄位，再執行 `npm run build:chrome-sync` 重新打包。
3. 填寫名稱、說明、截圖、支援資訊與資料使用揭露。資料使用內容見 [PRIVACY.md](chrome-sync-extension/PRIVACY.md)，發布網站後可提供此公開文件網址。
4. 送交商店審核，通過後提供商店安裝網址。學生首次從商店安裝後，在其他電腦登入相同個人資料並開啟擴充功能同步，即可由 Chrome 安裝相同擴充功能。

推送 GitHub 會發布網站連接程式與可下載 ZIP。商店上架需使用維護者的 Chrome 開發人員帳號完成，兩項發布各有進度。

## 儲存與維護

共用的同步資料格式與合併規則位於 `chrome-sync-extension/progress-core.js`。每個星級使用獨立鍵值，各台電腦各自記錄時間增量，再彙整總時間，避免兩台電腦同時寫入時互相覆蓋。重送請求帶有識別資料，同一請求只累加一次。證書採同級最早通過時的時間，重新驗證保留既有紀錄。

資料先存入擴充功能的本機備份，再寫入 `chrome.storage.sync`。儲存區拒絕寫入時會顯示狀態並安排重試。平常約 30 秒合併寫入一次，也可手動寫入。Chrome 未登入或關閉同步時，資料仍可在此電腦保存，跨電腦接續需由 Chrome 啟用同步。

同步模式首頁的重設按鈕改為「重新讀取 Chrome 同步進度」。本機草稿依原有的 `.py` 下載與還原功能管理。同步進度是學習練習紀錄，星級沿用原來的題目驗證。

執行 `npm run build:chrome-sync` 可重新產生下載 ZIP，執行 `npm run test:python` 可驗證資料合併、重試與教材相容性。

官方機制說明見 [Chrome 儲存 API](https://developer.chrome.com/docs/extensions/reference/api/storage)、[固定擴充功能 ID](https://developer.chrome.com/docs/extensions/reference/manifest/key)及[商店發布流程](https://developer.chrome.com/docs/webstore/publish)。
