import StickyStrokesSvg from './StickyStrokesSvg'
import type { StickyCanvasItem } from './types'

export default function StickyAnnotationOverlay({ item }: { item: StickyCanvasItem }) {
  return (
    <div
      data-canvas-item="sticky"
      data-item-id={item.id}
      data-lock-sticky-annotation
      aria-hidden
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        zIndex: item.zIndex,
        pointerEvents: 'none',
      }}
    >
      <StickyStrokesSvg
        stickyId={item.id}
        strokes={[]}
        annotationStrokes={item.annotationStrokes ?? []}
        width={item.width}
        height={item.height}
      />
    </div>
  )
}
