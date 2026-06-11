# bento-dash

Drag-and-drop personal dashboard mock — widgets snap to a 6-column bento grid, resize to preset sizes/layouts, and can be filtered/customized.

Layout, profile, and settings are stored in `localStorage` only.

## Stack

| Layer         | Tech                                    |
| ------------- | --------------------------------------- |
| Framework     | Next.js 16 (App Router)                 |
| UI            | React 19, Motion (Framer), Lucide icons |
| Drag-and-drop | @dnd-kit/core                           |
| State         | Zustand 5 with `persist` middleware     |
| Tests         | Vitest + Testing Library                |

---

## Grid engine

The grid is a fixed **6-column** layout with a max row height of **4**. Each widget has `(x, y, w, h)` coordinates and an `order` integer.

Two layout strategies live in `lib/grid/strategies/` and share the same `LayoutStrategy` interface:

```ts
interface LayoutStrategy {
	resolve(widgets: WidgetLayout[]): WidgetLayout[];
	preview(widgets: WidgetLayout[], move: Move): WidgetLayout[];
}
```

`resolve` produces the canonical, settled layout. `preview` returns an ephemeral layout used during drag/resize without touching the store.

### `autoPack`

Sorts widgets by `order`, then packs each one into the first open slot scanning left-to-right, top-to-bottom (dense packing). Moving a widget re-ranks it within the sequence; the board then re-packs from scratch.

### `pushCompact`

Preserves the widget's requested `x` position. Each widget is placed at its requested column and then pulled upward as far as possible without overlapping anything above it. Dragging pins the dragged widget at the target cell and lets others float up around it.

The active strategy is selected by `settingsStore.layoutMode` and resolved through `lib/grid/engine.ts → getStrategy()`.

---

## State stores

All stores are in `lib/state/`.

| Store           | Persisted              | Contents                                                |
| --------------- | ---------------------- | ------------------------------------------------------- |
| `boardStore`    | yes (`bento-board`)    | `WidgetLayout[]`; move/resize/add/remove/swap actions   |
| `settingsStore` | yes (`bento-settings`) | theme, layoutMode, filterMode, activeTags, accent color |
| `dragStore`     | no                     | active drag ID, palette drop preview, FAB open state    |
| `uiStore`       | no                     | `manageMode` (widget remove/controls visible)           |

On rehydration `boardStore` calls `reResolve()` so persisted positions are re-compacted under the current strategy.

---

## Drag-and-drop

`AppShell` owns the single `DndContext`. Two drag flows share it:

**Widget drag** — dragging an existing widget from the board. `dragState` (local React state in `AppShell`) tracks the phase (`idle` / `dragging`) and the live preview layout. On `DragMove`, a hit-test against committed positions determines whether to do a **swap** (same-size widgets) or an **insert** (different sizes, snapping left/right of the hovered widget). On `DragEnd`, the committed store is updated once.

**Palette drag** — dragging a new widget from the FAB carousel (IDs prefixed `palette:<category>:<w>x<h>`). The drop preview is a ghost `DropPreview` cell on the board. On `DragEnd`, `boardStore.addWidget` is called with the drop cell.

A 4 px pointer distance activation constraint prevents accidental drags on click.

---

## Resize

`ResizeHandle` in the bottom-right corner of each widget uses pointer capture. `useDragResize` translates pointer delta into column/row units and emits `onPreview` (live, strategy-computed) and `onCommit` (persisted). The nearest size preset is shown as a snap indicator during the drag.

`WidgetWithResize` is intentionally declared at module scope in `BentoBoard.tsx` (not inline) so its identity is stable across renders — this keeps pointer capture alive for the duration of a resize gesture.

---

## Filtering

`settingsStore.activeTags` holds the active category filter (`finance | lifestyle | health | calendar`). Two modes:

- **hide** — only matching widgets are shown, re-resolved to pack tight. Drag/resize are locked while active to avoid ambiguous order mapping.
- **dim** — all widgets shown; non-matching ones are visually dimmed.

Removing the last widget of a filtered category automatically drops that category from `activeTags`.

---

## Widget registry

`lib/widgets/registry.ts` exports `WIDGET_REGISTRY`, an array of `WidgetDefinition` objects. Each entry declares the widget type, label, category, accent color, icon, supported size presets, and a `ContentComponent`. Currently all widgets render `WidgetSkeleton` (placeholder content).

---

## File layout

```
app/                     Next.js routes (layout + page)
components/
  board/                 BentoBoard, Widget, ResizeHandle, DropPreview, DragOverlay
  shell/                 AppShell, LeftBar, Banner, Fab, WidgetCarousel, SettingsModal, ProfileButton
  widgets/               WidgetSkeleton (placeholder content)
lib/
  grid/                  types, engine, sizes, occupancy, collision, swap, categories
    strategies/          autoPack, pushCompact
  hooks/                 useDragResize, useGridMetrics, useGreeting, useWeather
  state/                 boardStore, settingsStore, dragStore, uiStore
  data/                  seed.ts (default widget set)
  widgets/               registry.ts
docs/superpowers/        design specs and implementation plans
```

---

## Dev

```bash
npm run dev        # Next.js dev server
npm test           # Vitest (run once)
npm run test:watch # Vitest watch
npm run build      # production build
```
