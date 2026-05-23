/** True when the platform convention is Cmd (⌘); false for Ctrl. */
export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

export function modKeyLabel(): string {
  return isMacPlatform() ? '⌘' : 'Ctrl'
}

export function modKeyEvent(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey
}
