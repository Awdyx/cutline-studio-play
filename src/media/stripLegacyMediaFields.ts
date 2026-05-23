import type { CanvasItem } from '../canvasItems/types'

type LegacyMediaItem = CanvasItem & {
  src?: string
  mediaId?: string
  snapshot?: string | null
  snapshotId?: string | null
}

/** Strip legacy inline data URL fields before writing to localStorage. */
export function stripLegacyMediaFields(item: CanvasItem): CanvasItem {
  if (item.type === 'image' || item.type === 'video') {
    const legacy = item as LegacyMediaItem
    const { src: _src, ...rest } = legacy
    return rest as CanvasItem
  }
  if (item.type === 'space') {
    const legacy = item as LegacyMediaItem
    const { snapshot: _snapshot, ...rest } = legacy
    return rest as CanvasItem
  }
  return item
}

export function stripLegacyMediaFromItems(items: CanvasItem[]): CanvasItem[] {
  return items.map(stripLegacyMediaFields)
}
