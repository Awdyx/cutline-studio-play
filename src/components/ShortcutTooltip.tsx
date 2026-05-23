import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CHROME_CARD_CLASS, card, font } from '../styles/tokens'
import { ShortcutKeycaps } from './ShortcutKeycaps'

const SHOW_DELAY_MS = 480

export default function ShortcutTooltip({
  keys,
  children,
  label,
  style,
}: {
  keys: string[]
  children: ReactNode
  label?: string
  style?: React.CSSProperties
}) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const wrapRef = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<number | null>(null)

  function show() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      const el = wrapRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setCoords({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      })
      setVisible(true)
    }, SHOW_DELAY_MS)
  }

  function hide() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setVisible(false)
  }

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  return (
    <span
      ref={wrapRef}
      style={{ display: 'inline-flex', position: 'relative', ...style }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible &&
        keys.length > 0 &&
        createPortal(
          <div
            role="tooltip"
            className={`theme-surface ${CHROME_CARD_CLASS}`}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              transform: 'translate(-50%, -100%)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              background: card.bg,
              border: card.border,
              boxShadow: card.shadow,
              borderRadius: 10,
              fontFamily: font.family,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {label && (
              <span style={{ fontSize: 12, color: font.colorMuted }}>{label}</span>
            )}
            <ShortcutKeycaps keys={keys} size="sm" />
          </div>,
          document.body,
        )}
    </span>
  )
}
