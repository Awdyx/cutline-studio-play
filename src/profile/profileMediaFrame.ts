import type { CSSProperties } from 'react'
import type { ProfileMediaFrame } from './types'

export type { ProfileMediaFrame } from './types'

export const MIN_PROFILE_MEDIA_SCALE = 1
export const MAX_PROFILE_MEDIA_SCALE = 3

export const DEFAULT_AVATAR_FRAME: ProfileMediaFrame = { x: 0, y: 0, scale: 1 }

/** Matches legacy banner object-position `center 18%`. */
export const DEFAULT_BANNER_FRAME: ProfileMediaFrame = { x: 0, y: -1, scale: 1 }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function clampProfileMediaFrame(frame: ProfileMediaFrame): ProfileMediaFrame {
  return {
    x: clamp(frame.x, -1, 1),
    y: clamp(frame.y, -1, 1),
    scale: clamp(frame.scale, MIN_PROFILE_MEDIA_SCALE, MAX_PROFILE_MEDIA_SCALE),
  }
}

export function defaultProfileMediaFrame(kind: 'avatar' | 'banner'): ProfileMediaFrame {
  return kind === 'banner' ? { ...DEFAULT_BANNER_FRAME } : { ...DEFAULT_AVATAR_FRAME }
}

export function parseProfileMediaFrame(raw: unknown): ProfileMediaFrame | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.x !== 'number' || typeof o.y !== 'number' || typeof o.scale !== 'number') {
    return null
  }
  return clampProfileMediaFrame({ x: o.x, y: o.y, scale: o.scale })
}

export function profileMediaFramesEqual(
  a: ProfileMediaFrame | null | undefined,
  b: ProfileMediaFrame | null | undefined,
): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return a.x === b.x && a.y === b.y && a.scale === b.scale
}

export function frameFocusPercent(frame: ProfileMediaFrame): { x: number; y: number } {
  const clamped = clampProfileMediaFrame(frame)
  return {
    x: 50 + clamped.x * 32,
    y: 50 + clamped.y * 32,
  }
}

export function framedImageStyle(frame: ProfileMediaFrame): CSSProperties {
  const clamped = clampProfileMediaFrame(frame)
  const focus = frameFocusPercent(clamped)
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${focus.x}% ${focus.y}%`,
    transform: `scale(${clamped.scale})`,
    transformOrigin: `${focus.x}% ${focus.y}%`,
    userSelect: 'none',
    WebkitUserDrag: 'none',
  } as CSSProperties
}

export function zoomProfileMediaFrameAtPoint(
  frame: ProfileMediaFrame,
  nextScale: number,
  /** Pinch focal point in container space, 0–1. */
  pointerX: number,
  pointerY: number,
): ProfileMediaFrame {
  const current = clampProfileMediaFrame(frame)
  const scale = clamp(nextScale, MIN_PROFILE_MEDIA_SCALE, MAX_PROFILE_MEDIA_SCALE)
  const ratio = scale / current.scale
  if (!Number.isFinite(ratio) || ratio === 1) return { ...current, scale }

  const nx = pointerX - 0.5
  const ny = pointerY - 0.5
  const anchorPull = 2.6

  return clampProfileMediaFrame({
    x: current.x - nx * (ratio - 1) * anchorPull,
    y: current.y - ny * (ratio - 1) * anchorPull,
    scale,
  })
}

export function nudgeProfileMediaFrame(
  frame: ProfileMediaFrame,
  delta: { x?: number; y?: number; scale?: number },
): ProfileMediaFrame {
  return clampProfileMediaFrame({
    x: frame.x + (delta.x ?? 0),
    y: frame.y + (delta.y ?? 0),
    scale: frame.scale + (delta.scale ?? 0),
  })
}
