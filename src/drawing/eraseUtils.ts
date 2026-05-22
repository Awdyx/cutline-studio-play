import type { Stroke } from './types'

/** Eraser tip radius in canvas units — any stroke point within this is deleted. */
export const ERASE_HIT_RADIUS = 12

export function hitTestStroke(
  stroke: Stroke,
  x: number,
  y: number,
  radius: number,
): boolean {
  const r2 = radius * radius
  for (const p of stroke.points) {
    const dx = p.x - x
    const dy = p.y - y
    if (dx * dx + dy * dy <= r2) return true
  }
  return false
}
