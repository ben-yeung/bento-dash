# Horizontal Scroll Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a horizontal scroll layout orientation to the widget board where row count is derived from viewport height and widgets stack rightward, togglable in settings alongside the existing vertical layout.

**Architecture:** A coordinate-transpose wrapper in `engine.ts` converts horizontal packing into calls to the existing unmodified vertical strategies by swapping `(x,y,w,h)` axes before packing and unswapping after. Viewport-derived `rowCount` lives in a tiny module (`gridState.ts`) so `boardStore` can read it without polluting Zustand. `useGridMetrics` gains orientation awareness, observing container height instead of width in horizontal mode.

**Tech Stack:** TypeScript, React 19, Zustand 5, Vitest, CSS Modules, dnd-kit

## Global Constraints

- Node 20.18 — do not upgrade vitest beyond v2 or jsdom beyond v24
- `npm run lint` is broken project-wide — use `npm test` (vitest) and `npx tsc --noEmit` to verify
- `autoPack.ts` and `pushCompact.ts` source files must not have their existing logic changed — only optional params added
- All new tests use `import { describe, it, expect } from 'vitest'`
- No comments unless the WHY is non-obvious
- `COLS = 6`, `MAX_H = 4`, `GRID_GAP = 12` live in `lib/grid/types.ts`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `lib/grid/types.ts` | Modify | Add `LayoutOrientation` type |
| `lib/grid/sizes.ts` | Modify | Add `TARGET_CELL_SIZE`, `MIN_ROWS`; update `clampSize` with optional bounds |
| `lib/grid/sizes.test.ts` | Modify | Test `clampSize` with custom params |
| `lib/grid/strategies/autoPack.ts` | Modify | `packDense` + `createAutoPack` factory accept `cols`/`maxH` |
| `lib/grid/strategies/pushCompact.ts` | Modify | Same for `compactVertical`/`pushCompactDrag`/`createPushCompact` |
| `lib/grid/strategies/autoPack.test.ts` | Modify | Test factory with custom bounds |
| `lib/grid/strategies/pushCompact.test.ts` | Modify | Same |
| `lib/grid/engine.ts` | Modify | Add `wrapHorizontal`, update `getStrategy` signature |
| `lib/grid/engine.test.ts` | Modify | Test horizontal wrapping |
| `lib/grid/collision.ts` | Modify | Add `rows` to `GridMetrics`; orientation-aware `pointToCell` |
| `lib/grid/collision.test.ts` | Modify | Test horizontal `pointToCell` |
| `lib/hooks/useGridMetrics.ts` | Modify | Add `scrollRef` + `orientation` params; observe height for horizontal |
| `lib/state/gridState.ts` | **Create** | Module-level `rowCount` shared between hook and store |
| `lib/state/settingsStore.ts` | Modify | Add `layoutOrientation`, `setLayoutOrientation` |
| `lib/state/settingsStore.test.ts` | Modify | Test new field |
| `lib/state/boardStore.ts` | Modify | `strategy()` reads `layoutOrientation` + `getRowCount()` |
| `components/shell/AppShell.tsx` | Modify | `scrollRef`; wheel event; `setRowCount`+`reResolve` effect; orientation-aware drag |
| `components/shell/AppShell.module.css` | Modify | Add `.scrollHorizontal` |
| `components/board/BentoBoard.tsx` | Modify | Orientation-aware inline grid styles; `data-orientation` |
| `components/board/BentoBoard.module.css` | Modify | Selector-based vertical/horizontal grid config |
| `components/shell/SettingsModal.tsx` | Modify | Add scroll direction toggle row |
| `components/shell/BrowseTile.tsx` | Modify | Filter default drag size by `rowCount` in horizontal mode |

---

## Task 1: `LayoutOrientation` type + `clampSize` optional bounds + grid constants

**Files:**
- Modify: `lib/grid/types.ts`
- Modify: `lib/grid/sizes.ts`
- Modify: `lib/grid/sizes.test.ts`

**Interfaces:**
- Produces: `LayoutOrientation = 'horizontal' | 'vertical'` (used by engine, settings, metrics)
- Produces: `clampSize(w, h, maxW?, maxH?)` — backward-compatible; new params used by Task 2's factories and Task 3's wrapper

- [ ] **Step 1: Write failing tests for new `clampSize` params**

Add to `lib/grid/sizes.test.ts` after the existing test block:

```ts
it('clampSize respects custom maxW and maxH', () => {
  expect(clampSize(10, 10, 4, 999)).toEqual({ w: 4, h: 10 });
  expect(clampSize(1, 6, 6, 4)).toEqual({ w: 1, h: 4 });
  expect(clampSize(3, 2, 3, 999)).toEqual({ w: 3, h: 2 });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm test -- sizes
```
Expected: FAIL — `clampSize` ignores extra args

- [ ] **Step 3: Add `LayoutOrientation` to types**

