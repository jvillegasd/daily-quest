const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * Escape a string for safe interpolation into HTML (e.g. transactional emails).
 * User-controlled values such as displayName or household name must pass through
 * this before being placed into an HTML template, otherwise they allow HTML /
 * link injection in the rendered email.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}
