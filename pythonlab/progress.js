// 星級記錄最高已驗證等級，各等級可獨立作答；三星選做。
export function migrateCompletion(completed = {}) {
  return Object.fromEntries(Object.entries(completed).filter(([, item]) => item && typeof item === 'object').map(([id, item]) => [id, item.levels ? item : { levels: { 1: item } }]));
}
export function earnedStars(record) {
  let stars = 0;
  for (let tier = 1; tier <= 3; tier++) {
    if (typeof record?.levels?.[tier]?.code === 'string') stars = tier;
  }
  return stars;
}
export function canAttemptTier(record, tier) {
  return Number.isInteger(tier) && tier >= 1 && tier <= 3;
}
export function awardTier(record, tier, evidence) {
  if (!canAttemptTier(record, tier)) throw new Error('星級必須是 1、2 或 3。');
  if (typeof evidence?.code !== 'string') throw new Error('缺少已驗證的程式。');
  return { levels: { ...(record?.levels || {}), [tier]: evidence } };
}
