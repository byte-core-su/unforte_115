# 教材更新與推送

- Codex 完成這個專案的教材或功能更新後，直接將該次已驗證的變更推送至 `byte-core-su/unforte_115` 的 `main`，供使用者在 GitHub Pages 測試。使用者另有指定發布範圍或要求暫緩時，依該次指示處理。
- 提交前確認發布範圍，並執行 `npm test`、`node scripts/build-lesson-plans.cjs --check` 和 `npm run check:materials`。與本次更新無關的草稿、本機備份和忽略檔案留在工作區。
- 以 GitHub 上最新的 `main` 為基礎，只做正常推送。推送後核對遠端提交。測試、合併或驗證未通過時，保留修改並在回覆中交代實際狀態。
