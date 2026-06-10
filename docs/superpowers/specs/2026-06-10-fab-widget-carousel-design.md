# FAB Widget Carousel — Design Spec

**Date:** 2026-06-10
**Status:** Approved design — ready for implementation planning
**Scope:** Replace the skeleton plan's minimal FAB popover (Task 16) with a polished FAB-to-carousel morph interaction. Resolves `TODO(widget-content)` at the abstraction layer only — widget bodies remain `WidgetSkeleton` this pass, with a registry seam for future real content.

**Depends on:** `docs/superpowers/specs/2026-06-10-bento-dashboard-skeleton-design.md` (skeleton must be fully implemented first)

---

## 1. Goal

Replace the skeleton's minimal `Fab.tsx` (category chips + size chips + Add button) with a proper widget-creation experience:

1. A `+` FAB at the bottom-right morphs into a floating, glass-surfaced carousel panel when clicked.
2. The carousel shows horizontally scrollable 1×1 widget preview cards with category filter chips.
3. Clicking a card expands a size-variation picker upward from the card.
4. From the size picker the user can **click to add** (auto-placed by the active strategy) or **drag to place** (positions on the board before committing).
5. Clicking outside the panel, pressing the `×` button, or successfully adding a widget closes the carousel and morphs back to the FAB circle.

---

## 2. Architecture

### 2.1 DndContext elevation (Approach A)

The skeleton's `DndContext` lives inside `BentoBoard`. To support drag-to-place from the carousel, it must be **lifted to `AppShell`** so both the carousel cards and the board tiles share one drag context.

**Changes to existing components:**
- `BentoBoard` stops owning `DndContext`, `DragOverlay`, `useSensors` — these move to `AppShell`.
- `BentoBoard` receives drag state via a shared Zustand atom (`useDragStore`) rather than local `useState`, so `AppShell` can read and write it.
- All existing board drag behaviour (drag existing tiles, resize) is unchanged. `AppShell` simply becomes the `DndContext` host.

### 2.2 Drag id namespace

Draggable ids are namespaced to distinguish palette drags from board tile drags:
- Board tile: id = widget id (UUID), e.g. `"seed-0"`
- Palette item: id = `"palette:<category>:<w>x<h>"`, e.g. `"palette:finance:2x2"`

`AppShell`'s `onDragEnd` inspects the prefix to route to the right handler:
- `"palette:…"` → `boardStore.addWidget(category, w, h, targetCell)` (new overload that accepts an optional target cell; falls back to `strategy.preview` first-fit if omitted)
- anything else → existing `boardStore.moveWidget(id, targetCell)`

### 2.3 Widget definition registry

```ts
// lib/widgets/registry.ts
export interface WidgetDefinition {
  type: string;                    // unique key, e.g. "finance"
  label: string;                   // display name
  category: Category;
  accentColor: string;             // dot color in the carousel card
  supportedSizes: SizePreset[];    // subset of SIZE_PRESETS shown in size picker
  // Content slot — swap WidgetSkeleton for a real component when ready.
  // TODO(widget-content): replace WidgetSkeleton with per-type content components.
  //   anchor: lib/widgets/registry.ts
  //   sites: components/widgets/WidgetSkeleton.tsx, components/board/Widget.tsx
  ContentComponent: React.ComponentType<WidgetContentProps>;
}

export interface WidgetContentProps {
  category: Category;
  w: number;
  h: number;
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  { type: 'finance',   label: 'Finance',   category: 'finance',   accentColor: '#6366f1', supportedSizes: [...], ContentComponent: WidgetSkeleton },
  { type: 'health',    label: 'Health',    category: 'health',    accentColor: '#10b981', supportedSizes: [...], ContentComponent: WidgetSkeleton },
  { type: 'calendar',  label: 'Calendar',  category: 'calendar',  accentColor: '#f59e0b', supportedSizes: [...], ContentComponent: WidgetSkeleton },
  { type: 'lifestyle', label: 'Lifestyle', category: 'lifestyle', accentColor: '#ec4899', supportedSizes: [...], ContentComponent: WidgetSkeleton },
];
```

`Widget.tsx` renders `def.ContentComponent` instead of importing `WidgetSkeleton` directly. This is the single seam point for future real content.

---

## 3. New components

```
components/shell/Fab.tsx                  (replaces skeleton Task 16 Fab)
components/shell/Fab.module.css
components/shell/WidgetCarousel.tsx
components/shell/WidgetCarousel.module.css
components/shell/CarouselCard.tsx
components/shell/CarouselCard.module.css
lib/widgets/registry.ts
lib/state/dragStore.ts                    (lifted drag state)
```

