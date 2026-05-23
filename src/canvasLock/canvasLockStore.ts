import { create } from 'zustand'
import { pushUndoSnapshot, clearHistory } from '../canvasHistory/canvasHistory'
import { playSound } from '../sound/playSound'
import { scheduleSaveCanvasItems } from '../canvasItems/canvasItemsPersistence'
import { useCanvasItemsStore } from '../canvasItems/canvasItemsStore'
import { scheduleSaveStrokes } from '../drawing/strokesPersistence'
import { useStrokesStore } from '../drawing/strokesStore'
import {
  discardAnnotationsFromItems,
  hasAnyAnnotations,
  mergeAnnotationsIntoCommitted,
} from './layer'
import {
  loadCanvasLockFromStorage,
  saveCanvasLockToStorage,
} from './canvasLockPersistence'

type CanvasLockState = {
  isLocked: boolean
  unlockModalOpen: boolean
  hydrate: () => void
  lockCanvas: () => void
  requestUnlock: () => void
  cancelUnlock: () => void
  keepAnnotationsAndUnlock: () => void
  discardAnnotationsAndUnlock: () => void
  /** Removes all annotation-layer items and strokes; committed content is untouched. */
  clearAllAnnotations: () => void
}

let persistEnabled = false

function persistLock(isLocked: boolean) {
  if (persistEnabled) saveCanvasLockToStorage(isLocked)
}

export const useCanvasLockStore = create<CanvasLockState>((set, get) => ({
  isLocked: false,
  unlockModalOpen: false,

  hydrate: () => {
    const isLocked = loadCanvasLockFromStorage()
    set({ isLocked })
    persistEnabled = true
  },

  lockCanvas: () => {
    if (get().isLocked) return
    set({ isLocked: true, unlockModalOpen: false })
    persistLock(true)
    clearHistory()
    playSound('lock')
  },

  requestUnlock: () => {
    if (!get().isLocked) return
    const items = useCanvasItemsStore.getState().items
    const annotationStrokes = useStrokesStore.getState().annotationStrokes
    if (!hasAnyAnnotations(items, annotationStrokes)) {
      set({ isLocked: false })
      persistLock(false)
      playSound('unlock')
      return
    }
    set({ unlockModalOpen: true })
  },

  cancelUnlock: () => {
    set({ unlockModalOpen: false })
  },

  keepAnnotationsAndUnlock: () => {
    const mergedItems = mergeAnnotationsIntoCommitted(
      useCanvasItemsStore.getState().items,
    )
    const strokesStore = useStrokesStore.getState()
    const mergedStrokes = [
      ...strokesStore.strokes,
      ...strokesStore.annotationStrokes,
    ]

    useCanvasItemsStore.setState({ items: mergedItems, activeStickyStroke: null, zMenu: null })
    useStrokesStore.setState({
      strokes: mergedStrokes,
      annotationStrokes: [],
      activeStroke: null,
    })
    scheduleSaveCanvasItems(mergedItems)
    scheduleSaveStrokes(mergedStrokes, [])

    set({ isLocked: false, unlockModalOpen: false })
    persistLock(false)
    clearHistory()
    playSound('unlock')
  },

  discardAnnotationsAndUnlock: () => {
    const items = discardAnnotationsFromItems(useCanvasItemsStore.getState().items)
    const committedStrokes = useStrokesStore.getState().strokes

    useCanvasItemsStore.setState({ items, activeStickyStroke: null, zMenu: null })
    useStrokesStore.setState({
      strokes: committedStrokes,
      annotationStrokes: [],
      activeStroke: null,
    })
    scheduleSaveCanvasItems(items)
    scheduleSaveStrokes(committedStrokes, [])

    set({ isLocked: false, unlockModalOpen: false })
    persistLock(false)
    clearHistory()
    playSound('unlock')
  },

  clearAllAnnotations: () => {
    const items = useCanvasItemsStore.getState().items
    const annotationStrokes = useStrokesStore.getState().annotationStrokes
    if (!hasAnyAnnotations(items, annotationStrokes)) return

    pushUndoSnapshot()

    const nextItems = discardAnnotationsFromItems(items)
    const committedStrokes = useStrokesStore.getState().strokes

    useCanvasItemsStore.setState({ items: nextItems, activeStickyStroke: null, zMenu: null })
    useStrokesStore.setState({
      strokes: committedStrokes,
      annotationStrokes: [],
      activeStroke: null,
    })
    scheduleSaveCanvasItems(nextItems)
    scheduleSaveStrokes(committedStrokes, [])
  },
}))
