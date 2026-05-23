import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'
import { clientToCanvas } from '../drawing/canvasCoords'
import { useCanvasItemsStore } from './canvasItemsStore'
import { isAcceptedMediaFile, prepareMediaFromFile } from './mediaUtils'
import { viewportCenterCanvas } from './viewportCenter'

export function useCanvasFileHandlers(
  transformRef: RefObject<ReactZoomPanPinchContentRef | null>,
  canvasRef: RefObject<HTMLDivElement | null>,
) {
  const imageInputRef = useRef<HTMLInputElement>(null)

  const placeMediaAt = useCallback(
    async (file: File, canvasX: number, canvasY: number) => {
      const prepared = await prepareMediaFromFile(file)
      if (!prepared) return
      const { addImage, addVideo } = useCanvasItemsStore.getState()
      if (prepared.kind === 'image') {
        addImage(canvasX, canvasY, prepared.src, prepared.width, prepared.height)
      } else {
        addVideo(canvasX, canvasY, prepared.src, prepared.width, prepared.height)
      }
    },
    [],
  )

  const openImagePicker = useCallback(() => {
    imageInputRef.current?.click()
  }, [])

  const spawnStickyAtViewportCenter = useCallback(() => {
    const center = viewportCenterCanvas(transformRef, canvasRef.current)
    if (!center) return
    useCanvasItemsStore.getState().addSticky(center.x, center.y)
  }, [transformRef, canvasRef])

  const spawnTextAtViewportCenter = useCallback(() => {
    const center = viewportCenterCanvas(transformRef, canvasRef.current)
    if (!center) return
    useCanvasItemsStore.getState().addText(center.x, center.y)
  }, [transformRef, canvasRef])

  const spawnSpaceAtViewportCenter = useCallback(() => {
    const center = viewportCenterCanvas(transformRef, canvasRef.current)
    if (!center) return
    useCanvasItemsStore.getState().addSpace(center.x, center.y)
  }, [transformRef, canvasRef])

  const onImageInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      const center = viewportCenterCanvas(transformRef, canvasRef.current)
      if (!center) return
      await placeMediaAt(file, center.x, center.y)
    },
    [transformRef, canvasRef, placeMediaAt],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function canvasPointFromClient(clientX: number, clientY: number) {
      return clientToCanvas(clientX, clientY, transformRef, canvas)
    }

    function onDragOver(e: DragEvent) {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }

    async function onDrop(e: DragEvent) {
      const dropped = e.dataTransfer?.files?.[0]
      if (!dropped || !isAcceptedMediaFile(dropped)) return
      e.preventDefault()
      e.stopPropagation()
      const point = canvasPointFromClient(e.clientX, e.clientY)
      if (!point) return
      await placeMediaAt(dropped, point.x, point.y)
    }

    canvas.addEventListener('dragover', onDragOver)
    canvas.addEventListener('drop', onDrop)
    return () => {
      canvas.removeEventListener('dragover', onDragOver)
      canvas.removeEventListener('drop', onDrop)
    }
  }, [canvasRef, transformRef, placeMediaAt])

  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return

      for (const entry of items) {
        if (entry.kind !== 'file') continue
        const file = entry.getAsFile()
        if (!file || !isAcceptedMediaFile(file)) continue

        e.preventDefault()
        const center = viewportCenterCanvas(transformRef, canvasRef.current)
        if (!center) return
        await placeMediaAt(file, center.x, center.y)
        return
      }
    }

    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [transformRef, canvasRef, placeMediaAt])

  return {
    imageInputRef,
    onImageInputChange,
    openImagePicker,
    spawnStickyAtViewportCenter,
    spawnTextAtViewportCenter,
    spawnSpaceAtViewportCenter,
  }
}
