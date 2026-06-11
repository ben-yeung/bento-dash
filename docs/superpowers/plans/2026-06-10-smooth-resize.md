# Smooth Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make widget resize track the mouse at grid-cell resolution with instant visual feedback, smooth neighbour reflow, a dashed snap-target outline, and a spring snap on mouseup.

**Architecture:** Replace `nearestPreset` in `onPointerMove` with `clampSize` so the preview fires at every cell boundary rather than only at preset boundaries. Add a parallel `onIndicator` callback for the nearest preset label. Disable the `motion.div` spring on the resizing widget during drag so it tracks the mouse instantly; neighbours keep their existing spring. On mouseup the spring re-enables and animates the final preset snap.

**Tech Stack:** React 18, motion/react (Framer Motion), vitest, @testing-library/react

**Spec:** `docs/superpowers/specs/2026-06-10-smooth-resize-design.md`

---

## File map

| File | Change |
|---|---|
| `lib/hooks/useDragResize.ts` | Core logic: cell-snap preview, indicator callback, preset commit |
| `lib/hooks/useDragResize.test.ts` | New: unit tests for the hook |
| `components/board/Widget.tsx` | Add `resizing` + `snapTarget` props, transition override, badge |
| `components/board/Widget.module.css` | Dashed outline + badge styles |
| `components/board/BentoBoard.tsx` | Wire `WidgetWithResize` with new hook API and widget props |

---

## Task 1: Write failing tests for `useDragResize`

**Files:**
- Create: `lib/hooks/useDragResize.test.ts`

The hook takes callbacks and pointer events. Test it by calling the returned handlers directly with minimal fake events.

`metrics` throughout: `{ cellSize: 100, gap: 12, cols: 6 }` → stride = 112 px per cell.

- [ ] **Step 1: Create the test file**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragResize } from './useDragResize';

const metrics = { cellSize: 100, gap: 12, cols: 6 }; // stride = 112 px

function makePointer(x: number, y: number, pointerId = 1): React.PointerEvent {
  return {
    clientX: x,
    clientY: y,
    pointerId,
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
    target: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
  } as unknown as React.PointerEvent;
}

describe('useDragResize', () => {
  let onPreview: ReturnType<typeof vi.fn>;
  let onIndicator: ReturnType<typeof vi.fn>;
  let onCommit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onPreview = vi.fn();
    onIndicator = vi.fn();
    onCommit = vi.fn();
  });

  it('calls onPreview at each cell boundary, not just preset boundaries', () => {
    const { result } = renderHook(() =>
      useDragResize({ startW: 2, startH: 2, metrics, onPreview, onIndicator, onCommit }),
    );
    act(() => result.current.onPointerDown(makePointer(0, 0)));
    // drag one cell right: raw = 3×2 (not a preset, but preview should fire)
    act(() => result.current.onPointerMove(makePointer(112, 0)));
    expect(onPreview).toHaveBeenCalledWith(3, 2);
    // drag another cell right: raw = 4×2 (a preset: 4×2 exists)
    act(() => result.current.onPointerMove(makePointer(224, 0)));
    expect(onPreview).toHaveBeenCalledWith(4, 2);
    expect(onPreview).toHaveBeenCalledTimes(2);
  });

  it('does not call onPreview when raw cell position is unchanged', () => {
    const { result } = renderHook(() =>
      useDragResize({ startW: 2, startH: 2, metrics, onPreview, onIndicator, onCommit }),
    );
    act(() => result.current.onPointerDown(makePointer(0, 0)));
    act(() => result.current.onPointerMove(makePointer(50, 0)));  // < 56 px threshold, still col 2
    act(() => result.current.onPointerMove(makePointer(55, 0)));  // still col 2
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('calls onIndicator only when nearest preset changes', () => {
    const { result } = renderHook(() =>
      useDragResize({ startW: 2, startH: 2, metrics, onPreview, onIndicator, onCommit }),
    );
    act(() => result.current.onPointerDown(makePointer(0, 0)));
    // raw 3×2: nearestPreset(3,2) = '3×2'
    act(() => result.current.onPointerMove(makePointer(112, 0)));
    expect(onIndicator).toHaveBeenCalledTimes(1);
    expect(onIndicator).toHaveBeenCalledWith(expect.objectContaining({ w: 3, h: 2 }));
    // raw 3×2 again (no change): indicator should not fire again
    act(() => result.current.onPointerMove(makePointer(120, 0)));
    expect(onIndicator).toHaveBeenCalledTimes(1);
  });

  it('commits the nearest preset on pointer up', () => {
    const { result } = renderHook(() =>
      useDragResize({ startW: 2, startH: 2, metrics, onPreview, onIndicator, onCommit }),
    );
    act(() => result.current.onPointerDown(makePointer(0, 0)));
    // drag to raw 3×2 — nearestPreset(3,2) = { w:3, h:2, name:'3×2' }
    act(() => result.current.onPointerMove(makePointer(112, 0)));
    act(() => result.current.onPointerUp(makePointer(112, 0)));
    expect(onCommit).toHaveBeenCalledWith(3, 2);
  });

  it('commits startW/startH preset if pointer never moved', () => {
    const { result } = renderHook(() =>
      useDragResize({ startW: 2, startH: 2, metrics, onPreview, onIndicator, onCommit }),
    );
    act(() => result.current.onPointerDown(makePointer(0, 0)));
    act(() => result.current.onPointerUp(makePointer(0, 0)));
    // nearestPreset(2,2) = { w:2, h:2 }
    expect(onCommit).toHaveBeenCalledWith(2, 2);
  });
});
```

- [ ] **Step 2: Run to confirm all tests fail**

```
npx vitest run lib/hooks/useDragResize.test.ts
```

Expected: all 5 tests fail — `onIndicator` is not in the hook API yet.

---

## Task 2: Update `useDragResize` hook

**Files:**
- Modify: `lib/hooks/useDragResize.ts` (full replacement)

- [ ] **Step 3: Replace the hook implementation**

```ts
'use client';
import { useCallback, useRef } from 'react';
import type { GridMetrics } from '@/lib/grid/collision';
import { clampSize, nearestPreset, type SizePreset } from '@/lib/grid/sizes';

