import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCanvasNavigationStore } from '../canvas/canvasNavigationStore'
import { primaryPointerReleased } from './canvasPointerSession'
import { clientToCanvasFromElement } from '../drawing/canvasCoords'
import { playSound } from '../sound/playSound'
import {
  startItemDragSound,
  stopItemDragSound,
  updateItemDragSound,
} from '../sound/itemDragSound'
import { useCanvasItemDragStore } from './canvasItemDragStore'
import { useCanvasItemsStore } from './canvasItemsStore'

const DRAG_THRESHOLD_PX = 8
const DRAG_ACTIVE_CLASS = 'canvas-item-drag-active'

type DragPhase = 'pending' | 'dragging'

type DragSession = {
  itemId: string
  pointerId: number
  phase: DragPhase
  canvasEl: HTMLElement
  grabOffsetX: number
  grabOffsetY: number
  startClientX: number
  startClientY: number
  lastClientX: number
  lastClientY: number
  onReleaseWithoutDrag?: () => void
}

let session: DragSession | null = null
let detachListeners: (() => void) | null = null
let dragRafId: number | null = null

function cancelDragRaf() {
  if (dragRafId != null) {
    cancelAnimationFrame(dragRafId)
    dragRafId = null
  }
}

function screenDist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1)
}

function resolveCanvasEl(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  const canvas = target.closest('.cutline-draw-target')
  return canvas instanceof HTMLElement ? canvas : null
}

function setDragActiveClass(active: boolean) {
  document.documentElement.classList.toggle(DRAG_ACTIVE_CLASS, active)
}

function clearActiveItem() {
  useCanvasItemDragStore.setState({ activeItemId: null })
}

function removeDocumentListeners() {
  detachListeners?.()
  detachListeners = null
}

function commitDragStart() {
  if (!session || session.phase === 'dragging') return

  session.phase = 'dragging'
  const store = useCanvasItemsStore.getState()
  store.beginItemDrag(session.itemId)
  store.raiseInPlane(session.itemId)
  playSound('itemGrab')
  startItemDragSound()
  useCanvasItemDragStore.setState({ activeItemId: session.itemId })
  setDragActiveClass(true)
}

function finishSession() {
  if (session && dragRafId != null) {
    cancelDragRaf()
    applyDragPosition(session.lastClientX, session.lastClientY)
  }

  const ended = session
  cancelDragRaf()
  removeDocumentListeners()
  session = null
  setDragActiveClass(false)
  clearActiveItem()

  if (!ended) return

  if (ended.phase === 'pending') {
    ended.onReleaseWithoutDrag?.()
    return
  }

  stopItemDragSound()
  playSound('itemDrop')

  const item = useCanvasItemsStore.getState().items.find((entry) => entry.id === ended.itemId)
  if (item) {
    useCanvasItemsStore.getState().updateItemPosition(item.id, item.x, item.y, {
      persist: true,
    })
  }
}

function applyDragPosition(clientX: number, clientY: number) {
  if (!session || session.phase !== 'dragging') return

  updateItemDragSound(clientX, clientY)

  const pos = clientToCanvasFromElement(clientX, clientY, session.canvasEl)
  if (!pos) return

  useCanvasItemsStore.getState().updateItemPosition(
    session.itemId,
    pos.x - session.grabOffsetX,
    pos.y - session.grabOffsetY,
    { persist: false },
  )
}

function scheduleDragMove(clientX: number, clientY: number) {
  if (!session) return
  session.lastClientX = clientX
  session.lastClientY = clientY

  if (dragRafId != null) return
  dragRafId = requestAnimationFrame(() => {
    dragRafId = null
    if (!session) return
    applyDragPosition(session.lastClientX, session.lastClientY)
  })
}

/**
 * Start tracking a grab-handle pointer. Document-level capture listeners only —
 * no setPointerCapture on the handle (DOM updates during move used to drop capture).
 */
export function attachCanvasItemDragPointerDown(
  itemId: string,
  event: ReactPointerEvent<HTMLElement>,
  options?: { onReleaseWithoutDrag?: () => void },
) {
  if (event.pointerType === 'pen') return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  if (
    event.pointerType === 'touch' &&
    useCanvasNavigationStore.getState().shouldSuppressHandleGesture()
  ) {
    return
  }

  const canvasEl = resolveCanvasEl(event.currentTarget)
  if (!canvasEl) return

  const items = useCanvasItemsStore.getState().items
  const item = items.find((entry) => entry.id === itemId)
  if (!item) return

  const pointerCanvas = clientToCanvasFromElement(
    event.clientX,
    event.clientY,
    canvasEl,
  )
  if (!pointerCanvas) return

  finishSession()

  event.preventDefault()
  event.stopPropagation()

  const pointerId = event.pointerId

  session = {
    itemId,
    pointerId,
    phase: 'pending',
    canvasEl,
    grabOffsetX: pointerCanvas.x - item.x,
    grabOffsetY: pointerCanvas.y - item.y,
    startClientX: event.clientX,
    startClientY: event.clientY,
    lastClientX: event.clientX,
    lastClientY: event.clientY,
    onReleaseWithoutDrag: options?.onReleaseWithoutDrag,
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!session || e.pointerId !== pointerId) return

    if (primaryPointerReleased(e)) {
      session.lastClientX = e.clientX
      session.lastClientY = e.clientY
      finishSession()
      return
    }

    if (useCanvasNavigationStore.getState().shouldSuppressHandleGesture()) {
      finishSession()
      return
    }

    if (session.phase === 'pending') {
      if (
        screenDist(e.clientX, e.clientY, session.startClientX, session.startClientY) <
        DRAG_THRESHOLD_PX
      ) {
        return
      }
      commitDragStart()
    }

    if (e.cancelable) e.preventDefault()
    scheduleDragMove(e.clientX, e.clientY)
  }

  const onPointerEnd = (e: PointerEvent) => {
    if (!session || e.pointerId !== pointerId) return
    session.lastClientX = e.clientX
    session.lastClientY = e.clientY
    finishSession()
  }

  document.addEventListener('pointermove', onPointerMove, { capture: true })
  document.addEventListener('pointerup', onPointerEnd, { capture: true })
  document.addEventListener('pointercancel', onPointerEnd, { capture: true })
  window.addEventListener('pointerup', onPointerEnd, { capture: true })
  window.addEventListener('pointercancel', onPointerEnd, { capture: true })
  window.addEventListener('blur', finishSession)

  const onWindowMouseMove = (e: MouseEvent) => {
    if (!session || session.pointerId !== pointerId) return
    if (primaryPointerReleased(e)) {
      session.lastClientX = e.clientX
      session.lastClientY = e.clientY
      finishSession()
    }
  }
  window.addEventListener('mousemove', onWindowMouseMove, { capture: true })

  detachListeners = () => {
    document.removeEventListener('pointermove', onPointerMove, true)
    document.removeEventListener('pointerup', onPointerEnd, true)
    document.removeEventListener('pointercancel', onPointerEnd, true)
    window.removeEventListener('pointerup', onPointerEnd, true)
    window.removeEventListener('pointercancel', onPointerEnd, true)
    window.removeEventListener('blur', finishSession)
    window.removeEventListener('mousemove', onWindowMouseMove, true)
  }
}

export function cancelCanvasItemDrag() {
  finishSession()
}
