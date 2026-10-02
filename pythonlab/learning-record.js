import { earnedStars } from './progress.js';

const safeElapsed = value => Number.isFinite(value) && value >= 0 ? value : 0;

// Anchor exists only in memory: closing the page never adds the offline interval.
export function createLearningClock(timings, now = () => performance.now()) {
  let unit = null;
  let anchor = null;
  function record() {
    if (unit === null) return null;
    const saved = timings[unit];
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) timings[unit] = {};
    timings[unit].elapsedMs = safeElapsed(timings[unit].elapsedMs);
    return timings[unit];
  }
  function elapsed() {
    const saved = record();
    return saved ? saved.elapsedMs + (anchor === null ? 0 : Math.max(0, now() - anchor)) : 0;
  }
  function checkpoint() {
    const saved = record();
    if (!saved || anchor === null) return;
    const time = now();
    saved.elapsedMs += Math.max(0, time - anchor);
    anchor = time;
  }
  return {
    elapsed, checkpoint,
    select(id) { checkpoint(); unit = id; anchor = null; record(); },
    setRunning(running) {
      checkpoint();
      anchor = running && record() && !record().paused ? now() : null;
    },
    setPaused(paused) { checkpoint(); if (record()) record().paused = Boolean(paused); if (paused) anchor = null; },
    isPaused() { return Boolean(record()?.paused); },
    isRunning() { return anchor !== null; }
  };
}

export function formatDuration(elapsedMs) {
  const total = Math.floor(safeElapsed(elapsedMs) / 1000);
  return `${String(Math.floor(total / 3600)).padStart(2, '0')}:${String(Math.floor(total / 60) % 60).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function normalizeStudent(student = {}) {
  return Object.fromEntries([['className', 40], ['seat', 3], ['name', 40]].map(([key, max]) => [key, String(student?.[key] ?? '').trim().slice(0, max)]));
}

export function validStudent(student) {
  const value = normalizeStudent(student);
  return Boolean(value.className && value.name && /^[0-9]{1,3}$/.test(String(student?.seat ?? '').trim()) && Number(value.seat) >= 1);
}

// A certificate uses the highest earned tier's snapshot, never the current running clock.
export function certificateRecord(completed) {
  const stars = earnedStars(completed);
  if (!stars) return null;
  const evidence = completed.levels[stars];
  return {
    stars,
    achievedAt: evidence.achievedAt || evidence.verifiedAt || null,
    elapsedMs: Number.isFinite(evidence.elapsedMs) && evidence.elapsedMs >= 0 ? evidence.elapsedMs : null,
    partial: Boolean(evidence.timingPartial)
  };
}
