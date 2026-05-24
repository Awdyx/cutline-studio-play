import { forwardRef, useCallback, type CSSProperties, type ReactNode, type Ref } from 'react'
import { useScrollFadeEdges } from './useScrollFadeEdges'

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') ref(node)
      else ref.current = node
    }
  }
}

type ChromeScrollFadeProps = {
  children: ReactNode
  className?: string
  scrollClassName?: string
  contentClassName?: string
  scrollStyle?: CSSProperties
  contentStyle?: CSSProperties
  enabled?: boolean
  contentPadY?: number
  /** Re-run fade edge detection when scroll content changes (e.g. tab filters). */
  observeDeps?: unknown[]
}

const ChromeScrollFade = forwardRef<HTMLDivElement, ChromeScrollFadeProps>(function ChromeScrollFade(
  {
    children,
    className,
    scrollClassName,
    contentClassName,
    scrollStyle,
    contentStyle,
    enabled = true,
    contentPadY = 14,
    observeDeps = [],
  },
  ref,
) {
  const { scrollRef, canScrollUp, canScrollDown, onScroll } = useScrollFadeEdges(
    enabled,
    observeDeps,
  )

  const setScrollRef = useCallback(
    mergeRefs(scrollRef, ref),
    [ref, scrollRef],
  )

  return (
    <div
      className={['chrome-scroll-fade-wrap', className].filter(Boolean).join(' ')}
      data-fade-top={canScrollUp ? '' : undefined}
      data-fade-bottom={canScrollDown ? '' : undefined}
    >
      <div
        ref={setScrollRef}
        className={['chrome-scroll-fade', scrollClassName].filter(Boolean).join(' ')}
        style={{ WebkitOverflowScrolling: 'touch', ...scrollStyle }}
        onScroll={onScroll}
      >
        <div
          className={['chrome-scroll-fade-content', contentClassName].filter(Boolean).join(' ')}
          style={{
            paddingTop: contentPadY,
            paddingBottom: contentPadY,
            ...contentStyle,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
})

export default ChromeScrollFade
