import type { RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './canvasDimensions'
import { isCanvasCoordSane } from './penInput'

export function clientToCanvas(
  clientX: number,
  clientY: number,
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>,
): { x: number; y: number } | null {
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
