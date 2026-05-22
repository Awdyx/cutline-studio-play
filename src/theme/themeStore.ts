import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PaletteConfig } from './paletteGenerator'

export type ThemeMode = 'light' | 'dark' | 'auto'

export type ThemeState = {
  mode: ThemeMode
  palette: PaletteConfig
  setMode: (mode: ThemeMode) => void
  setPalette: (partial: Partial<PaletteConfig>) => void
  resetCanvasAppearance: () => void
}

export const defaultPalette: PaletteConfig = {
  blobDepth: 0.45,
}

function clampPalette(partial: Partial<PaletteConfig>): Partial<PaletteConfig> {
  const next = { ...partial }
  if (next.blobDepth !== undefined) {
    next.blobDepth = Math.min(1, Math.max(0, next.blobDepth))
  }
  return next
}

type PersistedV1 = {
  mode?: ThemeMode
  palette?: {
    baseHue?: number
    saturation?: number
    warmth?: number
    blobDepth?: number
  }
}

function migratePalette(raw: PersistedV1['palette']): PaletteConfig {
  if (!raw) return defaultPalette
  if (typeof raw.blobDepth === 'number') {
    return { blobDepth: Math.min(1, Math.max(0, raw.blobDepth)) }
  }
  const saturation =
    typeof raw.saturation === 'number' ? Math.min(0.48, Math.max(0, raw.saturation)) : 0.18
  return { blobDepth: Math.min(1, saturation / 0.48) }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      palette: defaultPalette,

      setMode: (mode) => set({ mode }),

      setPalette: (partial) =>
        set((state) => ({
          palette: { ...state.palette, ...clampPalette(partial) },
        })),

      resetCanvasAppearance: () =>
        set((state) => ({
          palette: defaultPalette,
          mode: state.mode,
        })),
    }),
    {
      name: 'cutline-theme-v1',
      version: 2,
      migrate: (persisted: unknown) => {
        const state = persisted as PersistedV1
        return {
          mode: state.mode ?? 'light',
          palette: migratePalette(state.palette),
        }
      },
    },
  ),
)
