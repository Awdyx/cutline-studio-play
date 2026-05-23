import { useEffect, useRef } from 'react'
import { playSound } from '../sound/playSound'
import type { ThemeMode } from '../theme/themeStore'

/** Ambient SFX when the user explicitly switches light/dark. */
export function useThemeChangeFeedback(
  effectiveMode: 'light' | 'dark',
  themeMode: ThemeMode,
): void {
  const ready = useRef(false)
  const prev = useRef(effectiveMode)

  useEffect(() => {
    if (!ready.current) {
      ready.current = true
      prev.current = effectiveMode
      return
    }
    if (prev.current === effectiveMode) return

    const systemDriven = themeMode === 'auto'
    if (!systemDriven) {
      playSound(effectiveMode === 'light' ? 'themeToLight' : 'themeToDark')
    }

    prev.current = effectiveMode
  }, [effectiveMode, themeMode])
}
