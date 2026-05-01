export function evaluateRisk({ content, history, settings }) {
  const reasons = [];

  if (!content || !content.text) reasons.push('empty_content');

  const duplicate = history.find((h) => h.contentHash && h.contentHash === hashContent(content?.text || ''));
  if (duplicate) reasons.push('duplicate_content');

  const recent = history.filter((h) => Date.now() - new Date(h.startedAt).getTime() < settings.highFreqWindowSec * 1000);
  if (recent.length >= settings.highFreqLimit) reasons.push('high_frequency');

  const recentFailures = history.filter((h) => h.status === 'failed').slice(0, settings.circuitBreakerThreshold);
  if (recentFailures.length >= settings.circuitBreakerThreshold) reasons.push('circuit_breaker_open');

  return { pass: reasons.length === 0, reasons };
}

export function hashContent(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h << 5) - h + text.charCodeAt(i);
  return String(Math.abs(h));
}