Modified:
```
components/shell/AppShell.tsx             (owns DndContext + DragOverlay)
components/board/BentoBoard.tsx           (removes DndContext, reads dragStore)
components/board/Widget.tsx              (renders ContentComponent from registry)
lib/state/boardStore.ts                  (addWidget gains optional targetCell)
```

---

## 4. Component designs

### 4.1 `Fab.tsx`

Owns open/closed state. Renders two children inside a shared `fab-anchor` fixed container:

1. **`fab-btn`** — `<motion.button layoutId="fab-morph">` circle, `z-index: 100`. Visible when closed; fades + scales to 0 when open.
2. **`WidgetCarousel`** — `<motion.div layoutId="fab-morph">` panel, same `layoutId`. Visible when open.

`motion`'s `layoutId` shared element transition handles the circle-to-panel morph automatically via FLIP. `AnimatePresence` wraps each so they enter/exit cleanly.

**Animation spec (motion spring):**
- Open: `type: "spring", stiffness: 320, damping: 28, mass: 0.9` — gentle overshoot, settles in ~380ms
- Close: `type: "spring", stiffness: 380, damping: 36, mass: 0.85` — slightly snappier pull-back
- `transform-origin: bottom right` on the panel so it grows from / contracts toward the FAB corner

**Positioning:** `position: fixed; right: 28px; bottom: 28px; z-index: 100`. Both children align to the bottom-right of this anchor.

**Click-outside:** A full-screen transparent backdrop (`position: fixed; inset: 0; z-index: 90`) is rendered via `AnimatePresence` when open. A click on it fires `onClose`. The panel itself uses `e.stopPropagation()` on its wrapper click.

### 4.2 `WidgetCarousel.tsx`

The expanded panel. Glass surface (`backdrop-filter: blur(24px)`), `border-radius: 22px`, `max-width: min(580px, calc(100vw - 120px))`, right-anchored.

Layout (top to bottom):
1. **Header row** — "Add widget" label (left) + `×` close button (right)
2. **Filter chip row** — "All" + one chip per category; horizontally scrollable, no scrollbar; active chip uses `--accent` tint
3. **Cards row** — horizontally scrollable row of `CarouselCard` components; no scrollbar visible

Filtering: `activeCategoryFilter` local state (default: `null` = All). When set, only cards matching that category are rendered; others are removed with `AnimatePresence` exit.

### 4.3 `CarouselCard.tsx`

Props: `definition: WidgetDefinition`, `metrics: GridMetrics`, `onAdd(w, h): void`, `onDragStart(w, h): void`.

**Closed state:** 80×80px tile showing the category accent dot + label. Hover lifts 2px.

**Open (size picker) state:** triggered by clicking the card. The size picker is a `motion.div` with `initial={{ opacity: 0, y: 6, scale: 0.95 }}` → `animate={{ opacity: 1, y: 0, scale: 1 }}` positioned `bottom: calc(100% + 10px)` — expands upward. Contains:
- Category name label
- Size chip row (one chip per `supportedSizes` entry)
- "click to add · drag to place" hint

**Size chip interaction:**
- `onClick` → calls `onAdd(preset.w, preset.h)` → `boardStore.addWidget` → carousel closes
- `onPointerDown` with a 4px drag threshold → if dragged, calls `onDragStart(preset.w, preset.h)` which activates the palette drag in the shared `DndContext`

Only one card can have its picker open at a time (controlled by `selectedCardType` in `WidgetCarousel`).

A downward caret `::after` pseudo-element points from the bubble to the card.

### 4.4 `dragStore.ts` (lifted drag state)

```ts
interface DragState {
  activeId: string | null;
  preview: WidgetLayout[] | null;
  setActiveId: (id: string | null) => void;
  setPreview: (p: WidgetLayout[] | null) => void;
}
export const useDragStore = create<DragState>()(...)
```

`BentoBoard` reads `activeId` and `preview` from this store instead of local `useState`. `AppShell`'s `onDragStart/Move/End/Cancel` handlers write to it.

---

## 5. Drag-to-place flow (palette → board)

