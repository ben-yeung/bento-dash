# Horizontal Drag Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the transposition-based horizontal packing layer with native horizontal strategies so widgets shift left/right naturally during live drag with no visual artifacts.

**Architecture:** Add `fitsH` to the occupancy module (row-bounded fit check), then write native horizontal variants of autoPack and pushCompact using left-priority, row-bounded packing. Update `getStrategy` to drop the `rowCount` parameter and read it internally from `gridState`; update the two callers (AppShell, boardStore) accordingly.

**Tech Stack:** TypeScript, Vitest

## Global Constraints

- Run tests with: `npx vitest run <path>` for a specific file, or `npm test` for everything
- Test file lives alongside the source file it tests (e.g., `autoPack.ts` → `autoPack.test.ts`)
- `lint` is broken project-wide; use `npx tsc --noEmit` and `npm test` for verification
- Do not change any file not listed in a task's **Files** section
- `LARGE = 9999` is the sentinel for "effectively unbounded" in strategy factories

---

### Task 1: Add `fitsH` to occupancy

**Files:**
- Modify: `lib/grid/occupancy.ts`
- Modify: `lib/grid/occupancy.test.ts`

**Interfaces:**
- Produces: `fitsH(grid: Grid, x: number, y: number, w: number, h: number, rows: number): boolean` — exported from `lib/grid/occupancy.ts`

- [ ] **Step 1: Add failing tests for `fitsH`**

Append to `lib/grid/occupancy.test.ts` (after the existing `describe` block):

```typescript
import { createGrid, fits, occupy, fitsH } from './occupancy';

describe('fitsH', () => {
  it('reports a footprint as fitting in an empty grid within row bound', () => {
    const g = createGrid();
    expect(fitsH(g, 0, 0, 2, 2, 4)).toBe(true);
  });

  it('rejects footprints that overflow rows', () => {
    const g = createGrid();
    expect(fitsH(g, 0, 3, 1, 2, 4)).toBe(false); // y=3 + h=2 = 5 > rows=4
  });

  it('does not bound x (unbounded axis)', () => {
    const g = createGrid();
    expect(fitsH(g, 100, 0, 1, 1, 4)).toBe(true);
  });

  it('rejects footprints overlapping an occupied region', () => {
    const g = createGrid();
    occupy(g, 0, 0, 2, 2);
    expect(fitsH(g, 1, 1, 1, 1, 4)).toBe(false);
    expect(fitsH(g, 2, 0, 1, 1, 4)).toBe(true);
  });
});
```

> Note: the existing import line in the test already imports from `'./occupancy'` — update it to add `fitsH`, or add a second import. Don't duplicate the import.

- [ ] **Step 2: Run to verify failure**

```
npx vitest run lib/grid/occupancy.test.ts
```

Expected: FAIL — `fitsH is not a function` (or similar)

- [ ] **Step 3: Implement `fitsH` in `lib/grid/occupancy.ts`**

Append after the `occupy` function:

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

- [ ] **Step 4: Run to verify pass**

```
npx vitest run lib/grid/occupancy.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/grid/occupancy.ts lib/grid/occupancy.test.ts
git commit -m "feat(grid): add fitsH — row-bounded occupancy check for horizontal packing"
```

---

### Task 2: Horizontal autoPack functions

**Files:**
- Modify: `lib/grid/strategies/autoPack.ts`
- Modify: `lib/grid/strategies/autoPack.test.ts`

**Interfaces:**
- Consumes: `fitsH` from `'../occupancy'`; `createGrid`, `occupy` from `'../occupancy'`; `clampSize` from `'../sizes'`; `applySwap` from `'../swap'`; `LayoutStrategy`, `Move`, `WidgetLayout` from `'../types'`
- Produces:
  - `packDenseH(widgets: WidgetLayout[], rows: number, maxW?: number): WidgetLayout[]`
  - `reorderByCellH(widgets: WidgetLayout[], id: string, targetCell: { x: number; y: number }, rows: number): WidgetLayout[]`
  - `createAutoPackH(rows: number, maxW?: number): LayoutStrategy`
  - All three exported from `lib/grid/strategies/autoPack.ts`

- [ ] **Step 1: Add failing tests for horizontal autoPack**

Three edits to `lib/grid/strategies/autoPack.test.ts`:

