import { useCanvasLockFlattenStore } from './canvasLockFlattenStore'

export default function CanvasLockFlattenLayer() {
  const segments = useCanvasLockFlattenStore((s) => s.segments)
  const ready = useCanvasLockFlattenStore((s) => s.ready)

  if (!ready || segments.length === 0) return null

  return (
    <>
      {segments.map((segment) => (
        <img
          key={segment.id}
          src={segment.dataUrl}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: segment.zIndex,
            pointerEvents: 'none',
            display: 'block',
          }}
        />
      ))}
    </>
  )
}
