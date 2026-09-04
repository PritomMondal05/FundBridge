export function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeText(value, maxLength = 4000) {
  return stripHtml(value).slice(0, maxLength);
}

export function sanitizeStringArray(value, maxItems = 6, maxLength = 240) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function isSafeHttpUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeHttpUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || !isSafeHttpUrl(raw)) return '';
  return raw;
}
