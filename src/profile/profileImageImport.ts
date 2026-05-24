import {
  compressImageBitmap,
  resolveImportCompressFormat,
  shouldSkipImageCompression,
  type CompressOutputFormat,
} from '../media/imageCompressCore'
import { getImportImageFormat } from '../media/compressImage'
import { isProfileGifFile, isProfileImageFile } from './profileUtils'

export const PROFILE_MAX_STORED_BYTES = 2 * 1024 * 1024

export type ProfileImageKind = 'avatar' | 'banner'

const MAX_DIMENSION: Record<ProfileImageKind, number> = {
  avatar: 512,
  banner: 1600,
}

const MIN_DIMENSION = 256

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read that image'))
    }
    reader.onerror = () => reject(new Error('Could not read that image'))
    reader.readAsDataURL(file)
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read compressed image'))
    }
    reader.onerror = () => reject(new Error('Could not read compressed image'))
    reader.readAsDataURL(blob)
  })
}

function resolveFormat(mimeType: string, webpSupported: boolean): CompressOutputFormat {
  const resolved = resolveImportCompressFormat(mimeType, webpSupported)
  return resolved === 'original' ? 'jpeg' : resolved
}

async function compressToTargetSize(
  file: File,
  kind: ProfileImageKind,
): Promise<string> {
  if (isProfileGifFile(file)) {
    throw new Error('GIF must be 2 MB or smaller')
  }

  const buffer = await file.arrayBuffer()
  const mimeType = file.type || 'application/octet-stream'

  if (shouldSkipImageCompression(mimeType)) {
    throw new Error('Image must be 2 MB or smaller')
  }

  const webpSupported = (await getImportImageFormat()) === 'webp'
  const format = resolveFormat(mimeType, webpSupported)
  const bitmap = await createImageBitmap(new Blob([buffer], { type: mimeType }))

  try {
    let maxDimension = MAX_DIMENSION[kind]
    let lastBlob: Blob | null = null

    while (maxDimension >= MIN_DIMENSION) {
      const compressed = await compressImageBitmap(bitmap, format, maxDimension)
      if (!compressed) break

      lastBlob = compressed
      if (compressed.size <= PROFILE_MAX_STORED_BYTES) {
        return blobToDataUrl(compressed)
      }

      maxDimension = Math.round(maxDimension * 0.75)
    }

    if (lastBlob) {
      if (lastBlob.size <= PROFILE_MAX_STORED_BYTES) {
        return blobToDataUrl(lastBlob)
      }
      throw new Error('Image is too large to compress under 2 MB')
    }

    throw new Error('Could not compress that image')
  } finally {
    bitmap.close()
  }
}

export async function prepareProfileImageDataUrl(
  file: File,
  kind: ProfileImageKind,
): Promise<string> {
  if (!isProfileImageFile(file)) {
    throw new Error('Choose an image file')
  }

  // Keep GIF bytes intact so animation survives (Discord-style profile media).
  if (isProfileGifFile(file)) {
    if (file.size > PROFILE_MAX_STORED_BYTES) {
      throw new Error('GIF must be 2 MB or smaller')
    }
    return readFileAsDataUrl(file)
  }

  if (file.size <= PROFILE_MAX_STORED_BYTES) {
    return readFileAsDataUrl(file)
  }

  return compressToTargetSize(file, kind)
}
