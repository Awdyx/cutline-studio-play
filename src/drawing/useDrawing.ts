import { useEffect, type RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { isStylusTouch } from './penInput'
import type { PenToolMenuBridge } from './usePenToolMenu'
import { hitTestStickyAtCanvasPoint } from '../canvasItems/stickyHitTest'
import { useCanvasItemsStore } from '../canvasItems/canvasItemsStore'
import { useStrokesStore } from './strokesStore'
import { useToolStore } from './toolStore'
import type { StrokePoint } from './types'
const captureOpts = { capture: true } as const
const ERASE_THROTTLE_MS = 16

function readPressure(pressure: number): number {
  return pressure > 0 ? pressure : 0.5
}

import { clientToCanvasFromElement } from './canvasCoords'

export function useDrawing(
  canvasRef: RefObject<HTMLDivElement | null>,
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>,
  onPenStateChange?: (isDown: boolean) => void,
  penMenuBridgeRef?: RefObject<PenToolMenuBridge | null>,
  /** Pass the mounted canvas node so listeners attach when the ref is set. */
  canvasMount?: HTMLDivElement | null,
) {
  useEffect(() => {
    const el = canvasMount ?? canvasRef.current
    if (!el) return
    const canvasEl: HTMLDivElement = el

    const {
      startStroke,
      addPoint,
      endStroke,
      beginDragErase,
      applyDragErase,
    } = useStrokesStore.getState()

    const {
      startStickyStroke,
      addStickyStrokePoint,
      endStickyStroke,
      getStickyById,
    } = useCanvasItemsStore.getState()

    let pointerPenActive = false
    let eraseActive = false
    let lastEraseAt = 0
    let activeStickyId: string | null = null

    function setPenDown(down: boolean) {
      onPenStateChange?.(down)
    }

    function penMenu(): PenToolMenuBridge | null {
      return penMenuBridgeRef?.current ?? null
    }

    function toCanvasCoords(event: PointerEvent): { x: number; y: number } | null {
      return clientToCanvasFromElement(event.clientX, event.clientY, canvasEl)
    }

    function toStickyLocalPoint(
      canvasX: number,
      canvasY: number,
      stickyId: string,
      pressure: number,
    ): StrokePoint | null {
      const sticky = getStickyById(stickyId)
      if (!sticky) return null
      return {
        x: canvasX - sticky.x,
        y: canvasY - sticky.y,
        pressure,
      }
    }

    function capturePointer(event: PointerEvent) {
      try {
        canvasEl.setPointerCapture(event.pointerId)
      } catch {
        // ignore
      }
    }

    function releasePointer(event: PointerEvent) {
      if (canvasEl.hasPointerCapture(event.pointerId)) {
        canvasEl.releasePointerCapture(event.pointerId)
      }
    }

    function eraseAt(coords: { x: number; y: number }) {
      const now = performance.now()
      if (now - lastEraseAt < ERASE_THROTTLE_MS) return
      lastEraseAt = now
      applyDragErase(coords)
      useCanvasItemsStore.getState().applyStickyStrokeErase(coords)
    }

    function onTouchStart(event: TouchEvent) {
      if (penMenu()?.isActive()) return
      if (event.touches.length !== 1) return
      const touch = event.touches[0]
      if (!isStylusTouch(touch)) return
      event.stopPropagation()
      setPenDown(true)
    }

    function onTouchEnd(event: TouchEvent) {
      if (penMenu()?.isActive()) return
      if (pointerPenActive) return
      const ended = event.changedTouches[0]
      if (ended && isStylusTouch(ended)) {
        setPenDown(false)
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (penMenu()?.onPointerDown(event)) return
      if (event.pointerType !== 'pen') return

      event.preventDefault()
      event.stopPropagation()

      pointerPenActive = true
      setPenDown(true)
      capturePointer(event)

      const mode = useToolStore.getState().mode
      const coords = toCanvasCoords(event)

      if (mode === 'erase') {
        eraseActive = true
        beginDragErase()
        if (coords) {
          lastEraseAt = 0
          applyDragErase(coords)
        }
        return
      }

      const tools = useToolStore.getState()
      if (!coords) return

      const pressure = readPressure(event.pressure)
      const stickyId = hitTestStickyAtCanvasPoint(coords.x, coords.y)
      const config =
        mode === 'pen'
          ? {
              color: tools.penColor,
              size: tools.penSize,
              tool: 'pen' as const,
            }
          : {
              color: tools.highlighterColor,
              size: tools.highlighterSize,
              tool: 'highlighter' as const,
            }

      if (stickyId) {
        const local = toStickyLocalPoint(coords.x, coords.y, stickyId, pressure)
        if (!local) return
        activeStickyId = stickyId
        startStickyStroke(stickyId, local, config)
        return
      }

      activeStickyId = null
      const point: StrokePoint = { ...coords, pressure }
      startStroke(point, config)
    }

    function onPointerMove(event: PointerEvent) {
      if (penMenu()?.onPointerMove(event)) return
      if (event.pointerType !== 'pen') return

      const mode = useToolStore.getState().mode

      if (mode === 'erase' && eraseActive) {
        event.preventDefault()
        const coords = toCanvasCoords(event)
        if (coords) eraseAt(coords)
        return
      }

      event.preventDefault()
      if (event.pressure < 0.05) return

      const coords = toCanvasCoords(event)
      if (!coords) return

      const pressure = readPressure(event.pressure)

      if (activeStickyId) {
        const local = toStickyLocalPoint(
          coords.x,
          coords.y,
          activeStickyId,
          pressure,
        )
        if (local) addStickyStrokePoint(local)
        return
      }

      const activeStroke = useStrokesStore.getState().activeStroke
      if (!activeStroke) return

      addPoint({ ...coords, pressure })
    }

    function releasePen(event: PointerEvent) {
      const penMenuHandled = penMenu()?.onPointerUp(event) ?? false
      if (event.pointerType !== 'pen') return

      event.preventDefault()

      pointerPenActive = false
      setPenDown(false)
      releasePointer(event)

      if (penMenuHandled) {
        eraseActive = false
        activeStickyId = null
        useCanvasItemsStore.getState().cancelActiveStickyStroke()
        return
      }

      const mode = useToolStore.getState().mode

      if (mode === 'erase') {
        eraseActive = false
        return
      }

      if (activeStickyId) {
        endStickyStroke()
        activeStickyId = null
        return
      }

      const activeStroke = useStrokesStore.getState().activeStroke
      if (activeStroke) endStroke()
    }

    canvasEl.addEventListener('touchstart', onTouchStart, captureOpts)
    canvasEl.addEventListener('touchend', onTouchEnd, captureOpts)
    canvasEl.addEventListener('touchcancel', onTouchEnd, captureOpts)

    canvasEl.addEventListener('pointerdown', onPointerDown, captureOpts)
    canvasEl.addEventListener('pointermove', onPointerMove, captureOpts)
    canvasEl.addEventListener('pointerup', releasePen, captureOpts)
    canvasEl.addEventListener('pointercancel', releasePen, captureOpts)

    function onWindowPointerEnd() {
      if (pointerPenActive) return
      setPenDown(false)
    }

    window.addEventListener('pointerup', onWindowPointerEnd)
    window.addEventListener('pointercancel', onWindowPointerEnd)

    return () => {
      window.removeEventListener('pointerup', onWindowPointerEnd)
      window.removeEventListener('pointercancel', onWindowPointerEnd)
      canvasEl.removeEventListener('touchstart', onTouchStart, captureOpts)
      canvasEl.removeEventListener('touchend', onTouchEnd, captureOpts)
      canvasEl.removeEventListener('touchcancel', onTouchEnd, captureOpts)
      canvasEl.removeEventListener('pointerdown', onPointerDown, captureOpts)
      canvasEl.removeEventListener('pointermove', onPointerMove, captureOpts)
      canvasEl.removeEventListener('pointerup', releasePen, captureOpts)
      canvasEl.removeEventListener('pointercancel', releasePen, captureOpts)
      setPenDown(false)
      activeStickyId = null
    }
  }, [canvasMount, canvasRef, transformRef, onPenStateChange, penMenuBridgeRef])
}
