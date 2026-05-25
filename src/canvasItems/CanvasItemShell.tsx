import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../drawing/canvasDimensions'
import { isItemFrozen } from '../canvasLock/layer'
import { useCanvasLockStore } from '../canvasLock/canvasLockStore'
import {
  useCanvasItemsStore,
  useItemIsSoleSelected,
  useItemSelected,
  useItemSelectionIndex,
  useItemZOrderPulse,
} from './canvasItemsStore'
import { useCanvasEditingAllowed } from '../canvasEdit/layer'
import { useIsPhoneLayout } from '../hooks/useLayoutProfile'
import { useCanvasEditStore } from '../canvasEdit/canvasEditStore'
import DragHandle from './DragHandle'
import ResizeHandle from './ResizeHandle'
import { Z_SELECTION_ABOVE_DIM } from './canvasZOrder'
import { getGrabHandlePlacement } from './grabZone'
import { useCanvasItemDrag } from './useCanvasItemDrag'
import { useCanvasItemResize } from './useCanvasItemResize'
import { useDeferredCanvasTap } from '../canvas/useDeferredCanvasTap'
import { shouldSkipItemSelectForOutsideDismiss } from '../canvas/canvasSelectionDismiss'
import type { CanvasItem } from './types'
import {
  STUDY_HUB_ASPECT,
} from './types'
import {
  studyHubMaxCanvasHeight,
  studyHubMaxCanvasWidth,
  studyHubMinCanvasHeight,
  studyHubMinCanvasWidth,
} from './studyHubBounds'
import {
  canvasItemDeleteExit,
  canvasItemDeleteExitTransition,
} from './canvasItemMotion'
import { card } from '../styles/tokens'

const liftSpring = { type: 'spring' as const, stiffness: 380, damping: 28, mass: 0.7 }

