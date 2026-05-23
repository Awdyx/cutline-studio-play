import type { RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import CanvasItemShell from './CanvasItemShell'
import { MEDIA_SATURATE, type ImageCanvasItem } from './types'

export default function ImageItem({
  item,
  transformRef,
  onItemResizeStateChange,
  liftZIndex,
}: {
  item: ImageCanvasItem
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>
  onItemResizeStateChange?: (resizing: boolean) => void
  liftZIndex?: number
}) {
  return (
    <CanvasItemShell
      item={item}
      transformRef={transformRef}
      onItemResizeStateChange={onItemResizeStateChange}
      liftZIndex={liftZIndex}
    >
      <img
        src={item.src}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          display: 'block',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.6)',
          filter: `saturate(${MEDIA_SATURATE})`,
        }}
      />
    </CanvasItemShell>
  )
}
