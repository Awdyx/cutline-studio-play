import { create } from 'zustand'

/** Item currently being moved (after drag threshold). Drives lift UI and temporary pan lock. */
export const useCanvasItemDragStore = create<{
  activeItemId: string | null
}>(() => ({
  activeItemId: null,
}))
