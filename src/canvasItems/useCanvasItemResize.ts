import { useCallback, useRef, useState, type RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { useWindowPointerSession } from '../canvas/useWindowPointerSession'
import { MIN_ITEM_HEIGHT, MIN_ITEM_WIDTH } from './grabZone'
import { useCanvasItemsStore } from './canvasItemsStore'

export function useCanvasItemResize(
  itemId: string,
  width: number,
  height: number,
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>,
  onResizeStateChange?: (resizing: boolean) => void,
) {
  const [isResizing, setIsResizing] = useState(false)
  const activeRef = useRef(false)
  const resizeRef = useRef({
    pointerId: -1,
    startClientX: 0,
    startClientY: 0,
    startWidth: 0,
    startHeight: 0,
  })
  const { startSession } = useWindowPointerSession<HTMLButtonElement>()

  const setResizing = useCallback(
    (resizing: boolean) => {
      setIsResizing(resizing)
      onResizeStateChange?.(resizing)
    },
    [onResizeStateChange],
  )

  const finishResize = useCallback(() => {
    if (!activeRef.current) return
    activeRef.current = false
    resizeRef.current.pointerId = -1
    setResizing(false)
  }, [setResizing])

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'pen') return

      resizeRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startWidth: width,
        startHeight: height,
      }

      useCanvasItemsStore.getState().beginItemResize(itemId)
      useCanvasItemsStore.getState().closeZMenu()
      activeRef.current = true
      setResizing(true)

      startSession(
        event,
        {
          onMove: (clientX, clientY) => {
            if (!activeRef.current) return

            const ref = transformRef.current
            if (!ref) return
            const scale = ref.state.scale

            const dx = (clientX - resizeRef.current.startClientX) / scale
            const dy = (clientY - resizeRef.current.startClientY) / scale

            const nextWidth = Math.max(MIN_ITEM_WIDTH, resizeRef.current.startWidth + dx)
            const nextHeight = Math.max(MIN_ITEM_HEIGHT, resizeRef.current.startHeight + dy)

            useCanvasItemsStore.getState().updateItemSize(itemId, nextWidth, nextHeight)
          },
          onEnd: () => {
            finishResize()
          },
        },
        { allowPointerType: (type) => type !== 'pen' },
      )
    },
    [finishResize, height, itemId, setResizing, startSession, transformRef, width],
  )

  return {
    isResizing,
    handlePointerDown,
  }
}
