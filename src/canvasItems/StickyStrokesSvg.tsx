import { memo } from 'react'
import { resolveStrokeFill } from '../drawing/colorUtils'
import { strokeToSvgPath } from '../drawing/strokePath'
import { useThemeStore } from '../theme/themeStore'
import { useEffectiveMode } from '../theme/useEffectiveMode'
import type { Stroke } from '../drawing/types'
import { useCanvasItemsStore } from './canvasItemsStore'

const StrokePath = memo(function StrokePath({
  stroke,
  fill,
}: {
  stroke: Stroke
  fill: string
}) {
  const d = stroke.path
  if (!d) return null
  return <path d={d} fill={fill} />
})

const ActiveStrokePath = memo(function ActiveStrokePath({
  stroke,
  fill,
}: {
  stroke: Stroke
  fill: string
}) {
  const d = strokeToSvgPath(stroke, false)
  if (!d) return null
  return <path d={d} fill={fill} />
})

function renderStrokeList(
  strokes: Stroke[],
  effectiveMode: 'light' | 'dark',
  keyPrefix: string,
) {
  return strokes.map((stroke) => (
    <StrokePath
      key={`${keyPrefix}-${stroke.id}`}
      stroke={stroke}
      fill={resolveStrokeFill(stroke.color, stroke.tool, effectiveMode)}
    />
  ))
}

export default function StickyStrokesSvg({
  strokes,
  annotationStrokes,
  width,
  height,
  stickyId,
}: {
  strokes: Stroke[]
  annotationStrokes: Stroke[]
  width: number
  height: number
  stickyId: string
}) {
  const themeMode = useThemeStore((s) => s.mode)
  const effectiveMode = useEffectiveMode(themeMode)
  const active = useCanvasItemsStore(
    (s) =>
      s.activeStickyStroke?.stickyId === stickyId ? s.activeStickyStroke.stroke : null,
  )

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
    >
      {renderStrokeList(strokes, effectiveMode, 'c')}
      <g data-lock-sticky-annotation>
        {renderStrokeList(annotationStrokes, effectiveMode, 'a')}
        {active && (
          <ActiveStrokePath
            stroke={active}
            fill={resolveStrokeFill(active.color, active.tool, effectiveMode)}
          />
        )}
      </g>
    </svg>
  )
}
