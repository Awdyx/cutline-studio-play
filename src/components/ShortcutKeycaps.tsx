import { font } from '../styles/tokens'

export function ShortcutKeycaps({
  keys,
  size = 'md',
}: {
  keys: string[]
  size?: 'sm' | 'md'
}) {
  if (keys.length === 0) return null

  const fontSize = size === 'sm' ? 10 : 11
  const padding = size === 'sm' ? '2px 6px' : '3px 7px'
  const minWidth = size === 'sm' ? 18 : 20

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      {keys.map((key, i) => (
        <span key={`${key}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && (
            <span
              style={{
                fontSize: fontSize - 1,
                color: font.colorFaint,
                fontWeight: 500,
              }}
            >
              +
            </span>
          )}
          <kbd
            className="theme-surface"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth,
              padding,
              fontSize,
              fontWeight: 600,
              fontFamily: font.family,
              color: font.colorPrimary,
              background: 'var(--keycap-bg)',
              border: '1px solid var(--keycap-border)',
              borderRadius: 6,
              boxShadow: 'var(--keycap-shadow)',
              lineHeight: 1.2,
            }}
          >
            {key}
          </kbd>
        </span>
      ))}
    </span>
  )
}
