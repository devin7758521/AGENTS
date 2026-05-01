const VALID_PLATFORMS = ['x', 'xiaohongshu', 'douyin'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high'];

export function selectAccount(matrix, platform = 'x') {
  const now = Date.now();
  const candidates = matrix.filter((m) => m.platform === platform);
  for (const acc of candidates) {
    const cooldownMs = acc.cooldownMinutes * 60 * 1000;
    const canCooldown = now - (acc.lastPostAt || 0) >= cooldownMs;
    const canCap = (acc.postsToday || 0) < acc.postCapPerDay;
    if (canCooldown && canCap) return acc;
  }
  return null;
}

export function updateAccountAfterRun(matrix, accountId, success) {
  const now = Date.now();
  return matrix.map((a) => {
    if (a.id !== accountId) return a;
    if (success) {
      return { ...a, lastPostAt: now, postsToday: (a.postsToday || 0) + 1 };
    }
    return a;
  });
}

export function validateMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return { ok: false, error: 'matrix_must_be_non_empty_array' };
  for (const acc of matrix) {
    if (!acc || typeof acc !== 'object') return { ok: false, error: 'invalid_account_object' };
    if (typeof acc.id !== 'string' || !acc.id.trim()) return { ok: false, error: 'invalid_id' };
    if (!VALID_PLATFORMS.includes(acc.platform)) return { ok: false, error: 'invalid_platform' };
    if (!Number.isInteger(acc.postCapPerDay) || acc.postCapPerDay < 1 || acc.postCapPerDay > 1000) return { ok: false, error: 'invalid_postCapPerDay' };
    if (!Number.isInteger(acc.cooldownMinutes) || acc.cooldownMinutes < 0 || acc.cooldownMinutes > 24 * 60) return { ok: false, error: 'invalid_cooldownMinutes' };
    if (!VALID_RISK_LEVELS.includes(acc.riskLevel)) return { ok: false, error: 'invalid_riskLevel' };
  }
  return { ok: true };
}
