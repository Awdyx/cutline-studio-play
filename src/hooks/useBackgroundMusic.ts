import { useEffect } from 'react'
import { backgroundMusic } from '../sound/backgroundMusic'
import { useSoundStore } from '../sound/soundStore'

export function useBackgroundMusic() {
  useEffect(() => {
    const sync = () => {
      const { musicEnabled, hydrated } = useSoundStore.getState()
      if (!hydrated) return
      backgroundMusic.sync(musicEnabled)
    }

    backgroundMusic.preload()

    const startSync = () => sync()
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(startSync, { timeout: 200 })
    } else {
      setTimeout(startSync, 0)
    }

    const unsub = useSoundStore.subscribe(sync)

    function unlock() {
      backgroundMusic.unlock()
    }

    document.addEventListener('pointerdown', unlock, { once: true })
    document.addEventListener('keydown', unlock, { once: true })

    return () => {
      unsub()
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])
}
