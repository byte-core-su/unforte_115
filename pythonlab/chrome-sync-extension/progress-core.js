export const PREFIX = 'pythonlab:v1:';
export const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const validUnit = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 12;
const safeTime = value => Number.isFinite(value) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, value)) : 0;

export function compactEvidence(value) {
  if (!value || !(typeof value.code === 'string' || value.verified === true)) return null;
  return { verified: true, assisted: Boolean(value.assisted), verifiedAt: safeTime(value.verifiedAt),
    achievedAt: safeTime(value.achievedAt || value.verifiedAt),
    elapsedMs: Number.isFinite(value.elapsedMs) ? safeTime(value.elapsedMs) : null,
    timingPartial: Boolean(value.timingPartial) };
}
export function firstEvidence(left, right) {
  if (!left) return right;
  if (!right) return left;
  const leftTime = left.achievedAt || left.verifiedAt || Infinity;
  const rightTime = right.achievedAt || right.verifiedAt || Infinity;
  if (leftTime !== rightTime) return leftTime < rightTime ? left : right;
  return JSON.stringify(left) <= JSON.stringify(right) ? left : right;
}
export function positionOf(value) {
  if (!value || !validUnit(value.unit) || !Number.isInteger(value.stage) || value.stage < 0 || value.stage > 4) return null;
  return { unit: Number(value.unit), stage: value.stage, updatedAt: safeTime(value.updatedAt) };
}
export function summaryOf(state = {}) {
  const summary = { version: 1, completed: {}, timings: {}, position: positionOf(state.position || state.recent) };
  for (let unit = 1; unit <= 12; unit++) {
    const record = state.completed?.[unit];
    const levels = record?.levels || (typeof record?.code === 'string' ? { 1: record } : {});
    for (const tier of [1, 2, 3]) {
      const evidence = compactEvidence(levels[tier]);
      if (evidence) (summary.completed[unit] ||= { levels: {} }).levels[tier] = evidence;
    }
    if (state.timings?.[unit]) summary.timings[unit] = { elapsedMs: safeTime(state.timings[unit].elapsedMs) };
  }
  return summary;
}
export function mergeSummaries(leftValue, rightValue) {
  const left = summaryOf(leftValue);
  const right = summaryOf(rightValue);
  const result = summaryOf();
  for (let unit = 1; unit <= 12; unit++) {
    for (const tier of [1, 2, 3]) {
      const evidence = firstEvidence(left.completed[unit]?.levels[tier], right.completed[unit]?.levels[tier]);
      if (evidence) (result.completed[unit] ||= { levels: {} }).levels[tier] = evidence;
    }
    if (left.timings[unit] || right.timings[unit]) {
      result.timings[unit] = { elapsedMs: Math.max(left.timings[unit]?.elapsedMs || 0, right.timings[unit]?.elapsedMs || 0) };
    }
  }
  const positions = [left.position, right.position].filter(Boolean);
  positions.sort((a, b) => b.updatedAt - a.updatedAt || b.unit - a.unit || b.stage - a.stage);
  result.position = positions[0] || null;
  return result;
}
export function applySummary(state, incoming, submitted = summaryOf(state)) {
  const next = JSON.parse(JSON.stringify(state));
  next.completed ||= {}; next.timings ||= {};
  const summary = mergeSummaries(summaryOf(state), incoming);
  for (let unit = 1; unit <= 12; unit++) {
    if (summary.completed[unit]) {
      const original = next.completed[unit];
      const levels = original?.levels || (typeof original?.code === 'string' ? { 1: original } : {});
      next.completed[unit] = { levels: { ...levels } };
      for (const [tier, evidence] of Object.entries(summary.completed[unit].levels)) {
        next.completed[unit].levels[tier] = { ...levels[tier], ...evidence };
      }
    }
    if (incoming.timings?.[unit]) {
      const additional = Math.max(0, (state.timings?.[unit]?.elapsedMs || 0) - (submitted.timings?.[unit]?.elapsedMs || 0));
      next.timings[unit] = { ...next.timings[unit], elapsedMs: safeTime(incoming.timings[unit].elapsedMs + additional) };
    }
  }
  if (summary.position) next.recent = summary.position;
  return next;
}
export function readSyncData(data) {
  const summary = summaryOf();
  for (let unit = 1; unit <= 12; unit++) {
    for (const tier of [1, 2, 3]) {
      const evidence = compactEvidence(data[`${PREFIX}star:${unit}:${tier}`]);
      if (evidence) (summary.completed[unit] ||= { levels: {} }).levels[tier] = evidence;
    }
  }
  for (const [key, values] of Object.entries(data)) {
    if (!key.startsWith(`${PREFIX}time:`) || !values || typeof values !== 'object') continue;
    for (let unit = 1; unit <= 12; unit++) {
      const total = (summary.timings[unit]?.elapsedMs || 0) + safeTime(values[unit]);
      if (total) summary.timings[unit] = { elapsedMs: safeTime(total) };
    }
  }
  summary.position = positionOf(data[`${PREFIX}position`]);
  return summary;
}
export function allowPage(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    if (parsed.origin === 'https://byte-core-su.github.io') return /^\/unforte_115\/pythonlab\/(?:index\.html)?$/.test(path);
    return parsed.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(parsed.hostname) && /^\/pythonlab\/(?:index\.html)?$/.test(path);
  } catch { return false; }
}
