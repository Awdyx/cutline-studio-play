import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

const BOUND_EPS = 1.5
const PAN_BOUNCE_REFERENCE_VELOCITY = 14
const MAX_BOUNCE_PX = 20

export const PAN_BOUNCE_SNAP_BACK_MS = 240
/** Per-frame decay of the offset when at the edge but no fresh inward velocity. */
export const PAN_FRAME_DECAY = 0.88
/** Below this magnitude the offset rounds to 0 (avoids dangling sub-pixel transforms). */
export const PAN_OFFSET_SNAP_EPS = 0.4

export type PanBounceOffset = { x: number; y: number }

export const EMPTY_PAN_BOUNCE: PanBounceOffset = { x: 0, y: 0 }

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/**
 * Rubber-band target for a single frame: nonzero only when the camera sits at
 * a bound AND velocity continues to push further into that bound. Mirrors the
 * sign convention used by `canvasPanVignette`.
 */
export function readPanBounceTarget(
  ref: ReactZoomPanPinchRef,
  vx: number,
  vy: number,
): PanBounceOffset {
  const bounds = ref.instance.bounds
  if (!bounds) return EMPTY_PAN_BOUNCE

  const { positionX, positionY } = ref.state

  const atLeft = positionX >= bounds.maxPositionX - BOUND_EPS
  const atRight = positionX <= bounds.minPositionX + BOUND_EPS
  const atTop = positionY >= bounds.maxPositionY - BOUND_EPS
  const atBottom = positionY <= bounds.minPositionY + BOUND_EPS

  const xIntensity = Math.min(
    Math.abs(vx) / PAN_BOUNCE_REFERENCE_VELOCITY,
    1,
  )
  const yIntensity = Math.min(
    Math.abs(vy) / PAN_BOUNCE_REFERENCE_VELOCITY,
    1,
  )

  let x = 0
  let y = 0

  if (atLeft && vx > 0) x = xIntensity * MAX_BOUNCE_PX
  else if (atRight && vx < 0) x = -xIntensity * MAX_BOUNCE_PX

  if (atTop && vy > 0) y = yIntensity * MAX_BOUNCE_PX
  else if (atBottom && vy < 0) y = -yIntensity * MAX_BOUNCE_PX

  return { x, y }
}

function pickPeak(prev: number, next: number): number {
  if (next === 0) return prev
  if (prev === 0) return next
  if (Math.sign(next) !== Math.sign(prev)) return next
  return Math.abs(next) > Math.abs(prev) ? next : prev
}

/**
 * Combine the previous offset with this frame's target: hold the peak when
 * pushing further inward, gently decay when there's no inward velocity.
 */
export function stepPanBounceOffset(
  prev: PanBounceOffset,
  target: PanBounceOffset,
): PanBounceOffset {
  const x =
    target.x !== 0
      ? pickPeak(prev.x, target.x)
      : decayAxis(prev.x)
  const y =
    target.y !== 0
      ? pickPeak(prev.y, target.y)
      : decayAxis(prev.y)
  return { x, y }
}

function decayAxis(value: number): number {
  if (value === 0) return 0
  const next = value * PAN_FRAME_DECAY
  return Math.abs(next) < PAN_OFFSET_SNAP_EPS ? 0 : next
}
