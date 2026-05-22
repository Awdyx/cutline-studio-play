import { memo } from 'react'
import { useStrokesStore } from './strokesStore'
import { resolveStrokeFill } from './colorUtils'
import { strokeToSvgPath } from './strokePath'
import { useThemeStore } from '../theme/themeStore'
import { useEffectiveMode } from '../theme/useEffectiveMode'
import type { Stroke } from './types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './canvasDimensions'
const HIGHLIGHTER_GLOW_FILTER_ID = 'cutline-highlighter-glow'

const CompletedStrokePath = memo(function CompletedStrokePath({
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

export default function DrawingLayer() {
  const strokes = useStrokesStore((s) => s.strokes)
  const activeStroke = useStrokesStore((s) => s.activeStroke)
  const themeMode = useThemeStore((s) => s.mode)
  const effectiveMode = useEffectiveMode(themeMode)
  const isDark = effectiveMode === 'dark'

  const highlighters = strokes.filter((s) => s.tool === 'highlighter')
  const pens = strokes.filter((s) => s.tool === 'pen')

  const highlighterBlend: React.CSSProperties['mixBlendMode'] = isDark
    ? 'plus-lighter'
    : 'multiply'

  return (
    <svg
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {isDark && (
        <defs>
          <filter
            id={HIGHLIGHTER_GLOW_FILTER_ID}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      <g
        style={{
          mixBlendMode: highlighterBlend,
          filter: isDark ? `url(#${HIGHLIGHTER_GLOW_FILTER_ID})` : undefined,
        }}
      >
        {highlighters.map((stroke) => (
          <CompletedStrokePath
            key={stroke.id}
            stroke={stroke}
            fill={resolveStrokeFill(stroke.color, stroke.tool, effectiveMode)}
          />
        ))}
        {activeStroke?.tool === 'highlighter' && (
          <ActiveStrokePath
            stroke={activeStroke}
            fill={resolveStrokeFill(
              activeStroke.color,
              activeStroke.tool,
              effectiveMode,
            )}
          />
        )}
      </g>
      {pens.map((stroke) => (
        <CompletedStrokePath
          key={stroke.id}
          stroke={stroke}
          fill={resolveStrokeFill(stroke.color, stroke.tool, effectiveMode)}
        />
      ))}
      {activeStroke?.tool === 'pen' && (
        <ActiveStrokePath
          stroke={activeStroke}
          fill={resolveStrokeFill(
            activeStroke.color,
            activeStroke.tool,
            effectiveMode,
          )}
        />
      )}
    </svg>
  )
}
