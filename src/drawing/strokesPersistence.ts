import type { Stroke } from './types'
import { generateStrokeId } from './strokeId'
import { strokeToSvgPath } from './strokePath'
import {
  CONTRAST_INK,
  DEFAULT_HIGHLIGHTER_COLOR,
  normalizeStoredPenInk,
} from './colorUtils'
import type { DrawTool } from './types'

export const STROKES_STORAGE_KEY = 'cutline-strokes-v1'
const STORAGE_VERSION = 1
const MAX_BYTES = 4 * 1024 * 1024

type PersistedPayload = {
  version: number
  strokes: Stroke[]
}

function normalizeStroke(raw: unknown): Stroke | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<Stroke>
  if (!Array.isArray(o.points) || o.points.length < 3) return null

  const points = o.points.filter(
    (p): p is Stroke['points'][number] =>
      !!p &&
      typeof p === 'object' &&
      typeof (p as Stroke['points'][number]).x === 'number' &&
      typeof (p as Stroke['points'][number]).y === 'number',
  )
  if (points.length < 3) return null

  const tool: DrawTool = o.tool === 'highlighter' ? 'highlighter' : 'pen'
  const stroke: Stroke = {
    id: typeof o.id === 'string' ? o.id : generateStrokeId(),
    points,
    color:
      typeof o.color === 'string'
        ? tool === 'pen'
          ? normalizeStoredPenInk(o.color)
          : o.color
        : tool === 'pen'
          ? CONTRAST_INK
          : DEFAULT_HIGHLIGHTER_COLOR,
    size: typeof o.size === 'number' ? o.size : 4,
    tool,
  }

  stroke.path =
    typeof o.path === 'string' && o.path.length > 0
      ? o.path
      : strokeToSvgPath(stroke, true)

  return stroke
}

export function loadStrokesFromStorage(): Stroke[] {
  try {
    const raw = localStorage.getItem(STROKES_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as PersistedPayload | Stroke[]
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.strokes)
        ? parsed.strokes
        : []

    return list
      .map(normalizeStroke)
      .filter((s): s is Stroke => s !== null)
  } catch (err) {
    console.warn('[DRAW] failed to load strokes from localStorage', err)
    return []
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleSaveStrokes(strokes: Stroke[]): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveStrokesToStorage(strokes)
  }, 500)
}

export function saveStrokesToStorage(strokes: Stroke[]): void {
  try {
    const payload: PersistedPayload = {
      version: STORAGE_VERSION,
      strokes: strokes.map(({ id, points, color, size, tool, path }) => ({
        id,
        points,
        color,
        size,
        tool,
        path,
      })),
    }
    const serialized = JSON.stringify(payload)
    if (serialized.length > MAX_BYTES) {
      console.warn(
        `[DRAW] strokes payload ${(serialized.length / 1024 / 1024).toFixed(2)}MB exceeds 4MB — skipping save`,
      )
      return
    }
    localStorage.setItem(STROKES_STORAGE_KEY, serialized)
  } catch (err) {
    console.warn('[DRAW] failed to save strokes to localStorage', err)
  }
}
