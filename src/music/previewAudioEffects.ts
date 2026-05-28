import {
  backgroundMusic,
  PINNED_PREVIEW_DUCK_FADE_SEC,
} from '../sound/backgroundMusic'

/** Peak level for profile / picker song previews (after fade-in). */
export const PREVIEW_PLAYBACK_VOLUME = 0.12

/** Fade preview level and ambient duck in / out together. */
export const PREVIEW_TRACK_FADE_SEC = 4

const cutoffMonitorByElement = new WeakMap<
  HTMLAudioElement,
  { cleanup: () => void }
>()

/** Subtle muffled-room color for profile / picker song previews. */
const PREVIEW_ACOUSTICS = {
  lowpassHz: 3_400,
  lowpassQ: 0.65,
  reverbWet: 0.13,
  reverbDry: 0.87,
  impulseDurationSec: 1.4,
  impulseDecay: 2.1,
} as const

/** Required for Web Audio routing of cross-origin iTunes preview URLs. */
export const PREVIEW_AUDIO_CROSS_ORIGIN = 'anonymous' as const

type PreviewWireState = {
  master: GainNode
  ctx: AudioContext
  fadeGeneration: number
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

let previewCtx: AudioContext | null = null
let previewImpulse: AudioBuffer | null = null

function ensurePreviewContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!previewCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctx) return null
      previewCtx = new Ctx()
    }
    return previewCtx
  } catch {
    return null
  }
}

function sharedReverbImpulse(context: AudioContext): AudioBuffer {
  if (!previewImpulse) {
    previewImpulse = createReverbImpulse(
      context,
      PREVIEW_ACOUSTICS.impulseDurationSec,
      PREVIEW_ACOUSTICS.impulseDecay,
    )
  }
  return previewImpulse
}

const previewWireByElement = new WeakMap<HTMLAudioElement, PreviewWireState>()

function connectPreviewChain(el: HTMLAudioElement): PreviewWireState | null {
  const existing = previewWireByElement.get(el)
  if (existing) return existing

  const ctx = ensurePreviewContext()
  if (!ctx) return null

  try {
    const source = ctx.createMediaElementSource(el)

    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = PREVIEW_ACOUSTICS.lowpassHz
    lowpass.Q.value = PREVIEW_ACOUSTICS.lowpassQ

    const dryGain = ctx.createGain()
    dryGain.gain.value = PREVIEW_ACOUSTICS.reverbDry

    const wetGain = ctx.createGain()
    wetGain.gain.value = PREVIEW_ACOUSTICS.reverbWet

    const convolver = ctx.createConvolver()
    convolver.buffer = sharedReverbImpulse(ctx)
    convolver.normalize = true

    const master = ctx.createGain()
    master.gain.value = 0

    source.connect(lowpass)
    lowpass.connect(dryGain)
    lowpass.connect(convolver)
    convolver.connect(wetGain)
    dryGain.connect(master)
    wetGain.connect(master)
    master.connect(ctx.destination)

    const state: PreviewWireState = { master, ctx, fadeGeneration: 0 }
    previewWireByElement.set(el, state)
    return state
  } catch {
    return null
  }
}

