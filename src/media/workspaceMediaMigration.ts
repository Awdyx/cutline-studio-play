import type { CanvasItem } from '../canvasItems/types'
import {
  copyMediaBlob,
  putMediaFromDataUrl,
  putSnapshotFromDataUrl,
  verifyMediaBlob,
  verifySnapshotBlob,
} from './mediaBlobStore'
import { isInlineDataUrl } from './mediaKeys'
import type { LoadedWorkspace } from '../spaces/workspacePersistence'
import type { SpaceCanvasData } from '../spaces/types'

type LegacyImageItem = CanvasItem & { type: 'image'; src?: string; mediaId?: string }
type LegacyVideoItem = CanvasItem & { type: 'video'; src?: string; mediaId?: string }
type LegacySpaceItem = CanvasItem & {
  type: 'space'
  snapshot?: string | null
  snapshotId?: string | null
}

function legacyMediaId(item: LegacyImageItem | LegacyVideoItem): string | null {
  if (typeof item.mediaId === 'string' && item.mediaId.length > 0) return item.mediaId
  if (typeof item.src === 'string' && isInlineDataUrl(item.src)) return item.id
  return null
}

function legacySnapshotId(
  spaceId: string,
  snapshot: string | null | undefined,
  snapshotId: string | null | undefined,
): string | null {
  if (typeof snapshotId === 'string' && snapshotId.length > 0) return snapshotId
  if (typeof snapshot === 'string' && isInlineDataUrl(snapshot)) return spaceId
  return null
}

async function migrateCanvasItem(item: CanvasItem): Promise<CanvasItem | null> {
  if (item.type === 'image' || item.type === 'video') {
    const legacy = item as LegacyImageItem | LegacyVideoItem
    const mediaId = legacyMediaId(legacy)
    if (!mediaId) {
      if (typeof legacy.mediaId === 'string') return { ...item, mediaId: legacy.mediaId } as CanvasItem
      return null
    }

    if (typeof legacy.src === 'string' && isInlineDataUrl(legacy.src)) {
      const saved = await putMediaFromDataUrl(mediaId, legacy.src)
      if (!saved || !(await verifyMediaBlob(mediaId))) return null
    } else if (!(await verifyMediaBlob(mediaId))) {
      return null
    }

    const { src: _src, ...rest } = legacy
    return { ...rest, mediaId } as CanvasItem
  }

  if (item.type === 'space') {
    const legacy = item as LegacySpaceItem
    const snapshotId = legacySnapshotId(item.id, legacy.snapshot, legacy.snapshotId)
    if (snapshotId && typeof legacy.snapshot === 'string' && isInlineDataUrl(legacy.snapshot)) {
      const saved = await putSnapshotFromDataUrl(snapshotId, legacy.snapshot)
      if (!saved || !(await verifySnapshotBlob(snapshotId))) return null
    }
    const { snapshot: _snapshot, ...rest } = legacy
    return {
      ...rest,
      snapshotId: snapshotId ?? null,
    } as CanvasItem
  }

  return item
}

async function migrateItems(items: CanvasItem[]): Promise<CanvasItem[] | null> {
  const migrated: CanvasItem[] = []
  for (const item of items) {
    const next = await migrateCanvasItem(item)
    if (!next) return null
    migrated.push(next)
  }
  return migrated
}

async function migrateSpace(
  spaceId: string,
  space: SpaceCanvasData & { snapshot?: string },
): Promise<SpaceCanvasData | null> {
  const items = await migrateItems(space.items)
  if (!items) return null

  const snapshotId = legacySnapshotId(spaceId, space.snapshot, space.snapshotId)
  if (
    snapshotId &&
    typeof space.snapshot === 'string' &&
    isInlineDataUrl(space.snapshot)
  ) {
    const saved = await putSnapshotFromDataUrl(snapshotId, space.snapshot)
    if (!saved || !(await verifySnapshotBlob(snapshotId))) return null
  } else if (snapshotId && !(await verifySnapshotBlob(snapshotId))) {
    return {
      ...space,
      items,
      snapshotId: null,
    }
  }

  return {
    items,
    strokes: space.strokes,
    annotationStrokes: space.annotationStrokes,
    name: space.name,
    snapshotId: snapshotId ?? null,
    camera: space.camera,
  }
}

export function workspaceHasInlineMedia(data: LoadedWorkspace): boolean {
  const inspectItems = (items: CanvasItem[]) =>
    items.some((item) => {
      if (item.type === 'image' || item.type === 'video') {
        const legacy = item as LegacyImageItem | LegacyVideoItem
        return typeof legacy.src === 'string' && isInlineDataUrl(legacy.src)
      }
      if (item.type === 'space') {
        const legacy = item as LegacySpaceItem
        return typeof legacy.snapshot === 'string' && isInlineDataUrl(legacy.snapshot)
      }
      return false
    })

  if (inspectItems(data.mainItems)) return true
  for (const space of Object.values(data.spaces)) {
    if (inspectItems(space.items)) return true
    const legacy = space as SpaceCanvasData & { snapshot?: string }
    if (typeof legacy.snapshot === 'string' && isInlineDataUrl(legacy.snapshot)) {
      return true
    }
  }
  return false
}

export function workspaceNeedsMediaMigration(
  data: LoadedWorkspace,
  storageVersion: number,
): boolean {
  if (storageVersion < 2) return true
  return workspaceHasInlineMedia(data)
}

/** Copy inline data URLs to IndexedDB and return v2-shaped workspace. Returns null on failure. */
export async function migrateWorkspaceMediaToIdb(
  data: LoadedWorkspace,
): Promise<LoadedWorkspace | null> {
  const mainItems = await migrateItems(data.mainItems)
  if (!mainItems) return null

  const spaces: LoadedWorkspace['spaces'] = {}
  for (const [spaceId, space] of Object.entries(data.spaces)) {
    const migrated = await migrateSpace(spaceId, space)
    if (!migrated) return null
    spaces[spaceId] = migrated
  }

  return {
    ...data,
    mainItems,
    spaces,
    migratedFromLegacy: data.migratedFromLegacy,
  }
}

export async function duplicateMediaForItem(
  sourceMediaId: string,
  targetMediaId: string,
): Promise<boolean> {
  return copyMediaBlob(sourceMediaId, targetMediaId)
}
