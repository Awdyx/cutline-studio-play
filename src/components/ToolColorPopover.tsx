import { useEffect, useRef } from 'react'
import { card, font } from '../styles/tokens'
import {
  HIGHLIGHTER_PRESETS,
  PEN_PRESETS,
  penInkMatches,
  resolveHighlighterColor,
  resolvePenColor,
} from '../drawing/colorUtils'
import { useToolStore } from '../drawing/toolStore'
import { useThemeStore } from '../theme/themeStore'
import { useEffectiveMode } from '../theme/useEffectiveMode'

type ToolColorPopoverProps = {
  tool: 'pen' | 'highlighter'
  onClose: () => void
}

function PresetSwatches({
  presets,
  currentColor,
  onSelect,
  swatchColor,
  matchesPreset,
}: {
  presets: readonly string[]
  currentColor: string
  onSelect: (color: string) => void
  swatchColor?: (preset: string) => string
  matchesPreset?: (current: string, preset: string) => boolean
}) {
  const isSelected =
    matchesPreset ??
    ((current: string, preset: string) =>
      current.toLowerCase() === preset.toLowerCase())
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {presets.map((preset) => {
        const selected = isSelected(currentColor, preset)
        const displayColor = swatchColor ? swatchColor(preset) : preset
        return (
          <button
            key={preset}
            type="button"
            aria-label="Preset color"
            aria-pressed={selected}
            onClick={() => onSelect(preset)}
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: '50%',
              background: displayColor,
              border: selected
                ? '2.5px solid var(--ui-text)'
                : '2px solid rgba(255,255,255,0.9)',
              boxShadow: selected
                ? '0 0 0 2px rgba(255,255,255,0.9)'
                : '0 1px 4px rgba(0,0,0,0.12)',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        )
      })}
    </div>
  )
}

function SizeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number
  max: number
  value: number
  onChange: (size: number) => void
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: font.colorFaint,
          marginBottom: 4,
        }}
      >
        <span>Size</span>
        <span>{Math.round(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
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

export default function ToolColorPopover({ tool, onClose }: ToolColorPopoverProps) {
  const isPen = tool === 'pen'
  const themeMode = useThemeStore((s) => s.mode)
  const effectiveMode = useEffectiveMode(themeMode)
  const penColor = useToolStore((s) => s.penColor)
  const penSize = useToolStore((s) => s.penSize)
  const highlighterColor = useToolStore((s) => s.highlighterColor)
  const highlighterSize = useToolStore((s) => s.highlighterSize)
  const setPenColor = useToolStore((s) => s.setPenColor)
  const setPenSize = useToolStore((s) => s.setPenSize)
  const setHighlighterColor = useToolStore((s) => s.setHighlighterColor)
  const setHighlighterSize = useToolStore((s) => s.setHighlighterSize)

  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (popoverRef.current?.contains(e.target as Node)) return
      onClose()
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={popoverRef}
      className="theme-surface"
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 248,
        padding: '14px 12px',
        background: card.bg,
        backdropFilter: card.blur,
        WebkitBackdropFilter: card.blur,
        border: card.border,
        boxShadow: card.shadow,
        borderRadius: 16,
        fontFamily: font.family,
      }}
    >
      <PresetSwatches
        presets={isPen ? PEN_PRESETS : HIGHLIGHTER_PRESETS}
        currentColor={isPen ? penColor : highlighterColor}
        onSelect={isPen ? setPenColor : setHighlighterColor}
        swatchColor={(preset) =>
          isPen
            ? resolvePenColor(preset, effectiveMode)
            : resolveHighlighterColor(preset, effectiveMode)
        }
        matchesPreset={isPen ? penInkMatches : undefined}
      />
      <SizeSlider
        min={isPen ? 2 : 12}
        max={isPen ? 12 : 32}
        value={isPen ? penSize : highlighterSize}
        onChange={isPen ? setPenSize : setHighlighterSize}
      />
    </div>
  )
}