interface UseDragResizeArgs {
  startW: number;
  startH: number;
  metrics: GridMetrics;
  onPreview: (w: number, h: number) => void;
  onIndicator: (preset: SizePreset) => void;
  onCommit: (w: number, h: number) => void;
}

export function useDragResize({ startW, startH, metrics, onPreview, onIndicator, onCommit }: UseDragResizeArgs) {
  const origin = useRef<{ px: number; py: number; w: number; h: number } | null>(null);
  const latestRaw  = useRef<{ w: number; h: number }>({ w: startW, h: startH });
  const latestSnap = useRef<SizePreset>(nearestPreset(startW, startH));

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      origin.current = { px: e.clientX, py: e.clientY, w: startW, h: startH };
    },
    [startW, startH],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!origin.current) return;
      const stride = metrics.cellSize + metrics.gap;
      const dw = Math.round((e.clientX - origin.current.px) / stride);
      const dh = Math.round((e.clientY - origin.current.py) / stride);
      const raw = clampSize(origin.current.w + dw, origin.current.h + dh);
      if (raw.w !== latestRaw.current.w || raw.h !== latestRaw.current.h) {
        latestRaw.current = raw;
        onPreview(raw.w, raw.h);
      }
      const snap = nearestPreset(raw.w, raw.h);
      if (snap.w !== latestSnap.current.w || snap.h !== latestSnap.current.h) {
        latestSnap.current = snap;
        onIndicator(snap);
      }
    },
    [metrics, onPreview, onIndicator],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!origin.current) return;
      (e.target as Element).releasePointerCapture(e.pointerId);
      origin.current = null;
      onCommit(latestSnap.current.w, latestSnap.current.h);
    },
    [onCommit],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npx vitest run lib/hooks/useDragResize.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```
git add lib/hooks/useDragResize.ts lib/hooks/useDragResize.test.ts
git commit -m "feat: resize previews at cell boundaries with indicator callback"
```

---

## Task 3: Add `resizing` and `snapTarget` props to `Widget`

**Files:**
- Modify: `components/board/Widget.tsx`
- Modify: `components/board/Widget.module.css`

The dashed outline uses `outline` (not `border`) so it sits outside the tile without affecting layout. The badge uses `--accent` (`#6366f1`), the same variable used by `.close:hover`.

- [ ] **Step 6: Update `Widget.tsx`**

Replace the `WidgetProps` interface and component:

```tsx
interface WidgetProps {
  widget: WidgetLayout;
  dragging?: boolean;
  dimmed?: boolean;
  interactive?: boolean;
  manageMode?: boolean;
  resizing?: boolean;
  snapTarget?: string | null;
  children?: ReactNode;
}

export function Widget({
  widget,
  dragging = false,
  dimmed = false,
  interactive = true,
  manageMode = false,
  resizing = false,
  snapTarget = null,
  children,
}: WidgetProps) {
  const removeWidget = useBoard((s) => s.removeWidget);
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: widget.id,
    disabled: !interactive,
  });
  const def = WIDGET_REGISTRY.find((d) => d.category === widget.category);
  const ContentComponent = def?.ContentComponent;
  const style: CSSProperties = {
    gridColumn: `${widget.x + 1} / span ${widget.w}`,
    gridRow: `${widget.y + 1} / span ${widget.h}`,
  };
  return (
    <motion.div
      layout
      layoutId={widget.id}
      transition={
        resizing
          ? { duration: 0 }
          : { type: 'spring', stiffness: 520, damping: 42, mass: 0.7 }
      }
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: dimmed ? 0.18 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={styles.tile}
      style={style}
      data-dragging={dragging}
      data-dimmed={dimmed}
      data-resizing={resizing}
      ref={setNodeRef}
      {...(interactive ? listeners : {})}
      {...attributes}
    >
      {ContentComponent && (
        <ContentComponent category={widget.category} w={widget.w} h={widget.h} />
      )}
      {snapTarget && (
        <span className={styles.snapBadge}>{snapTarget}</span>
      )}
      {/* TODO(manage-mode-x-exit-anim): the × mounts/unmounts via the manageMode conditional with only enter animation (initial/animate); it pops out abruptly when manage mode toggles off. Wrap in AnimatePresence with an exit prop if the pop-out animation is wanted. */}
      {manageMode && (
        <motion.button
          type="button"
          className={styles.close}
          aria-label="Delete widget"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => removeWidget(widget.id)}
        >
          ×
        </motion.button>
      )}
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 7: Add styles to `Widget.module.css`**

Append to the end of the file:

```css
.tile[data-resizing='true'] {
  outline: 2px dashed var(--accent);
  outline-offset: 2px;
}

