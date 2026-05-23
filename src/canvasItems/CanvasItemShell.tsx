import { motion } from 'framer-motion'
import type { RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { isItemFrozen } from '../canvasLock/layer'
import { useCanvasLockStore } from '../canvasLock/canvasLockStore'
import { useCanvasItemsStore } from './canvasItemsStore'
import DragHandle from './DragHandle'
import ResizeHandle from './ResizeHandle'
import { useCanvasItemDrag } from './useCanvasItemDrag'
import { useCanvasItemResize } from './useCanvasItemResize'
import { useDeferredCanvasTap } from '../canvas/useDeferredCanvasTap'
import type { CanvasItem } from './types'

const liftSpring = { type: 'spring' as const, stiffness: 380, damping: 28, mass: 0.7 }

export default function CanvasItemShell({
  item,
  transformRef,
  onItemResizeStateChange,
  liftZIndex,
  children,
}: {
  item: CanvasItem
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>
  onItemResizeStateChange?: (resizing: boolean) => void
  /** When set, item is raised above the selection blur overlay. */
  liftZIndex?: number
  children: React.ReactNode
}) {
  const { isDragging, onGrabPointerDown } = useCanvasItemDrag(item.id)

  const { isResizing, handlePointerDown: onResizeDown } = useCanvasItemResize(
    item.id,
    item.width,
    item.height,
    transformRef,
    onItemResizeStateChange,
  )

  const isLocked = useCanvasLockStore((s) => s.isLocked)
  const frozen = isItemFrozen(item, isLocked)
  const selectedIds = useCanvasItemsStore((s) => s.selectedIds)
  const isSelected = liftZIndex != null || selectedIds.includes(item.id)
  const selectItem = useCanvasItemsStore((s) => s.selectItem)
  const itemTap = useDeferredCanvasTap((e) => {
    selectItem(item.id, e.shiftKey)
  })
  const displayZIndex = liftZIndex ?? item.zIndex
  const isTextItem = item.type === 'text'
  const lifted = isDragging || isResizing
  const clipContent = item.type === 'sticky' || item.type === 'text'

  return (
    <motion.div
      data-canvas-item={item.type}
      data-item-id={item.id}
      data-active={lifted || undefined}
      data-selected={isSelected || undefined}
      animate={{
        scale: isTextItem ? 1 : lifted ? 1.03 : 1,
        boxShadow: isTextItem
          ? 'none'
          : lifted
            ? '0 12px 40px rgba(20, 30, 50, 0.22)'
            : '0 2px 10px rgba(20, 30, 50, 0.12)',
      }}
      transition={liftSpring}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        zIndex: displayZIndex,
        transformOrigin: 'top left',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {!frozen && (
        <>
          <DragHandle onPointerDown={onGrabPointerDown} />
          <ResizeHandle onPointerDown={onResizeDown} />
        </>
      )}
      <div
        onPointerDown={(e) => {
          if (frozen || e.pointerType === 'pen') return
          if (e.target instanceof HTMLElement && e.target.closest('button')) return
          itemTap.onPointerDown(e)
        }}
        onPointerMove={itemTap.onPointerMove}
        onPointerUp={itemTap.onPointerUp}
        onPointerCancel={itemTap.onPointerCancel}
        className={isSelected ? 'canvas-item-selected-focus' : undefined}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: item.type === 'sticky' ? 4 : item.type === 'text' ? 0 : 8,
          overflow: clipContent ? 'hidden' : 'visible',
          pointerEvents: 'auto',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}
