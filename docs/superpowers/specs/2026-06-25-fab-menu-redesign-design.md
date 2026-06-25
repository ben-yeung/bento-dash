# FAB Menu Redesign — Design Spec
**Date:** 2026-06-25
**Status:** Approved, pending implementation

---

## Overview

Redesign the FAB menu UI while preserving the existing drag-and-drop pipeline and the open/close morph animation. The new menu is a full-width bottom panel with two states: a **browse state** (scrolling row of 1×1 widget previews) and a **size-picker state** (proportional size variants for a selected widget). All drag logic in `AppShell.tsx` is unchanged.

---

## What is preserved unchanged

- `layoutId="fab-morph"` button → panel morph animation and spring configs (`SPRING_OPEN`, `SPRING_CLOSE`)
- Backdrop and close-on-outside-click behaviour
- `dragStore` (`fabOpen` / `setFabOpen`)
- All of `AppShell.tsx` drag handlers (`handleDragStart`, `handleDragMove`, `handleDragEnd`)
- Palette drag ID format: `palette:category:widgetType:WxH`
- `boardStore.addWidget` for click-to-add
- `setFabOpen(false)` on successful drop

---

## Panel structure

The panel anchors `bottom: 0; left: 0; right: 0` — full viewport width. Bottom edge is flat (0px radius), top corners are rounded (`22px`, matching the current carousel).

**Browse-state height (static):**
```
height = cellSize + 24px (label) + 32px (filter row) + 52px (padding)
```

**Size-picker-state height (grows upward):**
```
height = (maxVariantRows × cellSize) + ((maxVariantRows - 1) × gap)
       + 24px (label) + 36px (header) + 52px (padding)
```
`maxVariantRows` is derived from the tallest `supportedSize` of the selected widget (max of all `h` values). If `maxVariantRows === 1`, the panel does not grow — height stays at browse-state height. Height transition uses the existing `SPRING_OPEN` / `SPRING_CLOSE` spring configs.

`cellSize` is passed as a React prop from `AppShell` (which already holds `metrics.cellSize`) down through `Fab.tsx` → `WidgetCarousel`. The panel also sets `--cell-size: ${cellSize}px` on its root element so `ScaledWidgetContent` inside tiles inherits it automatically.

---

## Browse state

### Header bar
- Category filter chips left-aligned, horizontally scrollable (existing chip styles)
- Categories: All · Finance · Health · Calendar · Lifestyle
- Close button right-aligned

### Tile row
- Single horizontally scrolling row, `scrollbar-width: none`
- `padding-inline` on both ends so first/last tiles don't clip
- Tiles spaced with `--gap` (12px), matching board grid

### Tile anatomy
- **Size:** `cellSize × cellSize` (1:1 with a board 1×1 cell)
- **Content:** `ScaledWidgetContent` with `--cell-size` set to the panel's cell size — renders the actual widget `ContentComponent` at full scale
- **Label:** Widget name below the tile, `11px`, `var(--muted)`, centered, single line, `~20px` height
- **Border radius:** `var(--radius-tile)` (14px)
- **Accent bar:** 3px bottom strip in the widget's `accentColor`

### Tile interactions
| Gesture | Outcome |
|---------|---------|
| Drag (>4px movement) | Initiates `palette:category:widgetType:1x1` drag — existing pipeline unchanged |
| Click (no drag) | Transitions panel to size-picker state for this widget |

---

## Size-picker state

### Header bar
- Back button: `← Widgets` (left-aligned, rounded pill, `var(--muted)`)
- Selected widget name (right of back button, `13px`, `font-weight: 600`)

### Size tile row
- Single horizontally scrolling row, `scrollbar-width: none`
- Tiles are aligned to their bottom edge (`align-items: flex-end`) so short and tall variants sit on the same baseline
- Each tile is the selected widget's `ContentComponent` rendered at proportional 1:1 scale:
  - Width: `w × cellSize + (w - 1) × gap`
  - Height: `h × cellSize + (h - 1) × gap`
- Label below each tile: `W × H` dimension string, `10px`, `var(--muted)`

### Size tile interactions
| Gesture | Outcome |
|---------|---------|
| Drag (>4px movement) | Initiates `palette:category:widgetType:WxH` drag for that tile's size — existing pipeline unchanged |
| Click (no drag) | Calls `boardStore.addWidget(category, widgetType, w, h)` → adds to board bottom, then `setFabOpen(false)` |

### Back button
- Click → panel height transitions back to browse-state height; content crossfades to browse state

---

## Transitions & animation

### Height transition (browse ↔ size-picker)
- Driven by Framer Motion `animate={{ height: targetHeight }}` on the panel `<motion.div>` — CSS `transition: height` cannot produce spring physics
- Spring: reuses `SPRING_OPEN` (stiffness 320, damping 28) for expand; `SPRING_CLOSE` (stiffness 380, damping 36) for collapse
- `targetHeight` is computed in JS from `cellSize`, `gap`, and the selected widget's `maxVariantRows`
- Bottom edge stays pinned; top edge moves

### Content crossfade (browse ↔ size-picker)
- `AnimatePresence mode="wait"` — outgoing content exits fully before incoming enters
- Outgoing: `opacity 1 → 0` over ~100ms
- Incoming: `opacity 0 → 1` + `y: 8 → 0` over ~150ms, spring stiffness 340, damping 26 (matches existing size-picker popup spring in current `CarouselCard.tsx`)

---

## Component changes

### `WidgetCarousel.tsx` → rename/replace with new full-width panel component
- Remove fixed `min(580px, calc(100vw - 120px))` width constraint
- Panel is `width: 100%`, positioned by `.anchor` → `.fab-panel` full-width positioning
- Internal state: `activeFilter`, `selectedWidget` (null = browse state, widget definition = size-picker state)
- Renders either browse content or size-picker content, wrapped in `AnimatePresence mode="wait"`

### `CarouselCard.tsx` → split into two components
- **`BrowseTile.tsx`** — 1×1 tile for browse state. Props: `definition: WidgetDefinition`, `onSelect: () => void`, `cellSize: number`. Drag ID always `palette:category:type:1x1`.
- **`SizePickerTile.tsx`** — proportional tile for size-picker state. Props: `definition: WidgetDefinition`, `size: SizePreset`, `onAdd: (w, h) => void`, `cellSize: number`. Drag ID: `palette:category:type:WxH`.

### `Fab.module.css` + `WidgetCarousel.module.css`
- Update panel positioning: `left: 0; right: 0; bottom: 0; border-radius: 22px 22px 0 0`
- Remove carousel-specific width constraints
- Add `transition: height` for size-picker grow

### No changes to
- `AppShell.tsx`
- `dragStore.ts`
- `boardStore.ts`
- `lib/grid/engine.ts`
- `lib/grid/collision.ts`
- `lib/widgets/registry.ts`
- `ScaledWidgetContent.tsx`

---

## Out of scope

- Pagination controls (arrow buttons / dot indicators) for the size-picker row — horizontal scroll is sufficient for ≤4 variants
- Widget search / text filtering
- Reordering tiles in the browse state
- Any changes to board-side drag behaviour or grid layout engine
