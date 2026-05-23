import { createStore, del, get, set } from 'idb-keyval'
import { mediaBlobKey, snapshotBlobKey } from './mediaKeys'

const blobStore = createStore('cutline-media', 'blobs')

export async function dataUrlToBlob(dataUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(dataUrl)
    return await response.blob()
  } catch (err) {
    console.warn('[media] failed to convert data URL to blob', err)
    return null
  }
}

export async function putMediaBlob(mediaId: string, blob: Blob): Promise<boolean> {
  try {
    await set(mediaBlobKey(mediaId), blob, blobStore)
    return true
  } catch (err) {
    console.warn(`[media] failed to save media ${mediaId}`, err)
    return false
  }
}

export async function putMediaFromDataUrl(
  mediaId: string,
  dataUrl: string,
): Promise<boolean> {
  const blob = await dataUrlToBlob(dataUrl)
  if (!blob) return false
  return putMediaBlob(mediaId, blob)
}

export async function getMediaBlob(mediaId: string): Promise<Blob | null> {
  try {
    const value = await get<Blob>(mediaBlobKey(mediaId), blobStore)
    return value instanceof Blob ? value : null
  } catch (err) {
    console.warn(`[media] failed to load media ${mediaId}`, err)
    return null
  }
}

export async function deleteMediaBlob(mediaId: string): Promise<void> {
  try {
    await del(mediaBlobKey(mediaId), blobStore)
  } catch (err) {
    console.warn(`[media] failed to delete media ${mediaId}`, err)
  }
}

export async function copyMediaBlob(
  sourceMediaId: string,
  targetMediaId: string,
): Promise<boolean> {
  const blob = await getMediaBlob(sourceMediaId)
  if (!blob) return false
  return putMediaBlob(targetMediaId, blob)
}

export async function putSnapshotBlob(spaceId: string, blob: Blob): Promise<boolean> {
  try {
    await set(snapshotBlobKey(spaceId), blob, blobStore)
    return true
  } catch (err) {
    console.warn(`[media] failed to save snapshot ${spaceId}`, err)
    return false
  }
}

export async function putSnapshotFromDataUrl(
  spaceId: string,
  dataUrl: string,
): Promise<boolean> {
  const blob = await dataUrlToBlob(dataUrl)
  if (!blob) return false
  return putSnapshotBlob(spaceId, blob)
}

export async function getSnapshotBlob(spaceId: string): Promise<Blob | null> {
  try {
    const value = await get<Blob>(snapshotBlobKey(spaceId), blobStore)
    return value instanceof Blob ? value : null
  } catch (err) {
    console.warn(`[media] failed to load snapshot ${spaceId}`, err)
    return null
  }
}

export async function deleteSnapshotBlob(spaceId: string): Promise<void> {
  try {
    await del(snapshotBlobKey(spaceId), blobStore)
  } catch (err) {
    console.warn(`[media] failed to delete snapshot ${spaceId}`, err)
  }
}

/** Verify a blob was written and can be read back. */
export async function verifyMediaBlob(mediaId: string): Promise<boolean> {
  const blob = await getMediaBlob(mediaId)
  return blob !== null && blob.size > 0
}

export async function verifySnapshotBlob(spaceId: string): Promise<boolean> {
  const blob = await getSnapshotBlob(spaceId)
  return blob !== null && blob.size > 0
}
