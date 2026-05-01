export function analyzeTraces(traces = []) {
  const failures = {};
  const stepCost = {};
  let riskHits = 0;

  for (const t of traces) {
    if (t.risk?.reasons?.length) riskHits += 1;
    for (const r of t.risk?.reasons || []) failures[r] = (failures[r] || 0) + 1;
    for (const s of t.steps || []) {
      stepCost[s.name] = stepCost[s.name] || { totalMs: 0, count: 0 };
      stepCost[s.name].totalMs += s.durationMs || 0;
      stepCost[s.name].count += 1;
    }
  }

  const bottleneck = Object.entries(stepCost)
    .map(([name, v]) => ({ name, avgMs: v.totalMs / Math.max(v.count, 1) }))
    .sort((a, b) => b.avgMs - a.avgMs)[0] || null;

  const suggestions = [];
  if ((failures.high_frequency || 0) > 0) suggestions.push('Increase cooldown and stagger matrix accounts.');
  if ((failures.duplicate_content || 0) > 0) suggestions.push('Improve content generation entropy and topic rotation.');
  if ((failures.circuit_breaker_open || 0) > 0) suggestions.push('Investigate upstream failures before resuming automation.');
  if (!suggestions.length) suggestions.push('System health good. Continue monitoring trace latency and risk drift.');

  return {
    totalRuns: traces.length,
    failureStats: failures,
    riskHitRate: traces.length ? Number((riskHits / traces.length).toFixed(3)) : 0,
    bottleneckStep: bottleneck,
    suggestions
  };
}
