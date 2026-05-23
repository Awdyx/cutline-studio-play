import type { LucideIcon } from 'lucide-react'
import { Copy, Lock, Plus, Redo2, Search, Trash2, Undo2 } from 'lucide-react'
import { modKeyLabel } from './modKey'

export type ShortcutKeyPart = string

export type ShortcutDef = {
  id: string
  label: string
  category: string
  keys: ShortcutKeyPart[]
  icon?: LucideIcon
  /** When true, firing this shortcut does not show the action toast. */
  skipToast?: boolean
}

const mod = modKeyLabel()

function modKeys(...parts: string[]): ShortcutKeyPart[] {
  return [mod, ...parts]
}

export const SHORTCUTS: ShortcutDef[] = [
  {
    id: 'undo',
    label: 'Undo',
    category: 'Edit',
    keys: modKeys('Z'),
    icon: Undo2,
  },
  {
    id: 'redo',
    label: 'Redo',
    category: 'Edit',
    keys: modKeys('⇧', 'Z'),
    icon: Redo2,
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    category: 'Canvas',
    keys: modKeys('D'),
    icon: Copy,
  },
  {
    id: 'select-all',
    label: 'Select all',
    category: 'Canvas',
    keys: modKeys('A'),
  },
  {
    id: 'delete',
    label: 'Delete',
    category: 'Canvas',
    keys: ['⌫'],
    icon: Trash2,
  },
  {
    id: 'deselect',
    label: 'Deselect / dismiss',
    category: 'Canvas',
    keys: ['Esc'],
  },
  {
    id: 'toggle-lock',
    label: 'Toggle canvas lock',
    category: 'Canvas',
    keys: modKeys('L'),
    icon: Lock,
  },
  {
    id: 'open-fab',
    label: 'Add to canvas',
    category: 'Canvas',
    keys: modKeys('K'),
    icon: Plus,
    skipToast: true,
  },
  {
    id: 'find',
    label: 'Search canvas',
    category: 'Navigation',
    keys: modKeys('F'),
    icon: Search,
    skipToast: true,
  },
]

export const SHORTCUTS_BY_ID = Object.fromEntries(
  SHORTCUTS.map((s) => [s.id, s]),
) as Record<string, ShortcutDef>

export const SHORTCUT_CATEGORIES = ['Edit', 'Canvas', 'Navigation'] as const

export function shortcutsByCategory(): Map<string, ShortcutDef[]> {
  const map = new Map<string, ShortcutDef[]>()
  for (const cat of SHORTCUT_CATEGORIES) {
    map.set(cat, [])
  }
  for (const s of SHORTCUTS) {
    const list = map.get(s.category) ?? []
    list.push(s)
    map.set(s.category, list)
  }
  return map
}
