export function buildDebugView({ traces, errors, queue }) {
  return {
    lastTrace: traces[0] || null,
    errors: errors.slice(0, 20),
    queue,
    timestamp: new Date().toISOString()
  };
}
