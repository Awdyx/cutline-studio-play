import { create } from 'zustand'
import { pushUndoSnapshot } from '../canvasHistory/canvasHistory'
import { playSound } from '../sound/playSound'
import {
  effectiveCanvasLocked,
  itemLayer,
  isItemFrozen,
  newItemLayer,
} from '../canvasLock/layer'
import { useCanvasLockStore } from '../canvasLock/canvasLockStore'
import { ERASE_HIT_RADIUS, hitTestStroke } from '../drawing/eraseUtils'
import { generateStrokeId } from '../drawing/strokeId'
import { strokeToSvgPath } from '../drawing/strokePath'
import type { DrawTool, Stroke, StrokePoint } from '../drawing/types'
import { notifyWorkspacePersist } from '../spaces/canvasWorkspaceStore'
import { useCanvasWorkspaceStore } from '../spaces/canvasWorkspaceStore'
import { generateItemId } from './itemId'
import {
  nextZIndexForLayer,
  zIndexForBringToFront,
  zIndexForRaiseInPlane,
  zIndexForSendToBack,
} from './canvasZOrder'
import {
  SPACE_HEIGHT,
  SPACE_WIDTH,
  STICKY_HEIGHT,
  STICKY_WIDTH,
  TEXT_HEIGHT,
  TEXT_WIDTH,
  type CanvasItem,
  type ImageCanvasItem,
  type SpaceCanvasItem,
  type StickyCanvasItem,
  type TextCanvasItem,
  type VideoCanvasItem,
} from './types'
import { DEFAULT_SPACE_NAME } from '../spaces/types'
import {
  DEFAULT_TEXT_ALIGNMENT,
  type ItemTextAlignment,
} from './textAlignment'

type StrokeConfig = {
  color: string
  size: number
  tool: DrawTool
}

type CanvasItemsState = {
  items: CanvasItem[]
  selectedIds: string[]
  activeStickyStroke: { stickyId: string; stroke: Stroke } | null
  hydrate: () => void
  setSelectedIds: (ids: string[]) => void
  selectItem: (id: string, additive?: boolean) => void
  clearSelection: () => void
  selectAll: () => void
  deleteSelected: () => void
  duplicateSelected: () => void
  addSticky: (x: number, y: number) => string
  addText: (x: number, y: number) => string
  addImage: (x: number, y: number, src: string, width: number, height: number) => string
  addVideo: (x: number, y: number, src: string, width: number, height: number) => string
  addSpace: (x: number, y: number) => string
  beginItemDrag: (id: string) => void
  beginItemResize: (id: string) => void
  updateItemPosition: (id: string, x: number, y: number) => void
  updateItemSize: (id: string, width: number, height: number) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  raiseInPlane: (id: string) => void
  zMenu: { itemId: string; anchorX: number; anchorY: number } | null
  openZMenu: (itemId: string, anchorX: number, anchorY: number) => void
  closeZMenu: () => void
  deleteItem: (id: string) => void
  commitStickyTextEdit: (id: string, text: string) => void
  updateStickyText: (id: string, text: string) => void
  commitTextItemEdit: (id: string, text: string) => void
  updateTextItemText: (id: string, text: string) => void
  setItemTextAlignment: (id: string, alignment: ItemTextAlignment) => void
  getStickyById: (id: string) => StickyCanvasItem | undefined
  startStickyStroke: (stickyId: string, point: StrokePoint, config: StrokeConfig) => void
  addStickyStrokePoint: (point: StrokePoint) => void
  endStickyStroke: () => void
  cancelActiveStickyStroke: () => void
  applyStickyStrokeErase: (canvasPos: { x: number; y: number }) => void
}

let persistEnabled = false

function createStroke(point: StrokePoint, config: StrokeConfig): Stroke {
  return {
    id: generateStrokeId(),
    points: [point],
    color: config.color,
    size: config.size,
    tool: config.tool,
  }
}

function persistItems() {
  if (persistEnabled) notifyWorkspacePersist()
}

function findItem(items: CanvasItem[], id: string): CanvasItem | undefined {
  return items.find((item) => item.id === id)
}

function itemIsMutable(item: CanvasItem | undefined): item is CanvasItem {
  if (!item) return false
  return !isItemFrozen(item, useCanvasLockStore.getState().isLocked)
}

function cloneItem(item: CanvasItem, offset: number): CanvasItem {
  const id = generateItemId()
  const base = {
    ...item,
    id,
    x: item.x + offset,
    y: item.y + offset,
    zIndex: item.zIndex + 1,
  }
  if (item.type === 'space') {
    useCanvasWorkspaceStore.getState().addSpaceData(id, item.name)
  }
  return base
}

