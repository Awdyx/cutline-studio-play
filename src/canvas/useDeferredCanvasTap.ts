import { useCallback, useRef } from 'react'
import { useCanvasNavigationStore } from './canvasNavigationStore'

/** Movement above this is treated as pan/navigation, not a tap. */
export const CANVAS_TAP_MOVE_THRESHOLD_PX = 10

type TapPhase = 'idle' | 'pending'

/**
 * Defers touch taps until pointerup so finger pans/pinches do not select or focus.
 * Mouse keeps immediate pointerdown behavior.
 */
export function useDeferredCanvasTap(onTap: (event: React.PointerEvent) => void) {
  const phaseRef = useRef<TapPhase>('idle')
  const startRef = useRef({
    pointerId: -1,
    clientX: 0,
    clientY: 0,
  })

  const reset = useCallback(() => {
    phaseRef.current = 'idle'
    startRef.current.pointerId = -1
  }, [])

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType === 'pen') return

      if (event.pointerType === 'mouse') {
        onTap(event)
        return
      }

      if (event.pointerType !== 'touch') return

      phaseRef.current = 'pending'
      startRef.current = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      }
    },
    [onTap],
  )

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (phaseRef.current !== 'pending') return
    if (event.pointerId !== startRef.current.pointerId) return

    const dx = event.clientX - startRef.current.clientX
    const dy = event.clientY - startRef.current.clientY
    if (Math.hypot(dx, dy) > CANVAS_TAP_MOVE_THRESHOLD_PX) {
      reset()
    }
  }, [reset])

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (phaseRef.current !== 'pending') return
      if (event.pointerId !== startRef.current.pointerId) return

      reset()

      if (useCanvasNavigationStore.getState().shouldSuppressItemTap()) return
      onTap(event)
    },
    [onTap, reset],
  )

  const onPointerCancel = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerId === startRef.current.pointerId) reset()
    },
    [reset],
  )

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
