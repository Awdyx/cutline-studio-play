import { useState } from 'react'
import { playSubmenuHover, playSubmenuTap } from '../sound/submenuSound'
import { chromeLabel, font } from '../styles/tokens'
import { useSubmenuSoundScope } from './SubmenuSoundScope'

export function MenuRow({
  icon: Icon,
  label,
  right,
  onClick,
  onMouseEnter,
  submenuSounds,
  submenuClickSound = true,
  dotColor,
  destructive = false,
}: {
  icon?: React.ElementType
  label: string
  right?: React.ReactNode
  onClick: () => void
  onMouseEnter?: () => void
  /** When omitted, uses SubmenuSoundScope ancestor. */
  submenuSounds?: boolean
  submenuClickSound?: boolean
  dotColor?: string
  destructive?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const inSubmenuScope = useSubmenuSoundScope()
  const sounds = submenuSounds ?? inSubmenuScope

  return (
    <button
      type="button"
      onClick={() => {
        if (sounds && submenuClickSound) playSubmenuTap()
        onClick()
      }}
      onMouseEnter={() => {
        setHovered(true)
        if (sounds) playSubmenuHover()
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
        color: destructive ? '#c44e4e' : font.colorPrimary,
        transition: 'background 150ms ease',
        textAlign: 'left',
      }}
      className={
        destructive
          ? 'theme-surface canvas-item-z-menu-row canvas-item-z-menu-row--destructive'
          : 'theme-surface'
      }
    >
      {dotColor ? (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0,
          }}
        />
      ) : Icon ? (
        <Icon
          size={16}
          strokeWidth={1.8}
          color={destructive ? '#c44e4e' : font.colorMuted}
          style={{ flexShrink: 0 }}
        />
      ) : null}
      <span style={{ flex: 1, fontSize: 14 }}>{chromeLabel(label)}</span>
      {right}
    </button>
  )
}
