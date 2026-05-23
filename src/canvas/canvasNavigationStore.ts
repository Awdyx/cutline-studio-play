import { create } from 'zustand'

type CanvasNavigationState = {
  /** Two or more fingers on the screen (pinch). */
  multiTouchActive: boolean
  setMultiTouchActive: (active: boolean) => void
  shouldSuppressItemTap: () => boolean
}

export const useCanvasNavigationStore = create<CanvasNavigationState>((set, get) => ({
  multiTouchActive: false,

  setMultiTouchActive: (active) => set({ multiTouchActive: active }),

  shouldSuppressItemTap: () => get().multiTouchActive,
}))

/**
 * Class-only selectors for react-zoom-pan-pinch `excluded` (it prefixes `.` — attribute
 * selectors like `[data-canvas-item]` break `Element.matches` and disable all pan/zoom).
 */
export const CANVAS_PAN_EXCLUDED = [
  'canvas-item-drag-handle',
  'canvas-item-resize-handle',
] as const
