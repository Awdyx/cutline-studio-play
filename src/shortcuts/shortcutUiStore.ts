import { create } from 'zustand'
import type { ShortcutDef } from './shortcutDefs'

export type ToastPayload = {
  shortcutId: string
  label: string
  keys: string[]
  icon?: ShortcutDef['icon']
}

type PlusFabControls = {
  open: () => void
  close: () => void
  isOpen: () => boolean
}

type ToolPaletteControls = {
  close: () => void
  isOpen: () => boolean
}

type CanvasSearchControls = {
  focus: () => void
  closeDropdown: () => void
  isDropdownOpen: () => boolean
  isInputFocused: () => boolean
  blurInput: () => void
}

type ShortcutUiState = {
  canvasSearch: CanvasSearchControls | null
  registerCanvasSearch: (controls: CanvasSearchControls | null) => void
  plusFab: PlusFabControls | null
  registerPlusFab: (controls: PlusFabControls | null) => void
  toolPalette: ToolPaletteControls | null
  registerToolPalette: (controls: ToolPaletteControls | null) => void
  toast: ToastPayload | null
  toastNonce: number
  showActionToast: (payload: ToastPayload) => void
  clearToast: () => void
}

export const useShortcutUiStore = create<ShortcutUiState>((set) => ({
  canvasSearch: null,
  registerCanvasSearch: (controls) => set({ canvasSearch: controls ?? null }),

  plusFab: null,
  registerPlusFab: (controls) => set({ plusFab: controls ?? null }),

  toolPalette: null,
  registerToolPalette: (controls) => set({ toolPalette: controls ?? null }),

  toast: null,
  toastNonce: 0,
  showActionToast: (payload) =>
    set((s) => ({
      toast: payload,
      toastNonce: s.toastNonce + 1,
    })),
  clearToast: () => set({ toast: null }),
}))
