import { useEffect, useState } from 'react'

/**
 * Defer assigning a data URL to an <img> until the browser can decode off the
 * critical path. Prevents iPad reload freezes when many space snapshots hydrate.
 */
export function useDeferredImageSrc(src: string | null | undefined): string | undefined {
  const [readySrc, setReadySrc] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!src) {
      setReadySrc(undefined)
      return
    }

    let cancelled = false
    const img = new Image()

    const apply = () => {
      if (!cancelled) setReadySrc(src)
    }

    img.onload = apply
    img.onerror = apply

    const startDecode = () => {
      if (!cancelled) img.src = src
    }

    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(startDecode, { timeout: 250 })
      return () => {
        cancelled = true
        cancelIdleCallback(id)
      }
    }

    const timer = setTimeout(startDecode, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [src])

  return readySrc
}
