// 星級是此瀏覽器的練習紀錄；二星完成核心學習，三星選做。
export function migrateCompletion(completed = {}) {
  return Object.fromEntries(Object.entries(completed).filter(([, item]) => item && typeof item === 'object').map(([id, item]) => [id, item.levels ? item : { levels: { 1: item } }]));
}
export function earnedStars(record) {
  let stars = 0;
  for (let tier = 1; tier <= 3; tier++) {
    if (!record?.levels?.[tier] || typeof record.levels[tier].code !== 'string') break;
    stars = tier;
  }
  return stars;
}
export function canAttemptTier(record, tier) {
  return Number.isInteger(tier) && tier >= 1 && tier <= 3 && earnedStars(record) >= tier - 1;
}
export function awardTier(record, tier, evidence) {
  if (!canAttemptTier(record, tier)) throw new Error('請先通過前一星級，再挑戰下一級。');
  if (typeof evidence?.code !== 'string') throw new Error('缺少已驗證的程式。');
  return { levels: { ...(record?.levels || {}), [tier]: evidence } };
}
