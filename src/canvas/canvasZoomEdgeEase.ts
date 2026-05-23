import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import {
  CANVAS_MAX_SCALE,
  CANVAS_ZOOM_EDGE_PADDING,
  CANVAS_ZOOM_MIN_EDGE_PADDING,
} from '../drawing/canvasDimensions'

export const ZOOM_SNAP_BACK_MS = 240
export const ZOOM_SNAP_BACK_MIN_MS = 310

const SCALE_EPS = 0.002
const ZOOM_VIGNETTE_MAX_VELOCITY = 0.05

let activeSnapRaf: number | null = null

export function cancelZoomSnapAnimation(): void {
  if (activeSnapRaf !== null) {
    cancelAnimationFrame(activeSnapRaf)
    activeSnapRaf = null
  }
}

/** Soft deceleration into the limit — no overshoot past the target. */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/** Gentler settle for zoom-out snap-back. */
function easeOutQuad(t: number): number {
  return t * (2 - t)
}

export function isBeyondHardZoomMax(scale: number): boolean {
  return scale > CANVAS_MAX_SCALE + SCALE_EPS
}

export function isBeyondHardZoomMin(scale: number, minScale: number): boolean {
  return scale < minScale - SCALE_EPS
}

export function hardClampScale(scale: number, minScale: number): number {
  return Math.min(CANVAS_MAX_SCALE, Math.max(minScale, scale))
}

export function needsZoomSnapBack(scale: number, minScale: number): boolean {
  return isBeyondHardZoomMax(scale) || isBeyondHardZoomMin(scale, minScale)
}

function wrapperSize(
  ref: ReactZoomPanPinchRef,
): { width: number; height: number } | null {
  const wrapper = ref.instance.wrapperComponent
  if (!wrapper) return null
  const width = wrapper.offsetWidth
  const height = wrapper.offsetHeight
  if (width <= 0 || height <= 0) return null
  return { width, height }
}

/** Snap scale to hard limits while keeping the viewport center pinned. */
export function snapZoomToHardLimits(
  ref: ReactZoomPanPinchRef,
  minScale: number,
  animationMs = ZOOM_SNAP_BACK_MS,
): boolean {
  const { positionX, positionY, scale } = ref.state
  if (!needsZoomSnapBack(scale, minScale)) return false

  cancelZoomSnapAnimation()

  const clamped = hardClampScale(scale, minScale)
  const size = wrapperSize(ref)
  const startScale = scale
  const startX = positionX
  const startY = positionY
  const snappingFromZoomOut = isBeyondHardZoomMin(startScale, minScale)
  const duration = snappingFromZoomOut ? ZOOM_SNAP_BACK_MIN_MS : animationMs
  const ease = snappingFromZoomOut ? easeOutQuad : easeOutCubic

  if (!size) {
    ref.setTransform(startX, startY, clamped, 0)
    return true
  }

  const centerCanvasX = (size.width / 2 - startX) / startScale
  const centerCanvasY = (size.height / 2 - startY) / startScale
  const targetX = size.width / 2 - centerCanvasX * clamped
  const targetY = size.height / 2 - centerCanvasY * clamped
  const startTime = performance.now()

  const tick = (now: number) => {
    const rawT = Math.min(1, (now - startTime) / duration)
    const eased = ease(rawT)
    const nextScale = startScale + (clamped - startScale) * eased
    const nextX = size.width / 2 - centerCanvasX * nextScale
    const nextY = size.height / 2 - centerCanvasY * nextScale

    ref.setTransform(nextX, nextY, nextScale, 0)

    if (rawT < 1) {
      activeSnapRaf = requestAnimationFrame(tick)
      return
    }

    ref.setTransform(targetX, targetY, clamped, 0)
    activeSnapRaf = null
  }

  activeSnapRaf = requestAnimationFrame(tick)
  return true
}

export function computeZoomEdgeVignetteStrength(
  scale: number,
  scaleDelta: number,
  minScale: number,
): number {
  const zoomingIn = scaleDelta > 0
  const zoomingOut = scaleDelta < 0

  if (zoomingIn) {
    const overshoot = Math.max(0, scale - CANVAS_MAX_SCALE)
    if (overshoot > 0) {
      return Math.min(1, 0.55 + overshoot / CANVAS_ZOOM_EDGE_PADDING)
    }
    if (scale >= CANVAS_MAX_SCALE - SCALE_EPS) {
      const push = Math.min(
        Math.abs(scaleDelta) / ZOOM_VIGNETTE_MAX_VELOCITY,
        1,
      )
      return 0.35 + push * 0.35
    }
  }

  if (zoomingOut) {
    const undershoot = Math.max(0, minScale - scale)
    if (undershoot > 0) {
      return Math.min(1, 0.5 + undershoot / CANVAS_ZOOM_MIN_EDGE_PADDING)
    }
    if (scale <= minScale + SCALE_EPS) {
      const push = Math.min(
        Math.abs(scaleDelta) / ZOOM_VIGNETTE_MAX_VELOCITY,
        1,
      )
      return 0.28 + push * 0.3
    }
  }

  return 0
}
