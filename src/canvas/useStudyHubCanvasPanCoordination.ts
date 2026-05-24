import { useEffect } from 'react'
import { useCanvasNavigationStore } from './canvasNavigationStore'
import {
  cancelStudyHubPanHintTracking,
  cancelStudyHubPanHintWheelBurst,
  feedStudyHubPanHintTouchEnd,
  feedStudyHubPanHintWheel,
} from './studyHubPanHint'
import {
  CANVAS_PAN_SESSION_GAP_MS,
  isMultiTouchGesture,
  isSingleTouchPan,
  isStudyHubWidgetPoint,
  isStudyHubWidgetTarget,
  isTrackpadPanWheel,
} from './studyHubPanScroll'

let coordinationListenerCount = 0

type TouchHintSession = {
  pointerId: number
  startX: number
  startY: number
}

const wheelPanSession = {
  lastWheelAt: 0,
  startedOutsideStudyHub: false,
  endTimer: null as ReturnType<typeof setTimeout> | null,
}

const touchPanSession = {
  pointerId: null as number | null,
  startedOutsideStudyHub: false,
}

let touchHintSession: TouchHintSession | null = null

function setPanLock(active: boolean) {
  useCanvasNavigationStore.getState().setTrackpadPanLock(active)
}

function clearWheelPanSession() {
  wheelPanSession.startedOutsideStudyHub = false
  wheelPanSession.lastWheelAt = 0
  if (wheelPanSession.endTimer != null) {
    clearTimeout(wheelPanSession.endTimer)
    wheelPanSession.endTimer = null
  }
}

function clearTouchPanSession() {
  touchPanSession.pointerId = null
  touchPanSession.startedOutsideStudyHub = false
  touchHintSession = null
}

function clearAllPanSessions() {
  clearWheelPanSession()
  clearTouchPanSession()
  setPanLock(false)
}

function scheduleWheelPanSessionEnd() {
  if (wheelPanSession.endTimer != null) {
    clearTimeout(wheelPanSession.endTimer)
  }
  wheelPanSession.endTimer = setTimeout(() => {
    clearWheelPanSession()
    if (!touchPanSession.startedOutsideStudyHub) {
      setPanLock(false)
    }
  }, CANVAS_PAN_SESSION_GAP_MS)
}

function onWheelCapture(event: WheelEvent) {
  if (!isTrackpadPanWheel(event)) return

  const overStudyHub = isStudyHubWidgetTarget(event.target)
  const now = performance.now()
  const gap = now - wheelPanSession.lastWheelAt
  const newSession = gap > CANVAS_PAN_SESSION_GAP_MS || wheelPanSession.lastWheelAt === 0

  if (newSession) {
    wheelPanSession.startedOutsideStudyHub = !overStudyHub
  }

  wheelPanSession.lastWheelAt = now

  if (wheelPanSession.startedOutsideStudyHub) {
    cancelStudyHubPanHintWheelBurst()
    setPanLock(true)
    scheduleWheelPanSessionEnd()
    return
  }

  scheduleWheelPanSessionEnd()
  feedStudyHubPanHintWheel(event)
}

function onTouchStartCapture(event: TouchEvent) {
  if (isMultiTouchGesture(event)) {
    clearTouchPanSession()
    cancelStudyHubPanHintWheelBurst()
    if (!wheelPanSession.startedOutsideStudyHub) {
      setPanLock(false)
    }
    return
  }

  if (!isSingleTouchPan(event)) return

  const touch = event.touches[0]
  const overStudyHub =
    isStudyHubWidgetTarget(event.target) ||
    isStudyHubWidgetPoint(touch.clientX, touch.clientY)

  touchPanSession.pointerId = touch.identifier
  touchPanSession.startedOutsideStudyHub = !overStudyHub

  if (touchPanSession.startedOutsideStudyHub) {
    cancelStudyHubPanHintWheelBurst()
    touchHintSession = null
    setPanLock(true)
    return
  }

  touchHintSession = {
    pointerId: touch.identifier,
    startX: touch.clientX,
    startY: touch.clientY,
  }
}

function onTouchMoveCapture(event: TouchEvent) {
  if (isMultiTouchGesture(event)) {
    clearTouchPanSession()
    if (!wheelPanSession.startedOutsideStudyHub) {
      setPanLock(false)
    }
    return
  }

  if (!touchPanSession.startedOutsideStudyHub) return
  if (!isSingleTouchPan(event)) return

  const touch = event.touches[0]
  if (touchPanSession.pointerId !== touch.identifier) return

  setPanLock(true)
}

function finalizeTouchHint(changedTouch: Touch) {
  if (!touchHintSession || touchHintSession.pointerId !== changedTouch.identifier) {
    return
  }

  const dx = changedTouch.clientX - touchHintSession.startX
  const dy = changedTouch.clientY - touchHintSession.startY
  touchHintSession = null
  feedStudyHubPanHintTouchEnd(dx, dy)
}

function onTouchEndCapture(event: TouchEvent) {
  for (const touch of event.changedTouches) {
    if (touchPanSession.pointerId === touch.identifier) {
      if (touchPanSession.startedOutsideStudyHub) {
        touchPanSession.pointerId = null
        touchPanSession.startedOutsideStudyHub = false
        if (!wheelPanSession.startedOutsideStudyHub) {
          setPanLock(false)
        }
      } else {
        finalizeTouchHint(touch)
        touchPanSession.pointerId = null
      }
    } else {
      finalizeTouchHint(touch)
    }
  }

  if (event.touches.length === 0) {
    clearTouchPanSession()
    if (!wheelPanSession.startedOutsideStudyHub) {
      setPanLock(false)
    }
  }
}

function onBlur() {
  cancelStudyHubPanHintTracking()
  clearAllPanSessions()
}

function attachCoordinationListeners() {
  coordinationListenerCount += 1
  if (coordinationListenerCount > 1) return

  window.addEventListener('wheel', onWheelCapture, { capture: true, passive: true })
  window.addEventListener('touchstart', onTouchStartCapture, {
    capture: true,
    passive: true,
  })
  window.addEventListener('touchmove', onTouchMoveCapture, {
    capture: true,
    passive: true,
  })
  window.addEventListener('touchend', onTouchEndCapture, { capture: true, passive: true })
  window.addEventListener('touchcancel', onTouchEndCapture, { capture: true, passive: true })
  window.addEventListener('blur', onBlur)
}

function detachCoordinationListeners() {
  coordinationListenerCount -= 1
  if (coordinationListenerCount > 0) return

  window.removeEventListener('wheel', onWheelCapture, true)
  window.removeEventListener('touchstart', onTouchStartCapture, true)
  window.removeEventListener('touchmove', onTouchMoveCapture, true)
  window.removeEventListener('touchend', onTouchEndCapture, true)
  window.removeEventListener('touchcancel', onTouchEndCapture, true)
  window.removeEventListener('blur', onBlur)
  cancelStudyHubPanHintTracking()
  clearAllPanSessions()
}

/**
 * Trackpad + touch pan: once a gesture starts outside a study hub widget, keep
 * panning until it ends even if the pointer moves over the widget.
 */
export function useStudyHubCanvasPanCoordination() {
  useEffect(() => {
    attachCoordinationListeners()
    return detachCoordinationListeners
  }, [])
}
