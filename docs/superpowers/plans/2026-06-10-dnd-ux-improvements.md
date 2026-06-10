# Drag-and-Drop UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace cursor-to-cell math with bounding-box widget detection, introduce a typed `DragState`, and add same-size widget swapping with clear visual feedback.

**Architecture:** A typed `DragState` object replaces the separate `activeId`+`preview` state in `BentoBoard`, driving all visual feedback (swap glow, dotted preview) from one source. Hover detection switches from `pointToCell` to DOM bounding-box intersection so drag triggering is grab-offset-independent. A shared `applySwap` utility enables direct coordinate exchange for same-size widgets in both layout strategies.

**Tech Stack:** React 18, dnd-kit/core v6, Zustand, Vitest, CSS Modules, TypeScript

**Spec:** `docs/superpowers/specs/2026-06-10-dnd-ux-design.md`

---

## File Map

| File | Change |
|---|---|
| `lib/grid/types.ts` | Add `DragState` type; add `swap` to `Move` union |
| `lib/grid/swap.ts` | **New** — `applySwap` utility (avoids circular dep via engine.ts) |
| `lib/grid/swap.test.ts` | **New** — tests for `applySwap` |
| `lib/grid/strategies/autoPack.ts` | Handle `swap` Move kind |
| `lib/grid/strategies/autoPack.test.ts` | Add `preview(swap)` test |
| `lib/grid/strategies/pushCompact.ts` | Handle `swap` Move kind |
| `lib/grid/strategies/pushCompact.test.ts` | Add `preview(swap)` test |
| `lib/state/boardStore.ts` | Add `swapWidgets` action |
| `lib/state/boardStore.test.ts` | Add `swapWidgets` test |
| `components/board/Widget.tsx` | Add `onMount`/`onUnmount` ref callbacks; `isSwapTarget` prop |
| `components/board/Widget.module.css` | Add `.tile[data-swap-target]` ring style |
| `components/board/DropPreview.tsx` | Add `mode` prop |
| `components/board/BentoBoard.tsx` | Replace `activeId`+`preview` with `dragState`; add `widgetRefs`; update all handlers + render |

**Not touched:** `DragOverlayWidget`, `ResizeHandle`, `useDragResize`, `useGridMetrics`, `collision.ts`, `sizes.ts`, `occupancy.ts`, `engine.ts`

---

## Task 1: Add `DragState` type and `swap` Move kind

**Files:**
- Modify: `lib/grid/types.ts`

No test needed — TypeScript enforces correctness at compile time. Strategies won't compile after this until Task 3.

- [ ] **Step 1: Add `swap` to the `Move` union and add `DragState` type**

Open `lib/grid/types.ts`. The full file after the change:

```ts
export const COLS = 6;
export const MAX_H = 4;
export const GRID_GAP = 12; // px, must match --gap

export type Category = 'finance' | 'lifestyle' | 'health' | 'calendar';

export interface WidgetLayout {
  id: string;
  x: number; // 0-based column
  y: number; // 0-based row
  w: number; // column span 1..COLS
  h: number; // row span 1..MAX_H
  category: Category;
  order: number; // canonical sequence (primary key for autoPack)
}

export type Move =
  | { kind: 'drag'; id: string; targetCell: { x: number; y: number } }
  | { kind: 'resize'; id: string; w: number; h: number }
  | { kind: 'add'; widget: WidgetLayout }
  | { kind: 'remove'; id: string }
  | { kind: 'swap'; id: string; targetId: string };

export interface LayoutStrategy {
  resolve(widgets: WidgetLayout[]): WidgetLayout[];
  preview(widgets: WidgetLayout[], move: Move): WidgetLayout[];
}

export type DragState =
  | { phase: 'idle' }
  | {
      phase: 'dragging';
      activeId: string;
      targetKind: 'none' | 'insert' | 'swap';
      targetId?: string; // only set when targetKind === 'swap'
      previewLayout: WidgetLayout[];
    };
```

