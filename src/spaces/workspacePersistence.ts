import { loadCanvasItemsFromStorage } from '../canvasItems/canvasItemsPersistence'
import type { CanvasItem } from '../canvasItems/types'
import { loadStrokesFromStorage } from '../drawing/strokesPersistence'
import type { Stroke } from '../drawing/types'
import { isUninitializedMainCamera } from '../canvas/canvasCamera'
import {
  DEFAULT_SPACE_CAMERA,
  DEFAULT_SPACE_NAME,
  clampSpaceName,
  type ActiveCanvasId,
  type SpaceCamera,
  type SpaceCanvasData,
} from './types'

export const WORKSPACE_STORAGE_KEY = 'cutline-workspace-v1'
const STORAGE_VERSION = 1
const MAX_SNAPSHOT_BYTES = 5 * 1024 * 1024

type PersistedSpace = {
  items: CanvasItem[]
  strokes: Stroke[]
  annotationStrokes?: Stroke[]
  name: string
  snapshot: string | null
  camera?: SpaceCamera
}

type PersistedPayload = {
  version: number
  mainItems: CanvasItem[]
  mainStrokes: Stroke[]
  mainAnnotationStrokes?: Stroke[]
  spaces: Record<string, PersistedSpace>
  activeCanvasId: ActiveCanvasId
  mainCamera?: SpaceCamera
}

export type LoadedWorkspace = {
  mainItems: CanvasItem[]
  mainStrokes: Stroke[]
  mainAnnotationStrokes: Stroke[]
  spaces: Record<string, SpaceCanvasData>
  activeCanvasId: ActiveCanvasId
  mainCamera: SpaceCamera | null
}

function normalizeMainCamera(raw: unknown): SpaceCamera | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as SpaceCamera
  if (
    typeof o.positionX !== 'number' ||
    typeof o.positionY !== 'number' ||
    typeof o.scale !== 'number'
  ) {
    return null
  }
  const camera: SpaceCamera = {
    positionX: o.positionX,
    positionY: o.positionY,
    scale: o.scale,
  }
  return isUninitializedMainCamera(camera) ? null : camera
}

function snapshotByteSize(dataUrl: string): number {
  return dataUrl.length
}

export function snapshotFitsBudget(
  dataUrl: string,
  otherPayloadEstimate: number,
): boolean {
  const total = snapshotByteSize(dataUrl) + otherPayloadEstimate
  try {
    const payload: PersistedPayload = {
      version: STORAGE_VERSION,
      mainItems: [],
      mainStrokes: [],
      spaces: {},
      activeCanvasId: 'main',
    }
    const baseSize = JSON.stringify(payload).length
    return baseSize + total < MAX_SNAPSHOT_BYTES * 2
  } catch {
    return snapshotByteSize(dataUrl) <= MAX_SNAPSHOT_BYTES
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleSaveWorkspace(data: LoadedWorkspace): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveWorkspaceToStorage(data)
  }, 500)
}

export function saveWorkspaceToStorage(data: LoadedWorkspace): void {
  try {
    const spaces: Record<string, PersistedSpace> = {}
    for (const [id, space] of Object.entries(data.spaces)) {
      let snapshot = space.snapshot
      if (snapshot && snapshotByteSize(snapshot) > MAX_SNAPSHOT_BYTES) {
        console.warn(`[spaces] skipped oversize snapshot for ${id}`)
        snapshot = null
      }
      spaces[id] = {
        items: space.items,
        strokes: space.strokes,
        annotationStrokes:
          space.annotationStrokes.length > 0
            ? space.annotationStrokes
            : undefined,
        name: space.name,
        snapshot,
        camera: space.camera,
      }
    }

    const payload: PersistedPayload = {
      version: STORAGE_VERSION,
      mainItems: data.mainItems,
      mainStrokes: data.mainStrokes,
      mainAnnotationStrokes:
        data.mainAnnotationStrokes.length > 0
          ? data.mainAnnotationStrokes
          : undefined,
      spaces,
      activeCanvasId: data.activeCanvasId,
      ...(data.mainCamera && !isUninitializedMainCamera(data.mainCamera)
        ? { mainCamera: data.mainCamera }
        : {}),
    }

    const serialized = JSON.stringify(payload)
    if (serialized.length > 8 * 1024 * 1024) {
      console.warn(
        `[spaces] workspace payload ${(serialized.length / 1024 / 1024).toFixed(2)}MB — skipping save`,
      )
      return
    }

    localStorage.setItem(WORKSPACE_STORAGE_KEY, serialized)
  } catch (err) {
    console.warn('[spaces] failed to save workspace', err)
  }
}

