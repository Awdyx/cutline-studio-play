import { useEffect, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import MotionIndicator from './MotionIndicator'
import TrailingVignette from './TrailingVignette'
import { usePanMotionHandler } from './usePanMotionHandler'

const CANVAS_SIZE = 3000
const meshColors = ['#e8f0fa', '#f5f8fc', '#dde8f5', '#ecf2f8', '#e0ebf5']

const meshBlobMotion = [
  {
    period: 14,
    size: 1600,
    path: [
      [8, 12],
      [32, 28],
      [22, 48],
      [8, 12],
    ],
  },
  {
    period: 18,
    size: 1700,
    path: [
      [88, 10],
      [72, 38],
      [92, 55],
      [88, 10],
    ],
  },
  {
    period: 22,
    size: 1800,
    path: [
      [48, 45],
      [62, 58],
      [38, 52],
      [48, 45],
    ],
  },
  {
    period: 26,
    size: 1650,
    path: [
      [12, 82],
      [28, 68],
      [18, 90],
      [12, 82],
    ],
  },
  {
    period: 30,
    size: 1750,
    path: [
      [85, 78],
      [70, 88],
      [92, 65],
      [85, 78],
    ],
  },
] as const

const meshKeyframesCss = meshBlobMotion
  .map(
    (blob, index) => `
@keyframes meshBlob${index} {
  0%, 100% { background-position: ${blob.path[0][0]}% ${blob.path[0][1]}%; }
  33% { background-position: ${blob.path[1][0]}% ${blob.path[1][1]}%; }
  66% { background-position: ${blob.path[2][0]}% ${blob.path[2][1]}%; }
}`,
  )
  .join('\n')

function getMinScale() {
  return Math.max(window.innerWidth / CANVAS_SIZE, window.innerHeight / CANVAS_SIZE)
}

function App() {
  const [minScale, setMinScale] = useState(getMinScale)
  const onPanning = usePanMotionHandler()

  useEffect(() => {
    const handleResize = () => setMinScale(getMinScale())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <MotionIndicator />
      <TrailingVignette />
      <TransformWrapper
        initialScale={1}
        minScale={minScale}
        maxScale={4}
        limitToBounds
        disablePadding
        centerZoomedOut={false}
        onInit={(ref) => ref.centerView()}
        onPanning={onPanning}
        wheel={{
          step: 0.02,
          activationKeys: (keys) =>
            keys.includes('Control') || keys.includes('Meta'),
        }}
        trackPadPanning={{ disabled: false }}
        panning={{ velocityDisabled: false }}
        velocityAnimation={{
          sensitivityMouse: 0.4,
          sensitivityTouch: 0.4,
          animationTime: 350,
          animationType: 'easeOut',
        }}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent
          wrapperStyle={{
            width: '100%',
            height: '100%',
            touchAction: 'none',
          }}
          contentStyle={{ willChange: 'transform' }}
        >
          <div
            style={{
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              position: 'relative',
              backgroundColor: meshColors[3],
            }}
            onPointerDown={(event) => {
              console.log(event.pointerType)
            }}
          >
            <style>{meshKeyframesCss}</style>
            {meshColors.map((color, index) => (
              <div
                key={color}
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `radial-gradient(circle, ${color} 0%, transparent 58%)`,
                  backgroundSize: `${meshBlobMotion[index].size}px ${meshBlobMotion[index].size}px`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: `${meshBlobMotion[index].path[0][0]}% ${meshBlobMotion[index].path[0][1]}%`,
                  animation: `meshBlob${index} ${meshBlobMotion[index].period}s ease-in-out infinite`,
                  willChange: 'background-position',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}

export default App