In `lib/grid/types.ts`, add after `export const GRID_GAP = 12;`:

```ts
export type LayoutOrientation = 'horizontal' | 'vertical';
```

- [ ] **Step 4: Update `sizes.ts`**

In `lib/grid/sizes.ts`, add constants after the imports:

```ts
export const TARGET_CELL_SIZE = 180; // px — target cell size for horizontal rowCount calc
export const MIN_ROWS = 2;           // minimum rows in horizontal mode
```

Replace `clampSize`:

```ts
export function clampSize(w: number, h: number, maxW = COLS, maxH = MAX_H): { w: number; h: number } {
  return {
    w: Math.max(1, Math.min(maxW, Math.round(w))),
    h: Math.max(1, Math.min(maxH, Math.round(h))),
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```
npm test -- sizes
```
Expected: all PASS, existing test for default clamping still passes

- [ ] **Step 6: Type-check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 7: Commit**

```
git add lib/grid/types.ts lib/grid/sizes.ts lib/grid/sizes.test.ts
git commit -m "feat: add LayoutOrientation type and clampSize optional bounds"
```

---

## Task 2: Strategy factory functions with configurable bounds

**Files:**
- Modify: `lib/grid/strategies/autoPack.ts`
- Modify: `lib/grid/strategies/pushCompact.ts`
- Modify: `lib/grid/strategies/autoPack.test.ts`
- Modify: `lib/grid/strategies/pushCompact.test.ts`

**Interfaces:**
- Consumes: `clampSize(w, h, maxW, maxH)` from Task 1
- Produces: `createAutoPack(cols?, maxH?): LayoutStrategy` — factory for horizontal wrapper (Task 3)
- Produces: `createPushCompact(cols?, maxH?): LayoutStrategy` — same
- Produces: `autoPack` and `pushCompact` singletons unchanged (created with defaults)

- [ ] **Step 1: Write failing tests for factory-with-custom-bounds behavior**

Add to `lib/grid/strategies/autoPack.test.ts`:

```ts
it('createAutoPack with cols=4 packs within 4 columns', () => {
  const strat = createAutoPack(4, 999);
  const widgets = [wdg('a', 2, 1, 0), wdg('b', 2, 1, 1), wdg('c', 2, 1, 2)];
  const out = strat.resolve(widgets);
  // With cols=4: a at x=0, b at x=2, c wraps to next row
  expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
  expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 2, y: 0 });
  expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 1 });
});
```

Add to `lib/grid/strategies/pushCompact.test.ts`:

```ts
it('createPushCompact with cols=3 compacts within 3 columns', () => {
  const strat = createPushCompact(3, 999);
  const widgets: WidgetLayout[] = [
    { id: 'a', x: 0, y: 0, w: 2, h: 1, category: 'finance', order: 0 },
    { id: 'b', x: 2, y: 0, w: 2, h: 1, category: 'health', order: 1 },
  ];
  const out = strat.resolve(widgets);
  // b.x=2, w=2, cols=3 — clamps to x=1
  expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 1 });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- autoPack pushCompact
```
Expected: FAIL — `createAutoPack` and `createPushCompact` not exported

- [ ] **Step 3: Update `autoPack.ts`**

In `lib/grid/strategies/autoPack.ts`, update `packDense` signature and add factory. Replace the whole file:

```ts
import { COLS, MAX_H, type LayoutStrategy, type Move, type WidgetLayout } from '../types';
import { clampSize } from '../sizes';
import { createGrid, fits, occupy } from '../occupancy';
import { applySwap } from '../swap';

export function packDense(widgets: WidgetLayout[], cols = COLS, maxH = MAX_H): WidgetLayout[] {
  const sorted = [...widgets].sort((a, b) => a.order - b.order);
  const grid = createGrid();
  const result: WidgetLayout[] = [];
  for (const wdg of sorted) {
    const { w, h } = clampSize(wdg.w, wdg.h, cols, maxH);
    let placed = false;
    for (let y = 0; !placed; y++) {
      for (let x = 0; x + w <= cols; x++) {
        if (fits(grid, x, y, w, h, cols)) {
          occupy(grid, x, y, w, h);
          result.push({ ...wdg, x, y, w, h });
          placed = true;
          break;
        }
      }
    }
  }
  return result.map((wdg, i) => ({ ...wdg, order: i }));
}

export function reorderByCell(
  widgets: WidgetLayout[],
  id: string,
  targetCell: { x: number; y: number },
  cols = COLS,
): WidgetLayout[] {
  const moving = widgets.find((w) => w.id === id);
  if (!moving) return widgets;
  const others = widgets.filter((w) => w.id !== id).sort((a, b) => a.order - b.order);
  const targetRank = targetCell.y * cols + targetCell.x;
  let insertIdx = others.length;
  for (let i = 0; i < others.length; i++) {
    const rank = others[i].y * cols + others[i].x;
    if (rank >= targetRank) {
      insertIdx = i;
      break;
    }
  }
  const list = [...others];
  list.splice(insertIdx, 0, moving);
  return list.map((w, i) => ({ ...w, order: i }));
}

