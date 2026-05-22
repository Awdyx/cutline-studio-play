import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Keyboard,
  Settings,
  Sparkles,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'
import { card, font } from '../styles/tokens'
import type { ThemeMode } from '../theme/themeStore'
import ThemeSubmenu from './ThemeSubmenu'

export type CutlineMenuDestination =
  | 'customize'
  | 'shortcuts'
  | 'settings'
  | 'whats-new'
  | 'help'

interface CutlineMenuProps {
  isOpen: boolean
  onClose: () => void
  mode: ThemeMode
  onModeChange: (mode: ThemeMode) => void
  onCustomizeCanvas: () => void
  onNavigate: (destination: CutlineMenuDestination) => void
}

const MODE_LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
}

function MenuRow({
  icon: Icon,
  label,
  right,
  onClick,
  onMouseEnter,
}: {
  icon: React.ElementType
  label: string
  right?: React.ReactNode
  onClick: () => void
  onMouseEnter?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => {
        setHovered(true)
        onMouseEnter?.()
      }}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 16px',
        background: hovered ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: font.family,
        color: font.colorPrimary,
        transition: 'background 150ms ease',
      }}
      className="theme-surface"
    >
      <Icon size={16} strokeWidth={1.8} color={font.colorMuted} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 14, textAlign: 'left' }}>{label}</span>
      {right}
    </button>
  )
}

export default function CutlineMenu({
  isOpen,
  onClose,
  mode,
  onModeChange,
  onCustomizeCanvas,
  onNavigate,
}: CutlineMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [themeSubmenuOpen, setThemeSubmenuOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setThemeSubmenuOpen(false)
      return
    }

    function handleMouseDown(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest('[data-panel-trigger="cutline"]')
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen, onClose])

  const ThemeIcon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 64,
        left: 16,
        width: 260,
        background: card.bg,
        backdropFilter: card.blur,
        WebkitBackdropFilter: card.blur,
        border: card.border,
        boxShadow: card.shadow,
        borderRadius: card.radius,
        fontFamily: font.family,
        color: font.colorPrimary,
        zIndex: 30,
        overflow: 'visible',
      }}
      className="theme-surface"
    >
      <MenuRow
        icon={Palette}
        label="Customize canvas"
        onClick={onCustomizeCanvas}
      />
      <div style={{ position: 'relative' }}>
        <MenuRow
          icon={ThemeIcon}
          label="Theme"
          right={
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                color: font.colorMuted,
              }}
            >
              {MODE_LABELS[mode]}
              <ChevronRight size={14} strokeWidth={2} />
            </span>
          }
          onClick={() => setThemeSubmenuOpen((o) => !o)}
        />
        <AnimatePresence>
          {themeSubmenuOpen && (
            <ThemeSubmenu
              currentMode={mode}
              onSelect={onModeChange}
              onClose={() => {
                setThemeSubmenuOpen(false)
                onClose()
              }}
            />
          )}
        </AnimatePresence>
      </div>
      <MenuRow
        icon={Keyboard}
        label="Shortcuts"
        onClick={() => {
          onNavigate('shortcuts')
          onClose()
        }}
      />
      <MenuRow
        icon={Settings}
        label="Settings"
        onClick={() => {
          onNavigate('settings')
          onClose()
        }}
      />
      <MenuRow
        icon={Sparkles}
        label="What's new"
        onClick={() => {
          onNavigate('whats-new')
          onClose()
        }}
      />

      <div
        style={{
          height: 1,
          background: 'rgba(20, 30, 50, 0.07)',
          margin: '4px 0',
        }}
      />

      <MenuRow
        icon={HelpCircle}
        label="Help"
        onClick={() => {
          onNavigate('help')
          onClose()
        }}
      />
    </motion.div>
  )
}
