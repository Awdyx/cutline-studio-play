/**
 * Reads Cutline localStorage from a Chromium profile's LevelDB (offline copy).
 * Chrome stores values as UTF-16LE on macOS.
 */
import { ClassicLevel } from 'classic-level'
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const CUTLINE_BACKUP_FORMAT_VERSION = 2

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'src/defaults/cutlineDefaultSeed.json')

const SOURCE_PROFILE =
  process.env.CUTLINE_BROWSER_PROFILE ??
  join(
    process.env.HOME ?? '',
    'Library/Application Support/Cursor/Partitions/cursor-browser',
  )

const DEV_URL = process.env.CUTLINE_DEV_URL ?? 'http://localhost:5173/'

function decodeLevelDbValue(buf) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf)
  // Chromium v1 localStorage value: 0x01 + UTF-8 payload
  if (buf[0] === 0x01) {
    return buf.subarray(1).toString('utf8')
  }
  // Chromium UTF-16BE payload on macOS (0x00, char, 0x00, char, …)
  if (buf.length >= 4 && buf[0] === 0x00 && buf[2] === 0x00) {
    let out = ''
    for (let i = 0; i + 1 < buf.length; i += 2) {
      out += String.fromCharCode((buf[i] << 8) | buf[i + 1])
    }
    return out
  }
  // Chromium UTF-16LE payload
  if (buf.length >= 2 && buf[1] === 0x00) {
    const u16 = new Uint16Array(buf.buffer, buf.byteOffset, buf.length / 2)
    let out = ''
    for (let i = 0; i < u16.length; i++) out += String.fromCharCode(u16[i])
    return out
  }
  return buf.toString('utf8')
}

function stripIllegalJsonControlChars(text) {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
}

function normalizeStoredJson(text) {
  const cleaned = stripIllegalJsonControlChars(text)
  return JSON.stringify(JSON.parse(cleaned))
}

function parseLocalStorageKey(rawKey) {
  const key = rawKey.replace(/\0/g, '')
  const marker = '_http://localhost:5173'
  const idx = key.indexOf(marker)
  if (idx === -1) return null
  const storageKey = key.slice(idx + marker.length).replace(/^[\x01]+/, '')
  return storageKey || null
}

async function readCutlineLocalStorageFromLevelDb(levelDbPath) {
  const out = {}
  const db = new ClassicLevel(levelDbPath, {
    createIfMissing: false,
    keyEncoding: 'buffer',
    valueEncoding: 'buffer',
  })

  for await (const [keyBuf, valBuf] of db.iterator()) {
    const rawKey = keyBuf.toString('utf8')
    const storageKey = parseLocalStorageKey(rawKey)
    if (!storageKey?.startsWith('cutline-')) continue
    if (storageKey === 'cutline-klipy-customer-id') continue
    const decoded = decodeLevelDbValue(valBuf)
    let value = decoded
    if (storageKey.endsWith('-v1') || storageKey.includes('cutline-')) {
      try {
        value = normalizeStoredJson(decoded)
      } catch {
        value = decoded
      }
    }
    const existing = out[storageKey]
    if (!existing || value.length > existing.length) {
      out[storageKey] = value
    }
  }

  await db.close()
  return out
}

