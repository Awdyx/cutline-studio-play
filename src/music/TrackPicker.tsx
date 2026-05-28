import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { font, menuDividerStyle } from '../styles/tokens'
import { useTrackSearch } from './useTrackSearch'
import TrackScrubber from './TrackScrubber'
import type { PinnedTrack } from '../profile/types'

interface TrackPickerProps {
  value: PinnedTrack | null
  onChange: (track: PinnedTrack | null) => void
}

// Selected card: springs in from below, collapses upward on exit
const cardVariants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 420, damping: 28, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -6,
    transition: { duration: 0.16, ease: 'easeIn' as const },
  },
}

// Search view: fades up in, fades down out
const searchVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: { duration: 0.12, ease: 'easeIn' as const },
  },
}

export default function TrackPicker({ value, onChange }: TrackPickerProps) {
  const { query, setQuery, results, status, reset } = useTrackSearch()
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  function pick(track: PinnedTrack) {
    onChange(track)
    reset()
  }

  function clear() {
    onChange(null)
  }

  return (
    // overflow: hidden clips the card scale/translate so it doesn't bleed outside the field
    <div style={{ overflow: 'hidden', borderRadius: 12 }}>
      <AnimatePresence mode="wait" initial={false}>
        {value ? (
          <motion.div
            key="selected"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'var(--card-bg)',
              overflow: 'hidden',
            }}
          >
            {/* Track info row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px' }}>
              <motion.img
                src={value.art}
                alt=""
                width={40}
                height={40}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 480, damping: 26, delay: 0.04 }}
                style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0, display: 'block' }}
              />
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut', delay: 0.06 }}
                style={{ flex: 1, minWidth: 0 }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: font.colorPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {value.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: font.colorMuted,
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {value.artist}
                </div>
              </motion.div>
              <button
                type="button"
                aria-label="Remove track"
                onClick={clear}
                style={controlButtonStyle}
              >
                <X size={13} strokeWidth={2.2} />
              </button>
            </div>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut', delay: 0.1 }}
              style={{ ...menuDividerStyle, margin: '0 10px', transformOrigin: 'left' }}
            />

            {/* Scrubber row */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut', delay: 0.13 }}
              style={{ padding: '10px 10px 12px' }}
            >
              <TrackScrubber
                previewUrl={value.preview}
                startTime={value.startTime}
                endTime={value.endTime}
                onStartTimeChange={(t) => onChange({ ...value, startTime: t })}
                onEndTimeChange={(t) => onChange({ ...value, endTime: t })}
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="search"
            variants={searchVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search or paste link lol"
              autoComplete="off"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'var(--card-bg)',
                color: font.colorPrimary,
                fontSize: 14,
                fontFamily: font.family,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <AnimatePresence>
              {status === 'searching' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 8,
                    fontSize: 12,
                    color: font.colorFaint,
                  }}
                >
                  <Loader2 size={12} />
                  Searching…
                </motion.div>
              )}
              {status === 'spotify' && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={hintStyle}
                >
                  Spotify links can't be previewed — search by title instead.
                </motion.p>
              )}
              {status === 'empty' && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={hintStyle}
                >
                  No results found.
                </motion.p>
              )}
              {status === 'error' && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={hintStyle}
                >
                  Couldn't reach the music API.
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}
                >
                  {results.map((t, i) => (
                    <motion.button
                      key={t.id}
                      type="button"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.14, ease: 'easeOut', delay: i * 0.03 }}
                      onClick={() =>
                        pick({
                          id: t.id,
                          title: t.title,
                          artist: t.artist,
                          art: t.art,
                          preview: t.preview,
                          startTime: 0,
                          endTime: 30,
                        })
                      }
                      onMouseEnter={() => setHoveredId(t.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '7px 8px',
                        borderRadius: 8,
                        border: 'none',
                        background:
                          hoveredId === t.id ? 'var(--menu-row-hover-fill)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <img
                        src={t.art}
                        alt=""
                        width={36}
                        height={36}
                        style={{ borderRadius: 5, objectFit: 'cover', flexShrink: 0, display: 'block' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: font.colorPrimary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: font.colorMuted,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: 1,
                          }}
                        >
                          {t.artist}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const controlButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  flexShrink: 0,
  borderRadius: 8,
  border: '1px solid var(--glass-border)',
  background: 'var(--card-bg)',
  color: font.colorMuted,
  cursor: 'pointer',
}

const hintStyle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: 12,
  color: font.colorFaint,
}