export function createAutoPack(cols = COLS, maxH = MAX_H): LayoutStrategy {
  return {
    resolve(widgets) {
      return packDense(widgets, cols, maxH);
    },
    preview(widgets, move: Move) {
      switch (move.kind) {
        case 'drag':
          return packDense(reorderByCell(widgets, move.id, move.targetCell, cols), cols, maxH);
        case 'resize':
          return packDense(
            widgets.map((w) => (w.id === move.id ? { ...w, ...clampSize(move.w, move.h, cols, maxH) } : w)),
            cols, maxH,
          );
        case 'add':
          return packDense([...widgets, { ...move.widget, order: widgets.length }], cols, maxH);
        case 'remove':
          return packDense(widgets.filter((w) => w.id !== move.id), cols, maxH);
        case 'swap':
          return applySwap(widgets, move.id, move.targetId);
      }
    },
  };
}

export const autoPack: LayoutStrategy = createAutoPack();
```

- [ ] **Step 4: Update `pushCompact.ts`**

Replace the whole file:

```ts
import { COLS, MAX_H, type LayoutStrategy, type Move, type WidgetLayout } from '../types';
import { clampSize } from '../sizes';
import { createGrid, fits, occupy } from '../occupancy';
import { applySwap } from '../swap';

export function compactVertical(widgets: WidgetLayout[], cols = COLS, maxH = MAX_H): WidgetLayout[] {
  const sorted = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x);
  const grid = createGrid();
  const placed: WidgetLayout[] = [];
  for (const wdg of sorted) {
    const { w, h } = clampSize(wdg.w, wdg.h, cols, maxH);
    const x = Math.max(0, Math.min(cols - w, wdg.x));
    let y = Math.max(0, wdg.y);
    while (!fits(grid, x, y, w, h, cols)) y++;
    while (y > 0 && fits(grid, x, y - 1, w, h, cols)) y--;
    occupy(grid, x, y, w, h);
    placed.push({ ...wdg, x, y, w, h });
  }
  return placed
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((wdg, i) => ({ ...wdg, order: i }));
}

export function pushCompactDrag(
  widgets: WidgetLayout[],
  id: string,
  targetCell: { x: number; y: number },
  cols = COLS,
  maxH = MAX_H,
): WidgetLayout[] {
  const moving = widgets.find((w) => w.id === id);
  if (!moving) return widgets;
  const { w, h } = clampSize(moving.w, moving.h, cols, maxH);
  const mx = Math.max(0, Math.min(cols - w, targetCell.x));
  const my = Math.max(0, targetCell.y);
  const grid = createGrid();
  occupy(grid, mx, my, w, h);
  const placed: WidgetLayout[] = [{ ...moving, x: mx, y: my, w, h }];
  const others = widgets
    .filter((o) => o.id !== id)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const o of others) {
    const oc = clampSize(o.w, o.h, cols, maxH);
    const x = Math.max(0, Math.min(cols - oc.w, o.x));
    let y = 0;
    while (!fits(grid, x, y, oc.w, oc.h, cols)) y++;
    occupy(grid, x, y, oc.w, oc.h);
    placed.push({ ...o, x, y, w: oc.w, h: oc.h });
  }
  return placed
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((wdg, i) => ({ ...wdg, order: i }));
}

export function createPushCompact(cols = COLS, maxH = MAX_H): LayoutStrategy {
  return {
    resolve(widgets) {
      return compactVertical(widgets, cols, maxH);
    },
    preview(widgets, move: Move) {
      switch (move.kind) {
        case 'drag':
          return pushCompactDrag(widgets, move.id, move.targetCell, cols, maxH);
        case 'resize':
          return compactVertical(
            widgets.map((w) => (w.id === move.id ? { ...w, ...clampSize(move.w, move.h, cols, maxH) } : w)),
            cols, maxH,
          );
        case 'add':
          return compactVertical([...widgets, move.widget], cols, maxH);
        case 'remove':
          return compactVertical(widgets.filter((w) => w.id !== move.id), cols, maxH);
        case 'swap':
          return applySwap(widgets, move.id, move.targetId);
      }
    },
  };
}

export const pushCompact: LayoutStrategy = createPushCompact();
```

- [ ] **Step 5: Run all tests**

```
npm test
```
Expected: all PASS — existing tests still pass, new factory tests pass

- [ ] **Step 6: Type-check**

```
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```
git add lib/grid/strategies/autoPack.ts lib/grid/strategies/pushCompact.ts \
        lib/grid/strategies/autoPack.test.ts lib/grid/strategies/pushCompact.test.ts
git commit -m "feat: add createAutoPack/createPushCompact factory functions with configurable bounds"
```

---

## Task 3: `wrapHorizontal` transpose wrapper + updated `getStrategy`