function normalizeSpace(raw: unknown): SpaceCanvasData | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as PersistedSpace
  if (!Array.isArray(o.items)) return null

  const camera = o.camera
  const normalizedCamera: SpaceCamera =
    camera &&
    typeof camera.positionX === 'number' &&
    typeof camera.positionY === 'number' &&
    typeof camera.scale === 'number'
      ? camera
      : DEFAULT_SPACE_CAMERA

  return {
    items: o.items,
    strokes: Array.isArray(o.strokes) ? o.strokes : [],
    annotationStrokes: Array.isArray(o.annotationStrokes)
      ? o.annotationStrokes
      : [],
    name:
      typeof o.name === 'string'
        ? clampSpaceName(o.name)
        : DEFAULT_SPACE_NAME,
    snapshot: typeof o.snapshot === 'string' ? o.snapshot : null,
    camera: normalizedCamera,
  }
}

export function loadWorkspaceFromStorage(): LoadedWorkspace | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedPayload
      const spaces: Record<string, SpaceCanvasData> = {}
      if (parsed.spaces && typeof parsed.spaces === 'object') {
        for (const [id, spaceRaw] of Object.entries(parsed.spaces)) {
          const space = normalizeSpace(spaceRaw)
          if (space) spaces[id] = space
        }
      }
      const mainCamera = normalizeMainCamera(parsed.mainCamera)

      return {
        mainItems: Array.isArray(parsed.mainItems) ? parsed.mainItems : [],
        mainStrokes: Array.isArray(parsed.mainStrokes) ? parsed.mainStrokes : [],
        mainAnnotationStrokes: Array.isArray(parsed.mainAnnotationStrokes)
          ? parsed.mainAnnotationStrokes
          : [],
        spaces,
        activeCanvasId:
          parsed.activeCanvasId === 'main' ||
          (typeof parsed.activeCanvasId === 'string' &&
            parsed.activeCanvasId in spaces)
            ? parsed.activeCanvasId
            : 'main',
        mainCamera,
      }
    }
  } catch (err) {
    console.warn('[spaces] failed to load workspace', err)
  }

  return migrateLegacyStorage()
}

function migrateLegacyStorage(): LoadedWorkspace {
  const mainItems = loadCanvasItemsFromStorage()
  const { strokes, annotationStrokes } = loadStrokesFromStorage()
  const spaces: Record<string, SpaceCanvasData> = {}

  for (const item of mainItems) {
    if (item.type !== 'space') continue
    spaces[item.id] = {
      items: [],
      strokes: [],
      annotationStrokes: [],
      name: item.name,
      snapshot: item.snapshot,
      camera: DEFAULT_SPACE_CAMERA,
    }
  }

  return {
    mainItems,
    mainStrokes: strokes,
    mainAnnotationStrokes: annotationStrokes,
    spaces,
    activeCanvasId: 'main',
    mainCamera: null,
  }
}

export function tryPersistSnapshot(
  spaceId: string,
  snapshot: string,
): string | null {
  if (snapshotByteSize(snapshot) > MAX_SNAPSHOT_BYTES) {
    console.warn(`[spaces] snapshot for ${spaceId} exceeds 5MB — not saved`)
    return null
  }
  return snapshot
}
