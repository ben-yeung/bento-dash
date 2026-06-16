# FAB Drag-to-Place & Scaled Previews — Design Spec

**Date:** 2026-06-15
**Status:** Approved design — ready for implementation planning
**Scope:** Make the end-to-end flow work — **tap `+` → menu opens → drag a widget card onto the board** — with a live-reflow drop preview and a scaled placeholder preview in the menu. Integrates the recent `--cell-size` em-scaling work into the FAB carousel and replaces the half-built `palettePreview` path with the existing board-drag pipeline.

**Builds on:** `docs/superpowers/specs/2026-06-10-fab-widget-carousel-design.md` (FAB→carousel morph, registry, lifted `DndContext`). That spec shipped the morph + click-to-add + a chip-level drag stub; this spec finishes drag-to-place.

---

## 1. Problem

The intended flow — grab a widget from the menu and drag it onto the board with a live preview — does not work today:

1. The only draggable element is the small **size chip** inside an expanded card's size-picker (`palette:<cat>:<type>:<w>x<h>`), not the widget card itself. There's no "grab the widget and drag it in" affordance.
2. The palette drag runs on a **separate, half-built path**: `dragStore.palettePreview` → a standalone `DropPreview` that shows only a static landing footprint. Existing widgets do **not** reflow during the drag (unlike board-tile drags, which reflow live via `dragState.previewLayout`).
3. The recent `--cell-size` em-scaling work is not reflected anywhere in the FAB — carousel cards render only a dot + label (`STUB_METRICS` is passed in but unused).

---

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| Drag unit | **The whole card.** Drops at a default size; resize on the board afterward. |
| Default drop size | **`def.supportedSizes[0]`** (first supported size). No registry change. |
| Live preview while dragging | **Full live reflow** — existing widgets push aside in real time, reusing the `strategy.preview` pipeline; a ghost footprint marks the landing spot. |
| Preview content | **Neutral placeholder now** (`WidgetSkeleton`), scaled via `--cell-size`. A single seam renders the real `ContentComponent` once the in-flight content redesign lands. |
| Drop outside board bounds | Not added; **menu stays open** (treated as cancel). |
| Successful drop | Adds at the target cell, **menu closes** (morphs back to `+`). |

---

## 3. Architecture

### 3.1 Unify the palette drag into the board-drag pipeline

The board-tile drag already has the good pipeline: `dragState.previewLayout` computed via `strategy.preview`, with live reflow, landing ghost, and floating overlay — all rendered by `BentoBoard` from `previewLayout`.

**A palette drag becomes a temp widget injected into that same preview** via `strategy.preview(committed, { kind: 'add', widget })`. Routing palette drags through `dragState` (instead of the separate `palettePreview`) gives live reflow, the ghost, and the overlay for free.

**Removed in this pass:**
- `palettePreview` + `setPalettePreview` from `lib/state/dragStore.ts` (and the `PalettePreview` interface).
- The `palettePreview` `DropPreview` block in `components/board/BentoBoard.tsx` (lines rendering `id: '__pal__'`).

