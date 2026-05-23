import {
  compressImageBitmap,
  outputMimeType,
  type CompressOutputFormat,
} from './imageCompressCore'

type WorkerRequest = {
  id: number
  buffer: ArrayBuffer
  mimeType: string
  format: CompressOutputFormat
  originalSize: number
}

type WorkerSuccess = {
  id: number
  buffer: ArrayBuffer
  mimeType: string
  naturalWidth: number
  naturalHeight: number
}

type WorkerFailure = {
  id: number
  error: string
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, buffer, mimeType, format, originalSize } = event.data

  try {
    const inputBlob = new Blob([buffer], { type: mimeType })
    const bitmap = await createImageBitmap(inputBlob)

    try {
      const compressed = await compressImageBitmap(bitmap, format)
      const naturalWidth = bitmap.width
      const naturalHeight = bitmap.height

      if (!compressed || compressed.size >= originalSize) {
        const response: WorkerSuccess = {
          id,
          buffer,
          mimeType,
          naturalWidth,
          naturalHeight,
        }
        self.postMessage(response)
        return
      }

      const outBuffer = await compressed.arrayBuffer()
      const response: WorkerSuccess = {
        id,
        buffer: outBuffer,
        mimeType: outputMimeType(format),
        naturalWidth,
        naturalHeight,
      }
      self.postMessage(response, { transfer: [outBuffer] })
    } finally {
      bitmap.close()
    }
  } catch (err) {
    const response: WorkerFailure = {
      id,
      error: err instanceof Error ? err.message : String(err),
    }
    self.postMessage(response)
  }
}
