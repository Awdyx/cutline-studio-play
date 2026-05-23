import { useCallback } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { attachCanvasItemDragPointerDown } from './canvasItemDrag'
import { useCanvasItemDragStore } from './canvasItemDragStore'

export function useCanvasItemDrag(
  itemId: string,
  options?: { suppressClickMenu?: boolean },
) {
  const activeItemId = useCanvasItemDragStore((s) => s.activeItemId)
  const isDragging = activeItemId === itemId

  const onGrabPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      attachCanvasItemDragPointerDown(itemId, event, options)
    },
    [itemId, options?.suppressClickMenu],
  )

  return { isDragging, onGrabPointerDown }
}
