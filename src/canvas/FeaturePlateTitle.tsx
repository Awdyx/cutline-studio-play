import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCanvasFisheyeStore } from './canvasFisheyeStore'
import { useAppDestinationActive } from '../navigation/useAppDestinationActive'
import {
  FEATURE_PLATE_TITLES,
  FEATURE_PLATE_TITLE_SUFFIX,
  type FeaturePlateDestination,
} from './canvasPlate'

const TITLE_MOTION_EASE = [0.18, 1.22, 0.32, 1] as const
const TITLE_MOTION_MS = 0.54

const TITLE_FOCUS_OPACITY = 1
const TITLE_IDLE_OPACITY = 0.34
const TITLE_FOCUS_EASE = [0.22, 0.94, 0.28, 1] as const
const TITLE_FOCUS_MS = 0.22

type Props = {
  destination: FeaturePlateDestination
}

export default function FeaturePlateTitle({ destination }: Props) {
  const engaged = useCanvasFisheyeStore((s) => s.engaged)
  const reduceMotion = useReducedMotion()
  const active = useAppDestinationActive(destination)
  const label = FEATURE_PLATE_TITLES[destination]
  const focusOpacity = active ? TITLE_FOCUS_OPACITY : TITLE_IDLE_OPACITY

  return (
    <AnimatePresence>
      {engaged && (
        <motion.p
          key={`feature-plate-title-${destination}`}
          className={`feature-plate-title studio-centre-title${
            active ? ' studio-centre-title--active' : ''
          }`}
          aria-hidden
          initial={
            reduceMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  y: -72,
                  scale: 1.12,
                  filter: 'blur(14px)',
                }
          }
          animate={
            reduceMotion
              ? { opacity: focusOpacity }
              : {
                  opacity: focusOpacity,
                  y: 0,
                  scale: 1,
                  filter: 'blur(0px)',
                }
          }
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0.1 } }
              : {
                  opacity: 0,
                  y: -72,
                  scale: 1.12,
                  filter: 'blur(14px)',
                  transition: { duration: TITLE_MOTION_MS, ease: TITLE_MOTION_EASE },
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.12 }
              : {
                  opacity: { duration: TITLE_FOCUS_MS, ease: TITLE_FOCUS_EASE },
                  duration: TITLE_MOTION_MS,
                  ease: TITLE_MOTION_EASE,
                }
          }
          style={{ overflow: 'visible' }}
        >
          <span className="studio-centre-title__glow">
            <span className="studio-centre-title__word">{label}</span>
            <span className="studio-centre-title__heart">
              {FEATURE_PLATE_TITLE_SUFFIX[destination]}
            </span>
          </span>
        </motion.p>
      )}
    </AnimatePresence>
  )
}
