export type DrawTool = 'pen' | 'highlighter'

export type StrokePoint = {
  x: number
  y: number
  pressure: number
}

export type Stroke = {
  id: string
  points: StrokePoint[]
  color: string
  size: number
  tool: DrawTool
  path?: string
  /** Canvas stack position when committed; older strokes keep their slot. */
  zIndex?: number
}