.snapBadge {
  position: absolute;
  bottom: 6px;
  right: 8px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  pointer-events: none;
  z-index: 4;
  letter-spacing: 0.02em;
}
```

- [ ] **Step 8: Run the full test suite to catch any type errors**

```
npx vitest run
```

Expected: all existing tests pass (Widget tests rely on render, not on the new props, so no breakage expected).

- [ ] **Step 9: Commit**

```
git add components/board/Widget.tsx components/board/Widget.module.css
git commit -m "feat: add resizing/snapTarget props to Widget with dashed outline and badge"
```

---

## Task 4: Wire `WidgetWithResize` in `BentoBoard`

**Files:**
- Modify: `components/board/BentoBoard.tsx`

`WidgetWithResize` lives at module scope. It can hold its own `snapTarget` state — only one widget is ever being resized at a time, so the state is purely local to the widget being dragged.

- [ ] **Step 10: Update imports at the top of `BentoBoard.tsx`**

Add `useState` to the React import and add `nearestPreset` and `SizePreset` to the sizes import:

```ts
import { useState } from 'react';
```

```ts
import { nearestPreset, type SizePreset } from '@/lib/grid/sizes';
```

- [ ] **Step 11: Update `WidgetWithResizeProps` interface**

The interface does not need new fields — `snapTarget` is local state inside `WidgetWithResize`, not passed from the parent.

- [ ] **Step 12: Update `WidgetWithResize` body**

Replace the full function body (keeping the module-scope declaration):

```tsx
function WidgetWithResize({
  w,
  dimmed = false,
  metrics,
  committed,
  layoutMode,
  activeId,
  resizingId,
  interactionsLocked,
  manageMode,
  setPreview,
  setResizingId,
  resizeWidget,
}: WidgetWithResizeProps) {
  const [snapTarget, setSnapTarget] = useState<SizePreset | null>(null);

  const { onPointerDown, onPointerMove, onPointerUp } = useDragResize({
    startW: w.w,
    startH: w.h,
    metrics,
    onPreview: (nw, nh) =>
      setPreview(getStrategy(layoutMode).preview(committed, { kind: 'resize', id: w.id, w: nw, h: nh })),
    onIndicator: setSnapTarget,
    onCommit: (nw, nh) => {
      resizeWidget(w.id, nw, nh);
      setResizingId(null);
      setPreview(null);
      setSnapTarget(null);
    },
  });

  const isResizing = resizingId === w.id;

  return (
    <Widget
      widget={w}
      dragging={w.id === activeId}
      dimmed={dimmed}
      interactive={resizingId === null && !interactionsLocked}
      manageMode={manageMode}
      resizing={isResizing}
      snapTarget={isResizing ? (snapTarget?.name ?? null) : null}
    >
      {!interactionsLocked && (
        <ResizeHandle
          onPointerDown={(e) => {
            setResizingId(w.id);
            setPreview(committed);
            setSnapTarget(nearestPreset(w.w, w.h));
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

- [ ] **Step 13: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 14: Commit**

```
git add components/board/BentoBoard.tsx
git commit -m "feat: wire smooth resize — cell-snap preview, snap indicator, instant widget spring"
```

---

## Task 5: Manual smoke test

- [ ] **Step 15: Start the dev server**

```
npm run dev
```

Open `http://localhost:3000`. Enter manage mode (long-press or the manage button).

- [ ] **Step 16: Verify resize behaviour**

Drag a widget's resize handle and confirm:
1. The widget resizes instantly at each grid-cell boundary (no spring lag during drag).
2. Neighbouring widgets spring smoothly into their reflowed positions on each cell crossing.
3. A dashed indigo outline appears on the resizing widget.
4. A small badge (e.g. `"3×2"`) in the bottom-right shows the nearest preset target. It updates as you cross boundaries.
5. On mouseup, the widget springs into the committed preset size (satisfying snap).
6. The dashed outline and badge disappear after release.

- [ ] **Step 17: Verify no regressions**

Check that:
- Drag-to-reorder still works (spring animations on other widgets unaffected).
- Manage mode ×-button still works.
- Tag filtering (dim/hide mode) still locks interactions correctly.
