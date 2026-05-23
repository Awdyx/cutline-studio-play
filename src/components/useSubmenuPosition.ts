import { useLayoutEffect, useState, type RefObject } from 'react'

export function useSubmenuPosition(
  anchorRef: RefObject<HTMLElement | null>,
  gapPx = 8,
): { top: number; left: number } {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    const el = anchorRef.current
    if (!el) return

    function update() {
      const anchor = anchorRef.current
      if (!anchor) return
      const r = anchor.getBoundingClientRect()
      setPos({ top: r.top, left: r.right + gapPx })
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [anchorRef, gapPx])

  return pos
}
