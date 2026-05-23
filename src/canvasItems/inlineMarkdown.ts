function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Renders a small subset of inline markdown to HTML for canvas text previews.
 * Supports **bold**, *italic*, ~~strikethrough~~, and ++underline++.
 */
export function parseInlineMarkdown(source: string): string {
  if (!source) return ''

  let html = escapeHtml(source)

  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>')
  html = html.replace(/\+\+(.+?)\+\+/g, '<u>$1</u>')
  html = html.replace(/\n/g, '<br />')

  return html
}
