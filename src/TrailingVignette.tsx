import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { usePanMotionStore } from './panMotionStore'

interface EdgeStrengths {
  left: number
  right: number
  top: number
  bottom: number
}

function computeEdgeStrengths(
  vx: number,
  vy: number,
  intensity: number,
): EdgeStrengths {
  const absVx = Math.abs(vx)
  const absVy = Math.abs(vy)
  const total = absVx + absVy

  if (total === 0 || intensity === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0 }
  }

  const xWeight = absVx / total
  const yWeight = absVy / total

  return {
    left: vx > 0 ? intensity * xWeight : 0,
    right: vx < 0 ? intensity * xWeight : 0,
    top: vy > 0 ? intensity * yWeight : 0,
    bottom: vy < 0 ? intensity * yWeight : 0,
  }
}

const EDGE_KEYS = ['left', 'right', 'top', 'bottom'] as const

const fadeTransition = (active: boolean) => ({
  duration: active ? 0.5 : 1.2,
  ease: active ? ('easeOut' as const) : ('easeInOut' as const),
})

const directionTransition = {
  duration: 0.4,
  ease: 'easeOut' as const,
}

function edgeGradient(key: (typeof EDGE_KEYS)[number]): string {
  const color = 'var(--vignette-rgba)'
  switch (key) {
    case 'left':
      return `linear-gradient(to right, ${color} 0%, transparent 25%)`
    case 'right':
      return `linear-gradient(to left, ${color} 0%, transparent 25%)`
    case 'top':
      return `linear-gradient(to bottom, ${color} 0%, transparent 25%)`
    case 'bottom':
      return `linear-gradient(to top, ${color} 0%, transparent 25%)`
  }
}

export default function TrailingVignette() {
  const active = usePanMotionStore((s) => s.active)
  const intensity = usePanMotionStore((s) => s.intensity)
  const vx = usePanMotionStore((s) => s.vx)
  const vy = usePanMotionStore((s) => s.vy)
  const lastStrengths = useRef<EdgeStrengths>({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  })

  const strengths = useMemo(() => {
    const next = computeEdgeStrengths(vx, vy, intensity)
    if (active) {
      lastStrengths.current = next
      return next
    }
    return lastStrengths.current
  }, [vx, vy, intensity, active])

  return (
    <motion.div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9,
        willChange: 'opacity, transform',
      }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={fadeTransition(active)}
    >
      {EDGE_KEYS.map((key) => (
        <motion.div
          key={key}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: edgeGradient(key),
            willChange: 'opacity, transform',
          }}
          animate={{ opacity: strengths[key] }}
          transition={active ? directionTransition : fadeTransition(false)}
        />
      ))}
    </motion.div>
  )
}
