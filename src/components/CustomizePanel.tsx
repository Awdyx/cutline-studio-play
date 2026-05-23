import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { CHROME_CARD_CLASS, card, font } from '../styles/tokens'
import { MAX_BLOB_DEPTH } from '../theme/paletteGenerator'
import { useThemeStore } from '../theme/themeStore'

interface CustomizePanelProps {
  isOpen: boolean
  onClose: () => void
}

function SliderRow({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
  leftLabel,
  rightLabel,
}: {
  label: string
  valueLabel?: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  leftLabel?: string
  rightLabel?: string
}) {
  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: font.colorPrimary }}>
          {label}
        </span>
        {valueLabel && (
          <span style={{ fontSize: 12, color: font.colorMuted }}>{valueLabel}</span>
        )}
      </div>
      {(leftLabel || rightLabel) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: font.colorFaint,
            marginBottom: 4,
          }}
        >
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          accentColor: 'var(--ui-accent)',
          cursor: 'pointer',
        }}
      />
    </div>
  )
}

export default function CustomizePanel({ isOpen, onClose }: CustomizePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const palette = useThemeStore((s) => s.palette)
  const setPalette = useThemeStore((s) => s.setPalette)
  const resetCanvasAppearance = useThemeStore((s) => s.resetCanvasAppearance)

  useEffect(() => {
    if (!isOpen) return

    function handleMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isOpen, onClose])

  const depthPct = Math.round(palette.blobDepth * 100)

  return (
    <motion.div
      ref={panelRef}
      layout
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 80,
        left: 16,
        width: 340,
        background: card.bg,
        border: card.border,
        boxShadow: card.shadow,
        borderRadius: 18,
        fontFamily: font.family,
        color: font.colorPrimary,
        zIndex: 30,
        padding: '16px 20px 20px',
      }}
      className={`theme-surface ${CHROME_CARD_CLASS}`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600 }}>Customize canvas</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            background: 'none',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            color: font.colorMuted,
          }}
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      <p
        style={{
          margin: '0 0 4px',
          fontSize: 12,
          lineHeight: 1.45,
          color: font.colorMuted,
        }}
      >
        Neutral grey canvas. Higher ambient depth reveals more moving blobs and stronger
        lightness contrast — theme (light / dark) is set from the Cutline menu.
      </p>

      <SliderRow
        label="Ambient depth"
        valueLabel={`${depthPct}%`}
        min={0}
        max={MAX_BLOB_DEPTH}
        step={0.01}
        value={palette.blobDepth}
        onChange={(blobDepth) => setPalette({ blobDepth })}
        leftLabel="Flat"
        rightLabel="Layered"
      />

      <button
        type="button"
        onClick={() => resetCanvasAppearance()}
        style={{
          marginTop: 24,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontSize: 13,
          color: font.colorMuted,
          fontFamily: font.family,
          width: '100%',
          textAlign: 'center',
        }}
      >
        Reset to default
      </button>
    </motion.div>
  )
}