**1a.** Update the existing import at line 2 to add the three new exports:
```typescript
import { autoPack, packDense, reorderByCell, createAutoPack, packDenseH, reorderByCellH, createAutoPackH } from './autoPack';
```

**1b.** Add a positioned-widget helper after the existing `wdg` helper (line 7):
```typescript
const at = (id: string, x: number, y: number, w: number, h: number, order: number): WidgetLayout => ({
  id, x, y, w, h, category: 'finance', order,
});
```

**1c.** Append the following describe block after the existing `describe('autoPack', ...)` closing brace:

```typescript
describe('autoPack horizontal', () => {
  it('packDenseH places left-first, filling a column before advancing right', () => {
    const out = packDenseH([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1), wdg('c', 1, 1, 2)], 3);
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 2 });
  });

  it('packDenseH overflows to next column when all rows in the current column are full', () => {
    const out = packDenseH([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1), wdg('c', 1, 1, 2)], 2);
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 1, y: 0 });
  });

  it('packDenseH clamps h to rows', () => {
    const out = packDenseH([wdg('a', 1, 4, 0)], 2);
    expect(out.find((w) => w.id === 'a')!.h).toBe(2);
  });

  it('reorderByCellH uses x-primary rank so moving to (0,0) puts widget first', () => {
    const widgets = [
      at('a', 0, 0, 1, 1, 0),
      at('b', 0, 1, 1, 1, 1),
      at('c', 1, 0, 1, 1, 2),
    ];
    const reordered = reorderByCellH(widgets, 'c', { x: 0, y: 0 }, 2);
    expect(reordered.find((w) => w.id === 'c')!.order).toBe(0);
  });

  it('createAutoPackH preview(drag) packs with left priority', () => {
    const strat = createAutoPackH(3);
    const resolved = strat.resolve([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1)]);
    const out = strat.preview(resolved, { kind: 'drag', id: 'b', targetCell: { x: 0, y: 0 } });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
  });

  it('createAutoPackH preview(remove) repacks remaining widgets left', () => {
    const strat = createAutoPackH(2);
    // resolve: a=(0,0), b=(0,1), c=(1,0) in a 2-row grid
    const start = strat.resolve([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1), wdg('c', 1, 1, 2)]);
    const out = strat.preview(start, { kind: 'remove', id: 'b' });
    expect(out).toHaveLength(2);
    // c was at (1,0); after b removed, c shifts to fill (0,1) based on order
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 1 });
  });

  it('createAutoPackH preview(swap) exchanges positions without repacking', () => {
    const strat = createAutoPackH(4);
    const layout = [at('a', 0, 0, 2, 1, 0), at('b', 1, 0, 2, 1, 1)];
    const out = strat.preview(layout, { kind: 'swap', id: 'a', targetId: 'b' });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 1, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
  });
});
```

> Note: `wdg` is already defined at the top of autoPack.test.ts and is used by the new tests above.

- [ ] **Step 2: Run to verify failure**

```
npx vitest run lib/grid/strategies/autoPack.test.ts
```

Expected: FAIL — `packDenseH is not a function`

- [ ] **Step 3: Add `fitsH` to the occupancy import in `autoPack.ts`**

Change the existing import line at the top of `lib/grid/strategies/autoPack.ts`:

```typescript
import { createGrid, fits, occupy, fitsH } from '../occupancy';
```

- [ ] **Step 4: Implement `packDenseH`, `reorderByCellH`, and `createAutoPackH`**

Append to the bottom of `lib/grid/strategies/autoPack.ts` (after the existing `export const autoPack` line):

