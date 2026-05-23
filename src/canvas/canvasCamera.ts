import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../drawing/canvasDimensions'
import type { SpaceCamera } from '../spaces/types'

/** Persisted when the user has never panned/zoomed the main canvas. */
export const UNINITIALIZED_MAIN_CAMERA: SpaceCamera = {
  positionX: 0,
  positionY: 0,
  scale: 1,
}

export function isUninitializedMainCamera(
  camera: SpaceCamera | null | undefined,
): boolean {
  if (!camera) return true
  return (
    camera.positionX === UNINITIALIZED_MAIN_CAMERA.positionX &&
    camera.positionY === UNINITIALIZED_MAIN_CAMERA.positionY &&
    camera.scale === UNINITIALIZED_MAIN_CAMERA.scale
  )
}

type PanBounds = {
  minPositionX: number
  maxPositionX: number
  minPositionY: number
  maxPositionY: number
  scaleWidthFactor: number
  scaleHeightFactor: number
}

/** Mirrors react-zoom-pan-pinch bounds with disablePadding + centerZoomedOut=false. */
export function boundsForCanvas(
  wrapperWidth: number,
  wrapperHeight: number,
  scale: number,
): PanBounds {
  const newContentWidth = CANVAS_WIDTH * scale
  const newContentHeight = CANVAS_HEIGHT * scale
  const newDiffWidth = wrapperWidth - newContentWidth
  const newDiffHeight = wrapperHeight - newContentHeight

  const scaleWidthFactor =
    wrapperWidth > newContentWidth ? newDiffWidth : 0
  const scaleHeightFactor =
    wrapperHeight > newContentHeight ? newDiffHeight : 0

  let minPositionX = wrapperWidth - newContentWidth - scaleWidthFactor
  let maxPositionX = scaleWidthFactor
  let minPositionY = wrapperHeight - newContentHeight - scaleHeightFactor
  let maxPositionY = scaleHeightFactor

  const contentFitsCompletely =
    wrapperWidth >= newContentWidth && wrapperHeight >= newContentHeight

  if (contentFitsCompletely) {
    minPositionX = 0
    maxPositionX = 0
    minPositionY = 0
    maxPositionY = 0
  }

  return {
    minPositionX,
    maxPositionX,
    minPositionY,
    maxPositionY,
    scaleWidthFactor,
    scaleHeightFactor,
  }
}

function clampToBounds(
  positionX: number,
  positionY: number,
  bounds: PanBounds,
): { positionX: number; positionY: number } {
  return {
    positionX: Math.max(
      bounds.minPositionX,
      Math.min(bounds.maxPositionX, positionX),
    ),
    positionY: Math.max(
      bounds.minPositionY,
      Math.min(bounds.maxPositionY, positionY),
    ),
  }
}

/** Read the camera from laid-out DOM (matches what the user sees). */
export function readCameraFromRef(
  ref: ReactZoomPanPinchContentRef | null,
): SpaceCamera | null {
  if (!ref) return null
  const wrapper = ref.instance.wrapperComponent
  const content = ref.instance.contentComponent
  if (!wrapper || !content) {
    const { positionX, positionY, scale } = ref.state
    return { positionX, positionY, scale }
  }

  const wrapRect = wrapper.getBoundingClientRect()
  const contentRect = content.getBoundingClientRect()
  const scale =
    content.offsetWidth > 0
      ? contentRect.width / content.offsetWidth
      : ref.state.scale

  return {
    positionX: contentRect.left - wrapRect.left,
    positionY: contentRect.top - wrapRect.top,
    scale,
  }
}

/**
 * Apply pan/zoom and clamp to canvas bounds. Recalculates library bounds
 * so limitToBounds stays correct (setTransform alone skips this).
 */
export function applyCameraToRef(
  ref: ReactZoomPanPinchContentRef | null,
  camera: SpaceCamera,
  options?: { centerIfUninitialized?: boolean },
): void {
  if (!ref) return
  const wrapper = ref.instance.wrapperComponent
  if (!wrapper) return

  if (options?.centerIfUninitialized && isUninitializedMainCamera(camera)) {
    ref.centerView(1, 0)
    const bounds = boundsForCanvas(
      wrapper.offsetWidth,
      wrapper.offsetHeight,
      ref.state.scale,
    )
    ref.instance.bounds = bounds
    return
  }

  const bounds = boundsForCanvas(
    wrapper.offsetWidth,
    wrapper.offsetHeight,
    camera.scale,
  )
  const clamped = clampToBounds(camera.positionX, camera.positionY, bounds)

  ref.setTransform(clamped.positionX, clamped.positionY, camera.scale, 0)
  ref.instance.bounds = bounds
}

/** Pan the viewport so the item's center sits in the wrapper center. */
export function focusItemOnCanvas(
  ref: ReactZoomPanPinchContentRef | null,
  item: { x: number; y: number; width: number; height: number },
  options?: { animationMs?: number; scale?: number },
): void {
  if (!ref) return
  const wrapper = ref.instance.wrapperComponent
  if (!wrapper) return

  const scale = options?.scale ?? ref.state.scale
  const cx = item.x + item.width / 2
  const cy = item.y + item.height / 2
  const ww = wrapper.offsetWidth
  const wh = wrapper.offsetHeight
  const positionX = ww / 2 - cx * scale
  const positionY = wh / 2 - cy * scale

  const bounds = boundsForCanvas(ww, wh, scale)
  const clamped = clampToBounds(positionX, positionY, bounds)
  const animationMs = options?.animationMs ?? 420

  ref.setTransform(clamped.positionX, clamped.positionY, scale, animationMs)
  ref.instance.bounds = bounds
}
