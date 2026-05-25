import { playSound } from './playSound'
import { SFX_ON_GAIN } from './soundLevels'
import { setMasterOutputGain } from './soundEngine'
import { useSoundStore } from './soundStore'

/** submenuTap release (~72ms) plus a small buffer before muting. */
export const SUBMENU_TAP_DURATION_MS = 90

/** Row hover is silent — only taps/clicks play submenu SFX. */
export function playSubmenuHover(): void {}

export function playSubmenuTap(): void {
  playSound('submenuTap')
}

export function submenuRowHoverProps(): { onMouseEnter: () => void } {
  return { onMouseEnter: () => playSubmenuHover() }
}

/** Play tap at full gain, then run callback after it finishes (e.g. mute SFX). */
export function playSubmenuTapThen(afterTap: () => void): void {
  const { hydrated } = useSoundStore.getState()
  if (!hydrated) {
    afterTap()
    return
  }

  setMasterOutputGain(SFX_ON_GAIN)
  playSound('submenuTap', { bypassMute: true })
  window.setTimeout(afterTap, SUBMENU_TAP_DURATION_MS)
}

/** Run handler, then optional tap (handler first so e.g. re-enabling SFX unmutes before the tap). */
export function runSubmenuClick(handler: () => void, playTap = true): void {
  handler()
  if (playTap) playSubmenuTap()
}
