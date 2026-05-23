import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useCanvasItemsStore } from '../canvasItems/canvasItemsStore'
import { useStrokesStore } from '../drawing/strokesStore'
import { captureFlattenSegments } from './captureFlattenSegments'
import { useCanvasLockFlattenStore } from './canvasLockFlattenStore'
import { buildFlattenPlan, resolveGifImageIds } from './flattenPlan'
import { shouldFlattenCanvas } from './flattenVisibility'

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

export function useCanvasLockFlatten(
  canvasRef: RefObject<HTMLDivElement | null>,
  isLocked: boolean,
) {
  useEffect(() => {
    const lockActive = shouldFlattenCanvas(isLocked)
    const flattenStore = useCanvasLockFlattenStore.getState()

    if (!lockActive) {
      flattenStore.clear()
      return
    }

    let cancelled = false
    flattenStore.setCapturing(true)

    void (async () => {
      await waitForPaint()

      const canvasEl = canvasRef.current
      if (cancelled || !canvasEl) {
        if (!cancelled) useCanvasLockFlattenStore.getState().clear()
        return
      }

      const items = useCanvasItemsStore.getState().items
      const strokes = useStrokesStore.getState().strokes
      const gifImageIds = await resolveGifImageIds(items)
      if (cancelled) return

      const { segments: segmentPlans, live } = buildFlattenPlan(
        items,
        strokes.length > 0,
        gifImageIds,
      )

      const liveItemIds = new Set(live.map((entry) => entry.itemId))

      if (segmentPlans.length === 0) {
        useCanvasLockFlattenStore.getState().setFlattened([], gifImageIds)
        return
      }

      const segments = await captureFlattenSegments(canvasEl, segmentPlans, liveItemIds)
      if (cancelled) return

      if (segments.length === 0) {
        console.warn('[canvas-lock] flatten capture produced no segments; keeping live DOM')
        useCanvasLockFlattenStore.getState().clear()
        return
      }

      useCanvasLockFlattenStore.getState().setFlattened(segments, gifImageIds)
    })()

    return () => {
      cancelled = true
    }
  }, [canvasRef, isLocked])
}