1. User pointer-downs on a size chip and drags past 4px threshold.
2. `CarouselCard` calls `onDragStart(w, h)` → `WidgetCarousel` calls `AppShell`'s exposed `startPaletteDrag(type, w, h)`.
3. `AppShell` sets `dragStore.activeId = "palette:finance:2x2"` and programmatically activates the dnd-kit sensor.
4. `DragOverlay` renders a `DragOverlayWidget` sized to `w×h` following the cursor (same component used for board tile drags).
5. `onDragMove`: `pointToCell` → `getStrategy(layoutMode).preview(committed, { kind: 'add', widget: { ...tempWidget, x: cell.x, y: cell.y } })` → `dragStore.setPreview(result)`. `DropPreview` renders the landing footprint.
6. `onDragEnd`: `boardStore.addWidget(category, w, h, targetCell)` — new overload places at the target cell. Carousel closes.
7. `onDragCancel`: discard preview, carousel stays open.

If the user drops outside the board bounds, the widget is not added (drag cancelled).

---

## 6. `boardStore` change: `addWidget` with optional target cell

```ts
addWidget: (category: Category, w: number, h: number, targetCell?: { x: number; y: number }) => void
```

When `targetCell` is provided, the strategy's `preview` is called with `{ kind: 'add', widget: { ...newWidget, x: targetCell.x, y: targetCell.y } }` — the strategy places it at or near the target (exact behavior depends on active strategy: `autoPack` repacks from order, `pushCompact` anchors at cell and pushes). When omitted, behavior is unchanged (first-fit placement).

---

## 7. Supported sizes per category

Each category exposes a curated subset of `SIZE_PRESETS`:

| Category  | Supported sizes               |
|-----------|-------------------------------|
| Finance   | 1×1, 2×1, 2×2, 3×2, 4×2      |
| Health    | 1×1, 2×2, 2×3                 |
| Calendar  | 1×2, 2×3, 3×3                 |
| Lifestyle | 1×1, 2×1, 3×2, 4×4            |

These live in `WIDGET_REGISTRY` and can be extended without touching the carousel components.

---

## 8. Animation summary

| Element                  | Motion config                                          |
|--------------------------|--------------------------------------------------------|
| FAB → carousel (open)    | `layoutId="fab-morph"`, spring `k=320 d=28 m=0.9`     |
| Carousel → FAB (close)   | same `layoutId`, spring `k=380 d=36 m=0.85`           |
| FAB `+` icon fade-out    | `AnimatePresence`, `exit: { opacity:0, scale:0.5 }`   |
| Carousel content fade-in | `initial:{opacity:0}` → `animate:{opacity:1}` delay 0.15s |
| Size picker expand up    | `initial:{opacity:0,y:6,scale:.95}` → `animate:{opacity:1,y:0,scale:1}` spring `k=340 d=26` |
| Card filter exit         | `AnimatePresence`, `exit:{opacity:0,scale:.9}`         |
| Backdrop                 | `AnimatePresence`, `initial:{opacity:0}` → `animate:{opacity:1}` |
| Board dim on open        | CSS transition `opacity .3s, filter .3s`               |

---

## 9. Theming

Carousel panel uses the existing `.glass` utility class (`backdrop-filter: blur(24px) saturate(1.4); background: var(--surface-glass); border: 1px solid var(--border-hairline)`). No new tokens needed.

Category accent colors are defined in `WIDGET_REGISTRY` and used only for the dot in the carousel card — not applied to board tiles (tiles keep `var(--surface)` per the skeleton's aesthetic rules).

---

## 10. Testing

- **Unit:** `registry.ts` — `WIDGET_REGISTRY` has 4 entries, each with non-empty `supportedSizes`, valid `category`, and `ContentComponent` defined.
- **Interaction test (`WidgetCarousel.test.tsx`):** render carousel with mock registry → clicking a card opens its size picker → clicking a size chip calls `onAdd` with correct `w,h` → second card click closes the first picker and opens the new one.
- **Interaction test (`Fab.test.tsx`):** FAB renders closed → click opens carousel → click backdrop fires close → store `addWidget` is called on chip click.
- Board-level drag-to-place validated manually (pointer events too low-level for jsdom).

---

## 11. Out of scope

- `TODO(widget-content)`: real per-type widget bodies. The `ContentComponent` slot in `WIDGET_REGISTRY` is the single replacement point. anchor: `lib/widgets/registry.ts`
- Keyboard navigation within the carousel (tab through cards, arrow keys for size chips).
- Touch/mobile swipe-to-dismiss the carousel.
- More than 4 widget types in the registry this pass — the scroll row handles N cards but only 4 are seeded.