**Files:**
- Modify: `lib/grid/engine.ts`
- Modify: `lib/grid/engine.test.ts`

**Interfaces:**
- Consumes: `createAutoPack`, `createPushCompact` from Task 2
- Consumes: `LayoutOrientation` from Task 1
- Produces: `getStrategy(mode, orientation?, rowCount?): LayoutStrategy`

- [ ] **Step 1: Write failing tests**

Replace `lib/grid/engine.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getStrategy, type LayoutMode } from './engine';
import { autoPack } from './strategies/autoPack';
import { pushCompact } from './strategies/pushCompact';
import type { WidgetLayout } from './types';

const wdg = (id: string, x: number, y: number, w: number, h: number, order: number): WidgetLayout => ({
  id, x, y, w, h, category: 'finance', order,
});

describe('engine', () => {
  it('returns autoPack by default and for the autoPack mode', () => {
    expect(getStrategy('autoPack')).toBe(autoPack);
  });
  it('returns pushCompact for the pushCompact mode', () => {
    expect(getStrategy('pushCompact')).toBe(pushCompact);
  });
  it('is typed to the two known modes', () => {
    const modes: LayoutMode[] = ['autoPack', 'pushCompact'];
    expect(modes).toHaveLength(2);
  });

  describe('horizontal autoPack', () => {
    it('packs column-major within rows=3', () => {
      // 3 rows, place three 1×1 widgets in order
      const strat = getStrategy('autoPack', 'horizontal', 3);
      const widgets = [
        wdg('a', 0, 0, 1, 1, 0),
        wdg('b', 0, 0, 1, 1, 1),
        wdg('c', 0, 0, 1, 1, 2),
      ];
      const out = strat.resolve(widgets);
      // Column-major: a=(0,0), b=(0,1), c=(0,2) — fills column 0 top-to-bottom
      expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
      expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
      expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 2 });
    });

    it('advances to next column when rows are full', () => {
      const strat = getStrategy('autoPack', 'horizontal', 2);
      const widgets = [
        wdg('a', 0, 0, 1, 1, 0),
        wdg('b', 0, 0, 1, 1, 1),
        wdg('c', 0, 0, 1, 1, 2),
      ];
      const out = strat.resolve(widgets);
      // rows=2: a=(0,0), b=(0,1), c overflows to column 1 => (1,0)
      expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 1, y: 0 });
    });

    it('clamps widget h to rows at resolve time (does not mutate store)', () => {
      const strat = getStrategy('autoPack', 'horizontal', 2);
      const widgets = [wdg('a', 0, 0, 2, 4, 0)]; // h=4 exceeds rows=2
      const out = strat.resolve(widgets);
      expect(out.find((w) => w.id === 'a')!.h).toBe(2);
    });
  });

  describe('horizontal pushCompact', () => {
    it('compacts leftward within rows', () => {
      const strat = getStrategy('pushCompact', 'horizontal', 3);
      const widgets = [
        wdg('a', 5, 0, 1, 1, 0),
        wdg('b', 5, 1, 1, 1, 1),
      ];
      const out = strat.resolve(widgets);
      // Both should compact to column 0 (left-gravity)
      expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
      expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- engine
```
Expected: FAIL — `getStrategy` doesn't accept orientation param

- [ ] **Step 3: Implement `wrapHorizontal` and update `getStrategy`**

Replace `lib/grid/engine.ts`:

```ts
import type { LayoutOrientation, LayoutStrategy, Move, WidgetLayout } from './types';
import { autoPack, createAutoPack } from './strategies/autoPack';
import { pushCompact, createPushCompact } from './strategies/pushCompact';

export type LayoutMode = 'autoPack' | 'pushCompact';

const LARGE = 9999; // effectively no upper bound on the unbounded axis

function transposeWidget(w: WidgetLayout, rows: number): WidgetLayout {
  return { ...w, x: w.y, y: w.x, w: Math.min(w.h, rows), h: w.w };
}

function untransposeWidget(w: WidgetLayout): WidgetLayout {
  return { ...w, x: w.y, y: w.x, w: w.h, h: w.w };
}

function transposeMove(move: Move, rows: number): Move {
  switch (move.kind) {
    case 'drag':
      return { ...move, targetCell: { x: move.targetCell.y, y: move.targetCell.x } };
    case 'resize':
      return { ...move, w: Math.min(move.h, rows), h: move.w };
    case 'add':
      return { ...move, widget: transposeWidget(move.widget, rows) };
    default:
      return move;
  }
}

function wrapHorizontal(mode: LayoutMode, rows: number): LayoutStrategy {
  const inner = mode === 'pushCompact' ? createPushCompact(rows, LARGE) : createAutoPack(rows, LARGE);
  return {
    resolve(widgets) {
      return inner.resolve(widgets.map((w) => transposeWidget(w, rows))).map(untransposeWidget);
    },
    preview(widgets, move) {
      return inner
        .preview(widgets.map((w) => transposeWidget(w, rows)), transposeMove(move, rows))
        .map(untransposeWidget);
    },
  };
}

export function getStrategy(
  mode: LayoutMode,
  orientation: LayoutOrientation = 'vertical',
  rowCount = 4,
): LayoutStrategy {
  if (orientation === 'horizontal') return wrapHorizontal(mode, rowCount);
  return mode === 'pushCompact' ? pushCompact : autoPack;
}
```

