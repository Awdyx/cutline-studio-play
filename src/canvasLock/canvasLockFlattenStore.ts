import { create } from 'zustand'

export type FlattenSegmentBitmap = {
  id: string
  zIndex: number
  dataUrl: string
}

type CanvasLockFlattenState = {
  ready: boolean
  capturing: boolean
  segments: FlattenSegmentBitmap[]
  liveGifIds: Set<string>
  setCapturing: (capturing: boolean) => void
  setFlattened: (segments: FlattenSegmentBitmap[], liveGifIds: Set<string>) => void
  clear: () => void
}

const emptyGifIds = new Set<string>()

export const useCanvasLockFlattenStore = create<CanvasLockFlattenState>((set) => ({
  ready: false,
  capturing: false,
  segments: [],
  liveGifIds: emptyGifIds,

  setCapturing: (capturing) => set({ capturing }),

  setFlattened: (segments, liveGifIds) =>
    set({ ready: true, capturing: false, segments, liveGifIds }),

  clear: () =>
    set({
      ready: false,
      capturing: false,
      segments: [],
      liveGifIds: emptyGifIds,
    }),
}))
