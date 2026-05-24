import { showStudyHubPanBlockedHint } from '../canvasItems/studyHubFeedback'
import {
  isStudyHubWidgetTarget,
  isTrackpadPanWheel,
  CANVAS_PAN_SESSION_GAP_MS,
} from './studyHubPanScroll'

const COMPLETED_GESTURES_FOR_HINT = 3
const GESTURE_HINT_WINDOW_MS = 4000
/** Minimum horizontal travel to count as a pan attempt (wheel burst total or touch drag). */
const MIN_HORIZONTAL_GESTURE_DELTA = 48
const HORIZONTAL_GESTURE_DOMINANCE = 1.4

type HintWheelBurst = {
  sumDeltaX: number
  sumDeltaY: number
  endTimer: ReturnType<typeof setTimeout> | null
}

let activeWheelBurst: HintWheelBurst | null = null
let completedPanAttempts = 0
let completedPanAttemptsWindowStart = 0

function resetActiveWheelBurst() {
  if (activeWheelBurst?.endTimer != null) {
    clearTimeout(activeWheelBurst.endTimer)
  }
  activeWheelBurst = null
}

function noteCompletedHorizontalPanAttempt(sumDeltaX: number, sumDeltaY: number) {
  const absX = Math.abs(sumDeltaX)
  const absY = Math.abs(sumDeltaY)
  if (absX < MIN_HORIZONTAL_GESTURE_DELTA) return
  if (absX <= absY * HORIZONTAL_GESTURE_DOMINANCE) return

  const now = performance.now()
  if (
    completedPanAttempts === 0 ||
    now - completedPanAttemptsWindowStart > GESTURE_HINT_WINDOW_MS
  ) {
    completedPanAttempts = 0
    completedPanAttemptsWindowStart = now
  }

  completedPanAttempts += 1
  if (completedPanAttempts < COMPLETED_GESTURES_FOR_HINT) return

  completedPanAttempts = 0
  showStudyHubPanBlockedHint()
}

function finalizeWheelBurst() {
  const burst = activeWheelBurst
  activeWheelBurst = null
  if (!burst) return
  noteCompletedHorizontalPanAttempt(burst.sumDeltaX, burst.sumDeltaY)
}

function scheduleWheelBurstEnd() {
  if (!activeWheelBurst) return
  if (activeWheelBurst.endTimer != null) {
    clearTimeout(activeWheelBurst.endTimer)
  }
  activeWheelBurst.endTimer = setTimeout(finalizeWheelBurst, CANVAS_PAN_SESSION_GAP_MS)
}

/** Track wheel ticks over a study hub; count one attempt when the burst ends. */
export function feedStudyHubPanHintWheel(event: WheelEvent) {
  if (!isTrackpadPanWheel(event)) return
  if (!isStudyHubWidgetTarget(event.target)) {
    resetActiveWheelBurst()
    return
  }

  if (!activeWheelBurst) {
    activeWheelBurst = { sumDeltaX: 0, sumDeltaY: 0, endTimer: null }
  }

  activeWheelBurst.sumDeltaX += event.deltaX
  activeWheelBurst.sumDeltaY += event.deltaY
  scheduleWheelBurstEnd()
}

/** Count one attempt when a single-finger touch gesture ends on a study hub. */
export function feedStudyHubPanHintTouchEnd(totalDeltaX: number, totalDeltaY: number) {
  noteCompletedHorizontalPanAttempt(totalDeltaX, totalDeltaY)
}

export function cancelStudyHubPanHintTracking() {
  resetActiveWheelBurst()
  completedPanAttempts = 0
}

export function cancelStudyHubPanHintWheelBurst() {
  resetActiveWheelBurst()
}
