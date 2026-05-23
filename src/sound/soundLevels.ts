import { BASE_MASTER_GAIN } from './soundEngine'

/** 2× prior “50% slider” SFX level (0.525 × 0.5 → 0.525). */
export const SFX_ON_GAIN = BASE_MASTER_GAIN

/** Half of prior “50% slider” music level (0.21 × 0.5 → 0.105). */
export const MUSIC_ON_GAIN = 0.0525
