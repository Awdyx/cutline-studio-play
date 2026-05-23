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
  Lock,
  LockOpen,
  Volume2,
} from 'lucide-react'
import { useSoundStore } from '../sound/soundStore'
import { CHROME_CARD_CLASS, card, font } from '../styles/tokens'
import type { ThemeMode } from '../theme/themeStore'
import ThemeSubmenu from './ThemeSubmenu'
import SoundSubmenu from './SoundSubmenu'
import ShortcutsSubmenu from './ShortcutsSubmenu'
import { SHORTCUTS_BY_ID } from '../shortcuts/shortcutDefs'
import ShortcutTooltip from './ShortcutTooltip'

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
  isCanvasLocked: boolean
  onToggleCanvasLock: () => void
  /** Lock is main-canvas-only; hidden inside a space. */
  showCanvasLock?: boolean
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
  isCanvasLocked,
  onToggleCanvasLock,
  showCanvasLock = true,
}: CutlineMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const soundAnchorRef = useRef<HTMLDivElement>(null)
  const themeAnchorRef = useRef<HTMLDivElement>(null)
  const shortcutsAnchorRef = useRef<HTMLDivElement>(null)
  const [themeSubmenuOpen, setThemeSubmenuOpen] = useState(false)
  const [soundSubmenuOpen, setSoundSubmenuOpen] = useState(false)
  const [shortcutsSubmenuOpen, setShortcutsSubmenuOpen] = useState(false)
  const soundMuted = useSoundStore((s) => s.muted)
  const musicEnabled = useSoundStore((s) => s.musicEnabled)

  const soundSummary =
    soundMuted && !musicEnabled
      ? 'Off'
      : !soundMuted && musicEnabled
        ? 'On'
        : soundMuted
          ? 'Music'
          : 'SFX'

  useEffect(() => {
    if (!isOpen) {
      setThemeSubmenuOpen(false)
      setSoundSubmenuOpen(false)
      setShortcutsSubmenuOpen(false)
      return
    }

    function handleMouseDown(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest('[data-panel-trigger="cutline"]') &&
        !(e.target as Element).closest('[data-cutline-submenu]')
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen, onClose])

  const ThemeIcon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor

  return (
    <>
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
        border: card.border,
        boxShadow: card.shadow,
        borderRadius: card.radius,
        fontFamily: font.family,
        color: font.colorPrimary,
        zIndex: 30,
        overflow: 'visible',
      }}
      className={`theme-surface ${CHROME_CARD_CLASS}`}
    >
      <MenuRow
        icon={Palette}
        label="Customize canvas"
        onClick={onCustomizeCanvas}
      />
      <div ref={soundAnchorRef}>
        <MenuRow
          icon={Volume2}
          label="Sound"
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
              {soundSummary}
              <ChevronRight size={14} strokeWidth={2} />
            </span>
          }
          onClick={() => {
            setThemeSubmenuOpen(false)
            setShortcutsSubmenuOpen(false)
            setSoundSubmenuOpen((o) => !o)
          }}
        />
      </div>
      {showCanvasLock && (
        <ShortcutTooltip
          keys={SHORTCUTS_BY_ID['toggle-lock'].keys}
          style={{ display: 'block', width: '100%' }}
        >
          <MenuRow
            icon={isCanvasLocked ? LockOpen : Lock}
            label={isCanvasLocked ? 'Unlock canvas' : 'Lock canvas'}
            onClick={() => {
              onToggleCanvasLock()
              onClose()
            }}
          />
        </ShortcutTooltip>
      )}
      <div ref={themeAnchorRef}>
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
          onClick={() => {
            setSoundSubmenuOpen(false)
            setShortcutsSubmenuOpen(false)
            setThemeSubmenuOpen((o) => !o)
          }}
        />
      </div>
      <div ref={shortcutsAnchorRef}>
        <MenuRow
          icon={Keyboard}
          label="Shortcuts"
          right={<ChevronRight size={14} strokeWidth={2} color={font.colorMuted} />}
          onClick={() => {
            setThemeSubmenuOpen(false)
            setSoundSubmenuOpen(false)
            setShortcutsSubmenuOpen((o) => !o)
          }}
        />
      </div>
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
        onClick={() => onNavigate('whats-new')}
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

    <AnimatePresence>
      {soundSubmenuOpen && <SoundSubmenu anchorRef={soundAnchorRef} />}
      {themeSubmenuOpen && (
        <ThemeSubmenu
          anchorRef={themeAnchorRef}
          currentMode={mode}
          onSelect={onModeChange}
          onClose={() => {
            setThemeSubmenuOpen(false)
            onClose()
          }}
        />
      )}
      {shortcutsSubmenuOpen && <ShortcutsSubmenu anchorRef={shortcutsAnchorRef} />}
    </AnimatePresence>
    </>
  )
}
