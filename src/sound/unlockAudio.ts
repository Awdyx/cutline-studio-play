import { resumePreviewAudioContext } from '../music/previewAudioEffects'
import { backgroundMusic } from './backgroundMusic'
import { resumeAudioContext } from './soundEngine'

/** Resume audio contexts and retry background music after a user gesture. */
export function unlockAudioFromUserGesture(): void {
  void resumeAudioContext()
  void resumePreviewAudioContext()
  void backgroundMusic.resumeContext()
  backgroundMusic.unlock()
}
