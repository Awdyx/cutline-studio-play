import { parseInlineMarkdown } from './inlineMarkdown'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function looksLikeHtml(stored: string): boolean {
  return /<[a-z][\s\S]*>/i.test(stored.trim())
}

function looksLikeMarkdown(stored: string): boolean {
  return /(\*\*|__|~~|\+\+|\*(?!\*)|_(?!_))/u.test(stored)
}

/** Convert persisted value (HTML or legacy markdown) for the rich-text editor. */
export function storedContentToHtml(stored: string): string {
  if (!stored) return ''
  const trimmed = stored.trim()
  if (!trimmed) return ''
  if (looksLikeHtml(trimmed)) return stored
  if (looksLikeMarkdown(stored)) return parseInlineMarkdown(stored)
  return escapeHtml(stored).replace(/\n/g, '<br />')
}

export function readEditorHtml(el: HTMLElement): string {
  return el.innerHTML
}

export function isEditorEmpty(el: HTMLElement): boolean {
  const text = el.textContent?.replace(/\u00a0/g, ' ').trim() ?? ''
  return text.length === 0
}
