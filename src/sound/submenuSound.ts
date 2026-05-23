import { playSound } from './playSound'

let lastHoverAt = 0
const HOVER_GAP_MS = 95

/** Soft hover breath — layered so airy tails are not cut off while scanning rows. */
export function playSubmenuHover(): void {
  const now = performance.now()
  if (now - lastHoverAt < HOVER_GAP_MS) return
  lastHoverAt = now
  playSound('submenuHover', { layer: true })
}

export function playSubmenuTap(): void {
  playSound('submenuTap')
}

export function submenuRowHoverProps(): { onMouseEnter: () => void } {
  return { onMouseEnter: () => playSubmenuHover() }
}

/** Run handler, then optional tap (handler first so e.g. re-enabling SFX unmutes before the tap). */
export function runSubmenuClick(handler: () => void, playTap = true): void {
  handler()
  if (playTap) playSubmenuTap()
}