```typescript
export function packDenseH(widgets: WidgetLayout[], rows: number, maxW = LARGE): WidgetLayout[] {
  const sorted = [...widgets].sort((a, b) => a.order - b.order);
  const grid = createGrid();
  const result: WidgetLayout[] = [];
  for (const wdg of sorted) {
    const { w, h } = clampSize(wdg.w, wdg.h, maxW, rows);
    let placed = false;
    for (let x = 0; !placed; x++) {
      for (let y = 0; y + h <= rows; y++) {
        if (fitsH(grid, x, y, w, h, rows)) {
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

export function reorderByCellH(
  widgets: WidgetLayout[],
  id: string,
  targetCell: { x: number; y: number },
  rows: number,
): WidgetLayout[] {
  const moving = widgets.find((w) => w.id === id);
  if (!moving) return widgets;
  const others = widgets.filter((w) => w.id !== id).sort((a, b) => a.order - b.order);
  const targetRank = targetCell.x * rows + targetCell.y;
  let insertIdx = others.length;
  for (let i = 0; i < others.length; i++) {
    const rank = others[i].x * rows + others[i].y;
    if (rank >= targetRank) {
      insertIdx = i;
      break;
    }
  }
  const list = [...others];
  list.splice(insertIdx, 0, moving);
  return list.map((w, i) => ({ ...w, order: i }));
}

const LARGE = 9999;

export function createAutoPackH(rows: number, maxW = LARGE): LayoutStrategy {
  return {
    resolve(widgets) {
      return packDenseH(widgets, rows, maxW);
    },
    preview(widgets, move: Move) {
      switch (move.kind) {
        case 'drag':
          return packDenseH(reorderByCellH(widgets, move.id, move.targetCell, rows), rows, maxW);
        case 'resize':
          return packDenseH(
            widgets.map((w) => (w.id === move.id ? { ...w, ...clampSize(move.w, move.h, maxW, rows) } : w)),
            rows, maxW,
          );
        case 'add':
          return packDenseH([...widgets, { ...move.widget, order: widgets.length }], rows, maxW);
        case 'remove':
          return packDenseH(widgets.filter((w) => w.id !== move.id), rows, maxW);
        case 'swap':
          return applySwap(widgets, move.id, move.targetId);
      }
    },
  };
}
```

> `LARGE` is already declared in engine.ts, but strategy files don't import it from there. Declare it locally here as a module-level constant (it's just a sentinel value).
>
> `Move` is already imported at the top of autoPack.ts via `import type { ..., Move, ... } from '../types'`. Confirm it's included; add it if missing.

- [ ] **Step 5: Run to verify pass**

```
npx vitest run lib/grid/strategies/autoPack.test.ts
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add lib/grid/strategies/autoPack.ts lib/grid/strategies/autoPack.test.ts
git commit -m "feat(grid): add horizontal autoPack strategy (packDenseH, reorderByCellH, createAutoPackH)"
```

---

### Task 3: Horizontal pushCompact functions

**Files:**
- Modify: `lib/grid/strategies/pushCompact.ts`
- Modify: `lib/grid/strategies/pushCompact.test.ts`

**Interfaces:**
- Consumes: `fitsH` from `'../occupancy'`; `createGrid`, `occupy` from `'../occupancy'`; `clampSize` from `'../sizes'`; `applySwap` from `'../swap'`; `LayoutStrategy`, `Move`, `WidgetLayout` from `'../types'`
- Produces:
  - `compactHorizontal(widgets: WidgetLayout[], rows: number, maxW?: number): WidgetLayout[]`
  - `pushCompactDragH(widgets: WidgetLayout[], id: string, targetCell: { x: number; y: number }, rows: number, maxW?: number): WidgetLayout[]`
  - `createPushCompactH(rows: number, maxW?: number): LayoutStrategy`
  - All three exported from `lib/grid/strategies/pushCompact.ts`

- [ ] **Step 1: Add failing tests for horizontal pushCompact**

Two edits to `lib/grid/strategies/pushCompact.test.ts`:

**1a.** Update the existing import at line 2 to add the three new exports:
```typescript
import { pushCompact, compactVertical, createPushCompact, compactHorizontal, pushCompactDragH, createPushCompactH } from './pushCompact';
```

**1b.** Append the following describe block after the existing `describe('pushCompact', ...)` closing brace:

