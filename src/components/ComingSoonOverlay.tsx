import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { font } from '../styles/tokens'

export function ComingSoonOverlay({ onDismiss }: { onDismiss: () => void }) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.22 }}
        style={{
          margin: 0,
          color: '#fff',
          fontFamily: font.family,
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: '-0.02em',
        }}
      >
        coming soon {'<3'}
      </motion.p>
    </motion.div>,
    document.body,
  )
}
