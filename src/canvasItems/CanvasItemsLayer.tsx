import { useMemo, type RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import {
  isAboveStrokes,
  isAnnotationItem,
  isBelowStrokes,
  Z_SELECTION_ABOVE_DIM,
} from './canvasZOrder'
import { useCanvasItemsStore } from './canvasItemsStore'
import ImageItem from './ImageItem'
import StickyNote from './StickyNote'
import TextItem from './TextItem'
import VideoItem from './VideoItem'
import SpaceItem from './SpaceItem'

export default function CanvasItemsLayer({
  transformRef,
  onItemResizeStateChange,
  plane,
}: {
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>
  onItemResizeStateChange?: (resizing: boolean) => void
  plane: 'below' | 'above' | 'annotation'
}) {
  const items = useCanvasItemsStore((s) => s.items)
  const selectedIds = useCanvasItemsStore((s) => s.selectedIds)
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const sorted = useMemo(() => {
    const filtered =
      plane === 'below'
        ? items.filter((i) => !isAnnotationItem(i) && isBelowStrokes(i.zIndex))
        : plane === 'above'
          ? items.filter((i) => !isAnnotationItem(i) && isAboveStrokes(i.zIndex))
          : items.filter(isAnnotationItem)
    return [...filtered].sort((a, b) => a.zIndex - b.zIndex)
  }, [items, plane, selectedSet])

  if (sorted.length === 0) return null

  const ariaLabel =
    plane === 'below'
      ? 'Canvas items below drawing'
      : plane === 'above'
        ? 'Canvas items above drawing'
        : 'Temporary canvas annotations'

  return (
    <div
      aria-label={ariaLabel}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {sorted.map((item) => {
        const selectedIndex = selectedIds.indexOf(item.id)
        const liftZIndex =
          selectedIndex >= 0 ? Z_SELECTION_ABOVE_DIM + selectedIndex : undefined
        const shellProps = {
          transformRef,
          onItemResizeStateChange,
          liftZIndex,
        }
        if (item.type === 'sticky') {
          return <StickyNote key={item.id} item={item} {...shellProps} />
        }
        if (item.type === 'text') {
          return <TextItem key={item.id} item={item} {...shellProps} />
        }
        if (item.type === 'image') {
          return <ImageItem key={item.id} item={item} {...shellProps} />
        }
        if (item.type === 'space') {
          return (
            <SpaceItem
              key={item.id}
              item={item}
              transformRef={transformRef}
              liftZIndex={liftZIndex}
            />
          )
        }
        return <VideoItem key={item.id} item={item} {...shellProps} />
      })}
    </div>
  )
}
