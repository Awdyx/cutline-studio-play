import type { RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './canvasDimensions'
import { isCanvasCoordSane } from './penInput'

/**
 * Map screen coords to canvas space using the canvas node's laid-out box.
 * Works even when pan/zoom state is mid-animation (avoids stale transform state).
 */
export function clientToCanvasFromElement(
  clientX: number,
  clientY: number,
  canvasEl: HTMLElement,
): { x: number; y: number } | null {
  const rect = canvasEl.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null

  const x = ((clientX - rect.left) / rect.width) * canvasEl.offsetWidth
  const y = ((clientY - rect.top) / rect.height) * canvasEl.offsetHeight

  if (!isCanvasCoordSane(x, y, CANVAS_WIDTH, CANVAS_HEIGHT)) return null
  return { x, y }
}

export function clientToCanvas(
  clientX: number,
  clientY: number,
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>,
  canvasEl?: HTMLElement | null,
): { x: number; y: number } | null {
  if (canvasEl) {
    return clientToCanvasFromElement(clientX, clientY, canvasEl)
  }

  const ref = transformRef.current
  if (!ref) return null
  const wrapper = ref.instance.wrapperComponent
  if (!wrapper) return null

  const rect = wrapper.getBoundingClientRect()
  const { positionX, positionY, scale } = ref.state
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  const x = (localX - positionX) / scale
  const y = (localY - positionY) / scale

  if (!isCanvasCoordSane(x, y, CANVAS_WIDTH, CANVAS_HEIGHT)) return null
  return { x, y }
}
