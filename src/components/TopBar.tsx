import { useRef, useState } from 'react'
import { Search, Bell } from 'lucide-react'
import { glass, font, themeTransition } from '../styles/tokens'

const islandBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backdropFilter: glass.blur,
  WebkitBackdropFilter: glass.blur,
  border: glass.border,
  boxShadow: glass.shadow,
  borderRadius: glass.radius,
  fontFamily: font.family,
  color: font.colorPrimary,
  userSelect: 'none',
  transition: themeTransition,
}

// ─── Brand Pill ───────────────────────────────────────────────────────────────

interface BrandPillProps {
  isOpen?: boolean
  onClick?: () => void
}

export function BrandPill({ isOpen = false, onClick }: BrandPillProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      data-panel-trigger="cutline"
      aria-label="Cutline menu"
      aria-expanded={isOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="theme-surface"
      style={{
        ...islandBase,
        gap: 8,
        padding: '8px 16px',
        cursor: 'pointer',
        background: isOpen
          ? 'var(--card-bg)'
          : hovered
            ? 'var(--card-bg)'
            : glass.bg,
        border: glass.border,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: '#3ecf6e',
          boxShadow: '0 0 6px rgba(62, 207, 110, 0.7)',
          flexShrink: 0,
        }}
      />
      <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>
        Cutline
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: font.colorMuted,
          letterSpacing: '0.01em',
        }}
      >
        2.0
      </span>
    </button>
  )
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export function SearchBar({ onSearch, placeholder = 'Search…' }: SearchBarProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
    onSearch(e.target.value)
  }

  return (
    <div
      className="theme-surface"
      style={{
        ...islandBase,
        background: glass.bg,
        gap: 8,
        padding: '8px 14px',
        width: '100%',
        maxWidth: 480,
        cursor: 'text',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <Search
        size={15}
        color="var(--ui-text-muted)"
        strokeWidth={2}
        style={{ flexShrink: 0 }}
      />
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="theme-surface"
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
          outline: 'none',
          fontSize: 14,
          fontFamily: font.family,
          color: font.colorPrimary,
          minWidth: 0,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          flexShrink: 0,
          opacity: value ? 0 : 1,
          transition: 'opacity 0.15s ease',
        }}
      >
        <kbd
          className="theme-surface"
          style={{
            fontSize: 11,
            fontFamily: font.family,
            color: font.colorFaint,
            background: 'rgba(20, 30, 50, 0.06)',
            border: '1px solid rgba(20, 30, 50, 0.1)',
            borderRadius: 5,
            padding: '1px 5px',
            lineHeight: '16px',
          }}
        >
          ⌘K
        </kbd>
      </div>
    </div>
  )
}

// ─── User Cluster ─────────────────────────────────────────────────────────────

interface UserClusterProps {
  user: { name: string; initial: string; avatarColor: string }
  unreadCount: number
  onNotificationClick: () => void
  onProfileClick: () => void
}

export function UserCluster({
  user,
  unreadCount,
  onNotificationClick,
  onProfileClick,
}: UserClusterProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={onNotificationClick}
        aria-label="Notifications"
        data-panel-trigger="notifications"
        className="theme-surface"
        style={{
          ...islandBase,
          background: glass.bg,
          position: 'relative',
          padding: 10,
          cursor: 'pointer',
        }}
      >
        <Bell size={16} color="var(--ui-text)" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread`}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: '#f05050',
              boxShadow: '0 0 0 1.5px rgba(255,255,255,0.8)',
            }}
          />
        )}
      </button>

      <button
        onClick={onProfileClick}
        aria-label={`Profile: ${user.name}`}
        data-panel-trigger="profile"
        className="theme-surface"
        style={{
          ...islandBase,
          background: glass.bg,
          gap: 8,
          padding: '6px 12px 6px 8px',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: user.avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}
        >
          {user.initial}
        </span>
        <span style={{ fontSize: 14, fontWeight: 500, color: font.colorPrimary }}>
          {user.name}
        </span>
      </button>
    </div>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
  user: UserClusterProps['user']
  unreadCount: number
  cutlineMenuOpen?: boolean
  onSearch: (query: string) => void
  onCutlineClick: () => void
  onNotificationClick: () => void
  onProfileClick: () => void
}

export default function TopBar({
  user,
  unreadCount,
  cutlineMenuOpen = false,
  onSearch,
  onCutlineClick,
  onNotificationClick,
  onProfileClick,
}: TopBarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto', flexShrink: 0 }}>
        <BrandPill isOpen={cutlineMenuOpen} onClick={onCutlineClick} />
      </div>
      <div
        style={{
          pointerEvents: 'auto',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <SearchBar onSearch={onSearch} placeholder="Search…" />
      </div>
      <div style={{ pointerEvents: 'auto', flexShrink: 0 }}>
        <UserCluster
          user={user}
          unreadCount={unreadCount}
          onNotificationClick={onNotificationClick}
          onProfileClick={onProfileClick}
        />
      </div>
    </div>
  )
}
