import { create } from 'zustand'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { clearHistory } from '../canvasHistory/canvasHistory'
import { useCanvasItemsStore } from '../canvasItems/canvasItemsStore'
import type { CanvasItem } from '../canvasItems/types'
import { useStrokesStore } from '../drawing/strokesStore'
import type { Stroke } from '../drawing/types'
import {
  loadWorkspaceFromStorage,
  scheduleSaveWorkspace,
  tryPersistSnapshot,
  type LoadedWorkspace,
} from './workspacePersistence'
import { normalizeLoadedWorkspace } from './normalizeWorkspace'
import { applyCameraToRef, readCameraFromRef } from '../canvas/canvasCamera'
import { captureCanvasSnapshot } from './spaceSnapshot'
import { spaceCardClientRect } from './spaceCardRect'
import type { SpaceCanvasItem } from '../canvasItems/types'
import {
  DEFAULT_SPACE_CAMERA,
  DEFAULT_SPACE_NAME,
  clampSpaceName,
  type ActiveCanvasId,
  type SpaceCamera,
  type SpaceCanvasData,
  type SpaceTransitionState,
} from './types'

type CanvasWorkspaceState = {
  activeCanvasId: ActiveCanvasId
  spaces: Record<string, SpaceCanvasData>
  transition: SpaceTransitionState
  hydrate: () => void
  isInsideSpace: () => boolean
  isOnMainCanvas: () => boolean
  getSpaceName: (spaceId: string) => string
  syncFromActiveStores: () => void
  flushActiveToSlot: () => void
  loadActiveFromSlot: (canvasId: ActiveCanvasId) => void
  persistWorkspace: () => void
  addSpaceData: (spaceId: string, name?: string) => void
  updateSpaceName: (spaceId: string, name: string) => void
  updateSpaceSnapshot: (spaceId: string, snapshot: string | null) => void
  saveCameraForActive: (camera: SpaceCamera) => void
  getCameraForSpace: (spaceId: string) => SpaceCamera
  beginEnterSpace: (spaceId: string, cardRect: DOMRect) => void
  completeEnterSpace: (transformRef: ReactZoomPanPinchContentRef | null) => void
  beginExitSpace: (transformRef: ReactZoomPanPinchContentRef | null) => void
  captureExitSnapshot: (
    transformRef: ReactZoomPanPinchContentRef | null,
    canvasEl: HTMLElement | null,
  ) => Promise<void>
  completeExitSpace: (transformRef: ReactZoomPanPinchContentRef | null) => void
  setTransitionIdle: () => void
  syncMainCamera: (transformRef: ReactZoomPanPinchContentRef | null) => void
  applyCameraForActiveCanvas: (
    transformRef: ReactZoomPanPinchContentRef | null,
  ) => void
}

let persistEnabled = false
let mainItemsCache: CanvasItem[] = []
let mainStrokesCache: Stroke[] = []
let mainAnnotationStrokesCache: Stroke[] = []
let mainCameraCache: SpaceCamera | null = null

function patchMainSpaceItem(
  spaceId: string,
  patch: Partial<Pick<SpaceCanvasItem, 'name' | 'snapshot'>>,
): void {
  mainItemsCache = mainItemsCache.map((item) =>
    item.id === spaceId && item.type === 'space' ? { ...item, ...patch } : item,
  )
}

function workspaceSnapshot(
  state: Pick<
    CanvasWorkspaceState,
    'activeCanvasId' | 'spaces'
  >,
): LoadedWorkspace {
  return {
    mainItems: mainItemsCache,
    mainStrokes: mainStrokesCache,
    mainAnnotationStrokes: mainAnnotationStrokesCache,
    spaces: state.spaces,
    activeCanvasId: state.activeCanvasId,
    mainCamera: mainCameraCache,
  }
}

