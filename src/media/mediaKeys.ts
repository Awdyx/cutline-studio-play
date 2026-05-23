/** IndexedDB blob keys for canvas media and space preview snapshots. */
export function mediaBlobKey(mediaId: string): string {
  return `media:${mediaId}`
}

export function snapshotBlobKey(spaceId: string): string {
  return `snapshot:${spaceId}`
}

export function isInlineDataUrl(value: string): boolean {
  return value.startsWith('data:')
}
