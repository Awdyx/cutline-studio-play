import { useEffect } from 'react'
import { syncChromeUiScale } from '../platform/chromeUiScale'
import { PHONE_MAX_WIDTH_PX } from '../platform/layoutProfile'

/** Keeps desktop chrome proportionally smaller on short/narrow viewports. */
export function useChromeUiScale() {
  useEffect(() => {
    const update = () => {
      syncChromeUiScale()
    }

    update()

    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    window.visualViewport?.addEventListener('resize', update)

    const narrowMq = window.matchMedia(`(max-width: ${PHONE_MAX_WIDTH_PX}px)`)
    const coarseMq = window.matchMedia('(pointer: coarse)')
    narrowMq.addEventListener('change', update)
    coarseMq.addEventListener('change', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.visualViewport?.removeEventListener('resize', update)
      narrowMq.removeEventListener('change', update)
      coarseMq.removeEventListener('change', update)
    }
  }, [])
}
