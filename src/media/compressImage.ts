import {
  compressImageBitmap,
  resolveImportCompressFormat,
  shouldSkipImageCompression,
  type CompressOutputFormat,
} from './imageCompressCore'

export type CompressedImage = {
  blob: Blob
  naturalWidth: number
  naturalHeight: number
}

let webpSupported: boolean | null = null

async function detectWebpSupport(): Promise<boolean> {
  if (typeof document === 'undefined') return false

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    canvas.toBlob((blob) => resolve(blob?.type === 'image/webp'), 'image/webp', 0.85)
  })
}

export async function getImportImageFormat(): Promise<CompressOutputFormat> {
  if (webpSupported === null) {
    webpSupported = await detectWebpSupport()
  }
  return webpSupported ? 'webp' : 'jpeg'
}

async function readImageDimensions(
  buffer: ArrayBuffer,
  mimeType: string,
): Promise<{ naturalWidth: number; naturalHeight: number }> {
  const blob = new Blob([buffer], { type: mimeType })
  const bitmap = await createImageBitmap(blob)
  try {
    return { naturalWidth: bitmap.width, naturalHeight: bitmap.height }
  } finally {
    bitmap.close()
  }
}

async function compressImageBuffer(
  buffer: ArrayBuffer,
  mimeType: string,
  format: CompressOutputFormat,
  originalSize: number,
): Promise<CompressedImage> {
  const blob = new Blob([buffer], { type: mimeType })
  const bitmap = await createImageBitmap(blob)

  try {
    const naturalWidth = bitmap.width
    const naturalHeight = bitmap.height
    const compressed = await compressImageBitmap(bitmap, format)

    if (!compressed || compressed.size >= originalSize) {
      return { blob: new Blob([buffer], { type: mimeType }), naturalWidth, naturalHeight }
    }

    return {
      blob: compressed,
      naturalWidth,
      naturalHeight,
    }
  } finally {
    bitmap.close()
  }
}

let worker: Worker | null = null
let workerJobId = 0
const workerPending = new Map<
  number,
  {
    resolve: (value: CompressedImage) => void
    reject: (reason: unknown) => void
  }
>()

function resetWorker() {
  worker?.terminate()
  worker = null
  workerPending.clear()
}

function getCompressWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./compressImage.worker.ts', import.meta.url), {
      type: 'module',
    })

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as
        | {
            id: number
            buffer: ArrayBuffer
            mimeType: string
            naturalWidth: number
            naturalHeight: number
          }
        | { id: number; error: string }

      const pending = workerPending.get(data.id)
      if (!pending) return
      workerPending.delete(data.id)

      if ('error' in data) {
        pending.reject(new Error(data.error))
        return
      }

      pending.resolve({
        blob: new Blob([data.buffer], { type: data.mimeType }),
        naturalWidth: data.naturalWidth,
        naturalHeight: data.naturalHeight,
      })
    }

    worker.onerror = (event) => {
      for (const pending of workerPending.values()) {
        pending.reject(event.error ?? new Error('Image compression worker failed'))
      }
      workerPending.clear()
      resetWorker()
    }
  }

  return worker
}

function compressViaWorker(
  buffer: ArrayBuffer,
  mimeType: string,
  format: CompressOutputFormat,
  originalSize: number,
): Promise<CompressedImage> {
  const id = ++workerJobId
  const compressWorker = getCompressWorker()

  return new Promise((resolve, reject) => {
    workerPending.set(id, { resolve, reject })
    compressWorker.postMessage({
      id,
      buffer,
      mimeType,
      format,
      originalSize,
    })
  })
}

export async function compressImageForImport(file: File): Promise<CompressedImage> {
  const buffer = await file.arrayBuffer()
  const mimeType = file.type || 'application/octet-stream'

  if (shouldSkipImageCompression(mimeType)) {
    const { naturalWidth, naturalHeight } = await readImageDimensions(buffer, mimeType)
    return {
      blob: new Blob([buffer], { type: mimeType }),
      naturalWidth,
      naturalHeight,
    }
  }

  const webpSupported = (await getImportImageFormat()) === 'webp'
  const format = resolveImportCompressFormat(mimeType, webpSupported)

  if (format === 'original') {
    const { naturalWidth, naturalHeight } = await readImageDimensions(buffer, mimeType)
    return {
      blob: new Blob([buffer], { type: mimeType }),
      naturalWidth,
      naturalHeight,
    }
  }

  if (typeof Worker !== 'undefined') {
    try {
      return await compressViaWorker(buffer, mimeType, format, file.size)
    } catch (err) {
      console.warn('[media] worker compression failed, falling back to main thread', err)
      resetWorker()
    }
  }

  return compressImageBuffer(buffer, mimeType, format, file.size)
}
