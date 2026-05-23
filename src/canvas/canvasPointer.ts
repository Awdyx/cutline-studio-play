const activeTouchIds = new Set<number>()

if (typeof window !== 'undefined') {
  const syncTouches = (event: TouchEvent) => {
    activeTouchIds.clear()
    for (const touch of event.touches) {
      activeTouchIds.add(touch.identifier)
    }
  }

  window.addEventListener('touchstart', syncTouches, { passive: true })
  window.addEventListener('touchmove', syncTouches, { passive: true })
  window.addEventListener('touchend', syncTouches, { passive: true })
  window.addEventListener('touchcancel', syncTouches, { passive: true })
}

/** True when a touch with this pointer id is still on screen (iOS pointercancel quirk). */
export function isTouchPointerStillActive(pointerId: number): boolean {
  return activeTouchIds.has(pointerId)
}
