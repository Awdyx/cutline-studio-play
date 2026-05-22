import { useCallback, useRef } from 'react'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { usePanMotionStore } from './panMotionStore'

const PAN_STOP_DEBOUNCE_MS = 100

export function usePanMotionHandler() {
  const prevPos = useRef({ x: 0, y: 0 })
  const initialized = useRef(false)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setPanVelocity = usePanMotionStore((s) => s.setPanVelocity)
  const setPanStopped = usePanMotionStore((s) => s.setPanStopped)

  const onPanning = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      const { positionX, positionY } = ref.state

      if (!initialized.current) {
        prevPos.current = { x: positionX, y: positionY }
        initialized.current = true
        return
      }

      const dx = positionX - prevPos.current.x
      const dy = positionY - prevPos.current.y
      prevPos.current = { x: positionX, y: positionY }

      setPanVelocity(dx, dy)

      if (stopTimer.current) clearTimeout(stopTimer.current)
      stopTimer.current = setTimeout(() => {
        setPanStopped()
      }, PAN_STOP_DEBOUNCE_MS)
    },
    [setPanVelocity, setPanStopped],
  )

  return onPanning
}
