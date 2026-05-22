import { create } from 'zustand'
import {
  DEFAULT_HIGHLIGHTER_COLOR,
  DEFAULT_PEN_COLOR,
  normalizeStoredPenInk,
} from './colorUtils'

export type ToolMode = 'pen' | 'highlighter' | 'erase'

const STORAGE_KEY = 'cutline-tools-v1'

type PersistedTools = {
  mode?: ToolMode
  penColor?: string
  penSize?: number
  highlighterColor?: string
  highlighterSize?: number
}

export type ToolState = {
  mode: ToolMode
  penColor: string
  penSize: number
  highlighterColor: string
  highlighterSize: number
  setMode: (mode: ToolMode) => void
  setPenColor: (color: string) => void
  setPenSize: (size: number) => void
  setHighlighterColor: (color: string) => void
  setHighlighterSize: (size: number) => void
}

const defaults = {
  mode: 'pen' as ToolMode,
  penColor: DEFAULT_PEN_COLOR,
  penSize: 4,
  highlighterColor: DEFAULT_HIGHLIGHTER_COLOR,
  highlighterSize: 20,
}

function loadPersisted(): Partial<PersistedTools> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as PersistedTools
  } catch {
    return {}
  }
}

function persistTools(state: ToolState): void {
  try {
    const payload: PersistedTools = {
      mode: state.mode,
      penColor: state.penColor,
      penSize: state.penSize,
      highlighterColor: state.highlighterColor,
      highlighterSize: state.highlighterSize,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota errors
  }
}

function normalizeMode(mode?: string): ToolMode {
  if (mode === 'highlighter') return 'highlighter'
  if (mode === 'erase' || mode === 'erase-tap' || mode === 'erase-drag') return 'erase'
  return 'pen'
}

const persisted = loadPersisted()

export const useToolStore = create<ToolState>((set, get) => ({
  mode: normalizeMode(persisted.mode),
  penColor: normalizeStoredPenInk(persisted.penColor ?? defaults.penColor),
  penSize: persisted.penSize ?? defaults.penSize,
  highlighterColor: persisted.highlighterColor ?? defaults.highlighterColor,
  highlighterSize: persisted.highlighterSize ?? defaults.highlighterSize,

  setMode: (mode) => {
    set({ mode })
    persistTools(get())
  },
  setPenColor: (penColor) => {
    set({ penColor })
    persistTools(get())
  },
  setPenSize: (penSize) => {
    set({ penSize })
    persistTools(get())
  },
  setHighlighterColor: (highlighterColor) => {
    set({ highlighterColor })
    persistTools(get())
  },
  setHighlighterSize: (highlighterSize) => {
    set({ highlighterSize })
    persistTools(get())
  },
}))

export function isDrawingMode(mode: ToolMode): boolean {
  return mode === 'pen' || mode === 'highlighter'
}

export function isEraseMode(mode: ToolMode): boolean {
  return mode === 'erase'
}
