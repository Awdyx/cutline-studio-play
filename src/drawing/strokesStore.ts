import { create } from 'zustand'
import { ERASE_HIT_RADIUS, hitTestStroke } from './eraseUtils'
import { loadStrokesFromStorage, scheduleSaveStrokes } from './strokesPersistence'
import { strokeToSvgPath } from './strokePath'
import { generateStrokeId } from './strokeId'
import type { DrawTool, Stroke, StrokePoint } from './types'

const HISTORY_CAP = 50

function pushPast(past: Stroke[][], snapshot: Stroke[]): Stroke[][] {
  const next = [...past, snapshot]
  if (next.length > HISTORY_CAP) return next.slice(-HISTORY_CAP)
  return next
}

type StrokeConfig = {
  color: string
  size: number
  tool: DrawTool
}

type StrokesState = {
  strokes: Stroke[]
  activeStroke: Stroke | null
  past: Stroke[][]
  future: Stroke[][]
  startStroke: (point: StrokePoint, config: StrokeConfig) => void
  addPoint: (point: StrokePoint) => void
  endStroke: () => void
  cancelActiveStroke: () => void
  cancelEraseSession: () => void
  beginDragErase: () => void
  applyDragErase: (pos: { x: number; y: number }) => void
  undo: () => void
  redo: () => void
  clearAll: () => void
  hydrate: () => void
}

function createStroke(point: StrokePoint, config: StrokeConfig): Stroke {
  return {
    id: generateStrokeId(),
    points: [point],
    color: config.color,
    size: config.size,
    tool: config.tool,
  }
}

let persistEnabled = false

export const useStrokesStore = create<StrokesState>((set, get) => ({
  strokes: [],
  activeStroke: null,
  past: [],
  future: [],

  hydrate: () => {
    const strokes = loadStrokesFromStorage()
    set({ strokes })
    persistEnabled = true
  },

  startStroke: (point, config) => {
    set({ activeStroke: createStroke(point, config) })
  },

  addPoint: (point) => {
    const { activeStroke } = get()
    if (!activeStroke) return
    set({
      activeStroke: {
        ...activeStroke,
        points: [...activeStroke.points, point],
      },
    })
  },

  cancelActiveStroke: () => {
    set({ activeStroke: null })
  },

  cancelEraseSession: () => {
    set((state) => {
      if (state.past.length === 0) return state
      const snapshot = state.past[state.past.length - 1]
      const unchanged =
        snapshot.length === state.strokes.length &&
        snapshot.every((s, i) => s.id === state.strokes[i]?.id)
      if (!unchanged) return state
      return { past: state.past.slice(0, -1) }
    })
  },

  endStroke: () => {
    set((state) => {
      const active = state.activeStroke
      if (!active) return state

      let points = [...active.points]
      while (points.length > 2 && points[points.length - 1].pressure < 0.15) {
        points.pop()
      }

      if (points.length < 3) {
        return { activeStroke: null }
      }

      const trimmed: Stroke = { ...active, points }
      const path = strokeToSvgPath(trimmed, true)
      const strokes = [...state.strokes, { ...trimmed, path }]

      if (persistEnabled) scheduleSaveStrokes(strokes)

      return {
        past: pushPast(state.past, state.strokes),
        future: [],
        strokes,
        activeStroke: null,
      }
    })
  },

  beginDragErase: () => {
    set((state) => ({
      past: pushPast(state.past, state.strokes),
      future: [],
    }))
  },

  applyDragErase: (pos) => {
    set((state) => {
      const strokes = state.strokes.filter(
        (stroke) =>
          !hitTestStroke(stroke, pos.x, pos.y, ERASE_HIT_RADIUS),
      )
      if (strokes.length === state.strokes.length) return state

      if (persistEnabled) scheduleSaveStrokes(strokes)
      return { strokes }
    })
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      const strokes = previous
      if (persistEnabled) scheduleSaveStrokes(strokes)
      return {
        past: state.past.slice(0, -1),
        future: [state.strokes, ...state.future],
        strokes,
        activeStroke: null,
      }
    })
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state
      const next = state.future[0]
      const strokes = next
      if (persistEnabled) scheduleSaveStrokes(strokes)
      return {
        past: pushPast(state.past, state.strokes),
        future: state.future.slice(1),
        strokes,
        activeStroke: null,
      }
    })
  },

  clearAll: () => {
    set((state) => {
      if (state.strokes.length === 0 && state.activeStroke === null) return state

      const strokes: Stroke[] = []
      if (persistEnabled) scheduleSaveStrokes(strokes)

      return {
        past: pushPast(state.past, state.strokes),
        future: [],
        strokes,
        activeStroke: null,
      }
    })
  },
}))
