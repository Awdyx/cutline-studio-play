import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause } from 'lucide-react'
import { font } from '../styles/tokens'

const FALLBACK_DURATION = 30

interface TrackScrubberProps {
  previewUrl: string
  startTime: number
  onStartTimeChange: (t: number) => void
}

export default function TrackScrubber({
  previewUrl,
  startTime,
  onStartTimeChange,
}: TrackScrubberProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [playhead, setPlayhead] = useState(startTime)
  const [duration, setDuration] = useState(FALLBACK_DURATION)
  const [dragging, setDragging] = useState(false)
  const [snapping, setSnapping] = useState(false)

  // Keep playhead pinned to startTime while not playing
  useEffect(() => {
    if (!playing && !dragging) setPlayhead(startTime)
  }, [startTime, playing, dragging])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.currentTime = startTime
      setPlayhead(startTime)
      void audio.play()
      setPlaying(true)
    }
  }

  function clampTime(t: number) {
    return Math.max(0, Math.min(t, duration - 0.1))
  }

  function timeFromClientX(clientX: number): number {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return clampTime((x / rect.width) * duration)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    setSnapping(false)
    const t = timeFromClientX(e.clientX)
    onStartTimeChange(t)
    setPlayhead(t)
    if (audioRef.current && playing) audioRef.current.currentTime = t
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const t = timeFromClientX(e.clientX)
    onStartTimeChange(t)
    setPlayhead(t)
    if (audioRef.current && playing) audioRef.current.currentTime = t
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  // The knob sits at playhead when playing, startTime when paused/dragging
  const knobPct = playing ? (playhead / duration) * 100 : (startTime / duration) * 100
  const startPct = (startTime / duration) * 100
  const fillWidth = Math.max(0, knobPct - startPct)

  // During playback/drag: no transition so knob tracks audio perfectly.
  // After snap-back (onEnded): spring overshoot via cubic-bezier.
  const livePos = playing || dragging
  const knobTransition = livePos
    ? 'none'
    : snapping
      ? 'left 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.18s ease'
      : 'left 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.18s ease'

  function fmt(s: number) {
    const secs = Math.floor(Math.max(0, s))
    return `0:${String(secs).padStart(2, '0')}`
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Play / pause */}
      <button
        type="button"
        aria-label={playing ? 'Pause preview' : 'Play from start point'}
        onClick={togglePlay}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: 8,
          border: '1px solid var(--glass-border)',
          background: playing ? 'rgba(20,30,50,0.06)' : 'var(--card-bg)',
          color: font.colorMuted,
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={playing ? 'pause' : 'play'}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {playing ? (
              <Pause size={12} strokeWidth={2.2} />
            ) : (
              <Play size={12} strokeWidth={2.2} />
            )}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Timeline */}
      <div
        ref={trackRef}
        style={{
          flex: 1,
          minWidth: 0,
          position: 'relative',
          height: 30,
          cursor: 'ew-resize',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Groove background */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 3,
            background: 'var(--ui-divider)',
          }}
        />

        {/* Played fill — trails the knob from startTime */}
        <div
          style={{
            position: 'absolute',
            left: `${startPct}%`,
            width: `${fillWidth}%`,
            height: 4,
            borderRadius: 3,
            background: 'var(--ui-accent)',
            opacity: 0.45,
            transition: livePos ? 'none' : 'width 0.25s ease, opacity 0.2s ease',
          }}
        />

        {/* Knob — IS the playhead */}
        <div
          style={{
            position: 'absolute',
            left: `${knobPct}%`,
            transform: `translateX(-50%) scale(${dragging ? 1.25 : 1})`,
            width: 3,
            height: 16,
            borderRadius: 999,
            background: 'var(--ui-accent)',
            boxShadow: dragging
              ? '0 0 0 4px rgba(var(--ui-accent-rgb, 100,120,200), 0.18)'
              : 'none',
            pointerEvents: 'none',
            zIndex: 1,
            willChange: 'left, transform',
            transition: knobTransition,
            transformOrigin: 'center center',
          }}
        />
      </div>

      {/* Time label */}
      <span
        style={{
          fontSize: 11,
          color: font.colorMuted,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          width: 26,
          textAlign: 'right',
          letterSpacing: '0.02em',
          transition: 'opacity 0.15s ease',
        }}
      >
        {fmt(startTime)}
      </span>

      <audio
        ref={audioRef}
        src={previewUrl}
        preload="none"
        onTimeUpdate={() => {
          if (audioRef.current) setPlayhead(audioRef.current.currentTime)
        }}
        onDurationChange={() => {
          const d = audioRef.current?.duration
          if (d && isFinite(d) && d > 0) setDuration(d)
        }}
        onEnded={() => {
          setPlaying(false)
          setSnapping(true)
          setPlayhead(startTime)
          // Clear snap flag after animation completes
          setTimeout(() => setSnapping(false), 600)
        }}
      />
    </div>
  )
}
