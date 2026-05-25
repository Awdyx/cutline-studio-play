import { isAnnotationItem } from '../canvasItems/canvasZOrder'
import { type CanvasItem, type StickyCanvasItem } from '../canvasItems/types'
import { effectiveCanvasLocked } from './layer'

export function isLiveWhenFlattened(
  item: CanvasItem,
  liveGifIds: ReadonlySet<string>,
): boolean {
  if (isAnnotationItem(item)) return true
  if (item.type === 'space') return true
  if (item.type === 'image' && liveGifIds.has(item.id)) return true
  return false
}

export function isCommittedHiddenWhenFlattened(
  item: CanvasItem,
  lockActive: boolean,
  flattenReady: boolean,
  liveGifIds: ReadonlySet<string>,
): boolean {
  return (
    lockActive &&
    flattenReady &&
    !isAnnotationItem(item) &&
    !isLiveWhenFlattened(item, liveGifIds)
  )
}

export function stickyNeedsAnnotationOverlay(
  item: StickyCanvasItem,
  lockActive: boolean,
  flattenReady: boolean,
  liveGifIds: ReadonlySet<string>,
  activeStickyId: string | null,
): boolean {
  if (!isCommittedHiddenWhenFlattened(item, lockActive, flattenReady, liveGifIds)) {
    return false
  }
  if ((item.annotationStrokes?.length ?? 0) > 0) return true
  return activeStickyId === item.id
}

export function shouldFlattenCanvas(isLocked: boolean): boolean {
  return effectiveCanvasLocked(isLocked)
}
