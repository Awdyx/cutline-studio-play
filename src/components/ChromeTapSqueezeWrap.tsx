import { useRef, type ReactNode } from 'react'
import {
  CHROME_TAP_SQUEEZE_PULSE_CLASS,
  triggerChromeTapPulse,
} from '../chrome/chromeTapPulse'
import { CHROME_TAP_SQUEEZE_TARGET_CLASS } from '../styles/tokens'

/** Wraps a chrome control so tap squeeze animates the shell, not inner transforms. */
export default function ChromeTapSqueezeWrap({
  children,
  compact = false,
}: {
  children: ReactNode
  /** Stronger squeeze for small icon-only chrome buttons. */
  compact?: boolean
}) {
  const ref = useRef<HTMLSpanElement>(null)

  return (
    <span
      ref={ref}
      className={`${CHROME_TAP_SQUEEZE_TARGET_CLASS}${
        compact ? ' chrome-tap-squeeze-target--compact' : ''
      }`}
      style={{ display: 'inline-flex' }}
      onPointerDown={() => {
        if (ref.current) triggerChromeTapPulse(ref.current)
      }}
      onAnimationEnd={(e) => {
        if (!e.animationName.startsWith('chrome-tap-squeeze')) return
        ref.current?.classList.remove(CHROME_TAP_SQUEEZE_PULSE_CLASS)
      }}
    >
      {children}
    </span>
  )
}
