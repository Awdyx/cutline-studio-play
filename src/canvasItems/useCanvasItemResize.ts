import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import {
  startItemResizeSound,
  stopItemResizeSound,
  updateItemResizeSound,
} from '../sound/itemResizeSound'
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
  const detachRef = useRef<(() => void) | null>(null)
  const resizeRef = useRef({
    pointerId: -1,
    startClientX: 0,
    startClientY: 0,
    startWidth: 0,
    startHeight: 0,
  })

  const setResizing = useCallback(
    (resizing: boolean) => {
      setIsResizing(resizing)
      onResizeStateChange?.(resizing)
    },
    [onResizeStateChange],
  )

  useEffect(
    () => () => {
      detachRef.current?.()
      detachRef.current = null
      if (activeRef.current) {
        activeRef.current = false
        stopItemResizeSound()
      }
    },
    [],
  )

  const finishResize = useCallback(() => {
    detachRef.current?.()
    detachRef.current = null
    if (!activeRef.current) return
    activeRef.current = false
    resizeRef.current.pointerId = -1
    stopItemResizeSound()
    setResizing(false)
  }, [setResizing])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'pen') return
      if (event.pointerType === 'mouse' && event.button !== 0) return

      detachRef.current?.()
      detachRef.current = null

      resizeRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startWidth: width,
        startHeight: height,
      }

      useCanvasItemsStore.getState().beginItemResize(itemId)
      activeRef.current = true
      setResizing(true)
      startItemResizeSound(event.clientX, event.clientY)

      event.preventDefault()
      event.stopPropagation()

      const pointerId = event.pointerId

      const onPointerMove = (e: PointerEvent) => {
        if (!activeRef.current || e.pointerId !== pointerId) return
        if (e.cancelable) e.preventDefault()

        updateItemResizeSound(e.clientX, e.clientY)

        const ref = transformRef.current
        if (!ref) return
        const scale = ref.state.scale

        const dx = (e.clientX - resizeRef.current.startClientX) / scale
        const dy = (e.clientY - resizeRef.current.startClientY) / scale

        const nextWidth = Math.max(
          MIN_ITEM_WIDTH,
          resizeRef.current.startWidth + dx,
        )
        const nextHeight = Math.max(
          MIN_ITEM_HEIGHT,
          resizeRef.current.startHeight + dy,
        )

        useCanvasItemsStore.getState().updateItemSize(itemId, nextWidth, nextHeight)
      }

      const onPointerEnd = (e: PointerEvent) => {
        if (!activeRef.current || e.pointerId !== pointerId) return
        finishResize()
      }

      document.addEventListener('pointermove', onPointerMove, { capture: true })
      document.addEventListener('pointerup', onPointerEnd, { capture: true })
      document.addEventListener('pointercancel', onPointerEnd, { capture: true })

      detachRef.current = () => {
        document.removeEventListener('pointermove', onPointerMove, true)
        document.removeEventListener('pointerup', onPointerEnd, true)
        document.removeEventListener('pointercancel', onPointerEnd, true)
      }
    },
    [finishResize, height, itemId, setResizing, transformRef, width],
  )

  return {
    isResizing,
    handlePointerDown,
  }
}
