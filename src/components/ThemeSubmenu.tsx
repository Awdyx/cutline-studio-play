import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { card, font } from '../styles/tokens'
import type { ThemeMode } from '../theme/themeStore'

const OPTIONS: { mode: ThemeMode; icon: React.ElementType; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light' },
  { mode: 'dark', icon: Moon, label: 'Dark' },
  { mode: 'auto', icon: Monitor, label: 'Auto' },
]

interface ThemeSubmenuProps {
  currentMode: ThemeMode
  onSelect: (mode: ThemeMode) => void
  onClose: () => void
}

export default function ThemeSubmenu({
  currentMode,
  onSelect,
  onClose,
}: ThemeSubmenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, x: -4 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.96, x: -4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: '100%',
        top: 0,
        marginLeft: 8,
        width: 160,
        background: card.bg,
        backdropFilter: card.blur,
        WebkitBackdropFilter: card.blur,
        border: card.border,
        boxShadow: card.shadow,
        borderRadius: card.radius,
        fontFamily: font.family,
        overflow: 'hidden',
        zIndex: 35,
      }}
      className="theme-surface"
    >
      {OPTIONS.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => {
            onSelect(mode)
            onClose()
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '10px 14px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: font.family,
            color: font.colorPrimary,
          }}
          className="theme-surface"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <Icon size={15} strokeWidth={1.8} color={font.colorMuted} />
          <span style={{ flex: 1, fontSize: 14, textAlign: 'left' }}>{label}</span>
          {currentMode === mode && (
            <Check size={14} strokeWidth={2.5} color={font.colorPrimary} />
          )}
        </button>
      ))}
    </motion.div>
  )
}
