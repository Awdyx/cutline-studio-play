import {
  isAboveStrokes,
  isAnnotationItem,
  isBelowStrokes,
  Z_ITEMS_BELOW_MIN,
  Z_STROKES,
} from '../canvasItems/canvasZOrder'
import type { CanvasItem } from '../canvasItems/types'
import { getMediaBlob } from '../media/mediaBlobStore'

export type FlattenSegmentPlan = {
  id: string
  zIndex: number
  itemIds: string[]
  includeCommittedStrokes: boolean
  includeMesh: boolean
}

export type FlattenLivePlan = {
  itemId: string
  zIndex: number
  kind: 'space' | 'gif'
}

export async function resolveGifImageIds(items: CanvasItem[]): Promise<Set<string>> {
  const gifIds = new Set<string>()
  const images = items.filter(
    (item) => item.type === 'image' && !isAnnotationItem(item),
  ) as Extract<CanvasItem, { type: 'image' }>[]

  await Promise.all(
    images.map(async (item) => {
      const blob = await getMediaBlob(item.mediaId)
      if (blob?.type === 'image/gif') gifIds.add(item.id)
    }),
  )

  return gifIds
}

function isLiveCommittedItem(item: CanvasItem, gifImageIds: Set<string>): boolean {
  if (item.type === 'space') return true
  if (item.type === 'image' && gifImageIds.has(item.id)) return true
  return false
}

export function buildFlattenPlan(
  items: CanvasItem[],
  hasCommittedStrokes: boolean,
  gifImageIds: Set<string>,
): { segments: FlattenSegmentPlan[]; live: FlattenLivePlan[] } {
  const committed = items.filter((item) => !isAnnotationItem(item))
  const below = committed
    .filter((item) => isBelowStrokes(item.zIndex))
    .sort((a, b) => a.zIndex - b.zIndex)
  const above = committed
    .filter((item) => isAboveStrokes(item.zIndex))
    .sort((a, b) => a.zIndex - b.zIndex)

  const segments: FlattenSegmentPlan[] = []
  const live: FlattenLivePlan[] = []
  let segmentCounter = 0
  let pendingIds: string[] = []
  let includeMesh = true

  const itemById = new Map(committed.map((item) => [item.id, item]))

  function flushPendingItems() {
    if (pendingIds.length === 0) return
    const zIndex = Math.min(
      ...pendingIds.map((id) => itemById.get(id)?.zIndex ?? Z_ITEMS_BELOW_MIN),
    )
    segments.push({
      id: `seg-${segmentCounter++}`,
      zIndex,
      itemIds: [...pendingIds],
      includeCommittedStrokes: false,
      includeMesh,
    })
    pendingIds = []
    includeMesh = false
  }

  function processItem(item: CanvasItem) {
    if (isLiveCommittedItem(item, gifImageIds)) {
      flushPendingItems()
      live.push({
        itemId: item.id,
        zIndex: item.zIndex,
        kind: item.type === 'space' ? 'space' : 'gif',
      })
      return
    }
    pendingIds.push(item.id)
  }

  for (const item of below) processItem(item)
  flushPendingItems()

  if (hasCommittedStrokes) {
    segments.push({
      id: `seg-${segmentCounter++}`,
      zIndex: Z_STROKES,
      itemIds: [],
      includeCommittedStrokes: true,
      includeMesh,
    })
    includeMesh = false
  }

  for (const item of above) processItem(item)
  flushPendingItems()

  return { segments, live }
}
