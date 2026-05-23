import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { isItemFrozen } from '../canvasLock/layer'
import { useCanvasLockStore } from '../canvasLock/canvasLockStore'
import { useCanvasItemsStore } from './canvasItemsStore'
import CanvasItemShell from './CanvasItemShell'
import StickyStrokesSvg from './StickyStrokesSvg'
import {
  textAlignmentContainerStyle,
  textAlignmentEditorStyle,
} from './textAlignment'
import { useThemeStore } from '../theme/themeStore'
import { resolveStickyColor, resolveStickyTextColor } from '../theme/paletteGenerator'
import { useEffectiveMode } from '../theme/useEffectiveMode'
import { useDeferredCanvasTap } from '../canvas/useDeferredCanvasTap'
import type { StickyCanvasItem } from './types'

const textSaveDelayMs = 400

export default function StickyNote({
  item,
  transformRef,
  onItemResizeStateChange,
  liftZIndex,
}: {
  item: StickyCanvasItem
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>
  onItemResizeStateChange?: (resizing: boolean) => void
  liftZIndex?: number
}) {
  const themeMode = useThemeStore((s) => s.mode)
  const effectiveMode = useEffectiveMode(themeMode)
  const stickyBg = resolveStickyColor(effectiveMode)
  const stickyText = resolveStickyTextColor(effectiveMode)
  const isLocked = useCanvasLockStore((s) => s.isLocked)
  const frozen = isItemFrozen(item, isLocked)
  const editableRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spawnedEmptyRef = useRef(item.text.length === 0)
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const scheduleSave = useCallback(
    (text: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null
        useCanvasItemsStore.getState().updateStickyText(item.id, text)
      }, textSaveDelayMs)
    },
    [item.id],
  )

  const commitTextEdit = useCallback(() => {
    const text = editableRef.current?.textContent ?? ''
    useCanvasItemsStore.getState().commitStickyTextEdit(item.id, text)
  }, [item.id])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const el = editableRef.current
    if (!el || document.activeElement === el) return
    if (el.textContent !== item.text) {
      el.textContent = item.text
    }
  }, [item.text])

  const focusEditor = useCallback((atEnd = false) => {
    const el = editableRef.current
    if (!el) return
    el.focus()
    if (!atEnd) return
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [])

  const editorTap = useDeferredCanvasTap((e) => {
    useCanvasItemsStore.getState().selectItem(item.id, e.shiftKey)
    focusEditor()
    e.stopPropagation()
  })

  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      const el = editableRef.current
      if (!el) return
      if (!el.contains(e.target as Node) && document.activeElement === el) {
        el.blur()
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
  }, [])

  const flushSaveAndCommit = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    commitTextEdit()
  }, [commitTextEdit])

  useEffect(() => {
    if (!spawnedEmptyRef.current || frozen) return
    spawnedEmptyRef.current = false
    setShowPlaceholder(true)
    focusEditor(true)
  }, [focusEditor, frozen])

  return (
    <CanvasItemShell
      item={item}
      transformRef={transformRef}
      onItemResizeStateChange={onItemResizeStateChange}
      liftZIndex={liftZIndex}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: stickyBg,
          borderRadius: 4,
        }}
      >
        <StickyStrokesSvg
          stickyId={item.id}
          strokes={item.strokes}
          annotationStrokes={item.annotationStrokes ?? []}
          width={item.width}
          height={item.height}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            ...textAlignmentContainerStyle(item.textAlign),
          }}
        >
          <div
            role="textbox"
            aria-label="Sticky note text"
            aria-placeholder="Type something…"
            ref={editableRef}
            contentEditable={!frozen}
            suppressContentEditableWarning
            data-placeholder={showPlaceholder ? 'Type something…' : undefined}
            onPointerDown={(e) => {
              if (e.pointerType === 'pen') {
                e.preventDefault()
                return
              }
              editorTap.onPointerDown(e)
            }}
            onPointerMove={editorTap.onPointerMove}
            onPointerUp={editorTap.onPointerUp}
            onPointerCancel={editorTap.onPointerCancel}
          onFocus={() => {
            const text = editableRef.current?.textContent ?? ''
            if (text.length === 0) setShowPlaceholder(true)
          }}
          onInput={() => {
            const text = editableRef.current?.textContent ?? ''
            scheduleSave(text)
            setShowPlaceholder(text.length === 0)
          }}
          onBlur={() => {
            flushSaveAndCommit()
            setShowPlaceholder(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              flushSaveAndCommit()
              editableRef.current?.blur()
            }
          }}
            style={{
              padding: '28px 14px 14px',
              fontSize: 15,
              lineHeight: 1.35,
              color: stickyText,
              outline: 'none',
              wordBreak: 'break-word',
              pointerEvents: frozen ? 'none' : 'auto',
              ...textAlignmentEditorStyle(item.textAlign),
            }}
            className={
              showPlaceholder
                ? 'sticky-note-editor sticky-note-editor--show-placeholder'
                : 'sticky-note-editor'
            }
          />
        </div>
      </div>
    </CanvasItemShell>
  )
}
