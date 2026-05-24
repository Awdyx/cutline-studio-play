import { Hand, TriangleAlert } from 'lucide-react'
import { STUDY_SUBJECTS } from '../components/study/studyHubData'
import { useShortcutUiStore } from '../shortcuts/shortcutUiStore'
import type { StudySubjectId } from './types'

const PAN_HINT_TOAST_COOLDOWN_MS = 8000
let lastPanHintToastAt = 0

export function showStudyHubPanBlockedHint(): void {
  const now = Date.now()
  if (now - lastPanHintToastAt < PAN_HINT_TOAST_COOLDOWN_MS) return
  lastPanHintToastAt = now

  requestAnimationFrame(() => {
    useShortcutUiStore.getState().showActionToast({
      shortcutId: 'study-hub-pan-blocked',
      label: 'Pan the canvas from outside the study widget',
      keys: [],
      icon: Hand,
      holdMs: 4200,
    })
  })
}

export function showStudyHubDuplicateToast(subjectId: StudySubjectId): void {
  const label =
    STUDY_SUBJECTS.find((subject) => subject.id === subjectId)?.label ?? subjectId

  requestAnimationFrame(() => {
    useShortcutUiStore.getState().showActionToast({
      shortcutId: `study-hub-duplicate-${subjectId}`,
      label: `${label} already added to canvas`,
      keys: [],
      icon: TriangleAlert,
      holdMs: 3500,
    })
  })
}