`dragStore` keeps only `fabOpen` / `setFabOpen` (drag state itself lives in `AppShell`'s `dragState` `useState`, as it does today for board tiles).

### 3.2 The drag unit: the whole card

`CarouselCard` becomes the draggable:
- `useDraggable({ id: 'palette:<category>:<type>:<w>x<h>' })` where `W×H = def.supportedSizes[0]`.
- The `PointerSensor` already uses `activationConstraint: { distance: 4 }`, so:
  - **Click** (no movement) → toggles the size picker (unchanged behavior).
  - **Drag** (>4px) → starts the palette drag at the default size.
- The size **chips** lose their `useDraggable` behavior and become **click-to-add only**. One clear drag model: the card.

The temp widget for the drag carries `category`, `widgetType`, `w`, `h` so the scaled overlay and the reflow preview render correctly.

### 3.3 Scaled previews via a shared seam

The em-scaling wrapper is currently **duplicated** inline in `Widget.tsx` and `DragOverlayWidget.tsx`:

```tsx
<div style={{ position: 'absolute', inset: 0,
  fontSize: 'clamp(8px, calc(var(--cell-size, 100px) / 10), 14px)' }}>
  <ContentComponent category={...} w={...} h={...} />
</div>
```

Extract it into one component:

```tsx
// components/widgets/ScaledWidgetContent.tsx
export function ScaledWidgetContent({ category, w, h, ContentComponent }: {
  category: Category; w: number; h: number;
  ContentComponent: React.ComponentType<WidgetContentProps>;
}) { /* the wrapper above */ }
```

Three consumers, each setting `--cell-size` on an ancestor:
- `Widget.tsx` (board tile) — `--cell-size` = board cell (from `metrics.cellSize`, already on the board grid).
- `DragOverlayWidget.tsx` (floating drag) — `--cell-size` = board cell (true scale).
- `CarouselCard.tsx` (menu) — `--cell-size` = a smaller **menu preview cell** constant so the placeholder renders correctly proportioned and shrunk inside the fixed-size card.

Content stays `WidgetSkeleton` for now. When the content redesign lands, swapping `def.ContentComponent` flows to all three at once — no change to drag/scaling infra. This is the single `TODO(widget-content)` seam.

---

## 4. AppShell drag handlers (palette branch rewrite)

`parsePaletteId` is unchanged (`palette:<cat>:<type>:<w>x<h>` → `{ cat, widgetType, w, h }`).

- **`handleDragStart` (palette):** parse id → build temp `WidgetLayout` (`{ id: paletteId, x:0, y:0, w, h, category, widgetType, order: maxOrder+1 }`) → set `dragState = { phase:'dragging', activeId: paletteId, targetKind:'none', previewLayout: committed }`. (The temp widget enters `previewLayout` on the first `move`.)
- **`handleDragMove` (palette):** `pointToCell` from the translated drag rect → `strategy.preview(committed, { kind:'add', widget: { ...temp, x: cell.x, y: cell.y } })` → store as `previewLayout` with `targetKind:'insert'`. No swap for palette (insert/none only).
- **`handleDragEnd` (palette):** if the drop point is inside the board bounds → `addWidget(cat, widgetType, w, h, { x, y })` + `setFabOpen(false)`; if outside → cancel (nothing added, menu stays open).
- **`handleDragCancel` (palette):** discard preview, menu stays open.

`activeWidget` (for `DragOverlay`) continues to derive a synthetic widget from the palette id, now consistent with the temp widget in `previewLayout`.

`BentoBoard` already: renders widgets from `previewLayout` during a drag, filters out `activeId` (rendered as the floating overlay instead), and renders the `DropPreview` ghost for `activeWidget` when `targetKind !== 'swap'`. So palette drags get reflow + ghost + overlay with no `BentoBoard`-specific palette code.

---

## 5. Files

**New:**
```
components/widgets/ScaledWidgetContent.tsx        (extracted scale seam)
docs/superpowers/specs/2026-06-15-fab-drag-to-place-design.md
```

**Modified:**
```
components/shell/CarouselCard.tsx     (card is draggable; chips click-only; scaled placeholder preview)
components/shell/WidgetCarousel.tsx   (drop unused STUB_METRICS plumbing if no longer needed)
components/shell/AppShell.tsx         (palette drag routed through dragState; bounds check on drop)
components/board/BentoBoard.tsx       (remove palettePreview DropPreview block)
components/board/Widget.tsx           (use ScaledWidgetContent)
components/board/DragOverlayWidget.tsx(use ScaledWidgetContent)
lib/state/dragStore.ts                (remove palettePreview / setPalettePreview / PalettePreview)
```

---

## 6. Testing

- **`ScaledWidgetContent`** — renders the given `ContentComponent` inside the scale wrapper with the expected `font-size` clamp.
- **`CarouselCard`** — the card is draggable (`useDraggable` wired); a click (no drag) still toggles the size picker; a size chip click calls `onAdd` with the correct `w,h`.
- **`AppShell` / palette routing** — existing `parsePaletteId` and `addWidget`-on-drop routing tests stay green; add coverage that a palette drop outside board bounds does **not** call `addWidget`.
- **`dragStore`** — update/remove tests referencing `palettePreview`.
- Live reflow and the floating overlay are validated **manually** — pointer-level dnd-kit interactions are too low-level for jsdom (same stance as the 2026-06-10 carousel spec).

---

## 7. Out of scope

- `TODO(widget-content)`: real per-type widget bodies (the content redesign in flight). `ScaledWidgetContent` + `def.ContentComponent` is the single replacement seam. anchor: `lib/widgets/registry.ts`.
- Per-widget curated default sizes (a `defaultSize` registry field) — deferred; first supported size is the default for now.
- Auto-scroll of the board when dragging a card near the top/bottom edge.
- Keyboard / touch affordances for drag-to-place.
- Changing the size-picker UX beyond removing chip-drag.
