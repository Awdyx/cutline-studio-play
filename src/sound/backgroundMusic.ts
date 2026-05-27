import { MUSIC_ON_GAIN } from './soundLevels'

const MUSIC_SRC = `${import.meta.env.BASE_URL}audio/account-selection.mp3`
const INTRO_FADE_SEC = 8

/** Match study-hub menu-focus camera motion (~460–720ms) with a little overlap. */
const STUDY_SPACE_ENTER_SEC = 1.05
const STUDY_SPACE_EXIT_SEC = 0.88

const ACOUSTICS = {
  outside: {
    lowpassHz: 16_000,
    lowpassQ: 0.6,
    bassDb: 0,
    highShelfDb: 0,
    reverbWet: 0,
    reverbDry: 1,
    presence: 1,
    outputGain: 1,
  },
  inside: {
    /** Exaggerated preset — obvious A/B when entering a space canvas. */
    lowpassHz: 120,
    lowpassQ: 3.2,
    bassDb: 24,
    highShelfDb: -32,
    reverbWet: 0.88,
    reverbDry: 0.22,
    presence: 1.55,
    /** Compensate for filter/reverb loss so the muffled mix stays audible. */
    outputGain: 5,
  },
} as const

function deferHeavyWork(fn: () => void): void {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(fn, { timeout: 400 })
  } else {
    setTimeout(fn, 0)
  }
}

function createReverbImpulse(
  context: AudioContext,
  durationSec: number,
  decay: number,
): AudioBuffer {
  const sampleRate = context.sampleRate
  const length = Math.max(1, Math.floor(sampleRate * durationSec))
  const impulse = context.createBuffer(2, length, sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay
    }
  }
  return impulse
}

let musicCtx: AudioContext | null = null
let musicGain: GainNode | null = null
let musicLowpass: BiquadFilterNode | null = null
let musicBassShelf: BiquadFilterNode | null = null
let musicHighShelf: BiquadFilterNode | null = null
let musicConvolver: ConvolverNode | null = null
let musicDryGain: GainNode | null = null
let musicWetGain: GainNode | null = null
let musicPresenceGain: GainNode | null = null
let musicReverbEnabled = false

function ensureMusicContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!musicCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctx) return null
      musicCtx = new Ctx()
      musicGain = musicCtx.createGain()
      musicGain.gain.value = 0
      musicGain.connect(musicCtx.destination)
    }
    return musicCtx
  } catch {
    return null
  }
}

let musicEffectsReady = false

function ensureMusicEffectChain(): boolean {
  const ctx = ensureMusicContext()
  if (!ctx || !musicGain) return false
  if (musicEffectsReady) return musicLowpass != null

  try {
    musicLowpass = ctx.createBiquadFilter()
    musicLowpass.type = 'lowpass'
    musicLowpass.frequency.value = ACOUSTICS.outside.lowpassHz
    musicLowpass.Q.value = ACOUSTICS.outside.lowpassQ

    musicBassShelf = ctx.createBiquadFilter()
    musicBassShelf.type = 'lowshelf'
    musicBassShelf.frequency.value = 120
    musicBassShelf.gain.value = ACOUSTICS.outside.bassDb

    musicHighShelf = ctx.createBiquadFilter()
    musicHighShelf.type = 'highshelf'
    musicHighShelf.frequency.value = 3_200
    musicHighShelf.gain.value = ACOUSTICS.outside.highShelfDb

    musicLowpass.connect(musicBassShelf)
    musicBassShelf.connect(musicHighShelf)

    try {
      musicConvolver = ctx.createConvolver()
      musicConvolver.buffer = createReverbImpulse(ctx, 2.8, 1.65)
      musicConvolver.normalize = true

      musicDryGain = ctx.createGain()
      musicDryGain.gain.value = ACOUSTICS.outside.reverbDry

      musicWetGain = ctx.createGain()
      musicWetGain.gain.value = ACOUSTICS.outside.reverbWet

      musicPresenceGain = ctx.createGain()
      musicPresenceGain.gain.value = ACOUSTICS.outside.presence

      musicHighShelf.connect(musicDryGain)
      musicHighShelf.connect(musicConvolver)
      musicConvolver.connect(musicWetGain)
      musicDryGain.connect(musicPresenceGain)
      musicWetGain.connect(musicPresenceGain)
      musicPresenceGain.connect(musicGain)
      musicReverbEnabled = true
    } catch (reverbErr) {
      console.warn('[music] reverb unavailable, using filter-only path', reverbErr)
      musicHighShelf.connect(musicGain)
      musicConvolver = null
      musicDryGain = null
      musicWetGain = null
      musicPresenceGain = null
      musicReverbEnabled = false
    }

    musicEffectsReady = true
    return true
  } catch (err) {
    console.warn('[music] effect chain unavailable', err)
    musicLowpass = null
    musicBassShelf = null
    musicHighShelf = null
    musicConvolver = null
    musicDryGain = null
    musicWetGain = null
    musicPresenceGain = null
    musicReverbEnabled = false
    musicEffectsReady = true
    return false
  }
}

