import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import { PHONE_CHROME_INSET } from '../styles/phoneChrome'
import { CHROME_FROSTED_MENU_CLASS, chromeFrostedMenuStyle, font } from '../styles/tokens'
import { playSubmenuTap } from '../sound/submenuSound'

const MODAL_TRANSITION = { duration: 0.18, ease: 'easeOut' as const }

export default function PhoneCenteredChromeModal({
  children,
  onDismiss,
  cardRef,
  cardDataAttributes,
  maxWidth = 300,
  maxHeight = 'min(72dvh, 520px)',
  zIndex = 55,
  cardStyle,
}: {
  children: ReactNode
  onDismiss: () => void
  cardRef?: RefObject<HTMLDivElement | null>
  cardDataAttributes?: Record<string, string>
  maxWidth?: number
  maxHeight?: string
  zIndex?: number
  cardStyle?: CSSProperties
}) {
  return createPortal(
    <motion.div
      data-phone-chrome-modal-scrim=""
      className="ui-chrome-scrim phone-chrome-modal-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={MODAL_TRANSITION}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: PHONE_CHROME_INSET,
      }}
      onClick={() => {
        playSubmenuTap()
        onDismiss()
      }}
    >
      <motion.div
        ref={cardRef}
        {...cardDataAttributes}
        className={`theme-surface ${CHROME_FROSTED_MENU_CLASS} phone-chrome-modal-card`}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={MODAL_TRANSITION}
        style={{
          position: 'relative',
          width: `min(${maxWidth}px, calc(100vw - ${PHONE_CHROME_INSET * 2}px))`,
          maxHeight,
          ...chromeFrostedMenuStyle,
          fontFamily: font.family,
          color: font.colorPrimary,
          overflow: 'hidden',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          ...cardStyle,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  )
}
