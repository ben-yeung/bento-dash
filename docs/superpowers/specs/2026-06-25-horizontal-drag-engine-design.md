# Horizontal Drag Engine Design

**Date:** 2026-06-25
**Status:** Approved

## Problem

In horizontal layout mode, dragging a widget causes surrounding widgets to visually shift into what look like vertical positions mid-drag, then spring back to correct horizontal positions on drop. This happens because the current engine uses a transposition trick: it flips all widget coordinates from horizontal space into the vertical engine's space, runs the vertical packing algorithm, then unflips the results. The intermediate previewLayout positions look wrong to the user.

## Goal

Replace the transposition layer with native horizontal packing strategies — the horizontal equivalent of the existing `autoPack` and `pushCompact` strategies — so that widgets shift left/right naturally during live drag with no visual artifacts.

## Scope

**4 files change. Nothing else.**

| File | Change |
|---|---|
| `lib/grid/occupancy.ts` | Add `fitsH` — bounds `y + h ≤ rows` instead of `x + w ≤ cols` |
| `lib/grid/strategies/autoPack.ts` | Add `packDenseH`, `reorderByCellH`, `createAutoPackH` |
| `lib/grid/strategies/pushCompact.ts` | Add `compactHorizontal`, `pushCompactDragH`, `createPushCompactH` |
| `lib/grid/engine.ts` | Delete transposition functions; `getStrategy` calls H factories directly, reads `rowCount` from `gridState` |

**Unchanged:** `AppShell.tsx`, `Widget.tsx`, `BentoBoard.tsx`, `DragOverlayWidget.tsx`, `DropPreview.tsx`, `collision.ts`, all stores, all CSS. The drag event pipeline, animations, overlay, and hit-detection need no changes. `pointToCell` already returns native horizontal coords (x unbounded, y bounded by rowCount).

## Architecture

### Algorithm Selection

`getStrategy(mode, orientation)` — `orientation` is the sole selector (from `settingsStore.layoutOrientation`). No `rowCount` parameter at the call site.

When `orientation === 'horizontal'`, `getStrategy` reads `rowCount` from `gridState` internally and passes it to the H factory. This keeps the engine responsive to viewport resizes (rowCount adapts to available height) without coupling callers to the grid metrics.

```
getStrategy(mode, 'horizontal')
  → rowCount = gridState.getState().rowCount
  → mode === 'pushCompact' ? createPushCompactH(rowCount, LARGE)
                           : createAutoPackH(rowCount, LARGE)

getStrategy(mode, 'vertical')
  → mode === 'pushCompact' ? pushCompact : autoPack   // unchanged
```

The four transposition helpers (`transposeWidget`, `untransposeWidget`, `transposeMove`, `wrapHorizontal`) are deleted entirely.

### Axis conventions

| Mode | Bounded axis | Unbounded axis | Pack direction |
|---|---|---|---|
| Vertical | x (cols = 6) | y (rows grow down) | top priority |
| Horizontal | y (rows = rowCount) | x (cols grow right) | left priority |

In horizontal mode: `x` = column (unbounded, grows right), `y` = row (bounded by `rowCount`). Widget `w` = column span, `h` = row span ≤ rowCount.

## New Functions

### `occupancy.ts` — `fitsH`

Identical to `fits` except the bounds check is `y + h > rows` instead of `x + w > cols`. The grid traversal (checking `grid[r][c]`) is unchanged. `occupy` is reused as-is.

```typescript
export function fitsH(grid: Grid, x: number, y: number, w: number, h: number, rows: number): boolean {
  if (x < 0 || y < 0 || y + h > rows) return false;
  for (let r = y; r < y + h; r++) {
    const row = grid[r];
    if (!row) continue;
    for (let c = x; c < x + w; c++) {
      if (row[c]) return false;
    }
  }
  return true;
}
```

### `autoPack.ts` — horizontal additions

