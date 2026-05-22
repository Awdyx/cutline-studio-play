/** Logical canvas size in px (4:3 landscape). */
export const CANVAS_WIDTH = 2000
export const CANVAS_HEIGHT = 1500
export const CANVAS_ASPECT = CANVAS_WIDTH / CANVAS_HEIGHT

/** Stay 20% more zoomed-in than the border-hugging contain fit (scale × 1.2). */
const MIN_SCALE_CONTAIN_FACTOR = 1.2

/**
 * Minimum zoom scale: fit the full canvas in the viewport (contain) without
 * cropping, then back off 20% so the canvas stops short of the viewport edges.
 */
export function getCanvasMinScale(
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
): number {
  const containScale = Math.min(
    viewportWidth / CANVAS_WIDTH,
    viewportHeight / CANVAS_HEIGHT,
  )
  return containScale * MIN_SCALE_CONTAIN_FACTOR
}
