import { useLayoutEffect, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Music, Music2, Volume2, VolumeX } from 'lucide-react'
import { useIsPhoneLayout } from '../hooks/useLayoutProfile'
import { CHROME_FROSTED_MENU_CLASS, chromeFrostedMenuStyle, font, menuDividerStyle } from '../styles/tokens'
import { useSubmenuPosition } from './useSubmenuPosition'
import { unlockAudioFromUserGesture } from '../sound/unlockAudio'
import { playSubmenuTap, playSubmenuTapThen } from '../sound/submenuSound'
import { useSoundStore } from '../sound/soundStore'
import MenuToggleRow from './MenuToggleRow'
import { SubmenuSoundScope } from './SubmenuSoundScope'
import PhoneStackHeader from './PhoneStackHeader'
import PhoneCenteredChromeModal from './PhoneCenteredChromeModal'

export default function SoundSubmenu({
  anchorRef,
  onBack,
}: {
  anchorRef: RefObject<HTMLElement | null>
  onBack?: () => void
}) {
  const isPhone = useIsPhoneLayout()
  const [mounted, setMounted] = useState(false)
  const pos = useSubmenuPosition(anchorRef, { enabled: !isPhone })
  const muted = useSoundStore((s) => s.muted)
  const musicEnabled = useSoundStore((s) => s.musicEnabled)
  const setMuted = useSoundStore((s) => s.setMuted)
  const setMusicEnabled = useSoundStore((s) => s.setMusicEnabled)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  function handleSfxToggle(next: boolean) {
    if (!next) {
      playSubmenuTapThen(() => setMuted(true))
      return
    }
    setMuted(false)
    playSubmenuTap()
  }

  function handleMusicToggle(next: boolean) {
    setMusicEnabled(next)
    if (next) unlockAudioFromUserGesture()
  }

  if (!mounted) return null

  const soundBody = (
    <SubmenuSoundScope>
      {isPhone && onBack ? <PhoneStackHeader title="Sound" onBack={onBack} /> : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px 4px',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: font.colorMuted,
        }}
      >
        <Volume2 size={13} strokeWidth={2} />
        Sound effects
      </div>

      <MenuToggleRow
        label="Sound effects"
        enabled={!muted}
        onChange={handleSfxToggle}
        trackLeftIcon={VolumeX}
        trackRightIcon={Volume2}
        playClickSound={false}
      />

      <div style={menuDividerStyle} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px 4px',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: font.colorMuted,
        }}
      >
        <Music size={13} strokeWidth={2} />
        Background music
      </div>

      <MenuToggleRow
        label="Background music"
        enabled={musicEnabled}
        onChange={handleMusicToggle}
        trackLeftIcon={Music2}
        trackRightIcon={Music}
      />
    </SubmenuSoundScope>
  )

  return createPortal(
    isPhone ? (
      <PhoneCenteredChromeModal
        onDismiss={() => onBack?.()}
        cardDataAttributes={{ 'data-cutline-submenu': 'sound' }}
        maxWidth={300}
        zIndex={60}
      >
        {soundBody}
      </PhoneCenteredChromeModal>
    ) : (
      <motion.div
        data-cutline-submenu="sound"
        initial={{ opacity: 0, scale: 0.96, x: -4 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.96, x: -4 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          width: 220,
          ...chromeFrostedMenuStyle,
          fontFamily: font.family,
          overflow: 'hidden',
          zIndex: 50,
        }}
        className={`theme-surface ${CHROME_FROSTED_MENU_CLASS}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {soundBody}
      </motion.div>
    ),
    document.body,
  )
}
