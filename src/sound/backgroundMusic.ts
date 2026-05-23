import { MUSIC_ON_GAIN } from './soundLevels'
import {
  ensureAudioContext,
  getMusicGainNode,
  rampMusicOutputGain,
  resumeAudioContext,
  setMusicOutputGainImmediate,
} from './soundEngine'

const MUSIC_SRC = '/audio/account-selection.mp3'
const INTRO_FADE_SEC = 8

function deferHeavyWork(fn: () => void): void {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(fn, { timeout: 400 })
  } else {
    setTimeout(fn, 0)
  }
}

class BackgroundMusicController {
  private audio: HTMLAudioElement | null = null
  private elementSource: MediaElementAudioSourceNode | null = null
  private sourceCreated = false
  private enabled = false
  private playing = false
  private startQueued = false

  private targetGain(): number {
    return this.enabled ? MUSIC_ON_GAIN : 0
  }

  private ensureElement(): HTMLAudioElement | null {
    if (!this.audio) {
      this.audio = new Audio(MUSIC_SRC)
      this.audio.preload = 'auto'
      this.audio.loop = true
    }
    return this.audio
  }

  private wireToContext(): boolean {
    const ctx = ensureAudioContext()
    const bus = getMusicGainNode()
    const el = this.ensureElement()
    if (!ctx || !bus || !el) return false

    if (!this.sourceCreated) {
      try {
        this.elementSource = ctx.createMediaElementSource(el)
        this.elementSource.connect(bus)
        this.sourceCreated = true
      } catch (err) {
        console.warn('[music] MediaElementSource failed', err)
        return false
      }
    }
    return true
  }

  private async startPlayback(): Promise<void> {
    if (!this.enabled) return
    if (this.playing) return
    if (!this.wireToContext()) return

    const el = this.audio!
    el.volume = 1
    await resumeAudioContext()

    rampMusicOutputGain(0, this.targetGain(), INTRO_FADE_SEC)

    try {
      el.currentTime = 0
      await el.play()
      this.playing = true
    } catch {
      this.playing = false
    }
  }

  private queueStartPlayback(): void {
    if (!this.enabled || this.playing || this.startQueued) return
    this.startQueued = true
    deferHeavyWork(() => {
      this.startQueued = false
      void this.startPlayback()
    })
  }

  sync(enabled: boolean): void {
    this.enabled = enabled

    if (!enabled) {
      this.stop()
      return
    }

    this.queueStartPlayback()
  }

  /** Call on user gesture so autoplay policy allows playback (never from SFX path). */
  unlock(): void {
    this.queueStartPlayback()
  }

  /** Warm the MP3 in the background without wiring Web Audio or playing. */
  preload(): void {
    const el = this.ensureElement()
    if (!el) return
    if (el.readyState < HTMLMediaElement.HAVE_METADATA) {
      el.load()
    }
  }

  stop(): void {
    this.playing = false
    this.startQueued = false
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
    setMusicOutputGainImmediate(0)
  }
}

export const backgroundMusic = new BackgroundMusicController()
