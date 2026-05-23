export const MAX_MEDIA_BYTES = 5 * 1024 * 1024
export const MAX_MEDIA_DIMENSION = 400

export function isAcceptedMediaFile(file: File): boolean {
  return file.type.startsWith('image/') || file.type.startsWith('video/')
}

function rejectOversize(file: File): boolean {
  if (file.size > MAX_MEDIA_BYTES) {
    console.warn(
      `[canvas] rejected ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 5MB`,
    )
    return true
  }
  return false
}

function fitDimensions(
  naturalWidth: number,
  naturalHeight: number,
): { width: number; height: number } {
  const max = MAX_MEDIA_DIMENSION
  if (naturalWidth <= max && naturalHeight <= max) {
    return { width: naturalWidth, height: naturalHeight }
  }
  const scale = max / Math.max(naturalWidth, naturalHeight)
  return {
    width: Math.round(naturalWidth * scale),
    height: Math.round(naturalHeight * scale),
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function loadVideoMeta(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => resolve(video)
    video.onerror = reject
    video.src = src
  })
}

export async function prepareImageFromFile(
  file: File,
): Promise<{ src: string; width: number; height: number } | null> {
  if (!file.type.startsWith('image/')) return null
  if (rejectOversize(file)) return null

  const dataUrl = await readFileAsDataUrl(file)
  const img = await loadImage(dataUrl)
  const { width, height } = fitDimensions(img.naturalWidth, img.naturalHeight)
  return { src: dataUrl, width, height }
}

export async function prepareVideoFromFile(
  file: File,
): Promise<{ src: string; width: number; height: number } | null> {
  if (!file.type.startsWith('video/')) return null
  if (rejectOversize(file)) return null

  const dataUrl = await readFileAsDataUrl(file)
  const video = await loadVideoMeta(dataUrl)
  const { width, height } = fitDimensions(
    video.videoWidth || 320,
    video.videoHeight || 240,
  )
  return { src: dataUrl, width, height }
}

export async function prepareMediaFromFile(
  file: File,
): Promise<{ kind: 'image' | 'video'; src: string; width: number; height: number } | null> {
  if (!isAcceptedMediaFile(file)) return null
  if (file.type.startsWith('video/')) {
    const video = await prepareVideoFromFile(file)
    return video ? { kind: 'video', ...video } : null
  }
  const image = await prepareImageFromFile(file)
  return image ? { kind: 'image', ...image } : null
}
