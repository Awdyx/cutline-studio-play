import { create } from 'zustand'

const MAX_VELOCITY = 25

interface PanMotionState {
  vx: number
  vy: number
  intensity: number
  active: boolean
  setPanVelocity: (dx: number, dy: number) => void
  setPanStopped: () => void
}

export const usePanMotionStore = create<PanMotionState>((set) => ({
  vx: 0,
  vy: 0,
  intensity: 0,
  active: false,

  setPanVelocity: (dx, dy) => {
    const magnitude = Math.sqrt(dx * dx + dy * dy)
    const intensity = Math.min(magnitude / MAX_VELOCITY, 1)
    set({
      vx: dx,
      vy: dy,
      intensity,
      active: magnitude > 0,
    })
  },

  setPanStopped: () => {
    set({ active: false, intensity: 0 })
  },
}))

export { MAX_VELOCITY }