export const useCanvasItemsStore = create<CanvasItemsState>((set, get) => ({
  items: [],
  selectedIds: [],
  activeStickyStroke: null,
  zMenu: null,

  hydrate: () => {
    persistEnabled = true
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  selectItem: (id, additive = false) => {
    const item = findItem(get().items, id)
    if (!itemIsMutable(item)) return
    set((state) => {
      if (additive) {
        const has = state.selectedIds.includes(id)
        return {
          selectedIds: has
            ? state.selectedIds.filter((x) => x !== id)
            : [...state.selectedIds, id],
        }
      }
      return { selectedIds: [id] }
    })
  },

  clearSelection: () => set({ selectedIds: [] }),

  selectAll: () => {
    const ids = get()
      .items.filter((item) => itemIsMutable(item))
      .map((item) => item.id)
    set({ selectedIds: ids })
  },

  deleteSelected: () => {
    const { selectedIds, items } = get()
    if (selectedIds.length === 0) return
    const toDelete = selectedIds.filter((id) =>
      itemIsMutable(findItem(items, id)),
    )
    if (toDelete.length === 0) return
    pushUndoSnapshot()
    playSound('delete')
    set((state) => {
      const remove = new Set(toDelete)
      const nextItems = state.items.filter((item) => !remove.has(item.id))
      persistItems()
      return {
        items: nextItems,
        selectedIds: [],
        activeStickyStroke:
          state.activeStickyStroke &&
          remove.has(state.activeStickyStroke.stickyId)
            ? null
            : state.activeStickyStroke,
        zMenu: state.zMenu && remove.has(state.zMenu.itemId) ? null : state.zMenu,
      }
    })
  },

  duplicateSelected: () => {
    const { selectedIds, items } = get()
    if (selectedIds.length === 0) return
    const sources = selectedIds
      .map((id) => findItem(items, id))
      .filter((item): item is CanvasItem => itemIsMutable(item))
    if (sources.length === 0) return
    pushUndoSnapshot()
    const offset = 24
    const clones = sources.map((item) => cloneItem(item, offset))
    const newIds = clones.map((c) => c.id)
    set((state) => {
      const next = [...state.items, ...clones]
      persistItems()
      return { items: next, selectedIds: newIds }
    })
  },

  addSticky: (x, y) => {
    pushUndoSnapshot()
    const id = generateItemId()
    const items = get().items
    const layer = newItemLayer(useCanvasLockStore.getState().isLocked)
    const sticky: StickyCanvasItem = {
      id,
      type: 'sticky',
      x: x - STICKY_WIDTH / 2,
      y: y - STICKY_HEIGHT / 2,
      zIndex: nextZIndexForLayer(items, layer),
      width: STICKY_WIDTH,
      height: STICKY_HEIGHT,
      text: '',
      strokes: [],
      textAlign: DEFAULT_TEXT_ALIGNMENT,
      ...(layer === 'annotation' ? { layer } : {}),
    }
    const next = [...items, sticky]
    set({ items: next })
    persistItems()
    playSound('spawn')
    return id
  },

  addText: (x, y) => {
    pushUndoSnapshot()
    const id = generateItemId()
    const items = get().items
    const layer = newItemLayer(useCanvasLockStore.getState().isLocked)
    const textItem: TextCanvasItem = {
      id,
      type: 'text',
      x: x - TEXT_WIDTH / 2,
      y: y - TEXT_HEIGHT / 2,
      zIndex: nextZIndexForLayer(items, layer),
      width: TEXT_WIDTH,
      height: TEXT_HEIGHT,
      text: '',
      textAlign: DEFAULT_TEXT_ALIGNMENT,
      ...(layer === 'annotation' ? { layer } : {}),
    }
    const next = [...items, textItem]
    set({ items: next })
    persistItems()
    playSound('spawn')
    return id
  },

  addImage: (x, y, src, width, height) => {
    pushUndoSnapshot()
    const id = generateItemId()
    const items = get().items
    const layer = newItemLayer(useCanvasLockStore.getState().isLocked)
    const image: ImageCanvasItem = {
      id,
      type: 'image',
      x: x - width / 2,
      y: y - height / 2,
      zIndex: nextZIndexForLayer(items, layer),
      width,
      height,
      src,
      ...(layer === 'annotation' ? { layer } : {}),
    }
    const next = [...items, image]
    set({ items: next })
    persistItems()
    playSound('spawn')
    return id
  },

  addVideo: (x, y, src, width, height) => {
    pushUndoSnapshot()
    const id = generateItemId()
    const items = get().items
    const layer = newItemLayer(useCanvasLockStore.getState().isLocked)
    const video: VideoCanvasItem = {
      id,
      type: 'video',
      x: x - width / 2,
      y: y - height / 2,
      zIndex: nextZIndexForLayer(items, layer),
      width,
      height,
      src,
      ...(layer === 'annotation' ? { layer } : {}),
    }
    const next = [...items, video]
    set({ items: next })
    persistItems()
    playSound('spawn')
    return id
  },

  addSpace: (x, y) => {
    if (!useCanvasWorkspaceStore.getState().isOnMainCanvas()) return ''
    pushUndoSnapshot()
    const id = generateItemId()
    const items = get().items
    const layer = newItemLayer(useCanvasLockStore.getState().isLocked)
    const space: SpaceCanvasItem = {
      id,
      type: 'space',
      x: x - SPACE_WIDTH / 2,
      y: y - SPACE_HEIGHT / 2,
      zIndex: nextZIndexForLayer(items, layer),
      width: SPACE_WIDTH,
      height: SPACE_HEIGHT,
      name: DEFAULT_SPACE_NAME,
      snapshot: null,
      ...(layer === 'annotation' ? { layer } : {}),
    }
    useCanvasWorkspaceStore.getState().addSpaceData(id, DEFAULT_SPACE_NAME)
    const next = [...items, space]
    set({ items: next })
    persistItems()
    playSound('spawn')
    return id
  },

  beginItemDrag: (id: string) => {
    if (!itemIsMutable(findItem(get().items, id))) return
    pushUndoSnapshot()
  },

  beginItemResize: (id: string) => {
    if (!itemIsMutable(findItem(get().items, id))) return
    pushUndoSnapshot()
  },

  updateItemPosition: (id, x, y) => {
    if (!itemIsMutable(findItem(get().items, id))) return
    set((state) => {
      const items = state.items.map((item) =>
        item.id === id ? { ...item, x, y } : item,
      )
      persistItems()
      return { items }
    })
  },

  updateItemSize: (id, width, height) => {
    if (!itemIsMutable(findItem(get().items, id))) return
    set((state) => {
      const items = state.items.map((item) =>
        item.id === id ? { ...item, width, height } : item,
      )
      persistItems()
      return { items }
    })
  },

  bringToFront: (id) => {
    if (!itemIsMutable(findItem(get().items, id))) return
    pushUndoSnapshot()
    set((state) => {
      const zIndex = zIndexForBringToFront(state.items, id)
      const items = state.items.map((item) =>
        item.id === id ? { ...item, zIndex } : item,
      )
      persistItems()
      return { items }
    })
  },

  sendToBack: (id) => {
    if (!itemIsMutable(findItem(get().items, id))) return
    pushUndoSnapshot()
    set((state) => {
      const zIndex = zIndexForSendToBack(state.items, id)
      const items = state.items.map((item) =>
        item.id === id ? { ...item, zIndex } : item,
      )
      persistItems()
      return { items }
    })
  },

  raiseInPlane: (id) => {
    if (!itemIsMutable(findItem(get().items, id))) return
    set((state) => {
      const zIndex = zIndexForRaiseInPlane(state.items, id)
      const items = state.items.map((item) =>
        item.id === id ? { ...item, zIndex } : item,
      )
      persistItems()
      return { items }
    })
  },

  openZMenu: (itemId, anchorX, anchorY) => {
    set({ zMenu: { itemId, anchorX, anchorY } })
  },

  closeZMenu: () => {
    set({ zMenu: null })
  },

  deleteItem: (id) => {
    if (!itemIsMutable(findItem(get().items, id))) return
    pushUndoSnapshot()
    set((state) => {
      const items = state.items.filter((item) => item.id !== id)
      persistItems()
      const activeStickyStroke =
        state.activeStickyStroke?.stickyId === id ? null : state.activeStickyStroke
      const zMenu = state.zMenu?.itemId === id ? null : state.zMenu
      const selectedIds = state.selectedIds.filter((sid) => sid !== id)
      return { items, activeStickyStroke, zMenu, selectedIds }
    })
  },

  commitStickyTextEdit: (id, text) => {
    const item = get().items.find((i) => i.id === id)
    if (!itemIsMutable(item) || item?.type !== 'sticky' || item.text === text) return
    pushUndoSnapshot()
    get().updateStickyText(id, text)
  },

  updateStickyText: (id, text) => {
    if (!itemIsMutable(findItem(get().items, id))) return
    set((state) => {
      const items = state.items.map((item) =>
        item.id === id && item.type === 'sticky' ? { ...item, text } : item,
      )
      persistItems()
      return { items }
    })
  },

  commitTextItemEdit: (id, text) => {
    const item = get().items.find((i) => i.id === id)
    if (!itemIsMutable(item) || item?.type !== 'text' || item.text === text) return
    pushUndoSnapshot()
    get().updateTextItemText(id, text)
  },

  updateTextItemText: (id, text) => {
    if (!itemIsMutable(findItem(get().items, id))) return
    set((state) => {
      const items = state.items.map((item) =>
        item.id === id && item.type === 'text' ? { ...item, text } : item,
      )
      persistItems()
      return { items }
    })
  },

  setItemTextAlignment: (id, alignment) => {
    const item = get().items.find((i) => i.id === id)
    if (!itemIsMutable(item)) return
    if (item?.type !== 'sticky' && item?.type !== 'text') return
    if (
      item.textAlign.horizontal === alignment.horizontal &&
      item.textAlign.vertical === alignment.vertical
    ) {
      return
    }
    pushUndoSnapshot()
    set((state) => {
      const items = state.items.map((entry) =>
        entry.id === id && (entry.type === 'sticky' || entry.type === 'text')
          ? { ...entry, textAlign: alignment }
          : entry,
      )
      persistItems()
      return { items }
    })
  },

  getStickyById: (id) => {
    const item = get().items.find((i) => i.id === id)
    return item?.type === 'sticky' ? item : undefined
  },

  startStickyStroke: (stickyId, point, config) => {
    set({ activeStickyStroke: { stickyId, stroke: createStroke(point, config) } })
  },

  addStickyStrokePoint: (point) => {
    const { activeStickyStroke } = get()
    if (!activeStickyStroke) return
    set({
      activeStickyStroke: {
        ...activeStickyStroke,
        stroke: {
          ...activeStickyStroke.stroke,
          points: [...activeStickyStroke.stroke.points, point],
        },
      },
    })
  },

  cancelActiveStickyStroke: () => {
    set({ activeStickyStroke: null })
  },

  applyStickyStrokeErase: (canvasPos) => {
    if (!useCanvasLockStore.getState().isLocked) return

    let changed = false
    set((state) => {
      const items = state.items.map((item) => {
        if (item.type !== 'sticky') return item

        const localX = canvasPos.x - item.x
        const localY = canvasPos.y - item.y

        if (item.layer === 'annotation') {
          const next = item.strokes.filter(
            (stroke) =>
              !hitTestStroke(stroke, localX, localY, ERASE_HIT_RADIUS),
          )
          if (next.length === item.strokes.length) return item
          changed = true
          return { ...item, strokes: next }
        }

        const ann = item.annotationStrokes ?? []
        if (ann.length === 0) return item
        const next = ann.filter(
          (stroke) => !hitTestStroke(stroke, localX, localY, ERASE_HIT_RADIUS),
        )
        if (next.length === ann.length) return item
        changed = true
        return { ...item, annotationStrokes: next }
      })
      if (!changed) return state
      persistItems()
      return { items }
    })
  },

  endStickyStroke: () => {
    const active = get().activeStickyStroke
    if (!active) return

    let points = [...active.stroke.points]
    while (points.length > 2 && points[points.length - 1].pressure < 0.15) {
      points.pop()
    }

    if (points.length < 3) {
      set({ activeStickyStroke: null })
      return
    }

    pushUndoSnapshot()

    const trimmed: Stroke = { ...active.stroke, points }
    const path = strokeToSvgPath(trimmed, true)
    const completed = { ...trimmed, path }

    const isLocked = effectiveCanvasLocked(
      useCanvasLockStore.getState().isLocked,
    )

    set((state) => {
      const items = state.items.map((item) => {
        if (item.id !== active.stickyId || item.type !== 'sticky') return item
        const onCommittedLayer = isLocked && itemLayer(item) === 'committed'
        if (onCommittedLayer) {
          const annotationStrokes = [...(item.annotationStrokes ?? []), completed]
          return { ...item, annotationStrokes }
        }
        return { ...item, strokes: [...item.strokes, completed] }
      })
      persistItems()
      return { items, activeStickyStroke: null }
    })
  },
}))
