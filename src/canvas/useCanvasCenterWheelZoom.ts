import { useEffect, useRef, type RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import {
  applyViewportCenterWheelZoom,
  CANVAS_WHEEL_ZOOM_STEP,
} from './canvasCamera'
import { CANVAS_PAN_SESSION_GAP_MS } from './studyHubPanScroll'
import { useCanvasWorkspaceStore } from '../spaces/canvasWorkspaceStore'

function isModifierWheelZoom(event: WheelEvent): boolean {
  return event.ctrlKey || event.metaKey
}

function isExcludedWheelTarget(
  target: EventTarget | null,
  excludedClasses: string[],
): boolean {
  if (!(target instanceof Element)) return false
  return excludedClasses.some((cls) => target.closest(`.${cls}`) != null)
}

/** Trackpad pinch / modifier wheel zoom anchored to the viewport center. */
export function useCanvasCenterWheelZoom({
  transformRef,
  viewportRef,
  panExcluded,
  onZoom,
  onZoomStop,
  disabled = false,
  step = CANVAS_WHEEL_ZOOM_STEP,
}: {
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>
  viewportRef: RefObject<HTMLElement | null>
  panExcluded: string[]
  onZoom: (ref: ReactZoomPanPinchContentRef) => void
  onZoomStop: (ref: ReactZoomPanPinchContentRef) => void
  disabled?: boolean
  step?: number
}) {
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || disabled) return

    function onWheel(event: WheelEvent) {
      if (!isModifierWheelZoom(event)) return
      if (isExcludedWheelTarget(event.target, panExcluded)) return

      const ref = transformRef.current
      if (!ref || ref.instance.setup.disabled || ref.instance.setup.wheel.disabled) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (!applyViewportCenterWheelZoom(ref, event.deltaY, step)) return

      onZoom(ref)
      useCanvasWorkspaceStore.getState().syncMainCamera(ref)

      if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
      stopTimerRef.current = setTimeout(() => {
        stopTimerRef.current = null
        const live = transformRef.current
        if (live) onZoomStop(live)
      }, CANVAS_PAN_SESSION_GAP_MS)
    }

    viewport.addEventListener('wheel', onWheel, { passive: false, capture: true })
    return () => {
      viewport.removeEventListener('wheel', onWheel, { capture: true })
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current)
        stopTimerRef.current = null
      }
    }
  }, [transformRef, viewportRef, panExcluded, onZoom, onZoomStop, disabled, step])
}