```typescript
describe('pushCompact horizontal', () => {
  it('compactHorizontal pulls floating widgets leftward, preserving their row', () => {
    const out = compactHorizontal([at('a', 0, 0, 1, 1, 0), at('b', 5, 1, 1, 1, 1)], 3);
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
  });

  it('compactHorizontal compacts to fill a left gap when the occupant is removed', () => {
    // b at x=2 should slide left to x=0 once the grid is empty before it
    const out = compactHorizontal([at('b', 2, 0, 1, 1, 0)], 2);
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0 });
  });

  it('compactHorizontal clamps h to rows bound', () => {
    const out = compactHorizontal([at('a', 0, 0, 1, 5, 0)], 3);
    expect(out.find((w) => w.id === 'a')!.h).toBe(3);
  });

  it('pushCompactDragH places moving widget at target and pushes colliding neighbor right', () => {
    const widgets = [at('a', 0, 0, 2, 1, 0), at('b', 0, 1, 2, 1, 1)];
    const out = pushCompactDragH(widgets, 'b', { x: 0, y: 0 }, 2);
    const b = out.find((w) => w.id === 'b')!;
    const a = out.find((w) => w.id === 'a')!;
    expect(b).toMatchObject({ x: 0, y: 0 });
    expect(a.x).toBeGreaterThanOrEqual(2); // pushed right past b's 2-wide footprint
  });

  it('createPushCompactH preview(drag) places widget at target cell', () => {
    const strat = createPushCompactH(3);
    const widgets = [at('a', 0, 0, 1, 1, 0), at('b', 1, 0, 1, 1, 1)];
    const out = strat.preview(widgets, { kind: 'drag', id: 'b', targetCell: { x: 0, y: 0 } });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
  });

  it('createPushCompactH preview(remove) compacts remaining widgets leftward', () => {
    const strat = createPushCompactH(3);
    const start = [at('a', 0, 0, 1, 1, 0), at('b', 1, 0, 1, 1, 1), at('c', 2, 0, 1, 1, 2)];
    const out = strat.preview(start, { kind: 'remove', id: 'a' });
    expect(out).toHaveLength(2);
    // b and c should compact left after a is removed
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 1 });
  });

  it('createPushCompactH preview(swap) exchanges positions without repacking', () => {
    const strat = createPushCompactH(4);
    const layout = [at('a', 0, 0, 2, 1, 0), at('b', 1, 0, 2, 1, 1)];
    const out = strat.preview(layout, { kind: 'swap', id: 'a', targetId: 'b' });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 1, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
  });
});
```

> Note: `at` is already defined at the top of pushCompact.test.ts — no new helper needed.

- [ ] **Step 2: Run to verify failure**

```
npx vitest run lib/grid/strategies/pushCompact.test.ts
```

Expected: FAIL — `compactHorizontal is not a function`

- [ ] **Step 3: Add `fitsH` to the occupancy import in `pushCompact.ts`**

Change the existing import line at the top of `lib/grid/strategies/pushCompact.ts`:

```typescript
import { createGrid, fits, occupy, fitsH } from '../occupancy';
```

- [ ] **Step 4: Implement `compactHorizontal`, `pushCompactDragH`, and `createPushCompactH`**

Append to the bottom of `lib/grid/strategies/pushCompact.ts` (after the existing `export const pushCompact` line):

```typescript
const LARGE = 9999;

export function compactHorizontal(widgets: WidgetLayout[], rows: number, maxW = LARGE): WidgetLayout[] {
  const sorted = [...widgets].sort((a, b) => a.x - b.x || a.y - b.y);
  const grid = createGrid();
  const placed: WidgetLayout[] = [];
  for (const wdg of sorted) {
    const { w, h } = clampSize(wdg.w, wdg.h, maxW, rows);
    const y = Math.max(0, Math.min(rows - h, wdg.y));
    let x = Math.max(0, wdg.x);
    while (!fitsH(grid, x, y, w, h, rows)) x++;
    while (x > 0 && fitsH(grid, x - 1, y, w, h, rows)) x--;
    occupy(grid, x, y, w, h);
    placed.push({ ...wdg, x, y, w, h });
  }
  return placed
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .map((wdg, i) => ({ ...wdg, order: i }));
}

export function pushCompactDragH(
  widgets: WidgetLayout[],
  id: string,
  targetCell: { x: number; y: number },
  rows: number,
  maxW = LARGE,
): WidgetLayout[] {
  const moving = widgets.find((w) => w.id === id);
  if (!moving) return widgets;
  const { w, h } = clampSize(moving.w, moving.h, maxW, rows);
  const mx = Math.max(0, Math.min(maxW - w, targetCell.x));
  const my = Math.max(0, Math.min(rows - h, targetCell.y));
  const grid = createGrid();
  occupy(grid, mx, my, w, h);
  const placed: WidgetLayout[] = [{ ...moving, x: mx, y: my, w, h }];
  const others = widgets
    .filter((o) => o.id !== id)
    .sort((a, b) => a.x - b.x || a.y - b.y);
  for (const o of others) {
    const oc = clampSize(o.w, o.h, maxW, rows);
    const y = Math.max(0, Math.min(rows - oc.h, o.y));
    let x = 0;
    while (!fitsH(grid, x, y, oc.w, oc.h, rows)) x++;
    occupy(grid, x, y, oc.w, oc.h);
    placed.push({ ...o, x, y, w: oc.w, h: oc.h });
  }
  return placed
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .map((wdg, i) => ({ ...wdg, order: i }));
}

export function createPushCompactH(rows: number, maxW = LARGE): LayoutStrategy {
  return {
    resolve(widgets) {
      return compactHorizontal(widgets, rows, maxW);
    },
    preview(widgets, move: Move) {
      switch (move.kind) {
        case 'drag':
          return pushCompactDragH(widgets, move.id, move.targetCell, rows, maxW);
        case 'resize':
          return compactHorizontal(
            widgets.map((w) => (w.id === move.id ? { ...w, ...clampSize(move.w, move.h, maxW, rows) } : w)),
            rows, maxW,
          );
        case 'add':
          return compactHorizontal([...widgets, move.widget], rows, maxW);
        case 'remove':
          return compactHorizontal(widgets.filter((w) => w.id !== move.id), rows, maxW);
        case 'swap':
          return applySwap(widgets, move.id, move.targetId);
      }
    },
  };
}
```

