export function buildDebugView({ traces, errors, queue }) {
  return {
    lastTrace: traces[0] || null,
    recentTraces: traces.slice(0, 10),
    errors: errors.slice(0, 20),
    queue,
    timestamp: new Date().toISOString()
  };
}
