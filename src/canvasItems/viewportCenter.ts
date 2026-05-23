import type { RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { clientToCanvas } from '../drawing/canvasCoords'

export function viewportCenterCanvas(
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>,
  canvasEl?: HTMLElement | null,
): { x: number; y: number } | null {
  if (canvasEl) {
    const rect = canvasEl.getBoundingClientRect()
    return clientToCanvas(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      transformRef,
      canvasEl,
    )
  }

  const ref = transformRef.current
  const wrapper = ref?.instance.wrapperComponent
  if (!wrapper) return null

  const rect = wrapper.getBoundingClientRect()
  return clientToCanvas(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
    transformRef,
  )
}
