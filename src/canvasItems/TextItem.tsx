import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { isItemFrozen } from '../canvasLock/layer'
import { useCanvasLockStore } from '../canvasLock/canvasLockStore'
import { font } from '../styles/tokens'
import { useCanvasItemsStore } from './canvasItemsStore'
import CanvasItemShell from './CanvasItemShell'
import {
  isEditorEmpty,
  readEditorHtml,
  storedContentToHtml,
} from './textEditorContent'
import {
  applyTextFormat,
  formatKindFromShortcutKey,
  isFormatModifierShortcut,
} from './textEditorFormat'
import {
  textAlignmentContainerStyle,
  textAlignmentEditorStyle,
} from './textAlignment'
import { useDeferredCanvasTap } from '../canvas/useDeferredCanvasTap'
import type { TextCanvasItem } from './types'

const textSaveDelayMs = 400

export default function TextItem({
  item,
  transformRef,
  onItemResizeStateChange,
  liftZIndex,
}: {
  item: TextCanvasItem
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>
  onItemResizeStateChange?: (resizing: boolean) => void
  liftZIndex?: number
}) {
  const isLocked = useCanvasLockStore((s) => s.isLocked)
  const frozen = isItemFrozen(item, isLocked)
  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const spawnedEmptyRef = useRef(item.text.length === 0)
  const [showPlaceholder, setShowPlaceholder] = useState(item.text.length === 0)

  const scheduleSave = useCallback(
    (html: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null
        useCanvasItemsStore.getState().updateTextItemText(item.id, html)
      }, textSaveDelayMs)
    },
    [item.id],
  )

  const commitTextEdit = useCallback(() => {
    const el = editorRef.current
    const html = el ? readEditorHtml(el) : ''
    useCanvasItemsStore.getState().commitTextItemEdit(item.id, html)
  }, [item.id])

  const flushSaveAndCommit = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    commitTextEdit()
  }, [commitTextEdit])

  const syncFromStore = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const html = storedContentToHtml(item.text)
    if (el.innerHTML !== html) {
      el.innerHTML = html
    }
    setShowPlaceholder(isEditorEmpty(el))
  }, [item.text])

  const focusEditor = useCallback((atEnd = false) => {
    const el = editorRef.current
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

  const applyFormatShortcut = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isFormatModifierShortcut(e)) return false

      const kind = formatKindFromShortcutKey(e.key, e.shiftKey)
      if (!kind) return false

      e.preventDefault()
      applyTextFormat(kind)

      const el = editorRef.current
      if (el) {
        scheduleSave(readEditorHtml(el))
        setShowPlaceholder(isEditorEmpty(el))
      }
      return true
    },
    [scheduleSave],
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    syncFromStore()
  }, [item.id])

  useEffect(() => {
    if (!spawnedEmptyRef.current) return
    spawnedEmptyRef.current = false
    focusEditor(true)
  }, [focusEditor])

  useEffect(() => {
    const el = editorRef.current
    if (!el || document.activeElement === el) return
    syncFromStore()
  }, [item.text, syncFromStore])

  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      const el = editorRef.current
      if (!el) return
      if (!el.contains(e.target as Node) && document.activeElement === el) {
        el.blur()
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
  }, [])

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
            ...textAlignmentContainerStyle(item.textAlign),
          }}
        >
          <div
            role="textbox"
            aria-label="Canvas text"
            aria-multiline
            ref={editorRef}
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
          onInput={() => {
            const el = editorRef.current
            if (!el) return
            scheduleSave(readEditorHtml(el))
            setShowPlaceholder(isEditorEmpty(el))
          }}
          onBlur={() => {
            flushSaveAndCommit()
          }}
          onKeyDown={(e) => {
            if (applyFormatShortcut(e)) return
            if (e.key === 'Escape') {
              e.preventDefault()
              flushSaveAndCommit()
              editorRef.current?.blur()
            }
          }}
            style={{
              padding: 0,
              fontSize: 16,
              lineHeight: 1.45,
              fontFamily: font.family,
              color: font.colorPrimary,
              overflow: 'auto',
              wordBreak: 'break-word',
              outline: 'none',
              background: 'transparent',
              boxSizing: 'border-box',
              cursor: frozen ? 'default' : 'text',
              pointerEvents: frozen ? 'none' : 'auto',
              ...textAlignmentEditorStyle(item.textAlign),
            }}
            className={`canvas-text-editor${showPlaceholder ? ' canvas-text-editor--empty' : ''}`}
          />
        </div>
    </CanvasItemShell>
  )
}
