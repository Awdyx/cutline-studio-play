import { effectiveCanvasLocked } from '../canvasLock/layer'
import { useCanvasLockStore } from '../canvasLock/canvasLockStore'
import { isAnnotationItem } from './canvasZOrder'
import { useCanvasItemsStore } from './canvasItemsStore'
import { isStickyItem, type CanvasItem, type StickyCanvasItem } from './types'

function stickyHitTestOrder(a: StickyCanvasItem, b: StickyCanvasItem): number {
  const aAnn = isAnnotationItem(a) ? 1 : 0
  const bAnn = isAnnotationItem(b) ? 1 : 0
  if (aAnn !== bAnn) return bAnn - aAnn
  return b.zIndex - a.zIndex
}

/** Top-most sticky at canvas coordinates — used for pen routing. */
export function hitTestStickyAtCanvasPoint(
  x: number,
  y: number,
  items?: CanvasItem[],
): string | null {
  const list = items ?? useCanvasItemsStore.getState().items
  const isLocked = effectiveCanvasLocked(useCanvasLockStore.getState().isLocked)
  const stickies = list
    .filter((item): item is StickyCanvasItem => {
      if (!isStickyItem(item)) return false
      // While locked, only temporary stickies capture pen input; committed
      // ones are visual-only for drawing (ink uses annotation strokes).
      if (isLocked) return isAnnotationItem(item)
      return true
    })
    .sort(stickyHitTestOrder)

  for (const sticky of stickies) {
    if (
      x >= sticky.x &&
      x <= sticky.x + sticky.width &&
      y >= sticky.y &&
      y <= sticky.y + sticky.height
    ) {
      return sticky.id
    }
  }
  return null
}
