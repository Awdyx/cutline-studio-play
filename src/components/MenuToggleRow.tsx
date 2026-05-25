import type { ElementType } from 'react'
import { Lock, LockOpen, Moon, Sun } from 'lucide-react'
import { chromeLabel, font } from '../styles/tokens'
import { playSubmenuHover, runSubmenuClick } from '../sound/submenuSound'

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '11px 14px',
}

const LABEL_STYLE: React.CSSProperties = {
  flex: 1,
  fontSize: 14,
  color: font.colorPrimary,
}

function IconTrackToggle({
  active,
  onChange,
  ariaLabel,
  disabled = false,
  playClickSound = true,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
}: {
  active: boolean
  onChange: (next: boolean) => void
  ariaLabel: string
  disabled?: boolean
  playClickSound?: boolean
  leftIcon: ElementType
  rightIcon: ElementType
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={`chrome-menu-toggle${disabled ? ' chrome-menu-toggle--disabled' : ''}`}
      onClick={() => {
        if (disabled) return
        runSubmenuClick(() => onChange(!active), playClickSound)
      }}
    >
      <LeftIcon
        size={14}
        strokeWidth={2}
        className={`chrome-menu-toggle__side-icon${
          !active ? ' chrome-menu-toggle__side-icon--active' : ''
        }`}
        aria-hidden
      />
      <RightIcon
        size={14}
        strokeWidth={2}
        className={`chrome-menu-toggle__side-icon${
          active ? ' chrome-menu-toggle__side-icon--active' : ''
        }`}
        aria-hidden
      />
    </button>
  )
}

function lockRowClassName(disabled: boolean): string {
  return disabled
    ? 'chrome-menu-toggle-row chrome-menu-toggle-row--dimmed'
    : 'chrome-menu-toggle-row'
}

function RowIcon({ icon: Icon }: { icon: ElementType }) {
  return (
    <Icon
      size={16}
      strokeWidth={1.8}
      color={font.colorMuted}
      style={{ flexShrink: 0 }}
      aria-hidden
    />
  )
}

export default function MenuToggleRow({
  icon: Icon,
  label,
  enabled,
  onChange,
  trackLeftIcon,
  trackRightIcon,
  playClickSound = true,
}: {
  icon?: ElementType
  label: string
  enabled: boolean
  onChange: (next: boolean) => void
  trackLeftIcon: ElementType
  trackRightIcon: ElementType
  playClickSound?: boolean
}) {
  return (
    <div onMouseEnter={() => playSubmenuHover()} style={ROW_STYLE}>
      {Icon ? <RowIcon icon={Icon} /> : null}
      <span style={LABEL_STYLE}>{chromeLabel(label)}</span>
      <IconTrackToggle
        active={enabled}
        onChange={onChange}
        ariaLabel={label}
        playClickSound={playClickSound}
        leftIcon={trackLeftIcon}
        rightIcon={trackRightIcon}
      />
    </div>
  )
}

export function LockToggleRow({
  icon: Icon,
  locked,
  onChange,
  disabled = false,
}: {
  icon?: ElementType
  locked: boolean
  onChange: (locked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div
      onMouseEnter={() => {
        if (!disabled) playSubmenuHover()
      }}
      className={lockRowClassName(disabled)}
      style={ROW_STYLE}
    >
      {Icon ? <RowIcon icon={Icon} /> : null}
      <span className="chrome-menu-toggle-row__label">
        {chromeLabel('Canvas lock')}
      </span>
      <IconTrackToggle
        active={locked}
        onChange={onChange}
        ariaLabel="Canvas lock"
        disabled={disabled}
        leftIcon={LockOpen}
        rightIcon={Lock}
      />
    </div>
  )
}

export function ThemeToggleRow({
  icon: Icon,
  dark,
  onChange,
}: {
  icon?: ElementType
  dark: boolean
  onChange: (dark: boolean) => void
}) {
  return (
    <div onMouseEnter={() => playSubmenuHover()} style={ROW_STYLE}>
      {Icon ? <RowIcon icon={Icon} /> : null}
      <span style={LABEL_STYLE}>{chromeLabel('Theme')}</span>
      <IconTrackToggle
        active={dark}
        onChange={onChange}
        ariaLabel="Theme"
        leftIcon={Sun}
        rightIcon={Moon}
      />
    </div>
  )
}
