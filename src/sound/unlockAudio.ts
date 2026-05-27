import { backgroundMusic } from './backgroundMusic'
import { resumeAudioContext } from './soundEngine'

/** Resume both audio contexts and retry background music after a user gesture. */
export function unlockAudioFromUserGesture(): void {
  void resumeAudioContext()
  void backgroundMusic.resumeContext()
  backgroundMusic.unlock()
}
