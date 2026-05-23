import { storedContentToHtml } from '../canvasItems/textEditorContent'
import type { CanvasItem } from '../canvasItems/types'

export type CanvasSearchKind = 'sticky' | 'text' | 'space'

export type CanvasSearchEntry = {
  id: string
  kind: CanvasSearchKind
  title: string
  preview: string
  searchText: string
  item: CanvasItem
  accentColor?: string
}

function plainTextFromStored(stored: string): string {
  if (!stored.trim()) return ''
  const html = storedContentToHtml(stored)
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

export function buildCanvasSearchEntries(items: CanvasItem[]): CanvasSearchEntry[] {
  const entries: CanvasSearchEntry[] = []

  for (const item of items) {
    if (item.type === 'sticky') {
      const plain = plainTextFromStored(item.text)
      const title = plain ? truncate(plain, 48) : 'Untitled sticky'
      entries.push({
        id: item.id,
        kind: 'sticky',
        title,
        preview: plain || 'Empty sticky note',
        searchText: plain.toLowerCase(),
        item,
      })
      continue
    }

    if (item.type === 'text') {
      const plain = plainTextFromStored(item.text)
      const title = plain ? truncate(plain, 48) : 'Untitled text'
      entries.push({
        id: item.id,
        kind: 'text',
        title,
        preview: plain || 'Empty text',
        searchText: plain.toLowerCase(),
        item,
      })
      continue
    }

    if (item.type === 'space') {
      const name = item.name.trim() || 'Untitled space'
      entries.push({
        id: item.id,
        kind: 'space',
        title: name,
        preview: name,
        searchText: name.toLowerCase(),
        item,
      })
    }
  }

  return entries.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  )
}

export function filterCanvasSearchEntries(
  entries: CanvasSearchEntry[],
  query: string,
): CanvasSearchEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return entries.filter(
    (e) =>
      e.searchText.includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.preview.toLowerCase().includes(q),
  )
}
