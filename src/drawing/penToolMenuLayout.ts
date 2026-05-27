import type { ToolMode } from './toolStore'

/** Screen-space pill to the left of the pencil anchor (px, zoom-independent). */
export const PILL_GAP = 10
export const PILL_HEIGHT = 44
export const PILL_PADDING = 4
export const SEGMENT_WIDTH = 48

export const PEN_TOOL_ORDER: ToolMode[] = ['pen', 'highlighter', 'lasso', 'erase']

/** UI customization draw tab — no lasso in the hold-to-open tool pill. */
export const UI_DRAW_PEN_TOOL_ORDER: ToolMode[] = ['pen', 'highlighter', 'erase']

export const PILL_WIDTH = pillWidthForToolOrder(PEN_TOOL_ORDER)

export function pillWidthForToolOrder(order: readonly ToolMode[]): number {
  return PILL_PADDING * 2 + SEGMENT_WIDTH * order.length
}

export function isUiDrawCanvasTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('[data-ui-draw-canvas]')
}

export function pillScreenRect(
  anchorX: number,
  anchorY: number,
  toolOrder: readonly ToolMode[] = PEN_TOOL_ORDER,
) {
  const width = pillWidthForToolOrder(toolOrder)
  const right = anchorX - PILL_GAP
  const left = right - width
  const top = anchorY - PILL_HEIGHT / 2
  return { left, top, right, bottom: top + PILL_HEIGHT, width, height: PILL_HEIGHT }
}

export function hitTestPenToolPill(
  clientX: number,
  clientY: number,
  anchorX: number,
  anchorY: number,
  toolOrder: readonly ToolMode[] = PEN_TOOL_ORDER,
): ToolMode | null {
  const { left, top, right, bottom } = pillScreenRect(anchorX, anchorY, toolOrder)
  if (clientX < left || clientX > right || clientY < top || clientY > bottom) return null

  const innerLeft = left + PILL_PADDING
  const index = Math.floor((clientX - innerLeft) / SEGMENT_WIDTH)
  if (index < 0 || index >= toolOrder.length) return null
  return toolOrder[index] ?? null
}
