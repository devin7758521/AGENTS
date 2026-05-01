export function selectAccount(matrix, platform = 'x') {
  const now = Date.now();
  const candidates = matrix.filter((m) => m.platform === platform);
  for (const acc of candidates) {
    const cooldownMs = acc.cooldown * 1000;
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
