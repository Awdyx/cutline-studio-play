import { create } from 'zustand'
import {
  EMPTY_EDGE_STRENGTHS,
  MAX_VELOCITY,
  type EdgeStrengths,
} from './canvasPanVignette'

interface PanMotionState {
  vx: number
  vy: number
  intensity: number
  active: boolean
  edges: EdgeStrengths
  zoomEdgeStrength: number
  setPanFrame: (vx: number, vy: number, edges: EdgeStrengths) => void
  setEdges: (edges: EdgeStrengths) => void
  setZoomEdgeStrength: (strength: number) => void
  setPanStopped: () => void
}

export const usePanMotionStore = create<PanMotionState>((set) => ({
  vx: 0,
  vy: 0,
  intensity: 0,
  active: false,
  edges: EMPTY_EDGE_STRENGTHS,
  zoomEdgeStrength: 0,

  setPanFrame: (vx, vy, edges) => {
    const magnitude = Math.sqrt(vx * vx + vy * vy)
    const intensity = Math.min(magnitude / MAX_VELOCITY, 1)
    set({
      vx,
      vy,
      edges,
      intensity,
      active: magnitude > 0,
    })
  },

  setEdges: (edges) => {
    set({ edges })
  },

  setZoomEdgeStrength: (strength) => {
    set({ zoomEdgeStrength: strength })
  },

  setPanStopped: () => {
    set({ active: false, intensity: 0, vx: 0, vy: 0 })
  },
}))

export { MAX_VELOCITY } from './canvasPanVignette'
