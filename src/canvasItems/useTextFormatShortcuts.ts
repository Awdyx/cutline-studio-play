import { useEffect, type RefObject } from 'react'
import { handleTextFormatShortcutEvent } from './textEditorFormat'

/** Capture-phase Cmd/Ctrl+B/I/U/Shift+X while a canvas rich-text editor is focused. */
export function useTextFormatShortcuts(
  editorRef: RefObject<HTMLElement | null>,
  isEditing: boolean,
  onFormatApplied: () => void,
) {
  useEffect(() => {
    if (!isEditing) return

    function onKeyDown(event: KeyboardEvent) {
      const editor = editorRef.current
      if (!editor?.isContentEditable) return

      const active = document.activeElement
      if (
        active !== editor &&
        !(active instanceof Node && editor.contains(active))
      ) {
        return
      }

      if (handleTextFormatShortcutEvent(event, editor, onFormatApplied)) {
        event.stopPropagation()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [editorRef, isEditing, onFormatApplied])
}