export const useCanvasWorkspaceStore = create<CanvasWorkspaceState>((set, get) => ({
  activeCanvasId: 'main',
  spaces: {},
  transition: { phase: 'idle', spaceId: null, cardRect: null },

  hydrate: () => {
    const loaded = loadWorkspaceFromStorage()
    if (!loaded) {
      persistEnabled = true
      return
    }

    const normalized = normalizeLoadedWorkspace(loaded)

    mainItemsCache = normalized.mainItems
    mainStrokesCache = normalized.mainStrokes
    mainAnnotationStrokesCache = normalized.mainAnnotationStrokes
    mainCameraCache = normalized.mainCamera

    set({
      spaces: normalized.spaces,
      activeCanvasId: normalized.activeCanvasId,
    })

    get().loadActiveFromSlot(normalized.activeCanvasId)
    persistEnabled = true
  },

  isInsideSpace: () => get().activeCanvasId !== 'main',

  isOnMainCanvas: () => get().activeCanvasId === 'main',

  getSpaceName: (spaceId) =>
    get().spaces[spaceId]?.name ?? DEFAULT_SPACE_NAME,

  syncFromActiveStores: () => {
    const items = useCanvasItemsStore.getState().items
    const { strokes, annotationStrokes } = useStrokesStore.getState()
    const { activeCanvasId, spaces } = get()

    if (activeCanvasId === 'main') {
      mainItemsCache = items
      mainStrokesCache = strokes
      mainAnnotationStrokesCache = annotationStrokes
      return
    }

    const existing = spaces[activeCanvasId]
    if (!existing) return

    set({
      spaces: {
        ...spaces,
        [activeCanvasId]: {
          ...existing,
          items,
          strokes,
          annotationStrokes,
        },
      },
    })
  },

  flushActiveToSlot: () => {
    get().syncFromActiveStores()
  },

  loadActiveFromSlot: (canvasId) => {
    const { spaces } = get()
    let items: CanvasItem[]
    let strokes: Stroke[]
    let annotationStrokes: Stroke[]

    if (canvasId === 'main') {
      items = mainItemsCache
      strokes = mainStrokesCache
      annotationStrokes = mainAnnotationStrokesCache
    } else {
      const space = spaces[canvasId]
      if (!space) {
        items = []
        strokes = []
        annotationStrokes = []
      } else {
        items = space.items
        strokes = space.strokes
        annotationStrokes = space.annotationStrokes
      }
    }

    useCanvasItemsStore.setState({
      items,
      activeStickyStroke: null,
      zMenu: null,
      selectedIds: [],
    })
    useStrokesStore.setState({
      strokes,
      annotationStrokes,
      activeStroke: null,
    })
    set({ activeCanvasId: canvasId })
  },

  persistWorkspace: () => {
    if (!persistEnabled) return
    get().flushActiveToSlot()
    scheduleSaveWorkspace(workspaceSnapshot(get()))
  },

  addSpaceData: (spaceId, name = DEFAULT_SPACE_NAME) => {
    const clampedName = clampSpaceName(name)
    set((state) => ({
      spaces: {
        ...state.spaces,
        [spaceId]: {
          items: [],
          strokes: [],
          annotationStrokes: [],
          name: clampedName,
          snapshot: null,
          camera: DEFAULT_SPACE_CAMERA,
        },
      },
    }))
    get().persistWorkspace()
  },

  updateSpaceName: (spaceId, name) => {
    const space = get().spaces[spaceId]
    if (!space) return
    const clampedName = clampSpaceName(name)
    set((state) => ({
      spaces: {
        ...state.spaces,
        [spaceId]: { ...space, name: clampedName },
      },
    }))
    patchMainSpaceItem(spaceId, { name: clampedName })
    if (get().activeCanvasId === 'main') {
      useCanvasItemsStore.setState({ items: [...mainItemsCache] })
    }
    get().persistWorkspace()
  },

  updateSpaceSnapshot: (spaceId, snapshot) => {
    const space = get().spaces[spaceId]
    if (!space) return
    const accepted = snapshot ? tryPersistSnapshot(spaceId, snapshot) : null
    const finalSnapshot = accepted ?? space.snapshot
    set((state) => ({
      spaces: {
        ...state.spaces,
        [spaceId]: { ...space, snapshot: finalSnapshot },
      },
    }))
    patchMainSpaceItem(spaceId, { snapshot: finalSnapshot })
    if (get().activeCanvasId === 'main') {
      useCanvasItemsStore.setState({ items: [...mainItemsCache] })
    }
    get().persistWorkspace()
  },

  saveCameraForActive: (camera) => {
    const { activeCanvasId, spaces } = get()
    if (activeCanvasId === 'main') return
    const space = spaces[activeCanvasId]
    if (!space) return
    set({
      spaces: {
        ...spaces,
        [activeCanvasId]: { ...space, camera },
      },
    })
    get().persistWorkspace()
  },

  getCameraForSpace: (spaceId) =>
    get().spaces[spaceId]?.camera ?? DEFAULT_SPACE_CAMERA,

  beginEnterSpace: (spaceId, cardRect) => {
    useCanvasItemsStore.getState().clearSelection()
    set({
      transition: { phase: 'entering', spaceId, cardRect },
    })
  },

  syncMainCamera: (transformRef) => {
    if (get().activeCanvasId !== 'main') return
    const camera = readCameraFromRef(transformRef)
    if (camera) mainCameraCache = camera
  },

  applyCameraForActiveCanvas: (transformRef) => {
    const { activeCanvasId, spaces } = get()
    if (!transformRef) return

    if (activeCanvasId === 'main') {
      applyCameraToRef(transformRef, mainCameraCache ?? DEFAULT_SPACE_CAMERA, {
        centerIfUninitialized: true,
      })
      const synced = readCameraFromRef(transformRef)
      if (synced) mainCameraCache = synced
      return
    }

    const space = spaces[activeCanvasId]
    const camera = space?.camera ?? DEFAULT_SPACE_CAMERA
    const isDefaultCamera =
      camera.positionX === DEFAULT_SPACE_CAMERA.positionX &&
      camera.positionY === DEFAULT_SPACE_CAMERA.positionY &&
      camera.scale === DEFAULT_SPACE_CAMERA.scale
    const isEmpty =
      !space ||
      (space.items.length === 0 &&
        space.strokes.length === 0 &&
        space.annotationStrokes.length === 0)

    if (isDefaultCamera && isEmpty) {
      transformRef.centerView(1, 0)
      requestAnimationFrame(() => {
        const synced = readCameraFromRef(transformRef)
        if (synced) get().saveCameraForActive(synced)
      })
    } else {
      applyCameraToRef(transformRef, camera)
    }
  },

  completeEnterSpace: (transformRef) => {
    const { transition } = get()
    const spaceId = transition.spaceId
    if (!spaceId) return

    const savedMain = readCameraFromRef(transformRef)
    if (savedMain) mainCameraCache = savedMain

    get().flushActiveToSlot()
    get().loadActiveFromSlot(spaceId)
    clearHistory()

    get().applyCameraForActiveCanvas(transformRef)

    set({
      transition: { phase: 'idle', spaceId: null, cardRect: null },
    })
    get().persistWorkspace()
  },

  beginExitSpace: (transformRef) => {
    const { activeCanvasId } = get()
    if (activeCanvasId === 'main') return

    const spaceItem = mainItemsCache.find(
      (i): i is SpaceCanvasItem =>
        i.id === activeCanvasId && i.type === 'space',
    )
    const cardRect =
      spaceItem && transformRef
        ? spaceCardClientRect(spaceItem, transformRef, mainCameraCache)
        : null

    set({
      transition: {
        phase: 'exiting',
        spaceId: activeCanvasId,
        cardRect,
      },
    })
  },

  captureExitSnapshot: async (transformRef, canvasEl) => {
    const { activeCanvasId } = get()
    if (activeCanvasId === 'main' || !canvasEl) return

    const camera = readCameraFromRef(transformRef)
    if (camera) get().saveCameraForActive(camera)

    get().flushActiveToSlot()

    const snapshot = await captureCanvasSnapshot(canvasEl)
    if (snapshot) get().updateSpaceSnapshot(activeCanvasId, snapshot)
  },

  completeExitSpace: (transformRef) => {
    const { activeCanvasId, transition } = get()
    const spaceId = transition.spaceId ?? activeCanvasId
    if (spaceId === 'main' || !spaceId) return

    get().loadActiveFromSlot('main')
    clearHistory()

    applyCameraToRef(transformRef, mainCameraCache ?? DEFAULT_SPACE_CAMERA, {
      centerIfUninitialized: true,
    })
    const synced = readCameraFromRef(transformRef)
    if (synced) mainCameraCache = synced

    set({
      transition: { phase: 'idle', spaceId: null, cardRect: null },
    })
    get().persistWorkspace()
  },

  setTransitionIdle: () => {
    set({
      transition: { phase: 'idle', spaceId: null, cardRect: null },
    })
  },
}))

/** Called by items/strokes stores whenever active canvas data changes. */
export function notifyWorkspacePersist() {
  useCanvasWorkspaceStore.getState().persistWorkspace()
}
