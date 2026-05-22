import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eraser, Highlighter, Pen } from 'lucide-react'
import type { PenToolMenuState } from '../drawing/usePenToolMenu'
import { pillScreenRect } from '../drawing/penToolMenuLayout'
import type { ToolMode } from '../drawing/toolStore'

const ICON_SIZE = 20
const ICON_STROKE = 2
/** Thin physical ring behind the glyph (theme-colored via --pill-icon-halo). */
const ICON_HALO_STROKE = 3

const tools: { mode: ToolMode; Icon: typeof Pen; label: string }[] = [
  { mode: 'pen', Icon: Pen, label: 'Pen' },
  { mode: 'highlighter', Icon: Highlighter, label: 'Highlighter' },
  { mode: 'erase', Icon: Eraser, label: 'Eraser' },
]

const hostVariants = {
  initial: {
    x: 14,
    scale: 0.94,
    clipPath: 'inset(0 0 0 100% round 999px)',
  },
  animate: {
    x: 0,
    scale: 1,
    clipPath: 'inset(0 0 0 0% round 999px)',
    transition: {
      x: { type: 'spring' as const, stiffness: 620, damping: 36, mass: 0.65 },
      scale: { type: 'spring' as const, stiffness: 620, damping: 36, mass: 0.65 },
      clipPath: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
    },
  },
  exit: {
    x: 12,
    scale: 0.96,
    clipPath: 'inset(0 0 0 100% round 999px)',
    transition: {
      duration: 0.12,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
}

const motionBlurVariants = {
  initial: { opacity: 0.9, scaleX: 0.68, filter: 'blur(36px)' },
  animate: {
    opacity: 0,
    scaleX: 1.12,
    filter: 'blur(0px)',
    transition: {
      opacity: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
      scaleX: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
      filter: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
    },
  },
  exit: {
    opacity: 0.8,
    scaleX: 0.78,
    filter: 'blur(34px)',
    transition: {
      duration: 0.12,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
}

function PillToolIcon({ Icon }: { Icon: typeof Pen }) {
  return (
    <span className="pen-tool-pill__icon" aria-hidden>
      <Icon
        className="pen-tool-pill__icon-ring"
        size={ICON_SIZE}
        strokeWidth={ICON_HALO_STROKE}
        stroke="var(--pill-icon-halo)"
      />
      <Icon
        className="pen-tool-pill__icon-glyph"
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE}
        color="var(--ui-text)"
      />
    </span>
  )
}

type Props = {
  state: PenToolMenuState
}

export default function PenToolPillMenu({ state }: Props) {
  const layoutRef = useRef(pillScreenRect(0, 0))

  if (state.phase === 'open') {
    layoutRef.current = pillScreenRect(state.anchorX, state.anchorY)
  }

  const { left, top, width, height } = layoutRef.current

  return (
    <AnimatePresence initial={false}>
      {state.phase === 'open' && (
        <motion.div
          key={`pill-${Math.round(state.anchorX)}-${Math.round(state.anchorY)}`}
          className="pen-tool-pill-host"
          role="toolbar"
          aria-label="Drawing tools"
          style={{ left, top, width, height }}
          variants={hostVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.span
            className="pen-tool-pill__motion-blur"
            aria-hidden
            variants={motionBlurVariants}
          />

          <div className="pen-tool-pill">
            {tools.map(({ mode, Icon, label }) => {
              const hovered = state.hoveredTool === mode

              return (
                <div
                  key={mode}
                  className={[
                    'pen-tool-pill__segment',
                    hovered ? 'pen-tool-pill__segment--hovered' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  role="img"
                  aria-label={label}
                >
                  <PillToolIcon Icon={Icon} />
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