function musicInputNode(): AudioNode | null {
  if (!ensureMusicContext() || !musicGain) return null
  ensureMusicEffectChain()
  return musicLowpass ?? musicGain
}

function rampParam(
  param: AudioParam,
  from: number,
  to: number,
  start: number,
  durationSec: number,
  exponential = false,
): void {
  param.cancelScheduledValues(start)
  if (durationSec <= 0) {
    param.setValueAtTime(to, start)
    return
  }
  const safeFrom = exponential ? Math.max(from, 0.0001) : from
  const safeTo = exponential ? Math.max(to, 0.0001) : to
  param.setValueAtTime(safeFrom, start)
  if (exponential) {
    param.exponentialRampToValueAtTime(safeTo, start + durationSec)
  } else {
    param.linearRampToValueAtTime(safeTo, start + durationSec)
  }
}

function applyEnclosedAcoustics(
  active: boolean,
  durationSec: number,
): void {
  if (!ensureMusicEffectChain()) return
  const ctx = musicCtx
  if (!ctx || !musicLowpass || !musicBassShelf || !musicHighShelf) return

  const target = active ? ACOUSTICS.inside : ACOUSTICS.outside
  const now = ctx.currentTime

  rampParam(
    musicLowpass.frequency,
    musicLowpass.frequency.value,
    target.lowpassHz,
    now,
    durationSec,
    true,
  )
  rampParam(
    musicLowpass.Q,
    musicLowpass.Q.value,
    target.lowpassQ,
    now,
    durationSec,
  )
  rampParam(
    musicBassShelf.gain,
    musicBassShelf.gain.value,
    target.bassDb,
    now,
    durationSec,
  )
  rampParam(
    musicHighShelf.gain,
    musicHighShelf.gain.value,
    target.highShelfDb,
    now,
    durationSec,
  )

  if (!musicReverbEnabled || !musicDryGain || !musicWetGain || !musicPresenceGain) {
    return
  }

  rampParam(
    musicDryGain.gain,
    musicDryGain.gain.value,
    target.reverbDry,
    now,
    durationSec,
  )
  rampParam(
    musicWetGain.gain,
    musicWetGain.gain.value,
    target.reverbWet,
    now,
    durationSec,
  )
  rampParam(
    musicPresenceGain.gain,
    musicPresenceGain.gain.value,
    target.presence,
    now,
    durationSec,
  )
}

export async function resumeMusicContext(): Promise<void> {
  const context = ensureMusicContext()
  if (!context) return
  if (context.state === 'suspended') {
    await context.resume().catch(() => undefined)
  }
}

function rampMusicOutputGain(
  from: number,
  to: number,
  durationSec: number,
): void {
  const context = ensureMusicContext()
  if (!context || !musicGain) return
  const now = context.currentTime
  musicGain.gain.cancelScheduledValues(now)
  musicGain.gain.setValueAtTime(Math.max(0, from), now)
  musicGain.gain.linearRampToValueAtTime(Math.max(0, to), now + durationSec)
}

function setMusicOutputGainImmediate(gain: number): void {
  if (!musicGain || !musicCtx) return
  musicGain.gain.cancelScheduledValues(musicCtx.currentTime)
  musicGain.gain.setValueAtTime(Math.max(0, gain), musicCtx.currentTime)
}

class BackgroundMusicController {
  private audio: HTMLAudioElement | null = null
  private elementSource: MediaElementAudioSourceNode | null = null
  private sourceCreated = false
  private enabled = false
  private playing = false
  private startQueued = false
  private loadFailed = false
  private enclosedAcousticsActive = false
  private pendingEnclosedAcoustics: boolean | null = null

  private targetGain(): number {
    if (!this.enabled) return 0
    const mult = this.enclosedAcousticsActive
      ? ACOUSTICS.inside.outputGain
      : ACOUSTICS.outside.outputGain
    return MUSIC_ON_GAIN * mult
  }

  private rampOutputGainForEnclosed(active: boolean, durationSec: number): void {
    if (!this.enabled || !musicGain || !musicCtx) return
    const mult = active ? ACOUSTICS.inside.outputGain : ACOUSTICS.outside.outputGain
    rampParam(
      musicGain.gain,
      musicGain.gain.value,
      MUSIC_ON_GAIN * mult,
      musicCtx.currentTime,
      durationSec,
    )
  }

