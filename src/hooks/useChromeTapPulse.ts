import { useEffect } from 'react'
import {
  CHROME_TAP_SQUEEZE_PULSE_CLASS,
  CHROME_TAP_SQUEEZE_TRIGGERS,
  resolveChromeTapSqueezeTarget,
  triggerChromeTapPulse,
} from '../chrome/chromeTapPulse'

/** Subtle squeeze feedback on main chrome controls (all layouts). */
export function useChromeTapPulse() {
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const trigger = (e.target as Element).closest(CHROME_TAP_SQUEEZE_TRIGGERS)
      if (!(trigger instanceof HTMLElement)) return
      triggerChromeTapPulse(resolveChromeTapSqueezeTarget(trigger))
    }

    function onAnimationEnd(e: AnimationEvent) {
      if (!e.animationName.startsWith('chrome-tap-squeeze')) return
      if (!(e.target instanceof HTMLElement)) return
      e.target.classList.remove(CHROME_TAP_SQUEEZE_PULSE_CLASS)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('animationend', onAnimationEnd)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('animationend', onAnimationEnd)
    }
  }, [])
}
