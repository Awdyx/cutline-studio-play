import { useEffect } from 'react'
import { useCanvasNavigationStore } from './canvasNavigationStore'

/** Tracks multi-touch so pinch gestures do not complete as item taps. */
export function useCanvasNavigationTracking() {
  useEffect(() => {
    const setMultiTouchActive = useCanvasNavigationStore.getState().setMultiTouchActive

    const syncMultiTouch = (event: TouchEvent) => {
      setMultiTouchActive(event.touches.length >= 2)
    }

    window.addEventListener('touchstart', syncMultiTouch, { passive: true })
    window.addEventListener('touchmove', syncMultiTouch, { passive: true })
    window.addEventListener('touchend', syncMultiTouch, { passive: true })
    window.addEventListener('touchcancel', syncMultiTouch, { passive: true })

    return () => {
      window.removeEventListener('touchstart', syncMultiTouch)
      window.removeEventListener('touchmove', syncMultiTouch)
      window.removeEventListener('touchend', syncMultiTouch)
      window.removeEventListener('touchcancel', syncMultiTouch)
      setMultiTouchActive(false)
    }
  }, [])
}
