export async function createDraft(platform, content) {
  return {
    platform,
    mode: 'draft',
    result: { id: platform + '_draft_' + Date.now(), text: content.text }
  };
}
