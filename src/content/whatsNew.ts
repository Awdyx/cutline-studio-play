export type WhatsNewRelease = {
  version: string
  title: string
  highlights: string[]
}

/** Rough release notes inferred from repo history and shipped features. */
export const WHATS_NEW_RELEASES: WhatsNewRelease[] = [
  {
    version: '2.0',
    title: 'Cutline menu & polish',
    highlights: [
      'Cutline 2.0 dropdown with frosted-glass panels and flyout submenus',
      'Theme picker (light, dark, auto), shortcuts cheat sheet, and sound controls',
      'Canvas search in the top bar to jump to stickies, text, and spaces',
      'Sound effects plus optional background music',
      'Action toasts when you use keyboard shortcuts',
    ],
  },
  {
    version: '1.4',
    title: 'Drawing & tools',
    highlights: [
      'Pen, highlighter, and eraser with strokes saved to the canvas',
      'Floating tool palette and pencil-hold radial tool menu',
      'Per-tool colors with presets and a color popover',
      'Undo and redo for canvas edits',
    ],
  },
  {
    version: '1.3',
    title: 'Canvas items & spaces',
    highlights: [
      'Sticky notes, text blocks, and images you can drag and resize',
      'Spaces — nested boards you can open, work inside, and exit with a transition',
      'Canvas lock: pin the board and sketch on an annotation layer',
      'Duplicate, select-all, delete, and z-order menu for items',
      'Find on canvas via keyboard shortcut',
    ],
  },
  {
    version: '1.2',
    title: 'Look & feel',
    highlights: [
      'Customize panel to tune mesh gradient depth and palette',
      'Light, dark, and system-auto theme modes',
      'Animated mesh background that drifts with your palette',
      'Pan motion dot and trailing vignette while you move the canvas',
    ],
  },
  {
    version: '1.1',
    title: 'Frosted UI shell',
    highlights: [
      'Top bar with notifications and profile panels',
      'Plus FAB to add canvas items and study actions',
      'Shared glass tokens so chrome blurs the canvas behind it',
      'Panel open/close sounds',
    ],
  },
  {
    version: '1.0',
    title: 'Canvas foundation',
    highlights: [
      'Infinite pan and zoom with bounds locked to the board',
      'Pinch and trackpad pan with velocity easing',
      'Workspace, items, and strokes persisted locally',
      'Viewport-fixed UI that stays put while the canvas moves',
    ],
  },
]
