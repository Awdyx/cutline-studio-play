import { useEffect, useRef } from 'react'
import { restoreBackgroundMusicAfterPreview } from './previewAudioEffects'

export function usePreviewBackgroundMusicDuck(): {
  onPreviewStarted: () => void
  onPreviewStopped: () => void
} {
  const duckingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (duckingRef.current) restoreBackgroundMusicAfterPreview()
    }
  }, [])

  return {
    onPreviewStarted: () => {
      duckingRef.current = true
    },
    onPreviewStopped: () => {
      if (!duckingRef.current) return
      restoreBackgroundMusicAfterPreview()
      duckingRef.current = false
    },
  }
}
