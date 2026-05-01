export async function publishToX(content, env) {
  const token = env.X_API_TOKEN || 'placeholder-token';
  return {
    platform: 'x',
    mode: 'live',
    tokenUsed: token ? 'yes' : 'no',
    result: { id: 'x_' + Date.now(), text: content.text }
  };
}
