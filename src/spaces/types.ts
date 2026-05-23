import type { CanvasItem } from '../canvasItems/types'
import type { Stroke } from '../drawing/types'

export type ActiveCanvasId = 'main' | string

export type SpaceCamera = {
  positionX: number
  positionY: number
  scale: number
}

export type SpaceCanvasData = {
  items: CanvasItem[]
  strokes: Stroke[]
  annotationStrokes: Stroke[]
  name: string
  snapshotId: string | null
  camera: SpaceCamera
}

export type SpaceTransitionPhase = 'idle' | 'entering' | 'exiting'

export type SpaceTransitionState = {
  phase: SpaceTransitionPhase
  spaceId: string | null
  /** Viewport rect of the space card at transition start (client coords). */
  cardRect: DOMRect | null
}

export const DEFAULT_SPACE_NAME = 'Untitled space'
export const SPACE_NAME_MAX_LENGTH = 25

export function clampSpaceName(name: string): string {
  return name.slice(0, SPACE_NAME_MAX_LENGTH)
}

export const DEFAULT_SPACE_CAMERA: SpaceCamera = {
  positionX: 0,
  positionY: 0,
  scale: 1,
}
