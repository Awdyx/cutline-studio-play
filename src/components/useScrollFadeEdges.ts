import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export function useScrollFadeEdges(enabled = true, deps: unknown[] = []) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const updateScrollEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const threshold = 6
    setCanScrollUp(el.scrollTop > threshold)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - threshold)
  }, [])

  useLayoutEffect(() => {
    if (!enabled) return
    updateScrollEdges()
    const el = scrollRef.current
    if (!el) return

    el.addEventListener('scroll', updateScrollEdges, { passive: true })
    const ro = new ResizeObserver(updateScrollEdges)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollEdges)
      ro.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extra deps refresh fade when content changes
  }, [enabled, updateScrollEdges, ...deps])

  return { scrollRef, canScrollUp, canScrollDown, onScroll: updateScrollEdges }
}
