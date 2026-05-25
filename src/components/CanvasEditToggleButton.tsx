import { PencilLine, PencilOff } from 'lucide-react'
import { useCanvasEditStore } from '../canvasEdit/canvasEditStore'
import { playSubmenuTap } from '../sound/submenuSound'
import ChromeTapSqueezeWrap from './ChromeTapSqueezeWrap'

export default function CanvasEditToggleButton() {
  const canvasEditEnabled = useCanvasEditStore((s) => s.enabled)
  const setCanvasEditEnabled = useCanvasEditStore((s) => s.setEnabled)
  const Icon = canvasEditEnabled ? PencilLine : PencilOff

  return (
    <ChromeTapSqueezeWrap compact>
      <button
        type="button"
        data-canvas-edit-toggle=""
        aria-label={canvasEditEnabled ? 'Canvas edit on' : 'Canvas edit off'}
        aria-pressed={canvasEditEnabled}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          playSubmenuTap()
          setCanvasEditEnabled(!canvasEditEnabled)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: 28,
          height: 28,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: 6,
          opacity: canvasEditEnabled ? 0.92 : 0.48,
        }}
      >
        <Icon size={15} color="var(--ui-text)" strokeWidth={1.8} />
      </button>
    </ChromeTapSqueezeWrap>
  )
}
