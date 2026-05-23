import { nextZIndexAbove } from '../canvasItems/canvasZOrder'
import type { CanvasItem, StickyCanvasItem } from '../canvasItems/types'
import { useCanvasWorkspaceStore } from '../spaces/canvasWorkspaceStore'

export type CanvasLayer = 'committed' | 'annotation'

export function itemLayer(item: CanvasItem): CanvasLayer {
  return item.layer === 'annotation' ? 'annotation' : 'committed'
}

/** Lock applies only on the main canvas — not inside a space. */
export function effectiveCanvasLocked(isLocked: boolean): boolean {
  if (useCanvasWorkspaceStore.getState().activeCanvasId !== 'main') return false
  return isLocked
}

export function newItemLayer(isLocked: boolean): CanvasLayer {
  return effectiveCanvasLocked(isLocked) ? 'annotation' : 'committed'
}

export function isItemFrozen(item: CanvasItem, isLocked: boolean): boolean {
  return effectiveCanvasLocked(isLocked) && itemLayer(item) === 'committed'
}

export function stickyAnnotationStrokes(sticky: StickyCanvasItem): import('../drawing/types').Stroke[] {
  return sticky.annotationStrokes ?? []
}

export function hasAnyAnnotations(
  items: CanvasItem[],
  globalAnnotationStrokes: import('../drawing/types').Stroke[],
): boolean {
  if (globalAnnotationStrokes.length > 0) return true
  return items.some((item) => {
    if (item.layer === 'annotation') return true
    if (item.type === 'sticky' && (item.annotationStrokes?.length ?? 0) > 0) return true
    return false
  })
}

export function mergeAnnotationsIntoCommitted(items: CanvasItem[]): CanvasItem[] {
  const result: CanvasItem[] = []

  for (const item of items) {
    if (item.type === 'sticky') {
      const extra = item.annotationStrokes ?? []
      const { layer, annotationStrokes: _ann, ...rest } = item
      let merged = {
        ...rest,
        strokes: [...item.strokes, ...extra],
      } as StickyCanvasItem
      if (layer === 'annotation') {
        merged = { ...merged, zIndex: nextZIndexAbove(result) }
      }
      result.push(merged)
      continue
    }

    const { layer, ...rest } = item
    if (layer === 'annotation') {
      result.push({ ...rest, zIndex: nextZIndexAbove(result) } as CanvasItem)
    } else {
      result.push(item)
    }
  }

  return result
}

export function discardAnnotationsFromItems(items: CanvasItem[]): CanvasItem[] {
  return items
    .filter((item) => item.layer !== 'annotation')
    .map((item) => {
      if (item.type !== 'sticky') return item
      const { annotationStrokes: _ann, ...rest } = item
      return { ...rest, annotationStrokes: [] }
    })
}

/** Images (incl. GIFs), videos, and space widgets survive a full layer clear. */
export function isPreservedCanvasItem(item: CanvasItem): boolean {
  return (
    item.type === 'image' || item.type === 'video' || item.type === 'space'
  )
}

export function hasClearableLayerContent(
  items: CanvasItem[],
  strokes: import('../drawing/types').Stroke[],
  annotationStrokes: import('../drawing/types').Stroke[],
  isLocked: boolean,
): boolean {
  if (effectiveCanvasLocked(isLocked)) {
    return hasAnyAnnotations(items, annotationStrokes)
  }
  if (strokes.length > 0 || annotationStrokes.length > 0) return true
  return items.some((item) => !isPreservedCanvasItem(item))
}

export function clearLayerItems(
  items: CanvasItem[],
  isLocked: boolean,
): CanvasItem[] {
  if (effectiveCanvasLocked(isLocked)) {
    return discardAnnotationsFromItems(items)
  }
  return items.filter(isPreservedCanvasItem)
}
