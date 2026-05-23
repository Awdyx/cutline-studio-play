export type TextFormatKind = 'bold' | 'italic' | 'underline' | 'strikethrough'

const EXEC_COMMAND: Record<TextFormatKind, string> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strikethrough: 'strikeThrough',
}

export function applyTextFormat(kind: TextFormatKind): void {
  document.execCommand(EXEC_COMMAND[kind], false)
}

export function formatKindFromShortcutKey(
  key: string,
  shiftKey: boolean,
): TextFormatKind | null {
  const k = key.toLowerCase()
  if (k === 'b') return 'bold'
  if (k === 'i') return 'italic'
  if (k === 'u') return 'underline'
  if (k === 'x' && shiftKey) return 'strikethrough'
  return null
}

export function isFormatModifierShortcut(e: {
  metaKey: boolean
  ctrlKey: boolean
  key: string
  shiftKey: boolean
}): boolean {
  if (!(e.metaKey || e.ctrlKey)) return false
  return formatKindFromShortcutKey(e.key, e.shiftKey) !== null
}
