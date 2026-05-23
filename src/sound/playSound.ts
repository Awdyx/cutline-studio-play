import { useSoundStore } from './soundStore'
import {
  ensureAudioContext,
  playSoundEngine,
  resumeAudioContext,
  setMasterOutputGain,
} from './soundEngine'
import { SFX_ON_GAIN } from './soundLevels'
import type { SoundId } from './types'

export function playSound(id: SoundId, opts?: { layer?: boolean }): void {
  const { muted, hydrated } = useSoundStore.getState()
  if (!hydrated || muted) return

  ensureAudioContext()
  void resumeAudioContext()

  setMasterOutputGain(SFX_ON_GAIN)
  playSoundEngine(id, opts)
}
