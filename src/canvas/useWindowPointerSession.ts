import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'

export type PointerSessionEndReason = 'up' | 'cancel' | 'lost-capture'

export type PointerSessionHandlers = {
  onMove: (clientX: number, clientY: number, event: PointerEvent) => void
  onEnd: (reason: PointerSessionEndReason, event: PointerEvent) => void
}

/**
 * Tracks one pointer on window until up/cancel/lost-capture. Avoids duplicate touch
 * listeners and keeps teardown in one place so interaction flags cannot stick.
 */
export function useWindowPointerSession<T extends HTMLElement>() {
  const activeRef = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const endSession = useCallback(() => {
    if (!activeRef.current) return
    activeRef.current = false
    cleanupRef.current?.()
    cleanupRef.current = null
  }, [])

  useEffect(() => () => endSession(), [endSession])

  const startSession = useCallback(
    (
      event: ReactPointerEvent<T>,
      handlers: PointerSessionHandlers,
      options?: { allowPointerType?: (type: string) => boolean },
    ): boolean => {
      if (options?.allowPointerType && !options.allowPointerType(event.pointerType)) {
        return false
      }

      if (activeRef.current) endSession()

      event.preventDefault()
      event.stopPropagation()

      const target = event.currentTarget
      const pointerId = event.pointerId
      activeRef.current = true

      try {
        target.setPointerCapture(pointerId)
      } catch {
        // ignore
      }

      const onPointerMove = (e: PointerEvent) => {
        if (!activeRef.current || e.pointerId !== pointerId) return
        handlers.onMove(e.clientX, e.clientY, e)
      }

      const finish = (e: PointerEvent, reason: PointerSessionEndReason) => {
        if (!activeRef.current || e.pointerId !== pointerId) return
        endSession()
        try {
          if (target.hasPointerCapture(pointerId)) {
            target.releasePointerCapture(pointerId)
          }
        } catch {
          // ignore
        }
        handlers.onEnd(reason, e)
      }

      const onPointerUp = (e: PointerEvent) => finish(e, 'up')
      const onPointerCancel = (e: PointerEvent) => finish(e, 'cancel')
      const onLostCapture = (e: PointerEvent) => finish(e, 'lost-capture')

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerCancel)
      target.addEventListener('lostpointercapture', onLostCapture)

      cleanupRef.current = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerCancel)
        target.removeEventListener('lostpointercapture', onLostCapture)
      }

      return true
    },
    [endSession],
  )

  return { startSession, endSession, isActive: () => activeRef.current }
}