**`packDenseH(widgets, rows, maxW)`** — left-priority dense pack:
- Sort by `order`
- Outer loop: `x = 0, 1, 2, ...` (unbounded, grows right — left priority)
- Inner loop: `y = 0` to `rows - h` (bounded by row count)
- First fitting (x, y) wins; uses `fitsH`

**`reorderByCellH(widgets, id, targetCell, rows)`** — horizontal ordering for drag:
- Rank formula = `x * rows + y` (x is primary, y is tiebreaker)
- Mirrors `reorderByCell` but with axes swapped in the rank formula
- Splices moving widget at its target rank, repacks with `packDenseH`

**`createAutoPackH(rows, maxW)`** — factory:
- `resolve`: `packDenseH(widgets, rows, maxW)`
- `preview` `drag`: `packDenseH(reorderByCellH(widgets, id, targetCell, rows), rows, maxW)`
- `preview` `resize`, `add`, `remove`, `swap`: same structure as `createAutoPack`, using `packDenseH`

### `pushCompact.ts` — horizontal additions

**`compactHorizontal(widgets, rows, maxW)`** — left-priority position-preserving compact:
- Sort by `x` then `y` (left-to-right, top-within-column)
- For each widget: clamp `y` to `[0, rows - h]`, start at `x = max(0, wdg.x)`, walk rightward until `fitsH` (clears any collision), then walk leftward as far as `fitsH` allows — gives each widget the leftmost position it can reach without disturbing already-placed widgets

**`pushCompactDragH(widgets, id, targetCell, rows, maxW)`** — place-and-pack:
- Place moving widget at `(clamp(targetCell.x, 0, maxW - w), clamp(targetCell.y, 0, rows - h))`
- Sort others by `x` then `y`
- For each other: fix `y` within bounds, scan from `x = 0` rightward for first `fitsH` fit
- Mirrors `pushCompactDrag` with horizontal axis

**`createPushCompactH(rows, maxW)`** — factory:
- `resolve`: `compactHorizontal(widgets, rows, maxW)`
- `preview` `drag`: `pushCompactDragH(widgets, id, targetCell, rows, maxW)`
- `preview` `resize`, `add`, `remove`, `swap`: same structure as `createPushCompact`, using `compactHorizontal`

## Data Flow During Drag (after change)

1. User drags widget → `AppShell.onDragMove` (unchanged)
2. `pointToCell` returns native horizontal (x, y) — already correct, no change
3. `getStrategy(layoutMode, 'horizontal')` → reads `rowCount` from `gridState` → returns H strategy
4. Strategy `.preview(widgets, { kind: 'drag', id, targetCell })` → widgets shift left/right in native horizontal coords
5. `dragState.previewLayout` holds correct horizontal positions throughout drag
6. Framer-motion spring animations in `Widget.tsx` animate to correct (x, y) — no visual artifact

## Responsive Behavior

`rowCount` is read fresh from `gridState` on each `getStrategy` call. `gridState` is updated by `useGridMetrics` on viewport resize. So if the user resizes the window mid-session, the next drag move picks up the new rowCount automatically. This matches the current adaptive behavior.

## Testing

New unit tests for each horizontal function (mirrors existing vertical tests):

- `packDenseH`: left-priority placement, row bound enforcement, order preservation
- `reorderByCellH`: x-primary rank ordering, correct insert index
- `compactHorizontal`: leftward compaction, row clamping, sort order
- `pushCompactDragH`: moving widget at target cell, others packed left from x=0
- `createAutoPackH` / `createPushCompactH`: preview cases for all Move kinds

Existing vertical strategy tests are unaffected.

## What Does Not Change

- The two drag behaviors (swap on same-size widget, insert on different-size/empty) — identical triggers and conditions
- Swap behavior (`applySwap`) — reused as-is in both H factories
- `collision.ts` — `pointToCell` already handles horizontal correctly
- `clampSize` — reused with `(w, h, maxW, rows)` argument order (same function, different values)
- All UI components, CSS, and stores
