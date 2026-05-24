/** True when the primary button is no longer held (e.g. released outside the browser). */
export function primaryPointerReleased(event: PointerEvent | MouseEvent): boolean {
  return event.buttons === 0
}
