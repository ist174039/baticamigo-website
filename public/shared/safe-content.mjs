export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
export function safeMediaUrl(value) {
  const input=String(value || '');
  if(/^data:(image\/(?:png|jpeg|gif|webp)|video\/(?:mp4|webm));base64,[A-Za-z0-9+/=]+$/.test(input)) return input;
  try {
    const url=new URL(input, globalThis.location?.origin || 'https://baticamigo.pt');
    const sameOrigin=globalThis.location?.origin && url.origin===globalThis.location.origin;
    const trustedStorage=['firebasestorage.googleapis.com','storage.googleapis.com'].includes(url.hostname);
    return (sameOrigin || (url.protocol==='https:' && trustedStorage)) && !url.username && !url.password ? escapeHtml(url.toString()) : '';
  } catch { return ''; }
}
