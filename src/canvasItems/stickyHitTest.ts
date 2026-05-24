import { effectiveCanvasLocked } from '../canvasLock/layer'
import { useCanvasLockStore } from '../canvasLock/canvasLockStore'
import { isAnnotationItem } from './canvasZOrder'
import { useCanvasItemsStore } from './canvasItemsStore'
import { isDrawableSurface, type CanvasItem, type DrawableSurfaceItem } from './types'

function drawableHitTestOrder(a: DrawableSurfaceItem, b: DrawableSurfaceItem): number {
  const aAnn = isAnnotationItem(a) ? 1 : 0
  const bAnn = isAnnotationItem(b) ? 1 : 0
  if (aAnn !== bAnn) return bAnn - aAnn
  return b.zIndex - a.zIndex
}

/** Top-most sticky or study topic at canvas coordinates — used for pen routing. */
export function hitTestStickyAtCanvasPoint(
  x: number,
  y: number,
  items?: CanvasItem[],
): string | null {
  const list = items ?? useCanvasItemsStore.getState().items
  const isLocked = effectiveCanvasLocked(useCanvasLockStore.getState().isLocked)
  const surfaces = list
    .filter((item): item is DrawableSurfaceItem => {
      if (!isDrawableSurface(item)) return false
      // While locked, only temporary surfaces capture pen input; committed
      // ones are visual-only for drawing (ink uses annotation strokes).
      if (isLocked) return isAnnotationItem(item)
      return true
    })
    .sort(drawableHitTestOrder)

  for (const surface of surfaces) {
    if (
      x >= surface.x &&
      x <= surface.x + surface.width &&
      y >= surface.y &&
      y <= surface.y + surface.height
    ) {
      return surface.id
    }
  }
  return null
}
