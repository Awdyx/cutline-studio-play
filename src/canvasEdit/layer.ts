import { isPhoneLayout } from '../platform/layoutProfile'
import { useCanvasEditStore } from './canvasEditStore'

/** Phone-only gate — desktop always allows canvas editing. */
export function canvasEditingAllowed(): boolean {
  if (!isPhoneLayout()) return true
  return useCanvasEditStore.getState().enabled
}

/** Reactive canvas-edit gate for React components. */
export function useCanvasEditingAllowed(): boolean {
  const enabled = useCanvasEditStore((s) => s.enabled)
  if (!isPhoneLayout()) return true
  return enabled
}
