/** Solid canvas-bg veil — crossfades with content; mesh stays on the canvas only. */
export default function CanvasSwapVeil({
  opacity,
  transition,
}: {
  opacity: number
  transition?: string
}) {
  return (
    <div
      aria-hidden
      className="cutline-canvas-bg"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2,
        opacity,
        transition,
        pointerEvents: 'none',
      }}
    />
  )
}