- [ ] **Step 4: Run all tests**

```
npm test
```
Expected: all PASS

- [ ] **Step 5: Type-check**

```
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```
git add lib/grid/engine.ts lib/grid/engine.test.ts
git commit -m "feat: add wrapHorizontal transpose wrapper and orientation param to getStrategy"
```

---

## Task 4: `GridMetrics.rows` + orientation-aware `pointToCell` + `useGridMetrics` horizontal mode

**Files:**
- Modify: `lib/grid/collision.ts`
- Modify: `lib/grid/collision.test.ts`
- Modify: `lib/hooks/useGridMetrics.ts`

**Interfaces:**
- Consumes: `LayoutOrientation`, `TARGET_CELL_SIZE`, `MIN_ROWS` from Task 1
- Produces: `GridMetrics` now has `rows: number | 'auto'` — consumed by BentoBoard (Task 7), AppShell (Task 6)
- Produces: `useGridMetrics(boardRef, scrollRef, orientation)` — consumed by AppShell (Task 6)

- [ ] **Step 1: Write failing tests for horizontal `pointToCell`**

In `lib/grid/collision.test.ts`, add a new describe block after the existing tests:

```ts
describe('horizontal mode pointToCell', () => {
  const mH: GridMetrics = { cellSize: 100, gap: 12, cols: 6, rows: 4 };

  it('clamps y to rows-1 and leaves x unbounded', () => {
    // stride = 100+12 = 112; 112*10 = 1120
    expect(pointToCell(1120, 0, mH)).toEqual({ x: 10, y: 0 }); // x=10, not clamped to cols-1=5
    expect(pointToCell(0, 1120, mH)).toEqual({ x: 0, y: 3 }); // y clamped to rows-1=3
  });

  it('handles negative inputs', () => {
    expect(pointToCell(-50, -50, mH)).toEqual({ x: 0, y: 0 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- collision
```
Expected: FAIL — `GridMetrics` has no `rows` field, `pointToCell` doesn't clamp y

- [ ] **Step 3: Update `collision.ts`**

Replace `lib/grid/collision.ts`:

```ts
export interface GridMetrics {
  cellSize: number;
  gap: number;
  cols: number;
  rows: number | 'auto'; // 'auto' in vertical (unbounded); rowCount in horizontal
}

export function pointToCell(px: number, py: number, m: GridMetrics): { x: number; y: number } {
  const stride = m.cellSize + m.gap;
  const xRaw = Math.floor(px / stride);
  const yRaw = Math.floor(py / stride);
  if (m.rows !== 'auto') {
    // horizontal: x unbounded, y bounded by rowCount
    return {
      x: Math.max(0, xRaw),
      y: Math.max(0, Math.min(m.rows - 1, yRaw)),
    };
  }
  // vertical: x bounded by cols, y unbounded
  return {
    x: Math.max(0, Math.min(m.cols - 1, xRaw)),
    y: Math.max(0, yRaw),
  };
}

export function cellSpanToPixels(w: number, h: number, m: GridMetrics): { width: number; height: number } {
  return {
    width: w * m.cellSize + (w - 1) * m.gap,
    height: h * m.cellSize + (h - 1) * m.gap,
  };
}
```

- [ ] **Step 4: Update `collision.test.ts` existing metrics literal**

The existing `const m: GridMetrics` now needs `rows: 'auto'`. Update:

```ts
const m: GridMetrics = { cellSize: 100, gap: 12, cols: 6, rows: 'auto' };
```

- [ ] **Step 5: Update `useGridMetrics.ts`**

Replace `lib/hooks/useGridMetrics.ts`:

```ts
'use client';
import { useEffect, useState, type RefObject } from 'react';
import { COLS, GRID_GAP, type LayoutOrientation } from '@/lib/grid/types';
import { TARGET_CELL_SIZE, MIN_ROWS } from '@/lib/grid/sizes';
import type { GridMetrics } from '@/lib/grid/collision';

export function useGridMetrics(
  boardRef: RefObject<HTMLElement | null>,
  scrollRef: RefObject<HTMLElement | null>,
  orientation: LayoutOrientation,
): GridMetrics {
  const [metrics, setMetrics] = useState<GridMetrics>({
    cellSize: 100,
    gap: GRID_GAP,
    cols: COLS,
    rows: 'auto',
  });

  useEffect(() => {
    if (orientation === 'horizontal') {
      const el = scrollRef.current;
      if (!el) return;
      const update = () => {
        const availableHeight = el.clientHeight;
        const rowCount = Math.max(MIN_ROWS, Math.floor(availableHeight / (TARGET_CELL_SIZE + GRID_GAP)));
        const cellSize = (availableHeight - (rowCount - 1) * GRID_GAP) / rowCount;
        setMetrics({ cellSize, gap: GRID_GAP, cols: COLS, rows: rowCount });
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    } else {
      const el = boardRef.current;
      if (!el) return;
      const update = () => {
        const width = el.clientWidth;
        const cellSize = (width - (COLS - 1) * GRID_GAP) / COLS;
        setMetrics({ cellSize, gap: GRID_GAP, cols: COLS, rows: 'auto' });
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [boardRef, scrollRef, orientation]);

  return metrics;
}
```

- [ ] **Step 6: Run all tests**

```
npm test
```
Expected: all PASS (the existing vertical collision tests still pass; new horizontal tests pass)

- [ ] **Step 7: Type-check**

```
npx tsc --noEmit
```
Note: `boardStore.ts` and `AppShell.tsx` will have type errors until Tasks 5–6 are complete. Check that the errors are ONLY about missing `rows` in GridMetrics usages (not new errors in the files you just edited).

- [ ] **Step 8: Commit**

```
git add lib/grid/collision.ts lib/grid/collision.test.ts lib/hooks/useGridMetrics.ts
git commit -m "feat: add GridMetrics.rows and orientation-aware pointToCell and useGridMetrics"
```

---

## Task 5: `settingsStore` orientation + `gridState.ts` + `boardStore` wiring

**Files:**
- Modify: `lib/state/settingsStore.ts`
- Create: `lib/state/gridState.ts`
- Modify: `lib/state/boardStore.ts`
- Modify: `lib/state/settingsStore.test.ts`

**Interfaces:**
- Produces: `useSettings().layoutOrientation`, `useSettings().setLayoutOrientation(o)`
- Produces: `getRowCount()` / `setRowCount(n)` from `lib/state/gridState.ts`
- Produces: `boardStore.strategy()` now picks up orientation + rowCount

- [ ] **Step 1: Write failing tests for `layoutOrientation` in settingsStore**

In `lib/state/settingsStore.test.ts`, read the existing tests to understand the pattern, then add:

```ts
it('defaults layoutOrientation to horizontal', () => {
  const s = useSettings.getState();
  expect(s.layoutOrientation).toBe('horizontal');
});

it('setLayoutOrientation changes orientation', () => {
  useSettings.getState().setLayoutOrientation('vertical');
  expect(useSettings.getState().layoutOrientation).toBe('vertical');
  useSettings.getState().setLayoutOrientation('horizontal');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- settingsStore
```
Expected: FAIL — `layoutOrientation` undefined

- [ ] **Step 3: Update `settingsStore.ts`**

In `lib/state/settingsStore.ts`, add the import and update the file:

Add import at top:
```ts
import type { LayoutOrientation } from '@/lib/grid/types';
```

Update `SETTINGS_DEFAULTS`:
```ts
export const SETTINGS_DEFAULTS = {
  theme: 'dark' as Theme,
  layoutMode: 'autoPack' as LayoutMode,
  layoutOrientation: 'horizontal' as LayoutOrientation,
  filterMode: 'hide' as FilterMode,
  activeTags: [] as Category[],
  accent: '#6366f1',
};
```

Update `SettingsState` interface — add after `layoutMode: LayoutMode;`:
```ts
layoutOrientation: LayoutOrientation;
setLayoutOrientation: (o: LayoutOrientation) => void;
```

Add to the `create` body — after `setLayoutMode`:
```ts
setLayoutOrientation: (layoutOrientation) => set({ layoutOrientation }),
```

- [ ] **Step 4: Create `lib/state/gridState.ts`**

```ts
// Runtime rowCount derived from viewport height — updated by useGridMetrics,
// read by boardStore.strategy() so horizontal packing uses the live row count.
let _rowCount = 4;
export function getRowCount(): number { return _rowCount; }
export function setRowCount(n: number): void { _rowCount = n; }
```

- [ ] **Step 5: Update `boardStore.ts`**

In `lib/state/boardStore.ts`, add imports at top:
```ts
import { getRowCount } from './gridState';
```

Replace the `strategy()` function:
```ts
function strategy() {
  const { layoutMode, layoutOrientation } = useSettings.getState();
  return getStrategy(layoutMode, layoutOrientation, getRowCount());
}
```

- [ ] **Step 6: Run all tests**

```
npm test
```
Expected: all PASS

- [ ] **Step 7: Type-check**

```
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```
git add lib/state/settingsStore.ts lib/state/settingsStore.test.ts \
        lib/state/gridState.ts lib/state/boardStore.ts
git commit -m "feat: add layoutOrientation to settingsStore, gridState rowCount, wire boardStore strategy"
```

---

## Task 6: `AppShell` horizontal scroll + wheel event + metrics wiring

**Files:**
- Modify: `components/shell/AppShell.tsx`
- Modify: `components/shell/AppShell.module.css`

**Interfaces:**
- Consumes: `setRowCount` from `lib/state/gridState`
- Consumes: `useGridMetrics(boardRef, scrollRef, orientation)` from Task 4
- Consumes: `useSettings().layoutOrientation`

- [ ] **Step 1: Add `.scrollHorizontal` to `AppShell.module.css`**

In `components/shell/AppShell.module.css`, append after the existing styles:

```css
.scrollHorizontal {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
  padding-left: 28px;
  scrollbar-width: none;
}
.scrollHorizontal::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 2: Update `AppShell.tsx`**

The changes to `AppShell.tsx` are spread across several spots. Apply them in order:

**Add import** (after the existing import block):
```ts
import { setRowCount } from '@/lib/state/gridState';
```

**Add `scrollRef`** (after `const boardRef = useRef<HTMLDivElement>(null);`):
```ts
const scrollRef = useRef<HTMLDivElement>(null);
```

**Add `orientation` selector and update `metrics`** (after `const layoutMode = useSettings(...)` line):
```ts
const orientation = useSettings((s) => s.layoutOrientation);
```

Replace the existing `const metrics = useGridMetrics(boardRef);` with:
```ts
const metrics = useGridMetrics(boardRef, scrollRef, orientation);
```

**Add `rowCount` sync + reResolve effect** (after the existing `layoutMode` subscription `useEffect`):
```ts
useEffect(() => {
  if (typeof metrics.rows !== 'number') return;
  setRowCount(metrics.rows);
  useBoard.getState().reResolve();
}, [metrics.rows]);
```

**Extend the existing `layoutMode` subscription** to also cover orientation changes. Replace the existing subscription effect:
```ts
useEffect(() => {
  return useSettings.subscribe((s, prev) => {
    if (s.layoutMode !== prev.layoutMode || s.layoutOrientation !== prev.layoutOrientation) {
      useBoard.getState().reResolve();
    }
  });
}, []);
```

**Add wheel-to-scroll conversion effect** (after the above):
```ts
useEffect(() => {
  if (orientation !== 'horizontal') return;
  const el = scrollRef.current;
  if (!el) return;
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  };
  el.addEventListener('wheel', onWheel, { passive: false });
  return () => el.removeEventListener('wheel', onWheel);
}, [orientation]);
```

**Fix `targetX` clamping in `handleDragMove`** — find this line (around line 205):
```ts
const targetX = Math.min(insertAfter ? hit.x + hit.w : hit.x, metrics.cols - 1);
```
Replace with:
```ts
const targetX = metrics.rows !== 'auto'
  ? (insertAfter ? hit.x + hit.w : hit.x)
  : Math.min(insertAfter ? hit.x + hit.w : hit.x, metrics.cols - 1);
```

**Add `ref` to scroll div and toggle CSS class** — find the JSX:
```tsx
<div className={styles.scroll}>
```
Replace with:
```tsx
<div
  ref={scrollRef}
  className={orientation === 'horizontal' ? styles.scrollHorizontal : styles.scroll}
>
```

- [ ] **Step 3: Type-check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Run all tests**

```
npm test
```
Expected: all PASS

- [ ] **Step 5: Commit**

```
git add components/shell/AppShell.tsx components/shell/AppShell.module.css
git commit -m "feat: wire AppShell for horizontal scroll — scrollRef, wheel event, rowCount sync"
```

---

## Task 7: `BentoBoard` horizontal CSS grid

**Files:**
- Modify: `components/board/BentoBoard.tsx`
- Modify: `components/board/BentoBoard.module.css`

**Interfaces:**
- Consumes: `useSettings().layoutOrientation`
- Consumes: `metrics.rows` (number in horizontal, `'auto'` in vertical)

- [ ] **Step 1: Update `BentoBoard.module.css`**

Replace the existing `.board` rule with orientation-specific selectors:

```css
.board {
  display: grid;
  gap: var(--gap);
  padding-top: 8px;
}

.board[data-orientation="vertical"] {
  grid-template-columns: repeat(6, 1fr);
  width: 100%;
  max-width: 1260px;
  margin: 0 auto;
}

.board[data-orientation="horizontal"] {
  height: 100%;
}
```

- [ ] **Step 2: Update `BentoBoard.tsx`**

**Add `layoutOrientation` selector** — in the component body after `const layoutMode = ...`:
```ts
const layoutOrientation = useSettings((s) => s.layoutOrientation);
```

**Update the board div's style and add `data-orientation`** — find:
```tsx
<div
  ref={boardRef}
  className={styles.board}
  style={{
    gridAutoRows: `${metrics.cellSize}px`,
    '--cell-size': `${metrics.cellSize}px`,
  } as React.CSSProperties}
>
```
Replace with:
```tsx
<div
  ref={boardRef}
  className={styles.board}
  data-orientation={layoutOrientation}
  style={(layoutOrientation === 'horizontal'
    ? {
        // metrics.rows is always a number in horizontal mode (set by the hook);
        // the type is number|'auto' so we guard against the 'auto' case at runtime.
        gridTemplateRows: `repeat(${typeof metrics.rows === 'number' ? metrics.rows : 4}, ${metrics.cellSize}px)`,
        gridAutoColumns: `${metrics.cellSize}px`,
        '--cell-size': `${metrics.cellSize}px`,
      }
    : {
        gridAutoRows: `${metrics.cellSize}px`,
        '--cell-size': `${metrics.cellSize}px`,
      }
  ) as React.CSSProperties}
>
```

- [ ] **Step 3: Type-check**

```
npx tsc --noEmit
```

- [ ] **Step 4: Run all tests**

```
npm test
```

- [ ] **Step 5: Commit**

```
git add components/board/BentoBoard.tsx components/board/BentoBoard.module.css
git commit -m "feat: BentoBoard renders horizontal CSS grid when orientation is horizontal"
```

---

## Task 8: `SettingsModal` orientation toggle

**Files:**
- Modify: `components/shell/SettingsModal.tsx`

**Interfaces:**
- Consumes: `useSettings().layoutOrientation`, `useSettings().setLayoutOrientation`

- [ ] **Step 1: Add the toggle row to `SettingsModal.tsx`**

Find the existing "Board layout" row block (lines ~174–179):
```tsx
<div className={styles.row}>
  <div className={styles.label}>Board layout</div>
  <div className={styles.seg}>
    <button className={styles.segBtn} data-on={s.layoutMode === 'autoPack'} onClick={() => s.setLayoutMode('autoPack')}>Auto-pack</button>
    <button className={styles.segBtn} data-on={s.layoutMode === 'pushCompact'} onClick={() => s.setLayoutMode('pushCompact')}>Push &amp; compact</button>
  </div>
</div>
```

Insert immediately **after** that block:
```tsx
<div className={styles.row}>
  <div className={styles.label}>Scroll direction</div>
  <div className={styles.seg}>
    <button className={styles.segBtn} data-on={s.layoutOrientation === 'horizontal'} onClick={() => s.setLayoutOrientation('horizontal')}>Horizontal</button>
    <button className={styles.segBtn} data-on={s.layoutOrientation === 'vertical'} onClick={() => s.setLayoutOrientation('vertical')}>Vertical</button>
  </div>
</div>
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

- [ ] **Step 3: Run all tests**

```
npm test
```

- [ ] **Step 4: Commit**

```
git add components/shell/SettingsModal.tsx
git commit -m "feat: add scroll direction toggle to SettingsModal"
```

---

## Task 9: `BrowseTile` safe default drag size in horizontal mode

**Files:**
- Modify: `components/shell/BrowseTile.tsx`

**Interfaces:**
- Consumes: `useSettings().layoutOrientation`, `getRowCount()` from `lib/state/gridState`

In horizontal mode, `BrowseTile` drags in `definition.supportedSizes[0]`. If that size has `h > rowCount`, the widget can't fit without clamping. Pick the first supported size with `h ≤ rowCount`, falling back to `supportedSizes[0]` (will be clamped by the engine during drop).

- [ ] **Step 1: Update `BrowseTile.tsx`**

Add imports at the top:
```ts
import { useSettings } from '@/lib/state/settingsStore';
import { getRowCount } from '@/lib/state/gridState';
```

Inside the `BrowseTile` function body, replace:
```ts
const defaultSize = definition.supportedSizes[0];
```
With:
```ts
const orientation = useSettings((s) => s.layoutOrientation);
const defaultSize = (() => {
  if (orientation !== 'horizontal') return definition.supportedSizes[0];
  const rows = getRowCount();
  return definition.supportedSizes.find((s) => s.h <= rows) ?? definition.supportedSizes[0];
})();
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

- [ ] **Step 3: Run all tests**

```
npm test
```

- [ ] **Step 4: Commit**

```
git add components/shell/BrowseTile.tsx
git commit -m "feat: BrowseTile picks a row-safe default drag size in horizontal mode"
```

---

## Verification

After all 9 tasks, run a full check:

```
npm test && npx tsc --noEmit
```

Then manually verify in the browser (`npm run dev`):

1. Open the app — board should display in horizontal scroll mode by default
2. Mouse wheel down → board scrolls right; wheel up → scrolls left
3. Resize the browser window — rowCount updates, board reflowed
4. Drag a widget from the FAB → ghost preview shows; drop lands correctly
5. Open Settings → toggle "Scroll direction" to Vertical → board switches to vertical scroll
6. In vertical mode, toggle back to Horizontal — board re-reflowed correctly
7. Switch layout mode (Auto-pack ↔ Push & compact) in both orientations
