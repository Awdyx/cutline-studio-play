import { useEffect, useRef } from 'react'
import { playSound } from '../sound/playSound'

const PANEL_IDS = new Set([
  'news',
  'notifications',
  'profile',
  'cutline',
])

export function usePanelSounds(openPanel: string | null) {
  const prevPanel = useRef<string | null>(null)

  useEffect(() => {
    const wasPanel = prevPanel.current
    const isPanel = openPanel && PANEL_IDS.has(openPanel) ? openPanel : null

    if (!wasPanel && isPanel) playSound('menuOpen')
    if (wasPanel && !isPanel) playSound('menuClose')

    prevPanel.current = openPanel
  }, [openPanel])
}
