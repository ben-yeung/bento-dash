# Horizontal Scroll Board Design

**Date:** 2026-06-25
**Status:** Approved

## Overview

Refactor the widget board to support two layout orientations — **vertical** (existing behavior, unchanged) and **horizontal** (new default). In horizontal mode the board is fixed-height and grows rightward, with scroll direction converted from vertical wheel input. A settings toggle switches between orientations; the choice persists to localStorage.

---

## 1. Settings & State

A new field `layoutOrientation: 'horizontal' | 'vertical'` is added to the board store alongside the existing `layoutMode` field.

- **Default:** `'horizontal'` for new saves
- **Existing saves:** absent field treated as `'vertical'` — backward compatible, no migration needed
- **Persistence:** same localStorage mechanism as `layoutMode`
- The settings panel exposes a toggle (Horizontal / Vertical) that dispatches a store update and triggers an immediate full reflow via the existing strategy pipeline

---

## 2. Grid Metrics (`useGridMetrics`)

The hook becomes orientation-aware. Its return shape gains a `rows` field:

```ts
{ cellSize: number; cols: number | 'auto'; rows: number | 'auto'; gap: number }
```

### Vertical mode (unchanged)
Observes container `clientWidth`. Computes:
```
cellSize = (width - (COLS - 1) × gap) / COLS   // COLS = 6
```
Returns `{ cellSize, cols: 6, rows: 'auto' }`.

### Horizontal mode (new)
Observes container `clientHeight` (`availableHeight = el.clientHeight`, where `el` is the `.scroll` container). Constants:
- `TARGET_CELL_SIZE = 180` — minimum target cell size in px
- `MIN_ROWS = 2` — floor to prevent degenerate single-row layouts

Computes:
```
rowCount = max(MIN_ROWS, floor(availableHeight / (TARGET_CELL_SIZE + gap)))
cellSize = (availableHeight - (rowCount - 1) × gap) / rowCount
```

Returns `{ cellSize, cols: 'auto', rows: rowCount }`.

A `ResizeObserver` on the scroll container fires on every height change (window resize, panel open/close). Each fire recomputes `rowCount` and `cellSize`, which triggers a full reflow via the strategy pipeline.

---

## 3. Strategy Engine (transpose wrapper)

`autoPack` and `pushCompact` are **not modified**. Both remain purely vertical strategies. Horizontal mode is implemented via a coordinate-transpose wrapper in `engine.ts`.

### Transpose wrapper

```
wrapHorizontal(strategy, rows):
  1. Clamp each widget's h to min(h, rows)        — prevent overflow beyond fixed row count
  2. Transpose all widgets: (x, y, w, h) → (y, x, h, w)   — swap both axes
  3. Run the vertical strategy with cols = rows
  4. Untranspose result: (y, x, h, w) → (x, y, w, h)      — self-inverse, restores orientation
```

The wrapper applies to both `resolve()` and `preview()` — every call that touches layout coordinates goes through the transpose. `getStrategy(layoutMode, orientation, rows)` returns:
- `orientation === 'vertical'`: bare strategy (today's behavior)
- `orientation === 'horizontal'`: `wrapHorizontal(bareStrategy, rows)`

### Invariants

- **Clamped `h` values are not written back to the store.** Canonical sizes live in the store; clamped values are layout-time only. If the viewport grows (more rows), widgets regain their full stored `h`.
- **`pushCompact` in horizontal = left-gravity.** The transposed strategy compacts upward in transposed space, which maps to compacting leftward in rendered space — the natural horizontal analogue of vertical gravity.

---

## 4. CSS Grid & Scroll

### Vertical mode (unchanged)
```css
/* BentoBoard */
grid-template-columns: repeat(6, 1fr);
grid-auto-rows: ${cellSize}px;
max-width: 1260px;

/* .scroll container */
overflow-y: auto;
padding: 0 28px 120px;
```

### Horizontal mode (new)

**Board (`BentoBoard`):**
```css
grid-template-rows: repeat(${rowCount}, ${cellSize}px);
grid-auto-columns: ${cellSize}px;   /* auto-creates column tracks as widgets are placed */
max-width: none;                     /* board grows as wide as content requires */
```

**Scroll container (`.scroll`):**
```css
overflow-x: auto;
overflow-y: hidden;
height: 100%;
padding-left: 28px;   /* aligns board with header at scrollLeft=0; no right padding */
```

`padding-left` is intentionally used (not `padding-right`). Modern browsers include `padding-left` in the `overflow-x` scrollable area, so at `scrollLeft = 0` the board aligns with header content. Scrolling back to origin feels natural with no cutoff. `padding-right` on overflow containers is browser-unreliable and omitted entirely, so widgets hang off the right edge for a seamless scroll experience.

**Wheel-to-scroll conversion:**

A `useEffect` on the scroll container intercepts `wheel` events and redirects vertical delta to horizontal scroll:
```ts
el.addEventListener('wheel', e => {
  e.preventDefault();
  el.scrollLeft += e.deltaY;
}, { passive: false });
```

Mouse wheel vertical input and trackpad vertical swipes scroll the board horizontally. Native trackpad horizontal swipe (`deltaX`) continues to work via browser default.

---

## 5. FAB & Drag-to-Place

### `pointToCell`
Unchanged. Maps pixel position → `(x, y)` using `(px - boardLeft) / (cellSize + gap)` for both axes. In horizontal mode `cellSize` is height-derived but the formula is identical — `x` is still column, `y` is still row.

### Bounds check on drop
Becomes orientation-aware:
- **Vertical (existing):** `x + w ≤ COLS`
- **Horizontal (new):** `y + h ≤ rowCount` — x is unbounded (board grows rightward)

### Size picker (FAB palette)
Size options with `h > rowCount` are hidden in horizontal mode to prevent selecting a widget taller than the board. Since `rowCount` is live, this updates automatically as the viewport resizes.

### Drop preview (`DropPreview.tsx`)
Unchanged. Uses `gridColumn` / `gridRow` placement with the same `(x, y, w, h)` values, which work correctly under both CSS grid configurations.

### FAB position
Fixed bottom-right in both modes. In horizontal mode, widgets scroll under it; no layout interaction needed.

---

## Key Files Affected

| File | Change |
|------|--------|
| `lib/grid/types.ts` | Add `LayoutOrientation` type; `TARGET_CELL_SIZE`, `MIN_ROWS` constants |
| `lib/hooks/useGridMetrics.ts` | Orientation-aware height/width observation; returns `rows` |
| `lib/grid/engine.ts` | Add `wrapHorizontal()`; update `getStrategy()` signature |
| `lib/state/boardStore.ts` | Add `layoutOrientation` field, default `'horizontal'`, persist |
| `components/board/BentoBoard.tsx` | Conditional CSS grid config per orientation |
| `components/board/BentoBoard.module.css` | Horizontal-mode grid styles |
| `components/shell/AppShell.tsx` | Wheel event conversion; orientation-aware bounds check |
| `components/shell/AppShell.module.css` | Horizontal-mode scroll container styles |
| `components/shell/CarouselCard.tsx` | Filter size options by `rowCount` in horizontal mode |
| Settings panel component | Add orientation toggle |

## Files NOT Changed

- `lib/grid/strategies/autoPack.ts`
- `lib/grid/strategies/pushCompact.ts`
- `lib/grid/occupancy.ts`
- `components/board/DropPreview.tsx`
- `components/board/Widget.tsx`
