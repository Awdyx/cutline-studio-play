/** Touch-primary devices — used to reduce animated mesh load on the canvas. */
export function isTouchFirstDevice(): boolean {
  if (typeof window === 'undefined') return false

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const ios =
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  return coarse || ios
}

/** @deprecated Use isTouchFirstDevice — same signal, clearer name for motion/velocity tuning. */
export function prefersSolidCompositorLayers(): boolean {
  return isTouchFirstDevice()
}
