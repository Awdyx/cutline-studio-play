import { useEffect, useRef, useState } from 'react'

type Pulse = { id: number; mode: 'light' | 'dark' }

/** Subtle full-screen wash that eases abrupt light/dark swaps. */
export default function ThemeChangePulse({
  effectiveMode,
}: {
  effectiveMode: 'light' | 'dark'
}) {
  const ready = useRef(false)
  const prev = useRef(effectiveMode)
  const [pulse, setPulse] = useState<Pulse | null>(null)

  useEffect(() => {
    if (!ready.current) {
      ready.current = true
      prev.current = effectiveMode
      return
    }
    if (prev.current === effectiveMode) return
    prev.current = effectiveMode
    setPulse({ id: Date.now(), mode: effectiveMode })
  }, [effectiveMode])

  if (!pulse) return null

  return (
    <div
      key={pulse.id}
      aria-hidden
      className={`theme-change-pulse theme-change-pulse--${pulse.mode}`}
      onAnimationEnd={() => setPulse(null)}
    />
  )
}
