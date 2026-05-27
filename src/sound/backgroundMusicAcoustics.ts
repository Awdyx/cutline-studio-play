import { isStudyHubMenuFocusActive } from '../canvasItems/studyHubMenuFocus'
import { useCanvasWorkspaceStore } from '../spaces/canvasWorkspaceStore'
import { backgroundMusic } from './backgroundMusic'

let lastMuffled: boolean | null = null

/** Whether background music should use the enclosed/muffled treatment. */
export function shouldMuffleBackgroundMusic(): boolean {
  const workspace = useCanvasWorkspaceStore.getState()
  if (workspace.canvasSwapMode === 'enter') return true
  if (workspace.canvasSwapMode === 'exit') return false
  return workspace.isInsideSpace() || isStudyHubMenuFocusActive()
}

export function syncBackgroundMusicEnclosedAcoustics(): void {
  const next = shouldMuffleBackgroundMusic()
  if (next === lastMuffled) return
  lastMuffled = next
  backgroundMusic.setEnclosedAcoustics(next)
}

/** Reset cached sync state (e.g. after music stops). */
export function resetBackgroundMusicEnclosedAcousticsCache(): void {
  lastMuffled = null
}
