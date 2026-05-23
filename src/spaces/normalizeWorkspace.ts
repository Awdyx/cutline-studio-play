import type { CanvasItem } from '../canvasItems/types'
import { ensureStrokePaths } from '../drawing/strokePaths'
import type { LoadedWorkspace } from './workspacePersistence'

function normalizeCanvasItem(item: CanvasItem): CanvasItem {
  if (item.type !== 'sticky') return item
  return {
    ...item,
    strokes: ensureStrokePaths(item.strokes),
    ...(item.annotationStrokes
      ? { annotationStrokes: ensureStrokePaths(item.annotationStrokes) }
      : {}),
  }
}

/** Precompute stroke paths and normalize items before they hit React render. */
export function normalizeLoadedWorkspace(loaded: LoadedWorkspace): LoadedWorkspace {
  const spaces: LoadedWorkspace['spaces'] = {}
  for (const [id, space] of Object.entries(loaded.spaces)) {
    spaces[id] = {
      ...space,
      items: space.items.map(normalizeCanvasItem),
      strokes: ensureStrokePaths(space.strokes),
      annotationStrokes: ensureStrokePaths(space.annotationStrokes),
    }
  }

  return {
    ...loaded,
    mainItems: loaded.mainItems.map(normalizeCanvasItem),
    mainStrokes: ensureStrokePaths(loaded.mainStrokes),
    mainAnnotationStrokes: ensureStrokePaths(loaded.mainAnnotationStrokes),
    spaces,
  }
}
