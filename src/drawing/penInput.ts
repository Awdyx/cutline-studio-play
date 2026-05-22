import { CANVAS_HEIGHT, CANVAS_WIDTH } from './canvasDimensions'

/** Safari iPad: Pencil may report as pointerType "pen" or "touch" with fractional pressure. */
export function isPenInput(event: PointerEvent): boolean {
  if (event.pointerType === 'pen') return true
  if (
    event.pointerType === 'touch' &&
    event.pressure > 0 &&
    event.pressure < 1
  ) {
    return true
  }
  return false
}

export function isStylusTouch(touch: Touch): boolean {
  const touchType = (touch as Touch & { touchType?: string }).touchType
  return touchType === 'stylus' || touchType === 'pen'
}

export function isCanvasCoordSane(
  x: number,
  y: number,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT,
): boolean {
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= -100 &&
    y >= -100 &&
    x <= width + 100 &&
    y <= height + 100
  )
}
