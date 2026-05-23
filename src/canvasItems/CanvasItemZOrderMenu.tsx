import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownToLine, ArrowUpToLine, Trash2 } from 'lucide-react'
import { MenuRow } from '../components/MenuRow'
import { SubmenuSoundScope } from '../components/SubmenuSoundScope'
import { CHROME_GLASS_CLASS, glass, menuDividerStyle } from '../styles/tokens'
import { useCanvasItemZMenuLayout } from './canvasItemZMenuLayout'
import { useCanvasItemDragStore } from './canvasItemDragStore'
import { useCanvasItemsStore } from './canvasItemsStore'
import TextAlignmentMenuSection from './TextAlignmentMenuSection'

export default function CanvasItemZOrderMenu() {
  const menuRef = useRef<HTMLDivElement>(null)
  const selectedIds = useCanvasItemsStore((s) => s.selectedIds)
  const activeDragItemId = useCanvasItemDragStore((s) => s.activeItemId)
  const bringToFront = useCanvasItemsStore((s) => s.bringToFront)
  const sendToBack = useCanvasItemsStore((s) => s.sendToBack)
  const deleteItem = useCanvasItemsStore((s) => s.deleteItem)

  const itemId = selectedIds.length === 1 ? selectedIds[0] : null
  const showMenu = itemId != null && activeDragItemId !== itemId

  const menuItem = useCanvasItemsStore((s) =>
    itemId ? s.items.find((item) => item.id === itemId) : undefined,
  )
  const isSpace = menuItem?.type === 'space'
  const showTextAlign =
    menuItem?.type === 'sticky' || menuItem?.type === 'text'

  const menuLayout = useCanvasItemZMenuLayout(menuRef, itemId, showMenu)

  return (
    <AnimatePresence>
      {showMenu && itemId && (
        <motion.div
          ref={menuRef}
          key={itemId}
          data-canvas-item-z-menu
          className={CHROME_GLASS_CLASS}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.7 }}
          style={{
            position: 'fixed',
            left: menuLayout.left,
            top: menuLayout.top,
            translate: `${menuLayout.translateX} 0`,
            zIndex: 30,
            minWidth: 168,
            padding: 4,
            borderRadius: 14,
            background: glass.bg,
            border: glass.border,
            boxShadow: glass.shadow,
            pointerEvents: 'auto',
            transformOrigin: menuLayout.transformOrigin,
            overflow: 'hidden',
          }}
        >
          <SubmenuSoundScope>
            {showTextAlign && menuItem && (
              <TextAlignmentMenuSection
                itemId={menuItem.id}
                alignment={menuItem.textAlign}
              />
            )}
            {!isSpace && (
              <>
                <MenuRow
                  icon={ArrowUpToLine}
                  label="Bring to front"
                  onClick={() => bringToFront(itemId)}
                />
                <MenuRow
                  icon={ArrowDownToLine}
                  label="Send to back"
                  onClick={() => sendToBack(itemId)}
                />
                <div style={menuDividerStyle} />
              </>
            )}
            <MenuRow
              icon={Trash2}
              label="Delete"
              destructive
              submenuClickSound={false}
              onClick={() => deleteItem(itemId)}
            />
          </SubmenuSoundScope>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
