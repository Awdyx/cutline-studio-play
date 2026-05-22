import { useEffect } from 'react'
import { useStrokesStore } from '../drawing/strokesStore'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

export function useKeyboardShortcuts() {
  const undo = useStrokesStore((s) => s.undo)
  const redo = useStrokesStore((s) => s.redo)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return
      if (!(e.metaKey || e.ctrlKey)) return

      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])
}
