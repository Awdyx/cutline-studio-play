import { motion } from 'framer-motion'
import { MAX_VELOCITY, usePanMotionStore } from './panMotionStore'

const DOT_COLOR = 'rgba(80, 100, 130, 0.5)'
const MAX_OFFSET = 3
const MAX_OPACITY = 0.9

const fadeTransition = (active: boolean) => ({
  duration: active ? 0.5 : 1.2,
  ease: active ? ('easeOut' as const) : ('easeInOut' as const),
})

export default function MotionIndicator() {
  const active = usePanMotionStore((s) => s.active)
  const intensity = usePanMotionStore((s) => s.intensity)
  const vx = usePanMotionStore((s) => s.vx)
  const vy = usePanMotionStore((s) => s.vy)

  const magnitude = Math.sqrt(vx * vx + vy * vy)
  const offsetScale = Math.min(magnitude / MAX_VELOCITY, 1)
  const offsetX =
    active && magnitude > 0
      ? (-vx / magnitude) * MAX_OFFSET * offsetScale
      : 0
  const offsetY =
    active && magnitude > 0
      ? (-vy / magnitude) * MAX_OFFSET * offsetScale
      : 0

  const opacity = active ? MAX_OPACITY * intensity : 0
  const transition = fadeTransition(active)

  return (
    <motion.div
      aria-hidden
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        width: 24,
        height: 24,
        pointerEvents: 'none',
        zIndex: 10,
        willChange: 'opacity, transform',
      }}
      animate={{ opacity }}
      transition={transition}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 24,
            height: 24,
            borderRadius: '50%',
            boxShadow: `0 0 0 1px ${DOT_COLOR.replace('0.5', '0.25')}`,
          }}
        />
        <motion.div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: DOT_COLOR,
            boxShadow: `0 0 6px 3px ${DOT_COLOR.replace('0.5', '0.15')}`,
            willChange: 'transform',
          }}
          animate={{ x: offsetX, y: offsetY }}
          transition={transition}
        />
      </div>
    </motion.div>
  )
}
