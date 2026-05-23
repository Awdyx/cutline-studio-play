import { useState, type RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import CanvasItemShell from './CanvasItemShell'
import { MEDIA_SATURATE, type VideoCanvasItem } from './types'

export default function VideoItem({
  item,
  transformRef,
  onItemResizeStateChange,
  liftZIndex,
}: {
  item: VideoCanvasItem
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>
  onItemResizeStateChange?: (resizing: boolean) => void
  liftZIndex?: number
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <CanvasItemShell
      item={item}
      transformRef={transformRef}
      onItemResizeStateChange={onItemResizeStateChange}
      liftZIndex={liftZIndex}
    >
      <video
        src={item.src}
        autoPlay
        muted
        loop
        playsInline
        controls={hovered}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          display: 'block',
          borderRadius: 8,
          background: '#111',
          filter: `saturate(${MEDIA_SATURATE})`,
        }}
      />
    </CanvasItemShell>
  )
}
