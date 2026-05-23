/** Global UI chroma / frosted-glass saturation multiplier (1 = default). */
export const UI_SATURATION_BOOST = 1

export const CHROME_GLASS_CLASS = 'ui-chrome-glass'
export const CHROME_CARD_CLASS = 'ui-chrome-card'
/** Frosted space cards on the pan/zoom canvas (lighter blur than fixed chrome). */
export const SPACE_GLASS_CLASS = 'ui-space-glass'
/** Backdrop blur behind selected items (blur only — no saturate). */
export const SELECTION_DEPTH_CLASS = 'ui-selection-depth'

export const glass = {
  bg: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  shadow: 'var(--glass-shadow)',
  radius: '999px',
}

export const card = {
  bg: 'var(--card-bg)',
  border: '1px solid var(--glass-border)',
  shadow: 'var(--card-shadow)',
  radius: '16px',
  transitionDuration: '180ms',
}

export const font = {
  family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
  colorPrimary: 'var(--ui-text)',
  colorMuted: 'var(--ui-text-muted)',
  colorFaint: 'var(--ui-text-faint)',
}

export const themeTransition =
  'background-color 400ms ease, color 400ms ease, border-color 400ms ease, box-shadow 400ms ease'
