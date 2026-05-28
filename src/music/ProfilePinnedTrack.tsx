import { useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { font } from '../styles/tokens'
import type { PinnedTrack } from '../profile/types'

export default function ProfilePinnedTrack({ track }: { track: PinnedTrack }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.currentTime = track.startTime
      void audio.play()
      setPlaying(true)
    }
  }

  return (
    <div style={{ marginTop: 8, textAlign: 'center' }}>
      <button
        type="button"
        aria-label={playing ? 'Pause preview' : 'Play preview'}
        onClick={togglePlay}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 9px 4px 4px',
          borderRadius: 20,
          border: '1px solid var(--glass-border)',
          background: playing ? 'rgba(20, 30, 50, 0.06)' : 'transparent',
          cursor: 'pointer',
          maxWidth: '100%',
          transition: 'background 0.15s ease',
          fontFamily: font.family,
        }}
      >
        <img
          src={track.art}
          alt=""
          width={22}
          height={22}
          style={{
            borderRadius: 11,
            objectFit: 'cover',
            flexShrink: 0,
            display: 'block',
          }}
        />
        <span
          style={{
            flex: '1 1 0',
            minWidth: 0,
            fontSize: 12,
            fontWeight: 500,
            color: font.colorPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {track.title}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            color: font.colorFaint,
            marginLeft: 1,
          }}
        >
          {playing ? (
            <Pause size={11} strokeWidth={2} />
          ) : (
            <Play size={11} strokeWidth={2} />
          )}
        </span>
      </button>
      <audio
        ref={audioRef}
        src={track.preview}
        onEnded={() => setPlaying(false)}
        preload="none"
      />
    </div>
  )
}
