const TRACE_PREFIX = 'trace:';
const HISTORY_KEY = 'history';
const MATRIX_KEY = 'matrix';
const ERRORS_KEY = 'errors';
const QUEUE_KEY = 'queue';
const SETTINGS_KEY = 'settings';

const defaultMatrix = [
  { id: 'x-main', platform: 'x', postCapPerDay: 10, cooldownMinutes: 30, riskLevel: 'medium', lastPostAt: 0, postsToday: 0 },
  { id: 'xhs-draft', platform: 'xiaohongshu', postCapPerDay: 20, cooldownMinutes: 20, riskLevel: 'low', lastPostAt: 0, postsToday: 0 },
  { id: 'douyin-draft', platform: 'douyin', postCapPerDay: 20, cooldownMinutes: 20, riskLevel: 'low', lastPostAt: 0, postsToday: 0 }
];

const defaultSettings = { mode: 'semi-auto', circuitBreakerThreshold: 5, highFreqWindowSec: 120, highFreqLimit: 8 };

export async function getJson(kv, key, fallback) {
  const raw = await kv.get(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

export async function putJson(kv, key, value) {
  await kv.put(key, JSON.stringify(value));
}

function migrateLegacyMatrix(matrix) {
  if (!Array.isArray(matrix)) return defaultMatrix;
  return matrix.map((m) => {
    if (typeof m.cooldownMinutes === 'number') return m;
    const cooldownMinutes = typeof m.cooldown === 'number' ? m.cooldown : 0;
    const { cooldown, ...rest } = m;
    return { ...rest, cooldownMinutes };
  });
}

export async function getMatrix(kv) {
  const matrix = await getJson(kv, MATRIX_KEY, defaultMatrix);
  return migrateLegacyMatrix(matrix);
}

export async function setMatrix(kv, matrix) {
  return putJson(kv, MATRIX_KEY, matrix);
}

export async function getSettings(kv) {
  return getJson(kv, SETTINGS_KEY, defaultSettings);
}

export async function getHistory(kv) {
  return getJson(kv, HISTORY_KEY, []);
}

export async function appendHistory(kv, item, cap = 500) {
  const history = await getHistory(kv);
  history.unshift(item);
  await putJson(kv, HISTORY_KEY, history.slice(0, cap));
}

export async function appendError(kv, item, cap = 200) {
  const errors = await getJson(kv, ERRORS_KEY, []);
  errors.unshift(item);
  await putJson(kv, ERRORS_KEY, errors.slice(0, cap));
}

export async function getErrors(kv) {
  return getJson(kv, ERRORS_KEY, []);
}

export async function getQueue(kv) {
  return getJson(kv, QUEUE_KEY, []);
}

export async function setQueue(kv, queue) {
  return putJson(kv, QUEUE_KEY, queue);
}

export async function saveTrace(kv, trace) {
  await putJson(kv, TRACE_PREFIX + trace.traceId, trace);
  await appendHistory(kv, {
    traceId: trace.traceId,
    status: trace.status,
    startedAt: trace.startedAt,
    finishedAt: trace.finishedAt,
    accountId: trace.accountId,
    platform: trace.platform,
    contentHash: trace.contentHash || null
  });
}

export async function getTrace(kv, traceId) {
  return getJson(kv, TRACE_PREFIX + traceId, null);
}
