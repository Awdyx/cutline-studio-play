import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCanvasWorkspaceStore } from '../spaces/canvasWorkspaceStore'
import { card } from '../styles/tokens'

const TRANSITION_MS = 280

export default function SpaceTransitionOverlay() {
  const transition = useCanvasWorkspaceStore((s) => s.transition)
  const [layout, setLayout] = useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)

  useEffect(() => {
    if (transition.phase === 'idle') {
      setLayout(null)
      return
    }

    if (transition.phase === 'entering' && transition.cardRect) {
      const r = transition.cardRect
      setLayout({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
      })
      const t = requestAnimationFrame(() => {
        setLayout({
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        })
      })
      return () => cancelAnimationFrame(t)
    }

    if (transition.phase === 'exiting') {
      setLayout({
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      })
      const t = requestAnimationFrame(() => {
        if (transition.cardRect) {
          const r = transition.cardRect
          setLayout({
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
          })
        }
      })
      return () => cancelAnimationFrame(t)
    }
  }, [transition.phase, transition.cardRect, transition.spaceId])

  const isActive = transition.phase !== 'idle'

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          data-space-transition
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: TRANSITION_MS / 1000, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 15,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: transition.phase === 'entering' ? 0 : 1 }}
            transition={{ duration: TRANSITION_MS / 1000, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--canvas-bg, #f5f4f0)',
            }}
          />
          {layout && (
            <div
              style={{
                position: 'fixed',
                left: layout.left,
                top: layout.top,
                width: layout.width,
                height: layout.height,
                borderRadius: 6,
                background: card.bg,
                boxShadow: card.shadow,
                transition: `left ${TRANSITION_MS}ms ease-out, top ${TRANSITION_MS}ms ease-out, width ${TRANSITION_MS}ms ease-out, height ${TRANSITION_MS}ms ease-out, border-radius ${TRANSITION_MS}ms ease-out`,
                overflow: 'hidden',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
