import { useEffect, type RefObject } from 'react'
import { useCanvasNavigationStore } from '../canvas/canvasNavigationStore'

/** Keep wheel / trackpad scroll inside a canvas item instead of panning the canvas. */
export function useCanvasItemScrollCapture(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onWheel(event: WheelEvent) {
      if (useCanvasNavigationStore.getState().trackpadPanLockActive) return
      event.stopPropagation()
    }

    el.addEventListener('wheel', onWheel, { passive: true })
    return () => el.removeEventListener('wheel', onWheel)
  }, [ref])
}
