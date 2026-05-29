import {
  applyCutlineBackupData,
  hasExistingCutlineData,
  hasExistingCutlineMedia,
  type CutlineBackupFile,
} from '../backup/cutlineBackup'
import { scopedStorageKey } from '../storage/storageScope'
import defaultSeed from './cutlineDefaultSeed.json'

const seed = defaultSeed as CutlineBackupFile

/** Set after the bundled default is applied once — never re-seed on reload. */
const INITIALIZED_KEY = scopedStorageKey('cutline-initialized-v1')

let bootstrapPromise: Promise<boolean> | null = null

function isAlreadyInitialized(): boolean {
  if (localStorage.getItem(INITIALIZED_KEY) === '1') return true
  return hasExistingCutlineData()
}

/** Apply bundled default canvas + profile for first-time visitors on this origin. */
export function applyDefaultSeedForFirstVisit(): Promise<boolean> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      // Only brand-new visitors (no prior Cutline localStorage / media) get the seed.
      // After that, each user's own saves persist across reloads — we never overwrite again.
      if (isAlreadyInitialized()) return false
      if (await hasExistingCutlineMedia()) return false

      if (!seed || typeof seed !== 'object') {
        console.warn('[defaults] bundled seed missing — skipping bootstrap')
        return false
      }

      try {
        await applyCutlineBackupData(seed)
        localStorage.setItem(INITIALIZED_KEY, '1')
        console.info('[defaults] applied bundled default canvas + profile seed')
        return true
      } catch (err) {
        console.warn('[defaults] failed to apply bundled seed', err)
        return false
      }
    })()
  }
  return bootstrapPromise
}
