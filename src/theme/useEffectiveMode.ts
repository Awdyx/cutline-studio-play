import { useEffect, useState } from 'react'
import type { ThemeMode } from './themeStore'

export function useEffectiveMode(mode: ThemeMode): 'light' | 'dark' {
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  )

  useEffect(() => {
    if (mode !== 'auto') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    setSystemDark(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  if (mode === 'auto') return systemDark ? 'dark' : 'light'
  return mode
}