> `Move` is already imported at the top of pushCompact.ts. Confirm it's in the type import line; add it if missing.

- [ ] **Step 5: Run to verify pass**

```
npx vitest run lib/grid/strategies/pushCompact.test.ts
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add lib/grid/strategies/pushCompact.ts lib/grid/strategies/pushCompact.test.ts
git commit -m "feat(grid): add horizontal pushCompact strategy (compactHorizontal, pushCompactDragH, createPushCompactH)"
```

---

### Task 4: Update engine and wire callers

This task wires up the new strategies, removes the transposition layer, and fixes the two callers that need `layoutOrientation` passed correctly.

**Files:**
- Modify: `lib/grid/engine.ts`
- Modify: `lib/grid/engine.test.ts`
- Modify: `lib/state/boardStore.ts`
- Modify: `components/shell/AppShell.tsx`

**Interfaces:**
- Consumes: `createAutoPackH` from `'./strategies/autoPack'`; `createPushCompactH` from `'./strategies/pushCompact'`; `getRowCount` from `'../state/gridState'`
- Produces: `getStrategy(mode: LayoutMode, orientation?: LayoutOrientation): LayoutStrategy` — signature loses the `rowCount` param

- [ ] **Step 1: Replace `engine.ts` entirely**

Replace the full content of `lib/grid/engine.ts` with:

```typescript
import type { LayoutOrientation, LayoutStrategy } from './types';
import { autoPack, createAutoPackH } from './strategies/autoPack';
import { pushCompact, createPushCompactH } from './strategies/pushCompact';
import { getRowCount } from '../state/gridState';

export type LayoutMode = 'autoPack' | 'pushCompact';

const LARGE = 9999;

export function getStrategy(
  mode: LayoutMode,
  orientation: LayoutOrientation = 'vertical',
): LayoutStrategy {
  if (orientation === 'horizontal') {
    const rowCount = getRowCount();
    return mode === 'pushCompact'
      ? createPushCompactH(rowCount, LARGE)
      : createAutoPackH(rowCount, LARGE);
  }
  return mode === 'pushCompact' ? pushCompact : autoPack;
}
```

- [ ] **Step 2: Update engine tests to use `setRowCount` instead of passing `rowCount`**

The existing horizontal tests in `lib/grid/engine.test.ts` call `getStrategy('autoPack', 'horizontal', 3)`. That third arg no longer exists. Update the `describe('horizontal autoPack')` and `describe('horizontal pushCompact')` blocks:

Add this import at the top of `engine.test.ts`:

```typescript
import { setRowCount } from '../state/gridState';
```

Then update the two horizontal describe blocks to set rowCount via `setRowCount` before each call and remove the third arg:

