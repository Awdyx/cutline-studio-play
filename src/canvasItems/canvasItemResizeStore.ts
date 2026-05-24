import { create } from 'zustand'

/** Item currently being resized (after threshold). Drives lift UI and resize styling. */
export const useCanvasItemResizeStore = create<{
  activeItemId: string | null
  /** Brief snap after rubber-band release at a size bound. */
  snapBackItemId: string | null
  snapBackNonce: number
}>(() => ({
  activeItemId: null,
  snapBackItemId: null,
  snapBackNonce: 0,
}))

export function setActiveResizeItem(id: string | null) {
  useCanvasItemResizeStore.setState({ activeItemId: id })
}

export function triggerResizeSnapBack(itemId: string) {
  useCanvasItemResizeStore.setState({
    snapBackItemId: itemId,
    snapBackNonce: Date.now(),
  })
  window.setTimeout(() => {
    if (useCanvasItemResizeStore.getState().snapBackItemId === itemId) {
      useCanvasItemResizeStore.setState({ snapBackItemId: null })
    }
  }, 220)
}
