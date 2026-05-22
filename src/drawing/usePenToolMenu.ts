import { useEffect, useRef, useState, type RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { clientToCanvas } from './canvasCoords'
import { isPenInput } from './penInput'
import { hitTestPenToolPill } from './penToolMenuLayout'
import { useStrokesStore } from './strokesStore'
import { useToolStore, type ToolMode } from './toolStore'

/** Hold this long with no UI — pill swoops in once threshold is met. */
export const HOLD_MS = 400
const MOVE_CANCEL_PX = 20
const MOVE_GRACE_MS = 80

export type PenToolMenuPhase = 'idle' | 'open'

export type PenToolMenuState = {
  phase: PenToolMenuPhase
  /** Pencil anchor in viewport (client) coordinates. */
  anchorX: number
  anchorY: number
  hoveredTool: ToolMode | null
}

const idleUi: PenToolMenuState = {
  phase: 'idle',
  anchorX: 0,
  anchorY: 0,
  hoveredTool: null,
}

type InternalPhase = 'idle' | 'pending' | 'open'

export type PenToolMenuBridge = {
  isActive: () => boolean
  onPointerDown: (e: PointerEvent) => boolean
  onPointerMove: (e: PointerEvent) => boolean
  onPointerUp: (e: PointerEvent) => boolean
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1)
}

export function usePenToolMenu(
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>,
): {
  state: PenToolMenuState
  bridgeRef: RefObject<PenToolMenuBridge>
} {
  const [state, setState] = useState<PenToolMenuState>(idleUi)

  const phaseRef = useRef<InternalPhase>('idle')
  const pointerIdRef = useRef<number | null>(null)
  const anchorRef = useRef({ x: 0, y: 0 })
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const graceUntilRef = useRef(0)
  const bridgeRef = useRef<PenToolMenuBridge>(null!)

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const resetToIdle = () => {
    clearHoldTimer()
    pointerIdRef.current = null
    phaseRef.current = 'idle'
    setState(idleUi)
  }

  const openMenu = () => {
    const { cancelActiveStroke, cancelEraseSession } = useStrokesStore.getState()
    cancelActiveStroke()
    cancelEraseSession()
    phaseRef.current = 'open'
    const { x, y } = anchorRef.current
    setState({
      phase: 'open',
      anchorX: x,
      anchorY: y,
      hoveredTool: null,
    })
  }

  const startPending = (clientX: number, clientY: number) => {
    clearHoldTimer()
    anchorRef.current = { x: clientX, y: clientY }
    graceUntilRef.current = performance.now() + MOVE_GRACE_MS
    phaseRef.current = 'pending'

    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null
      if (phaseRef.current === 'pending') openMenu()
    }, HOLD_MS)
  }

  const cancelPending = () => {
    if (phaseRef.current !== 'pending') return
    clearHoldTimer()
    phaseRef.current = 'idle'
  }

  const cancelHold = () => {
    cancelPending()
  }

  const checkDrift = (clientX: number, clientY: number) => {
    if (performance.now() < graceUntilRef.current) return
    const o = anchorRef.current
    if (dist(clientX, clientY, o.x, o.y) <= MOVE_CANCEL_PX) return
    if (phaseRef.current === 'pending') cancelPending()
  }

  bridgeRef.current = {
    isActive: () => phaseRef.current === 'pending' || phaseRef.current === 'open',

    onPointerDown(e) {
      if (!isPenInput(e)) return false
      if (phaseRef.current === 'open') return true
      if (pointerIdRef.current !== null) return false

      const canvas = clientToCanvas(e.clientX, e.clientY, transformRef)
      if (!canvas) return false

      pointerIdRef.current = e.pointerId
      startPending(e.clientX, e.clientY)
      return false
    },

    onPointerMove(e) {
      if (!isPenInput(e)) return false
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) {
        return false
      }

      if (phaseRef.current === 'open') {
        const { x, y } = anchorRef.current
        const hovered = hitTestPenToolPill(e.clientX, e.clientY, x, y)
        setState((prev) =>
          prev.hoveredTool === hovered ? prev : { ...prev, hoveredTool: hovered },
        )
        return true
      }

      if (phaseRef.current === 'pending') {
        checkDrift(e.clientX, e.clientY)
      }

      return false
    },

    onPointerUp(e) {
      if (!isPenInput(e)) return false
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) {
        return false
      }

      clearHoldTimer()

      if (phaseRef.current === 'open') {
        const { x, y } = anchorRef.current
        const hovered = hitTestPenToolPill(e.clientX, e.clientY, x, y)
        if (hovered) {
          useToolStore.getState().setMode(hovered)
        }
        resetToIdle()
        return true
      }

      cancelHold()
      pointerIdRef.current = null
      return false
    },
  }

  useEffect(() => {
    function onHide() {
      if (document.visibilityState === 'hidden') resetToIdle()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      resetToIdle()
    }
  }, [])

  return { state, bridgeRef }
}