function animateScalar(
  durationSec: number,
  from: number,
  to: number,
  apply: (value: number) => void,
  isCancelled: () => boolean,
): Promise<void> {
  const durationMs = Math.max(0, durationSec) * 1000
  if (durationMs <= 0) {
    if (!isCancelled()) apply(to)
    return Promise.resolve()
  }

  const t0 = performance.now()
  return new Promise((resolve) => {
    const step = (now: number) => {
      if (isCancelled()) {
        resolve()
        return
      }
      const p = Math.min(1, (now - t0) / durationMs)
      apply(from + (to - from) * p)
      if (p < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

async function fadePreviewLevel(
  el: HTMLAudioElement,
  to: number,
  durationSec: number,
): Promise<void> {
  const state = previewWireByElement.get(el)
  const generation = state ? ++state.fadeGeneration : 0

  await resumePreviewAudioContext()

  if (state) {
    const from = state.master.gain.value
    await animateScalar(
      durationSec,
      from,
      to,
      (value) => {
        state.master.gain.cancelScheduledValues(state.ctx.currentTime)
        state.master.gain.setValueAtTime(Math.max(0, value), state.ctx.currentTime)
      },
      () => generation !== state.fadeGeneration,
    )
    return
  }

  const from = el.volume
  await animateScalar(
    durationSec,
    from,
    to,
    (value) => {
      el.volume = Math.max(0, Math.min(1, value))
    },
    () => false,
  )
}

function resetPreviewLevel(el: HTMLAudioElement): void {
  const state = previewWireByElement.get(el)
  if (state) state.master.gain.value = 0
  else el.volume = 0
}

/** Fade-out length for an end cutoff — capped to the selected clip length. */
export function getPreviewCutoffFadeSec(startTime: number, endTime: number): number {
  const clipSec = Math.max(0.1, endTime - startTime)
  return Math.min(PREVIEW_TRACK_FADE_SEC, clipSec)
}

export function unbindPreviewEndCutoff(el: HTMLAudioElement): void {
  cutoffMonitorByElement.get(el)?.cleanup()
}

/**
 * Begin fading the preview out before {@link endTime} so reverb/muffle ease off
 * instead of cutting at the handle. Calls {@link onFadeComplete} after fade + pause.
 */
export function bindPreviewEndCutoff(
  el: HTMLAudioElement,
  options: {
    startTime: number
    endTime: number
    onFadeComplete: () => void | Promise<void>
  },
): () => void {
  unbindPreviewEndCutoff(el)

  const fadeSec = getPreviewCutoffFadeSec(options.startTime, options.endTime)
  const fadeStartAt = options.endTime - fadeSec
  let fading = false
  let cancelled = false

  const onTimeUpdate = () => {
    if (cancelled || fading || el.paused) return
    if (el.currentTime < fadeStartAt) return

    fading = true
    void (async () => {
      const remaining = Math.max(0, options.endTime - el.currentTime)
      const fadeDuration = Math.max(0.15, Math.min(fadeSec, remaining + 0.05))

      await fadePreviewLevel(el, 0, fadeDuration)
      if (cancelled) return

      el.pause()
      resetPreviewLevel(el)
      await options.onFadeComplete()
    })()
  }

  el.addEventListener('timeupdate', onTimeUpdate)

  const cleanup = () => {
    cancelled = true
    el.removeEventListener('timeupdate', onTimeUpdate)
    cutoffMonitorByElement.delete(el)
  }

  cutoffMonitorByElement.set(el, { cleanup })
  return cleanup
}

function waitForCanPlay(el: HTMLAudioElement): Promise<void> {
  if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const done = () => {
      el.removeEventListener('canplay', done)
      el.removeEventListener('error', onError)
      resolve()
    }
    const onError = () => {
      el.removeEventListener('canplay', done)
      el.removeEventListener('error', onError)
      reject(new Error('Preview failed to load'))
    }
    el.addEventListener('canplay', done)
    el.addEventListener('error', onError)
  })
}

/**
 * Assign preview URL with crossOrigin before load so Web Audio + effects work after reload.
 * Do not set `src` on the `<audio>` in JSX — call this from the play handler.
 */
export async function ensurePreviewMediaSource(
  el: HTMLAudioElement,
  url: string,
): Promise<void> {
  const resolved = url.trim()
  if (!resolved) throw new Error('Empty preview URL')

  el.crossOrigin = PREVIEW_AUDIO_CROSS_ORIGIN

  const loaded =
    (el.currentSrc || el.src) === resolved &&
    el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA

  if (loaded) return

  el.src = resolved
  el.load()
  await waitForCanPlay(el)
}

export async function resumePreviewAudioContext(): Promise<void> {
  const context = ensurePreviewContext()
  if (!context) return
  if (context.state === 'suspended') {
    await context.resume().catch(() => undefined)
  }
}

function wirePreviewAudioElement(el: HTMLAudioElement): PreviewWireState | null {
  const state = connectPreviewChain(el)
  if (state) void resumePreviewAudioContext()
  return state
}

export function duckBackgroundMusicForPreview(): void {
  void backgroundMusic.fadeAmbientForPreview(true, {
    durationSec: PINNED_PREVIEW_DUCK_FADE_SEC,
  })
}

export function restoreBackgroundMusicAfterPreview(): void {
  void backgroundMusic.fadeAmbientForPreview(false, {
    durationSec: PINNED_PREVIEW_DUCK_FADE_SEC,
  })
}

export async function preparePreviewForPlayback(
  el: HTMLAudioElement,
  url: string,
): Promise<void> {
  await ensurePreviewMediaSource(el, url)
  wirePreviewAudioElement(el)
  await resumePreviewAudioContext()
  void backgroundMusic.resumeContext()

  const state = previewWireByElement.get(el)
  if (state) {
    el.volume = 1
    state.master.gain.value = 0
  } else {
    el.volume = 0
  }
}

/** Load, play, and fade the preview in over {@link PREVIEW_TRACK_FADE_SEC}. */
export async function startPreviewPlayback(
  el: HTMLAudioElement,
  url: string,
  startTime: number,
): Promise<void> {
  duckBackgroundMusicForPreview()
  await preparePreviewForPlayback(el, url)
  el.currentTime = startTime
  await el.play()
  void fadePreviewLevel(el, PREVIEW_PLAYBACK_VOLUME, PREVIEW_TRACK_FADE_SEC)
}

/** Fade the preview out over {@link PREVIEW_TRACK_FADE_SEC}, then pause. */
export async function stopPreviewPlayback(el: HTMLAudioElement): Promise<void> {
  unbindPreviewEndCutoff(el)
  await fadePreviewLevel(el, 0, PREVIEW_TRACK_FADE_SEC)
  el.pause()
  resetPreviewLevel(el)
}
