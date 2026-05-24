/** Tracks when a native profile image picker is open (avoids submenu dismiss races). */
let openPickers = 0

export function beginProfileFilePicker(): void {
  openPickers += 1
}

export function endProfileFilePicker(): void {
  openPickers = Math.max(0, openPickers - 1)
}

export function isProfileFilePickerOpen(): boolean {
  return openPickers > 0
}
