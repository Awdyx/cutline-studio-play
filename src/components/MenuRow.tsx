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
  disabled = false,
  active = false,
  inset = false,
  compact = false,
  preserveCase = false,
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
  disabled?: boolean
  active?: boolean
  /** Inset pill row — used in fixed chrome menus. */
  inset?: boolean
  /** Tighter row for phone chrome menus. */
  compact?: boolean
  /** Keep label casing (e.g. HUBS, CHEM) instead of chrome lowercase. */
  preserveCase?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const inSubmenuScope = useSubmenuSoundScope()
  const sounds = submenuSounds ?? inSubmenuScope
  const canInteract = !disabled
  const showInsetFill = inset && hovered && canInteract

  return (
    <button
      type="button"
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      onClick={() => {
        if (!canInteract) return
        if (sounds && submenuClickSound) playSubmenuTap()
        onClick()
      }}
      onMouseEnter={() => {
        if (!canInteract) return
        setHovered(true)
        if (sounds) playSubmenuHover()
        onMouseEnter?.()
      }}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 8 : 10,
        width: inset ? 'calc(100% - 16px)' : '100%',
        margin: inset ? '0 8px' : undefined,
        padding: compact
          ? inset
            ? '7px 10px'
            : '7px 12px'
          : inset
            ? '10px 12px'
            : '10px 16px',
        borderRadius: inset ? 10 : undefined,
        background: showInsetFill ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
        border: 'none',
        cursor: canInteract ? 'pointer' : 'default',
        fontFamily: font.family,
        color: disabled
          ? font.colorFaint
          : destructive
            ? '#c44e4e'
            : font.colorPrimary,
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
          size={compact ? 15 : 16}
          strokeWidth={1.8}
          color={
            disabled
              ? font.colorFaint
              : destructive
                ? '#c44e4e'
                : font.colorMuted
          }
          style={{ flexShrink: 0 }}
        />
      ) : null}
      <span
        className={preserveCase ? 'ui-chrome-preserve-case' : undefined}
        style={{ flex: 1, fontSize: compact ? 13 : 14 }}
      >
        {preserveCase ? label : chromeLabel(label)}
      </span>
      {right}
    </button>
  )
}
