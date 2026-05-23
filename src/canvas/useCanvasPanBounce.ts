import { useCallback, useEffect, useRef } from 'react'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import {
  EMPTY_PAN_BOUNCE,
  PAN_BOUNCE_SNAP_BACK_MS,
  easeOutCubic,
  readPanBounceTarget,
  stepPanBounceOffset,
  type PanBounceOffset,
} from './canvasPanEdgeBounce'

/**
 * Subtle rubber-band offset on a wrapper around the pan/zoom canvas. Mirrors
 * the zoom edge ease: peak captured on impact, soft snap-back on release.
 */
export function useCanvasPanBounce() {
  const bounceRef = useRef<HTMLDivElement | null>(null)
  const offsetRef = useRef<PanBounceOffset>(EMPTY_PAN_BOUNCE)
  const prevPosRef = useRef({ x: 0, y: 0, ready: false })
  const snapRafRef = useRef<number | null>(null)

  const applyTransform = useCallback((x: number, y: number) => {
    const el = bounceRef.current
    if (!el) return
    if (x === 0 && y === 0) {
      el.style.transform = ''
      return
    }
    el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
  }, [])

  const cancelSnap = useCallback(() => {
    if (snapRafRef.current !== null) {
      cancelAnimationFrame(snapRafRef.current)
      snapRafRef.current = null
    }
  }, [])

  const startSnapBack = useCallback(() => {
    cancelSnap()
    const startX = offsetRef.current.x
    const startY = offsetRef.current.y
    if (startX === 0 && startY === 0) return

    const t0 = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / PAN_BOUNCE_SNAP_BACK_MS)
      const eased = easeOutCubic(t)
      const x = startX * (1 - eased)
      const y = startY * (1 - eased)
      offsetRef.current = { x, y }
      applyTransform(x, y)

      if (t < 1) {
        snapRafRef.current = requestAnimationFrame(tick)
        return
      }

      offsetRef.current = EMPTY_PAN_BOUNCE
      applyTransform(0, 0)
      snapRafRef.current = null
    }

    snapRafRef.current = requestAnimationFrame(tick)
  }, [applyTransform, cancelSnap])

  const onPanning = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      cancelSnap()

      const { positionX, positionY } = ref.state
      if (!prevPosRef.current.ready) {
        prevPosRef.current = { x: positionX, y: positionY, ready: true }
        return
      }
      const vx = positionX - prevPosRef.current.x
      const vy = positionY - prevPosRef.current.y
      prevPosRef.current = { x: positionX, y: positionY, ready: true }

      const target = readPanBounceTarget(ref, vx, vy)
      const next = stepPanBounceOffset(offsetRef.current, target)
      offsetRef.current = next
      applyTransform(next.x, next.y)
    },
    [applyTransform, cancelSnap],
  )

  const onPanningStop = useCallback(() => {
    prevPosRef.current = { x: 0, y: 0, ready: false }
    startSnapBack()
  }, [startSnapBack])

  useEffect(
    () => () => {
      cancelSnap()
    },
    [cancelSnap],
  )

  return { bounceRef, onPanning, onPanningStop }
}