export default function CanvasItemShell({
  item,
  transformRef,
  onItemResizeStateChange,
  children,
}: {
  item: CanvasItem
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>
  onItemResizeStateChange?: (resizing: boolean) => void
  children: React.ReactNode
}) {
  const { isDragging, onGrabPointerDown } = useCanvasItemDrag(item.id)

  const { isResizing, snapBack, handlePointerDown: onResizeDown } = useCanvasItemResize(
    item.id,
    item.width,
    item.height,
    transformRef,
    onItemResizeStateChange,
    item.type === 'study_hub'
      ? {
          minWidth: studyHubMinCanvasWidth(),
          minHeight: studyHubMinCanvasHeight(),
          maxWidth: studyHubMaxCanvasWidth(),
          maxHeight: studyHubMaxCanvasHeight(),
          mode: 'center-uniform',
          aspectRatio: STUDY_HUB_ASPECT,
        }
      : undefined,
  )

  const isLocked = useCanvasLockStore((s) => s.isLocked)
  const isPhone = useIsPhoneLayout()
  const canvasEditEnabled = useCanvasEditStore((s) => s.enabled)
  const isStudyHub = item.type === 'study_hub'
  const editBlocked = isPhone && !canvasEditEnabled
  const moveBlocked = editBlocked
  const frozen = isItemFrozen(item, isLocked)
  const interactionFrozen = frozen || moveBlocked
  const isSelected = useItemSelected(item.id)
  const selectionIndex = useItemSelectionIndex(item.id)
  const isSoleSelected = useItemIsSoleSelected(item.id)
  const zOrderPulse = useItemZOrderPulse(item.id)
  const editingAllowed = useCanvasEditingAllowed()
  const zMenuSuppressedItemId = useCanvasItemsStore((s) => s.zMenuSuppressedItemId)
  const hideDragHandle =
    isSoleSelected && editingAllowed && zMenuSuppressedItemId !== item.id
  const [zPulseClass, setZPulseClass] = useState<string | null>(null)
  const lastZPulseNonce = useRef(0)

  useEffect(() => {
    if (!zOrderPulse) return
    if (zOrderPulse.nonce === lastZPulseNonce.current) return
    lastZPulseNonce.current = zOrderPulse.nonce
    setZPulseClass(
      zOrderPulse.dir === 'front'
        ? 'canvas-item-z-pulse-front'
        : 'canvas-item-z-pulse-back',
    )
    const timer = window.setTimeout(() => setZPulseClass(null), 360)
    return () => window.clearTimeout(timer)
  }, [zOrderPulse])
  const selectItem = useCanvasItemsStore((s) => s.selectItem)
  const itemTap = useDeferredCanvasTap((e) => {
    if (shouldSkipItemSelectForOutsideDismiss(item.id)) return
    selectItem(item.id, e.shiftKey)
  })
  const displayZIndex =
    selectionIndex >= 0 ? Z_SELECTION_ABOVE_DIM + selectionIndex : item.zIndex
  const isFlatItem =
    item.type === 'text' || item.type === 'image' || item.type === 'video'
  const lifted = isDragging || isResizing
  const clipContent = item.type === 'sticky' || item.type === 'study_hub'
  const grabHandlePlacement = useMemo(
    () =>
      getGrabHandlePlacement(
        item.x,
        item.y,
        item.width,
        item.height,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      ),
    [item.x, item.y, item.width, item.height],
  )

  const studyHubLayout =
    isStudyHub && !isResizing && !isDragging && !snapBack ? ('size' as const) : false
  const shellTransition =
    (isResizing || snapBack) && isStudyHub ? { duration: 0 } : liftSpring
  const liftShadow = '0 12px 40px rgba(20, 30, 50, 0.22)'
  const restShadow = '0 2px 10px rgba(20, 30, 50, 0.12)'
  const shellBoxShadow = isFlatItem
    ? 'none'
    : isStudyHub
      ? lifted && !isResizing
        ? liftShadow
        : 'none'
      : lifted && !isResizing
        ? liftShadow
        : restShadow

  return (
    <motion.div
      data-canvas-item={item.type}
      data-item-id={item.id}
      data-active={lifted || undefined}
      data-selected={isSelected || undefined}
      data-resizing={isResizing && isStudyHub ? true : undefined}
      data-dragging={isDragging && isStudyHub ? true : undefined}
      layout={studyHubLayout}
      exit={{
        ...canvasItemDeleteExit,
        transition: canvasItemDeleteExitTransition,
      }}
      animate={{
        scale: isFlatItem
          ? 1
          : lifted && !isResizing
            ? 1.03
            : 1,
        boxShadow: shellBoxShadow,
      }}
      transition={shellTransition}
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
        ...(isStudyHub ? { borderRadius: card.radius } : null),
      }}
    >
      {!interactionFrozen && (
        <div data-lock-flatten-skip>
          {!hideDragHandle && (
            <DragHandle
              placement={grabHandlePlacement}
              onPointerDown={onGrabPointerDown}
            />
          )}
          <ResizeHandle onPointerDown={onResizeDown} />
        </div>
      )}
      <div
        onPointerDown={(e) => {
          if (frozen || e.pointerType === 'pen') return
          if (e.target instanceof HTMLElement && e.target.closest('button')) return
          if (
            isSelected &&
            useCanvasItemsStore.getState().zMenuSuppressedItemId === item.id
          ) {
            useCanvasItemsStore.setState({ zMenuSuppressedItemId: null })
          }
          if (isSelected) {
            if (!moveBlocked) onGrabPointerDown(e)
            return
          }
          itemTap.onPointerDown(e)
        }}
        onPointerMove={itemTap.onPointerMove}
        onPointerUp={itemTap.onPointerUp}
        onPointerCancel={itemTap.onPointerCancel}
        className={[
          isSelected ? 'canvas-item-selected-focus' : null,
          zPulseClass,
        ]
          .filter(Boolean)
          .join(' ') || undefined}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius:
            item.type === 'sticky'
              ? 4
              : item.type === 'study_hub'
                ? card.radius
                : isFlatItem
                  ? 0
                  : 8,
          overflow: clipContent ? 'hidden' : 'visible',
          pointerEvents: 'auto',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}
