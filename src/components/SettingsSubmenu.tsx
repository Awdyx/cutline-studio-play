import { useLayoutEffect, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Lock, Monitor, Moon, PencilLine, PencilOff, Sun, Volume2, VolumeX } from 'lucide-react'
import { useIsPhoneLayout } from '../hooks/useLayoutProfile'
import { CHROME_FROSTED_MENU_CLASS, chromeFrostedMenuStyle, font } from '../styles/tokens'
import type { ThemeMode } from '../theme/themeStore'
import { useEffectiveMode } from '../theme/useEffectiveMode'
import { backgroundMusic } from '../sound/backgroundMusic'
import { playSubmenuTap, playSubmenuTapThen } from '../sound/submenuSound'
import { useSoundStore } from '../sound/soundStore'
import { useCanvasEditStore } from '../canvasEdit/canvasEditStore'
import { useSubmenuPosition } from './useSubmenuPosition'
import MenuToggleRow, { LockToggleRow, ThemeToggleRow } from './MenuToggleRow'
import { SubmenuSoundScope } from './SubmenuSoundScope'
import PhoneStackHeader from './PhoneStackHeader'
import PhoneCenteredChromeModal from './PhoneCenteredChromeModal'

interface SettingsSubmenuProps {
  anchorRef: RefObject<HTMLElement | null>
  mode: ThemeMode
  onModeChange: (mode: ThemeMode) => void
  onCloseMenu: () => void
  isCanvasLocked: boolean
  onToggleCanvasLock: () => void
  showCanvasLock?: boolean
  onBack?: () => void
}

export default function SettingsSubmenu({
  anchorRef,
  mode,
  onModeChange,
  isCanvasLocked,
  onToggleCanvasLock,
  showCanvasLock = true,
  onBack,
}: SettingsSubmenuProps) {
  const isPhone = useIsPhoneLayout()
  const [mounted, setMounted] = useState(false)
  const pos = useSubmenuPosition(anchorRef, { enabled: !isPhone })

  const soundMuted = useSoundStore((s) => s.muted)
  const musicEnabled = useSoundStore((s) => s.musicEnabled)
  const setMuted = useSoundStore((s) => s.setMuted)
  const setMusicEnabled = useSoundStore((s) => s.setMusicEnabled)
  const canvasEditEnabled = useCanvasEditStore((s) => s.enabled)
  const setCanvasEditEnabled = useCanvasEditStore((s) => s.setEnabled)

  const effectiveMode = useEffectiveMode(mode)
  const soundOn = !soundMuted && musicEnabled
  const ThemeRowIcon =
    mode === 'auto' ? Monitor : effectiveMode === 'dark' ? Moon : Sun

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  function handleLockChange(locked: boolean) {
    if (locked !== isCanvasLocked) onToggleCanvasLock()
  }

  function handleSoundChange(enabled: boolean) {
    if (!enabled) {
      playSubmenuTapThen(() => {
        setMuted(true)
        setMusicEnabled(false)
      })
      return
    }
    setMuted(false)
    setMusicEnabled(true)
    void backgroundMusic.unlock()
    playSubmenuTap()
  }

  function handleThemeChange(dark: boolean) {
    onModeChange(dark ? 'dark' : 'light')
  }

  if (!mounted) return null

  const settingsBody = (
    <SubmenuSoundScope>
      {isPhone && onBack ? <PhoneStackHeader title="Settings" onBack={onBack} /> : null}
      <div
        style={{
          padding: isPhone ? '2px 0 10px' : '4px 0 8px',
          fontFamily: font.family,
        }}
      >
        {showCanvasLock && (
          <LockToggleRow
            icon={Lock}
            locked={isCanvasLocked}
            onChange={handleLockChange}
            disabled={isPhone && !canvasEditEnabled}
          />
        )}
        {isPhone && (
          <MenuToggleRow
            icon={PencilLine}
            label="Canvas edit"
            enabled={canvasEditEnabled}
            onChange={setCanvasEditEnabled}
            trackLeftIcon={PencilOff}
            trackRightIcon={PencilLine}
          />
        )}
        <MenuToggleRow
          icon={Volume2}
          label="Sound"
          enabled={soundOn}
          onChange={handleSoundChange}
          trackLeftIcon={VolumeX}
          trackRightIcon={Volume2}
          playClickSound={false}
        />
        <ThemeToggleRow
          icon={ThemeRowIcon}
          dark={effectiveMode === 'dark'}
          onChange={handleThemeChange}
        />
      </div>
    </SubmenuSoundScope>
  )

  return createPortal(
    isPhone ? (
      <PhoneCenteredChromeModal
        onDismiss={() => onBack?.()}
        cardDataAttributes={{ 'data-cutline-submenu': 'settings' }}
        maxWidth={300}
      >
        {settingsBody}
      </PhoneCenteredChromeModal>
    ) : (
      <motion.div
        data-cutline-submenu="settings"
        initial={{ opacity: 0, scale: 0.96, x: -4 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.96, x: -4 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          width: 260,
          ...chromeFrostedMenuStyle,
          fontFamily: font.family,
          overflow: 'hidden',
          zIndex: 40,
        }}
        className={`theme-surface ${CHROME_FROSTED_MENU_CLASS}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {settingsBody}
      </motion.div>
    ),
    document.body,
  )
}