async function readMediaAndProfileFromProfile(profilePath) {
  let context
  try {
    context = await chromium.launchPersistentContext(profilePath, {
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    })
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(DEV_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 })

    const gate = page.locator('input[type="password"]').first()
    if (await gate.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gate.fill(process.env.CUTLINE_ACCESS_PASS ?? 'asianavoidants4life')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
    }

    return await page.evaluate(async () => {
      const openDb = (name) =>
        new Promise((resolve, reject) => {
          const req = indexedDB.open(name)
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => reject(req.error)
        })

      const blobToSerialized = async (blob) => {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(blob)
        })
        const comma = dataUrl.indexOf(',')
        const header = dataUrl.slice(0, comma)
        const mimeMatch = /^data:([^;]+)/.exec(header)
        return {
          mimeType: mimeMatch?.[1] ?? blob.type ?? 'application/octet-stream',
          base64: dataUrl.slice(comma + 1),
        }
      }

      const readStore = async (dbName, storeName) => {
        const db = await openDb(dbName)
        const keys = await new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly')
          const req = tx.objectStore(storeName).getAllKeys()
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => reject(req.error)
        })
        const entries = {}
        for (const key of keys) {
          const blob = await new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly')
            const req = tx.objectStore(storeName).get(key)
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
          })
          if (blob instanceof Blob && blob.size > 0) {
            entries[String(key)] = await blobToSerialized(blob)
          }
        }
        db.close()
        return entries
      }

      const mediaBlobs = await readStore('cutline-media', 'blobs')

      let avatar = null
      let banner = null
      try {
        const profileDb = await openDb('cutline-profile')
        avatar = await new Promise((resolve, reject) => {
          const tx = profileDb.transaction('avatar', 'readonly')
          const req = tx.objectStore('avatar').get('user')
          req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null)
          req.onerror = () => reject(req.error)
        })
        banner = await new Promise((resolve, reject) => {
          const tx = profileDb.transaction('avatar', 'readonly')
          const req = tx.objectStore('avatar').get('user-banner')
          req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null)
          req.onerror = () => reject(req.error)
        })
        profileDb.close()
      } catch {
        // profile DB may be empty
      }

      return { mediaBlobs, profileImages: { avatar, banner } }
    })
  } finally {
    if (context) await context.close()
  }
}

async function main() {
  const tmpProfile = mkdtempSync(join(tmpdir(), 'cutline-seed-export-'))
  console.info('[export] copying browser profile…')
  cpSync(SOURCE_PROFILE, tmpProfile, { recursive: true })

  // Cursor stores the heavy Local Storage + IndexedDB at the partition root,
  // while Chromium reads from Default/ — merge root stores into Default/.
  const rootLs = join(SOURCE_PROFILE, 'Local Storage', 'leveldb')
  const defaultLs = join(tmpProfile, 'Default', 'Local Storage', 'leveldb')
  if (existsSync(rootLs)) {
    cpSync(rootLs, defaultLs, { recursive: true, force: true })
  }
  const rootIdb = join(SOURCE_PROFILE, 'IndexedDB')
  const defaultIdb = join(tmpProfile, 'Default', 'IndexedDB')
  if (existsSync(rootIdb)) {
    cpSync(rootIdb, defaultIdb, { recursive: true, force: true })
  }

  try {
    const levelDbPath = join(tmpProfile, 'Local Storage', 'leveldb')
    const localStorage = await readCutlineLocalStorageFromLevelDb(levelDbPath)
    const keyCount = Object.keys(localStorage).length
    console.info(`[export] read ${keyCount} cutline localStorage keys from LevelDB`)

    const ws = localStorage['cutline-workspace-v1']
    if (ws) {
      try {
        const parsed = JSON.parse(ws)
        console.info(
          `[export] workspace: ${parsed.mainItems?.length ?? 0} main items, ${Object.keys(parsed.spaces ?? {}).length} pockets`,
        )
      } catch {
        console.warn('[export] workspace JSON parse failed')
      }
    }

    console.info('[export] reading IndexedDB media + profile images…')
    const { mediaBlobs, profileImages } =
      await readMediaAndProfileFromProfile(tmpProfile)
    console.info(
      `[export] ${Object.keys(mediaBlobs).length} media blobs, avatar=${profileImages.avatar ? 'yes' : 'no'}, banner=${profileImages.banner ? 'yes' : 'no'}`,
    )

    if (keyCount === 0 && Object.keys(mediaBlobs).length === 0) {
      console.error('[export] no Cutline data found in profile')
      process.exit(1)
    }

    const backup = {
      formatVersion: CUTLINE_BACKUP_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      localStorage,
      mediaBlobs,
      profileImages,
    }

    await mkdir(dirname(OUT), { recursive: true })
    await writeFile(OUT, `${JSON.stringify(backup)}\n`)
    const sizeMb = (Buffer.byteLength(JSON.stringify(backup)) / (1024 * 1024)).toFixed(2)
    console.info(`[export] wrote ${OUT} (${sizeMb} MB)`)
  } finally {
    rmSync(tmpProfile, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error('[export] failed', err)
  process.exit(1)
})
