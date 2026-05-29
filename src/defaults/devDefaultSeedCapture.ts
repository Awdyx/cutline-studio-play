import { exportCutlineBackup } from '../backup/cutlineBackup'

/** Dev-only: write the current session as the bundled first-visit default seed. */
export async function saveBundledDefaultSeedFromSession(): Promise<void> {
  if (!import.meta.env.DEV) {
    throw new Error('only_available_in_dev')
  }

  const backup = await exportCutlineBackup()
  const response = await fetch('/__dev/save-default-seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backup),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(payload?.error ?? 'save_failed')
  }
}

if (import.meta.env.DEV) {
  ;(window as Window & { __saveCutlineDefaultSeed?: () => Promise<void> }).__saveCutlineDefaultSeed =
    saveBundledDefaultSeedFromSession
}