- [ ] **Step 2: Verify TypeScript still compiles (strategies will have exhaustiveness errors — that's expected)**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: errors in `autoPack.ts` and `pushCompact.ts` about non-exhaustive switch — this is correct and will be fixed in Task 3.

- [ ] **Step 3: Commit**

```bash
git add lib/grid/types.ts
git commit -m "feat: add DragState type and swap Move kind to grid types"
```

---

## Task 2: Create `applySwap` utility

**Files:**
- Create: `lib/grid/swap.ts`
- Create: `lib/grid/swap.test.ts`

> Note: `applySwap` lives in `lib/grid/swap.ts` (not `engine.ts` as the spec suggests) because both strategies import from `engine.ts`, which itself imports from the strategies — putting `applySwap` in `engine.ts` would create a circular dependency.

- [ ] **Step 1: Write the failing tests**

Create `lib/grid/swap.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { applySwap } from './swap';
import type { WidgetLayout } from './types';

const w = (id: string, x: number, y: number, ww: number, h: number): WidgetLayout => ({
  id, x, y, w: ww, h, category: 'finance', order: 0,
});

describe('applySwap', () => {
  it('exchanges x,y coordinates between two widgets', () => {
    const layout = [w('a', 0, 0, 2, 1), w('b', 2, 0, 2, 1)];
    const result = applySwap(layout, 'a', 'b');
    expect(result.find(x => x.id === 'a')).toMatchObject({ x: 2, y: 0 });
    expect(result.find(x => x.id === 'b')).toMatchObject({ x: 0, y: 0 });
  });

  it('leaves all other widgets unchanged', () => {
    const layout = [w('a', 0, 0, 1, 1), w('b', 1, 0, 1, 1), w('c', 2, 0, 1, 1)];
    const result = applySwap(layout, 'a', 'b');
    expect(result.find(x => x.id === 'c')).toMatchObject({ x: 2, y: 0 });
  });

  it('preserves w, h, category, and order fields of both widgets', () => {
    const layout = [
      { id: 'a', x: 0, y: 0, w: 2, h: 2, category: 'finance' as const, order: 3 },
      { id: 'b', x: 2, y: 0, w: 2, h: 2, category: 'health' as const, order: 7 },
    ];
    const result = applySwap(layout, 'a', 'b');
    expect(result.find(x => x.id === 'a')).toMatchObject({ w: 2, h: 2, category: 'finance', order: 3 });
    expect(result.find(x => x.id === 'b')).toMatchObject({ w: 2, h: 2, category: 'health', order: 7 });
  });

  it('returns a new array (does not mutate input)', () => {
    const layout = [w('a', 0, 0, 1, 1), w('b', 1, 0, 1, 1)];
    const result = applySwap(layout, 'a', 'b');
    expect(result).not.toBe(layout);
    expect(layout[0].x).toBe(0); // original unchanged
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/grid/swap.test.ts
```

Expected: FAIL — `Cannot find module './swap'`

- [ ] **Step 3: Implement `applySwap`**

Create `lib/grid/swap.ts`:

```ts
import type { WidgetLayout } from './types';

export function applySwap(layout: WidgetLayout[], id: string, targetId: string): WidgetLayout[] {
  const a = layout.find((w) => w.id === id)!;
  const b = layout.find((w) => w.id === targetId)!;
  return layout.map((w) =>
    w.id === id       ? { ...w, x: b.x, y: b.y } :
    w.id === targetId ? { ...w, x: a.x, y: a.y } : w,
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/grid/swap.test.ts
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add lib/grid/swap.ts lib/grid/swap.test.ts
git commit -m "feat: add applySwap utility for same-size widget coordinate exchange"
```

---

## Task 3: Add `swap` support to both layout strategies

**Files:**
- Modify: `lib/grid/strategies/autoPack.ts`
- Modify: `lib/grid/strategies/autoPack.test.ts`
- Modify: `lib/grid/strategies/pushCompact.ts`
- Modify: `lib/grid/strategies/pushCompact.test.ts`

- [ ] **Step 1: Write failing test for `autoPack.preview(swap)`**

Add to `lib/grid/strategies/autoPack.test.ts` (inside the `describe('autoPack', ...)` block, after the existing tests):

```ts
  it('preview(swap) exchanges positions without repacking other widgets', () => {
    const layout: WidgetLayout[] = [
      { id: 'a', x: 0, y: 0, w: 2, h: 1, category: 'finance', order: 0 },
      { id: 'b', x: 2, y: 0, w: 2, h: 1, category: 'health', order: 1 },
      { id: 'c', x: 4, y: 0, w: 2, h: 1, category: 'lifestyle', order: 2 },
    ];
    const out = autoPack.preview(layout, { kind: 'swap', id: 'a', targetId: 'b' });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 2, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 4, y: 0 }); // untouched
  });
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/grid/strategies/autoPack.test.ts
```

Expected: FAIL — TypeScript error about non-exhaustive switch on `move.kind`

- [ ] **Step 3: Add `swap` case to `autoPack.ts`**

Add `import { applySwap } from '../swap';` at the top of `lib/grid/strategies/autoPack.ts`, then add the `swap` case to the `preview` switch:

```ts
import { COLS, type LayoutStrategy, type Move, type WidgetLayout } from '../types';
import { clampSize } from '../sizes';
import { createGrid, fits, occupy } from '../occupancy';
import { applySwap } from '../swap';

// ... (packDense and reorderByCell unchanged) ...

export const autoPack: LayoutStrategy = {
  resolve(widgets) {
    return packDense(widgets);
  },
  preview(widgets, move: Move) {
    switch (move.kind) {
      case 'drag':
        return packDense(reorderByCell(widgets, move.id, move.targetCell));
      case 'resize':
        return packDense(
          widgets.map((w) => (w.id === move.id ? { ...w, ...clampSize(move.w, move.h) } : w)),
        );
      case 'add':
        return packDense([...widgets, { ...move.widget, order: widgets.length }]);
      case 'remove':
        return packDense(widgets.filter((w) => w.id !== move.id));
      case 'swap':
        return applySwap(widgets, move.id, move.targetId);
    }
  },
};
```

- [ ] **Step 4: Run autoPack tests**

```bash
npx vitest run lib/grid/strategies/autoPack.test.ts
```

Expected: PASS — all tests including the new swap test

- [ ] **Step 5: Write failing test for `pushCompact.preview(swap)`**

The file already has `describe('pushCompact', ...)` and an `at` helper. Add the following `it(...)` inside the existing describe block, after the `'resize grows the footprint'` test:

```ts
  it('preview(swap) exchanges positions without compacting other widgets', () => {
    const layout = [at('a', 0, 0, 2, 1, 0), at('b', 2, 0, 2, 1, 1), at('c', 4, 0, 2, 1, 2)];
    const out = pushCompact.preview(layout, { kind: 'swap', id: 'a', targetId: 'b' });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 2, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 4, y: 0 });
  });
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npx vitest run lib/grid/strategies/pushCompact.test.ts
```

Expected: FAIL — exhaustiveness error on `move.kind`

- [ ] **Step 7: Add `swap` case to `pushCompact.ts`**

Add `import { applySwap } from '../swap';` at top, and add the `swap` case to the `preview` switch:

```ts
import { COLS, type LayoutStrategy, type Move, type WidgetLayout } from '../types';
import { clampSize } from '../sizes';
import { createGrid, fits, occupy } from '../occupancy';
import { applySwap } from '../swap';

// ... (compactVertical and pushCompactDrag unchanged) ...

export const pushCompact: LayoutStrategy = {
  resolve(widgets) {
    return compactVertical(widgets);
  },
  preview(widgets, move: Move) {
    switch (move.kind) {
      case 'drag':
        return pushCompactDrag(widgets, move.id, move.targetCell);
      case 'resize':
        return compactVertical(
          widgets.map((w) => (w.id === move.id ? { ...w, ...clampSize(move.w, move.h) } : w)),
        );
      case 'add':
        return compactVertical([...widgets, move.widget]);
      case 'remove':
        return compactVertical(widgets.filter((w) => w.id !== move.id));
      case 'swap':
        return applySwap(widgets, move.id, move.targetId);
    }
  },
};
```

- [ ] **Step 8: Run all strategy tests**

```bash
npx vitest run lib/grid/strategies/
```

Expected: PASS — all tests in both strategy files

- [ ] **Step 9: Commit**

```bash
git add lib/grid/strategies/autoPack.ts lib/grid/strategies/autoPack.test.ts lib/grid/strategies/pushCompact.ts lib/grid/strategies/pushCompact.test.ts
git commit -m "feat: add swap Move support to autoPack and pushCompact strategies"
```

---

## Task 4: Add `swapWidgets` action to boardStore

**Files:**
- Modify: `lib/state/boardStore.ts`
- Modify: `lib/state/boardStore.test.ts`

- [ ] **Step 1: Write failing test**

Add to `lib/state/boardStore.test.ts` (inside the existing `describe` block):

```ts
  it('swapWidgets exchanges the positions of two widgets', () => {
    useBoard.getState().addWidget('finance', 2, 1);
    useBoard.getState().addWidget('health', 2, 1);
    const before = useBoard.getState().widgets;
    const [a, b] = before;
    // autoPack places them at x:0,y:0 and x:2,y:0
    useBoard.getState().swapWidgets(a.id, b.id);
    const after = useBoard.getState().widgets;
    expect(after.find((w) => w.id === a.id)).toMatchObject({ x: b.x, y: b.y });
    expect(after.find((w) => w.id === b.id)).toMatchObject({ x: a.x, y: a.y });
  });
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/state/boardStore.test.ts
```

Expected: FAIL — `swapWidgets is not a function`

- [ ] **Step 3: Add `swapWidgets` to `boardStore.ts`**

Update the `BoardState` interface in `lib/state/boardStore.ts` to add the new action:

```ts
interface BoardState {
  widgets: WidgetLayout[];
  setWidgets: (w: WidgetLayout[]) => void;
  reResolve: () => void;
  moveWidget: (id: string, targetCell: { x: number; y: number }) => void;
  resizeWidget: (id: string, w: number, h: number) => void;
  addWidget: (category: Category, w: number, h: number) => void;
  removeWidget: (id: string) => void;
  swapWidgets: (id: string, targetId: string) => void;
}
```

Then add the implementation inside the `create()(persist(...)` call alongside the other actions:

```ts
swapWidgets: (id, targetId) =>
  set({ widgets: strategy().preview(get().widgets, { kind: 'swap', id, targetId }) }),
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/state/boardStore.test.ts
```

Expected: PASS — all 4 tests

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: PASS — all tests pass (TypeScript exhaustiveness errors in BentoBoard are compile errors, not test failures)

- [ ] **Step 6: Commit**

```bash
git add lib/state/boardStore.ts lib/state/boardStore.test.ts
git commit -m "feat: add swapWidgets action to boardStore"
```

---

## Task 5: Add ref callbacks and `isSwapTarget` prop to Widget

**Files:**
- Modify: `components/board/Widget.tsx`
- Modify: `components/board/Widget.module.css`

No unit test — these are visual/DOM changes verified manually in Task 7.

- [ ] **Step 1: Add new props and ref registration to `Widget.tsx`**

The full updated file:

```tsx
'use client';
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useDraggable } from '@dnd-kit/core';
import styles from './Widget.module.css';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import type { WidgetLayout } from '@/lib/grid/types';

interface WidgetProps {
  widget: WidgetLayout;
  dragging?: boolean;
  dimmed?: boolean;
  interactive?: boolean;
  isSwapTarget?: boolean;
  onMount?: (id: string, el: HTMLElement) => void;
  onUnmount?: (id: string) => void;
  children?: ReactNode;
}

export function Widget({
  widget,
  dragging = false,
  dimmed = false,
  interactive = true,
  isSwapTarget = false,
  onMount,
  onUnmount,
  children,
}: WidgetProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: widget.id,
    disabled: !interactive,
  });

  // Maintain a local ref alongside dnd-kit's setNodeRef so we can register
  // the DOM element for bounding-box hit detection in BentoBoard.
  const localRef = useRef<HTMLDivElement | null>(null);
  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      setNodeRef(el);
      localRef.current = el;
    },
    [setNodeRef],
  );

  useEffect(() => {
    if (localRef.current) onMount?.(widget.id, localRef.current);
    return () => { onUnmount?.(widget.id); };
  // onMount/onUnmount are stable useCallback refs from BentoBoard — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.id]);

  const style: CSSProperties = {
    gridColumn: `${widget.x + 1} / span ${widget.w}`,
    gridRow: `${widget.y + 1} / span ${widget.h}`,
  };
  return (
    <motion.div
      layout
      layoutId={widget.id}
      transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.7 }}
      className={styles.tile}
      style={style}
      data-dragging={dragging}
      data-dimmed={dimmed}
      data-swap-target={isSwapTarget}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: dimmed ? 0.18 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      ref={combinedRef}
      {...(interactive ? listeners : {})}
      {...attributes}
    >
      <WidgetSkeleton category={widget.category} />
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Add swap target ring to `Widget.module.css`**

Append to `components/board/Widget.module.css`:

```css
.tile[data-swap-target='true'] {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
```

- [ ] **Step 3: Commit**

```bash
git add components/board/Widget.tsx components/board/Widget.module.css
git commit -m "feat: add onMount/onUnmount ref callbacks and isSwapTarget ring to Widget"
```

---

## Task 6: Add `mode` prop to DropPreview

**Files:**
- Modify: `components/board/DropPreview.tsx`

- [ ] **Step 1: Update `DropPreview.tsx`**

The full updated file:

```tsx
'use client';
import styles from './DropPreview.module.css';
import type { WidgetLayout } from '@/lib/grid/types';

interface DropPreviewProps {
  widget: WidgetLayout;
  mode?: 'insert' | 'none';
}

export function DropPreview({ widget, mode = 'insert' }: DropPreviewProps) {
  return (
    <div
      className={styles.ghost}
      data-mode={mode}
      style={{
        gridColumn: `${widget.x + 1} / span ${widget.w}`,
        gridRow: `${widget.y + 1} / span ${widget.h}`,
      }}
    />
  );
}
```

> The `mode` prop is wired up now but `DropPreview.module.css` is unchanged — both modes render identically for now. `data-mode` is available for future styling differentiation.

- [ ] **Step 2: Commit**

```bash
git add components/board/DropPreview.tsx
git commit -m "feat: add mode prop to DropPreview for insert/none distinction"
```

---

## Task 7: Refactor BentoBoard — DragState, widgetRefs, bounding-box detection

**Files:**
- Modify: `components/board/BentoBoard.tsx`

This is the largest change. Work through the steps sequentially — each step brings the file closer to compiling.

- [ ] **Step 1: Update imports**

Replace the import block at the top of `components/board/BentoBoard.tsx`:

```tsx
'use client';
import { useCallback, useRef, useState } from 'react';
import { LayoutGroup, AnimatePresence } from 'motion/react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
} from '@dnd-kit/core';
import styles from './BentoBoard.module.css';
import { Widget } from './Widget';
import { DragOverlayWidget } from './DragOverlayWidget';
import { DropPreview } from './DropPreview';
import { ResizeHandle } from './ResizeHandle';
import { useDragResize } from '@/lib/hooks/useDragResize';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';
import { useGridMetrics } from '@/lib/hooks/useGridMetrics';
import { getStrategy, type LayoutMode } from '@/lib/grid/engine';
import { pointToCell, type GridMetrics } from '@/lib/grid/collision';
import type { DragState, WidgetLayout } from '@/lib/grid/types';
```

- [ ] **Step 2: Update `WidgetWithResizeProps` interface and component**

Replace the `WidgetWithResizeProps` interface and `WidgetWithResize` function (lines 26–90 in the original):

```tsx
interface WidgetWithResizeProps {
  w: WidgetLayout;
  dimmed?: boolean;
  metrics: GridMetrics;
  committed: WidgetLayout[];
  layoutMode: LayoutMode;
  isSwapTarget: boolean;
  resizingId: string | null;
  interactionsLocked: boolean;
  setResizePreview: (widgets: WidgetLayout[] | null) => void;
  setResizingId: (id: string | null) => void;
  resizeWidget: (id: string, w: number, h: number) => void;
  onMount: (id: string, el: HTMLElement) => void;
  onUnmount: (id: string) => void;
}

// Defined at module scope (NOT inside BentoBoard) so its type identity is stable
// across renders. If it were declared in the render body, every state update would
// remount the whole widget subtree — dropping the resize handle's pointer capture
// mid-gesture (lostpointercapture). Stable identity lets React reconcile instead.
function WidgetWithResize({
  w,
  dimmed = false,
  metrics,
  committed,
  layoutMode,
  isSwapTarget,
  resizingId,
  interactionsLocked,
  setResizePreview,
  setResizingId,
  resizeWidget,
  onMount,
  onUnmount,
}: WidgetWithResizeProps) {
  const { onPointerDown, onPointerMove, onPointerUp } = useDragResize({
    startW: w.w,
    startH: w.h,
    metrics,
    onPreview: (nw, nh) =>
      setResizePreview(getStrategy(layoutMode).preview(committed, { kind: 'resize', id: w.id, w: nw, h: nh })),
    onCommit: (nw, nh) => {
      resizeWidget(w.id, nw, nh);
      setResizingId(null);
      setResizePreview(null);
    },
  });
  return (
    <Widget
      widget={w}
      dimmed={dimmed}
      interactive={resizingId === null && !interactionsLocked}
      isSwapTarget={isSwapTarget}
      onMount={onMount}
      onUnmount={onUnmount}
    >
      {!interactionsLocked && (
        <ResizeHandle
          onPointerDown={(e) => {
            setResizingId(w.id);
            setResizePreview(committed);
            onPointerDown(e);
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      )}
    </Widget>
  );
}
```

- [ ] **Step 3: Update state declarations inside `BentoBoard()`**

Replace lines 102–104 (the three `useState` declarations) with:

```tsx
const [dragState, setDragState] = useState<DragState>({ phase: 'idle' });
const [resizePreview, setResizePreview] = useState<WidgetLayout[] | null>(null);
const [resizingId, setResizingId] = useState<string | null>(null);
```

Also add `swapWidgets` to the store selectors (alongside `moveWidget` and `resizeWidget`):

```tsx
const swapWidgets = useBoard((s) => s.swapWidgets);
```

- [ ] **Step 4: Add `widgetRefs` and `findWidgetUnderCursor`**

Add after the state declarations (before `const sensors`):

```tsx
const widgetRefs = useRef<Map<string, HTMLElement>>(new Map());

const registerRef = useCallback((id: string, el: HTMLElement) => {
  widgetRefs.current.set(id, el);
}, []);

const unregisterRef = useCallback((id: string) => {
  widgetRefs.current.delete(id);
}, []);

function findWidgetUnderCursor(x: number, y: number, excludeId: string): string | null {
  for (const [id, el] of widgetRefs.current) {
    if (id === excludeId) continue;
    const r = el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return id;
  }
  return null;
}
```

- [ ] **Step 5: Update `base` and `widgets` derivations**

Replace lines 107–119 (the `base` and `widgets` derivations):

```tsx
const base =
  dragState.phase === 'dragging'
    ? dragState.previewLayout
    : (resizePreview ?? committed);

const filtering = activeTags.length > 0;
const matches = (cat: WidgetLayout['category']) => activeTags.includes(cat);

// hide mode: show only matches, re-resolved to pack tight. dim mode: show all.
// TODO(layout-reresolve): switching layoutMode (autoPack<->pushCompact) only affects
// subsequent mutations; the current board isn't recompacted until the next drag/resize.
// boardStore.reResolve() exists for this — wire a useSettings.subscribe effect to call it
// on layoutMode change. anchor: lib/state/boardStore.ts (reResolve)
const widgets =
  filtering && filterMode === 'hide'
    ? getStrategy(layoutMode).resolve(base.filter((w) => matches(w.category)))
    : base;

// TODO(filter-drag): while a `hide` filter is active, drag/resize are locked (interactionsLocked)
// to avoid ambiguous order-mapping against hidden widgets. Allow rearranging within a filtered
// subset in a later pass. anchor: components/board/BentoBoard.tsx
const interactionsLocked = filtering && filterMode === 'hide';

// Widget being dragged: look up in previewLayout (not widgets, which may exclude it in hide mode)
const activeWidget =
  dragState.phase === 'dragging'
    ? dragState.previewLayout.find((w) => w.id === dragState.activeId) ?? null
    : null;
```

- [ ] **Step 6: Replace the four drag handlers**

Replace `handleDragStart`, `handleDragMove`, `handleDragEnd`, `handleDragCancel`:

```tsx
function handleDragStart(e: DragStartEvent) {
  const id = String(e.active.id);
  const widget = committed.find((w) => w.id === id);
  if (!widget) return;
  // Reflow all other widgets into the gap, but keep the active widget in previewLayout
  // at its original position so DropPreview can render there.
  const withoutActive = getStrategy(layoutMode).preview(committed, { kind: 'remove', id });
  const previewLayout = [...withoutActive, widget];
  setDragState({ phase: 'dragging', activeId: id, targetKind: 'none', previewLayout });
}

function handleDragMove(e: DragMoveEvent) {
  if (dragState.phase !== 'dragging') return;
  const { activeId } = dragState;

  // Derive cursor position from activation point + accumulated delta
  const activator = e.activatorEvent as PointerEvent;
  const clientX = activator.clientX + e.delta.x;
  const clientY = activator.clientY + e.delta.y;

  const hitId = findWidgetUnderCursor(clientX, clientY, activeId);

  if (hitId) {
    const hit = committed.find((w) => w.id === hitId)!;
    const active = committed.find((w) => w.id === activeId)!;
    const isSameSize = hit.w === active.w && hit.h === active.h;

    if (isSameSize) {
      const previewLayout = getStrategy(layoutMode).preview(committed, {
        kind: 'swap', id: activeId, targetId: hitId,
      });
      setDragState({ phase: 'dragging', activeId, targetKind: 'swap', targetId: hitId, previewLayout });
    } else {
      const previewLayout = getStrategy(layoutMode).preview(committed, {
        kind: 'drag', id: activeId, targetCell: { x: hit.x, y: hit.y },
      });
      setDragState({ phase: 'dragging', activeId, targetKind: 'insert', targetId: hitId, previewLayout });
    }
  } else {
    // Cursor is in a gap — fall back to cell math for positioning
    const board = boardRef.current;
    const rect = e.active.rect.current.translated;
    if (!board || !rect) return;
    const b = board.getBoundingClientRect();
    const cell = pointToCell(rect.left - b.left, rect.top - b.top, metrics);
    const previewLayout = getStrategy(layoutMode).preview(committed, {
      kind: 'drag', id: activeId, targetCell: cell,
    });
    setDragState({ phase: 'dragging', activeId, targetKind: 'none', previewLayout });
  }
}

function handleDragEnd() {
  if (dragState.phase !== 'dragging') return;
  const { activeId, targetKind, targetId, previewLayout } = dragState;

  if (targetKind === 'swap' && targetId) {
    swapWidgets(activeId, targetId);
  } else {
    const moved = previewLayout.find((w) => w.id === activeId);
    if (moved) moveWidget(activeId, { x: moved.x, y: moved.y });
  }
  setDragState({ phase: 'idle' });
}

function handleDragCancel() {
  setDragState({ phase: 'idle' });
}
```

- [ ] **Step 7: Update the render return**

Replace the entire `return (...)` block:

```tsx
return (
  <DndContext
    sensors={sensors}
    onDragStart={handleDragStart}
    onDragMove={handleDragMove}
    onDragEnd={handleDragEnd}
    onDragCancel={handleDragCancel}
  >
    <div ref={boardRef} className={styles.board} style={{ gridAutoRows: `${metrics.cellSize}px` }}>
      <LayoutGroup>
        <AnimatePresence>
          {widgets
            .filter((w) => !(dragState.phase === 'dragging' && w.id === dragState.activeId))
            .map((w) => (
              <WidgetWithResize
                key={w.id}
                w={w}
                dimmed={filtering && filterMode === 'dim' && !matches(w.category)}
                metrics={metrics}
                committed={committed}
                layoutMode={layoutMode}
                isSwapTarget={dragState.phase === 'dragging' && w.id === dragState.targetId}
                resizingId={resizingId}
                interactionsLocked={interactionsLocked}
                setResizePreview={setResizePreview}
                setResizingId={setResizingId}
                resizeWidget={resizeWidget}
                onMount={registerRef}
                onUnmount={unregisterRef}
              />
            ))}
        </AnimatePresence>
        {activeWidget &&
          !interactionsLocked &&
          dragState.phase === 'dragging' &&
          dragState.targetKind !== 'swap' && (
            <DropPreview
              widget={activeWidget}
              mode={dragState.targetKind === 'insert' ? 'insert' : 'none'}
            />
          )}
      </LayoutGroup>
    </div>
    <DragOverlay dropAnimation={null}>
      {activeWidget ? <DragOverlayWidget widget={activeWidget} metrics={metrics} /> : null}
    </DragOverlay>
  </DndContext>
);
```

- [ ] **Step 8: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 9: Run the full test suite**

```bash
npm test
```

Expected: PASS — all tests

- [ ] **Step 10: Smoke test in browser**

```bash
npm run dev
```

Open `http://localhost:3000`. Test these scenarios:

1. **Immediate reflow** — pick up any widget; the source slot should close immediately and other widgets reflow around the gap
2. **Dotted preview tracks hover** — drag slowly across widgets; the dotted outline should update as the cursor enters each new widget's bounds (not wait until near an edge)
3. **Insert reflow** — drag a large widget over a smaller one; dotted outline shows final position, other widgets reflow
4. **Swap glow** — drag a 2×1 widget over another 2×1 widget; the target should show a solid accent-colored outline ring and the dotted preview should disappear
5. **Swap commit** — drop on a same-size target; both widgets should exchange positions with Motion animation
6. **Cancel** — press Escape mid-drag; board should snap back to committed state with no artifacts
7. **Resize** — resize a widget via drag handle; should work exactly as before with no regression

- [ ] **Step 11: Commit**

```bash
git add components/board/BentoBoard.tsx
git commit -m "feat: replace activeId+preview with DragState, bounding-box detection, swap glow"
```

---

## Final verification

- [ ] **Run full test suite one more time**

```bash
npm test
```

Expected: PASS — all tests

- [ ] **Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: clean
