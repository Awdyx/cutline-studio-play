import { create } from 'zustand'

type CanvasContextMenuState = {
  open: boolean
  clientX: number
  clientY: number
  canvasX: number
  canvasY: number
  openAt: (clientX: number, clientY: number, canvasX: number, canvasY: number) => void
  close: () => void
}

export const useCanvasContextMenuStore = create<CanvasContextMenuState>((set) => ({
  open: false,
  clientX: 0,
  clientY: 0,
  canvasX: 0,
  canvasY: 0,
  openAt: (clientX, clientY, canvasX, canvasY) =>
    set({
      open: true,
      clientX,
      clientY,
      canvasX,
      canvasY,
    }),
  close: () => set({ open: false }),
}))