```typescript
describe('horizontal autoPack', () => {
  it('packs column-major within rows=3', () => {
    setRowCount(3);
    const strat = getStrategy('autoPack', 'horizontal');
    const widgets = [
      wdg('a', 0, 0, 1, 1, 0),
      wdg('b', 0, 0, 1, 1, 1),
      wdg('c', 0, 0, 1, 1, 2),
    ];
    const out = strat.resolve(widgets);
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 2 });
  });

  it('advances to next column when rows are full', () => {
    setRowCount(2);
    const strat = getStrategy('autoPack', 'horizontal');
    const widgets = [
      wdg('a', 0, 0, 1, 1, 0),
      wdg('b', 0, 0, 1, 1, 1),
      wdg('c', 0, 0, 1, 1, 2),
    ];
    const out = strat.resolve(widgets);
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 1, y: 0 });
  });

  it('clamps widget h to rows at resolve time (does not mutate store)', () => {
    setRowCount(2);
    const strat = getStrategy('autoPack', 'horizontal');
    const widgets = [wdg('a', 0, 0, 2, 4, 0)];
    const out = strat.resolve(widgets);
    expect(out.find((w) => w.id === 'a')!.h).toBe(2);
  });
});

describe('horizontal pushCompact', () => {
  it('compacts leftward within rows', () => {
    setRowCount(3);
    const strat = getStrategy('pushCompact', 'horizontal');
    const widgets = [
      wdg('a', 5, 0, 1, 1, 0),
      wdg('b', 5, 1, 1, 1, 1),
    ];
    const out = strat.resolve(widgets);
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
  });
});
```

> The vertical tests (`returns autoPack by default`, `returns pushCompact for the pushCompact mode`) do not need changes — `getStrategy('autoPack')` still returns the `autoPack` singleton.

- [ ] **Step 3: Run engine tests to verify pass**

```
npx vitest run lib/grid/engine.test.ts
```

Expected: all tests PASS

- [ ] **Step 4: Update `boardStore.ts` — remove `getRowCount` from the `strategy()` call**

In `lib/state/boardStore.ts`, update lines 7 and 12:

Remove the `getRowCount` import (line 7):
```typescript
// delete this line:
import { getRowCount } from './gridState';
```

Update the `strategy()` helper (line 12) to remove the third argument:
```typescript
function strategy() {
  const { layoutMode, layoutOrientation } = useSettings.getState();
  return getStrategy(layoutMode, layoutOrientation);
}
```

- [ ] **Step 5: Update `AppShell.tsx` — pass `layoutOrientation` to all `getStrategy` calls**

`layoutOrientation` is already in scope at line 51 of AppShell. There are 5 call sites to update (all currently call `getStrategy(layoutMode)`):

**Line 171** (inside `handleDragStart`):
```typescript
const withoutActive = getStrategy(layoutMode, layoutOrientation).preview(committed, { kind: 'remove', id });
```

**Line 203** (inside `handleDragMove`, palette branch):
```typescript
const previewLayout = getStrategy(layoutMode, layoutOrientation).preview([...committed, temp], { kind: 'drag', id, targetCell: cell });
```

**Line 267** (inside `handleDragMove`, swap branch):
```typescript
const previewLayout = getStrategy(layoutMode, layoutOrientation).preview(committed, { kind: 'swap', id: activeId, targetId: hitId });
```

**Line 278** (inside `handleDragMove`, insert branch):
```typescript
const previewLayout = getStrategy(layoutMode, layoutOrientation).preview(committed, { kind: 'drag', id: activeId, targetCell: { x: targetX, y: hit.y } });
```

**Line 284** (inside `handleDragMove`, empty-space branch):
```typescript
const previewLayout = getStrategy(layoutMode, layoutOrientation).preview(committed, { kind: 'drag', id: activeId, targetCell: cell });
```

Also update the two `useCallback` dependency arrays to include `layoutOrientation`:

`handleDragStart` deps (line 174):
```typescript
}, [committed, layoutMode, layoutOrientation, setDrag]);
```

`handleDragMove` deps (line 287):
```typescript
}, [boardRef, metrics, committed, layoutMode, layoutOrientation, scheduleDrag]);
```

- [ ] **Step 6: Run the full test suite**

```
npm test
```

Expected: all tests PASS. If `npx tsc --noEmit` is needed for type-checking:

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add lib/grid/engine.ts lib/grid/engine.test.ts lib/state/boardStore.ts components/shell/AppShell.tsx
git commit -m "feat(grid): wire horizontal drag engine — replace transposition with native H strategies"
```