  private ensureElement(): HTMLAudioElement | null {
    if (!this.audio) {
      this.audio = new Audio(MUSIC_SRC)
      this.audio.preload = 'auto'
      this.audio.loop = true
      this.audio.addEventListener('error', () => {
        this.loadFailed = true
        this.stop()
      })
    }
    return this.audio
  }

  private wireToContext(): boolean {
    const ctx = ensureMusicContext()
    const el = this.ensureElement()
    const input = musicInputNode()
    if (!ctx || !el || !input || this.loadFailed) return false

    if (!this.sourceCreated) {
      try {
        this.elementSource = ctx.createMediaElementSource(el)
        this.elementSource.connect(input)
        this.sourceCreated = true
      } catch (err) {
        console.warn('[music] MediaElementSource failed', err)
        return false
      }
    }

    this.applyPendingEnclosedAcoustics()

    return true
  }

  private applyPendingEnclosedAcoustics(): void {
    if (!this.sourceCreated || !musicLowpass) return

    if (this.pendingEnclosedAcoustics != null) {
      const pending = this.pendingEnclosedAcoustics
      this.pendingEnclosedAcoustics = null
      this.enclosedAcousticsActive = pending
      applyEnclosedAcoustics(pending, 0)
      this.rampOutputGainForEnclosed(pending, 0)
    } else if (this.enclosedAcousticsActive) {
      applyEnclosedAcoustics(true, 0)
      this.rampOutputGainForEnclosed(true, 0)
    }
  }

  private async startPlayback(): Promise<void> {
    if (!this.enabled || this.loadFailed) return
    if (this.playing && this.audio && !this.audio.paused) return
    if (!this.wireToContext()) return

    const el = this.audio!
    if (!Number.isFinite(el.duration) && el.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise<void>((resolve) => {
        const done = () => {
          el.removeEventListener('loadedmetadata', done)
          el.removeEventListener('error', done)
          resolve()
        }
        el.addEventListener('loadedmetadata', done)
        el.addEventListener('error', done)
      })
      if (this.loadFailed || !Number.isFinite(el.duration)) return
    }

    el.volume = 1
    await resumeMusicContext()

    if (!this.playing) {
      rampMusicOutputGain(0, this.targetGain(), INTRO_FADE_SEC)
    }

    try {
      if (el.paused) {
        if (!this.playing) el.currentTime = 0
        await el.play()
      }
      this.playing = true
      void import('./backgroundMusicAcoustics').then(({ syncBackgroundMusicEnclosedAcoustics }) => {
        syncBackgroundMusicEnclosedAcoustics()
      })
    } catch {
      this.playing = false
    }
  }

  private queueStartPlayback(): void {
    if (!this.enabled || this.loadFailed) return
    if (this.playing && this.audio && !this.audio.paused) return
    if (this.startQueued) return
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
    void resumeMusicContext().then(() => {
      this.queueStartPlayback()
    })
  }

  /** Resume the music AudioContext (safe to call from a user-gesture handler). */
  resumeContext(): Promise<void> {
    return resumeMusicContext()
  }

  isPlaying(): boolean {
    return this.playing && !!this.audio && !this.audio.paused
  }

  /** Warm the MP3 in the background without wiring Web Audio or playing. */
  preload(): void {
    const el = this.ensureElement()
    if (!el || this.loadFailed) return
    if (el.readyState < HTMLMediaElement.HAVE_METADATA) {
      el.load()
    }
  }

  /**
   * Muffled + bass + reverb while inside a canvas space or study-hub menu focus.
   */
  setEnclosedAcoustics(
    active: boolean,
    opts?: { immediate?: boolean; durationSec?: number; force?: boolean },
  ): void {
    if (
      !opts?.force &&
      active === this.enclosedAcousticsActive &&
      opts?.immediate !== true
    ) {
      return
    }

    this.enclosedAcousticsActive = active

    if (!this.sourceCreated) {
      this.pendingEnclosedAcoustics = active
      return
    }
    if (!musicLowpass) return

    const durationSec = opts?.immediate
      ? 0
      : (opts?.durationSec ??
        (active ? STUDY_SPACE_ENTER_SEC : STUDY_SPACE_EXIT_SEC))

    applyEnclosedAcoustics(active, durationSec)
    this.rampOutputGainForEnclosed(active, durationSec)
  }

  /** @deprecated Use setEnclosedAcoustics */
  setStudySpaceAcoustics(
    active: boolean,
    opts?: { immediate?: boolean; durationSec?: number },
  ): void {
    this.setEnclosedAcoustics(active, opts)
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
