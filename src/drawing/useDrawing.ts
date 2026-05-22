import { useEffect, type RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './canvasDimensions'
import { isCanvasCoordSane, isStylusTouch } from './penInput'
import type { PenToolMenuBridge } from './usePenToolMenu'
import { useStrokesStore } from './strokesStore'
import { useToolStore } from './toolStore'
import type { StrokePoint } from './types'
const captureOpts = { capture: true } as const
const ERASE_THROTTLE_MS = 16

function readPressure(pressure: number): number {
  return pressure > 0 ? pressure : 0.5
}

function clientToCanvas(
  clientX: number,
  clientY: number,
  wrapperEl: HTMLElement,
  positionX: number,
  positionY: number,
  scale: number,
): { x: number; y: number } {
  const rect = wrapperEl.getBoundingClientRect()
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  return {
    x: (localX - positionX) / scale,
    y: (localY - positionY) / scale,
  }
}

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

    const { startStroke, addPoint, endStroke, beginDragErase, applyDragErase } =
      useStrokesStore.getState()

    let pointerPenActive = false
    let eraseActive = false
    let lastEraseAt = 0

    function setPenDown(down: boolean) {
      onPenStateChange?.(down)
    }

    function penMenu(): PenToolMenuBridge | null {
      return penMenuBridgeRef?.current ?? null
    }

    function getTransform() {
      const ref = transformRef.current
      if (!ref) return null
      const wrapper = ref.instance.wrapperComponent
      if (!wrapper) return null
      const { positionX, positionY, scale } = ref.state
      return { wrapper, positionX, positionY, scale }
    }

    function toCanvasCoords(event: PointerEvent): { x: number; y: number } | null {
      const transform = getTransform()
      if (!transform) return null

      const { x, y } = clientToCanvas(
        event.clientX,
        event.clientY,
        transform.wrapper,
        transform.positionX,
        transform.positionY,
        transform.scale,
      )

      if (!isCanvasCoordSane(x, y, CANVAS_WIDTH, CANVAS_HEIGHT)) return null
      return { x, y }
    }

    function toStrokePoint(event: PointerEvent): StrokePoint | null {
      const coords = toCanvasCoords(event)
      if (!coords) return null
      return { ...coords, pressure: readPressure(event.pressure) }
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
      const point = toStrokePoint(event)
      if (!point) return

      if (mode === 'pen') {
        startStroke(point, {
          color: tools.penColor,
          size: tools.penSize,
          tool: 'pen',
        })
      } else if (mode === 'highlighter') {
        startStroke(point, {
          color: tools.highlighterColor,
          size: tools.highlighterSize,
          tool: 'highlighter',
        })
      }
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

      const activeStroke = useStrokesStore.getState().activeStroke
      if (!activeStroke) return

      event.preventDefault()
      if (event.pressure < 0.05) return

      const point = toStrokePoint(event)
      if (point) addPoint(point)
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
        return
      }

      const mode = useToolStore.getState().mode

      if (mode === 'erase') {
        eraseActive = false
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

    return () => {
      canvasEl.removeEventListener('touchstart', onTouchStart, captureOpts)
      canvasEl.removeEventListener('touchend', onTouchEnd, captureOpts)
      canvasEl.removeEventListener('touchcancel', onTouchEnd, captureOpts)
      canvasEl.removeEventListener('pointerdown', onPointerDown, captureOpts)
      canvasEl.removeEventListener('pointermove', onPointerMove, captureOpts)
      canvasEl.removeEventListener('pointerup', releasePen, captureOpts)
      canvasEl.removeEventListener('pointercancel', releasePen, captureOpts)
      setPenDown(false)
    }
  }, [canvasMount, canvasRef, transformRef, onPenStateChange, penMenuBridgeRef])
}
