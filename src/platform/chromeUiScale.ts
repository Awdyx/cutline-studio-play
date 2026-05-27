import { isPhoneLayout } from './layoutProfile'
import { readViewportSize } from './viewportSize'

/** Design reference for desktop chrome — matches study hub viewport estimates. */
export const CHROME_UI_REFERENCE = { width: 1440, height: 900 }

/** Floor so text and controls stay legible on very small laptop screens. */
export const CHROME_UI_SCALE_MIN = 0.82

export const CHROME_UI_SCALE_MAX = 1

export function computeChromeUiScale(
  width: number,
  height: number,
  phoneLayout = isPhoneLayout(),
): number {
  if (phoneLayout) return CHROME_UI_SCALE_MAX

  const scale = Math.min(
    width / CHROME_UI_REFERENCE.width,
    height / CHROME_UI_REFERENCE.height,
    CHROME_UI_SCALE_MAX,
  )

  return Math.max(CHROME_UI_SCALE_MIN, scale)
}

export function syncChromeUiScale(): number {
  if (typeof document === 'undefined') return CHROME_UI_SCALE_MAX

  const size = readViewportSize()
  const scale = size
    ? computeChromeUiScale(size.width, size.height)
    : CHROME_UI_SCALE_MAX

  document.documentElement.style.setProperty('--chrome-ui-scale', String(scale))
  return scale
}
