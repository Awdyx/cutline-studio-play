import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { usePanMotionStore } from './panMotionStore'

const vignetteColor = 'rgba(26, 34, 48, 0.22)'

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

const EDGES = [
  {
    key: 'left' as const,
    gradient: `linear-gradient(to right, ${vignetteColor} 0%, transparent 25%)`,
  },
  {
    key: 'right' as const,
    gradient: `linear-gradient(to left, ${vignetteColor} 0%, transparent 25%)`,
  },
  {
    key: 'top' as const,
    gradient: `linear-gradient(to bottom, ${vignetteColor} 0%, transparent 25%)`,
  },
  {
    key: 'bottom' as const,
    gradient: `linear-gradient(to top, ${vignetteColor} 0%, transparent 25%)`,
  },
] as const

const fadeTransition = (active: boolean) => ({
  duration: active ? 0.5 : 1.2,
  ease: active ? ('easeOut' as const) : ('easeInOut' as const),
})

const directionTransition = {
  duration: 0.4,
  ease: 'easeOut' as const,
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
      {EDGES.map(({ key, gradient }) => (
        <motion.div
          key={key}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: gradient,
            willChange: 'opacity, transform',
          }}
          animate={{ opacity: strengths[key] }}
          transition={active ? directionTransition : fadeTransition(false)}
        />
      ))}
    </motion.div>
  )
}
