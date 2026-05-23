import type { CanvasLayer } from '../canvasLock/layer'
import type { Stroke } from '../drawing/types'
import type { ItemTextAlignment } from './textAlignment'
import { DEFAULT_TEXT_ALIGNMENT } from './textAlignment'

export type { ItemTextAlignment, TextAlignH, TextAlignV } from './textAlignment'
export { DEFAULT_TEXT_ALIGNMENT }
export type { CanvasLayer } from '../canvasLock/layer'

export type CanvasItemType = 'sticky' | 'text' | 'image' | 'video' | 'space'

export type CanvasItemBase = {
  id: string
  type: CanvasItemType
  x: number
  y: number
  zIndex: number
  width: number
  height: number
  /** Omitted or `committed` = permanent canvas content; `annotation` = added while locked. */
  layer?: CanvasLayer
}

export type StickyCanvasItem = CanvasItemBase & {
  type: 'sticky'
  text: string
  strokes: Stroke[]
  /** Ink on top of a committed sticky while the canvas is locked. */
  annotationStrokes?: Stroke[]
  textAlign: ItemTextAlignment
}

export type TextCanvasItem = CanvasItemBase & {
  type: 'text'
  text: string
  textAlign: ItemTextAlignment
}

export type ImageCanvasItem = CanvasItemBase & {
  type: 'image'
  src: string
}

export type VideoCanvasItem = CanvasItemBase & {
  type: 'video'
  src: string
}

export type SpaceCanvasItem = CanvasItemBase & {
  type: 'space'
  name: string
  snapshot: string | null
}

export type CanvasItem =
  | StickyCanvasItem
  | TextCanvasItem
  | ImageCanvasItem
  | VideoCanvasItem
  | SpaceCanvasItem

export const STICKY_WIDTH = 200
export const STICKY_HEIGHT = 200

export const SPACE_WIDTH = 240
export const SPACE_HEIGHT = 240
export const TEXT_WIDTH = 320
export const TEXT_HEIGHT = 72
export const TEXT_MIN_WIDTH = 120
export const TEXT_MIN_HEIGHT = 48
/** Muted yellow — slightly desaturated vs classic sticky note. */
export const STICKY_COLOR = '#F0EBC6'

/** Imported images/videos: 20% saturation reduction (saturate(0.8)). */
export const MEDIA_SATURATE = 0.8
