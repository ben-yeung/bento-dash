# Mobile & Responsive Widget Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add phone (2-col) and tablet (4-col) responsive breakpoints with a unified bottom navbar, touch interaction gating, and CSS-variable-driven widget content scaling.

**Architecture:** A `useBreakpoint()` hook provides the active column count to `useGridMetrics`, which returns `metrics.cols` equal to 2/4/6. `BentoBoard` calls `clampLayout` (ephemeral, never persisted) when `metrics.cols < 6`. The shell conditionally renders `LeftBar`+`Fab` (desktop) or `BottomNav`+`BottomSheet` (mobile). Touch drag is gated behind edit mode via sensor guards and CSS `--tile-touch-action` custom property switching.

**Tech Stack:** Next.js 15, React 19, CSS Modules, Zustand, @dnd-kit/core, motion/react, Vitest + @testing-library/react

## Global Constraints

- Vitest@2 / jsdom@24 pinned — do not upgrade (Node 20.18)
- `npm run lint` is broken project-wide — verify with `npx tsc --noEmit` and `npx vitest run` instead
- CSS Modules only — no Tailwind, no inline utility classes beyond what already exists
- No new npm dependencies
- Canonical widget layout always stays in 6-column coordinates in the store — `clampLayout` result is never written back
- Mobile drag reorder writes only `order` field (via `setWidgetOrder`), never `(x, y)`
- Horizontal scroll mode (`layoutOrientation === 'horizontal'`) is desktop-only; not affected by this plan
- Phone breakpoint: `width ≤ 480px` → 2 cols. Tablet: `width ≤ 768px` → 4 cols. Desktop: `> 768px` → 6 cols.

---

### Task 1: `useBreakpoint` hook

**Files:**
- Create: `lib/hooks/useBreakpoint.ts`
- Create: `lib/hooks/useBreakpoint.test.ts`

**Interfaces:**
- Produces: `useBreakpoint(): BreakpointInfo` where `BreakpointInfo = { breakpoint: 'phone'|'tablet'|'desktop', cols: 2|4|6, isMobile: boolean }`

- [ ] **Step 1: Write the failing test**

```ts
// lib/hooks/useBreakpoint.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreakpoint } from './useBreakpoint';

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

describe('useBreakpoint', () => {
  afterEach(() => setWidth(1280));

  it('returns desktop for 1280px', () => {
    setWidth(1280);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toEqual({ breakpoint: 'desktop', cols: 6, isMobile: false });
  });

  it('returns tablet for 768px', () => {
    setWidth(768);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toEqual({ breakpoint: 'tablet', cols: 4, isMobile: true });
  });

  it('returns phone for 375px', () => {
    setWidth(375);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toEqual({ breakpoint: 'phone', cols: 2, isMobile: true });
  });

  it('updates on window resize', () => {
    setWidth(1280);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('desktop');
    act(() => setWidth(375));
    expect(result.current.breakpoint).toBe('phone');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```
npx vitest run lib/hooks/useBreakpoint.test.ts
```
Expected: FAIL — `Cannot find module './useBreakpoint'`

- [ ] **Step 3: Implement**

```ts
// lib/hooks/useBreakpoint.ts
'use client';
import { useState, useEffect } from 'react';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export interface BreakpointInfo {
  breakpoint: Breakpoint;
  cols: 2 | 4 | 6;
  isMobile: boolean;
}

function getBreakpoint(width: number): BreakpointInfo {
  if (width <= 480) return { breakpoint: 'phone', cols: 2, isMobile: true };
  if (width <= 768) return { breakpoint: 'tablet', cols: 4, isMobile: true };
  return { breakpoint: 'desktop', cols: 6, isMobile: false };
}

export function useBreakpoint(): BreakpointInfo {
  const [info, setInfo] = useState<BreakpointInfo>(() =>
    typeof window !== 'undefined'
      ? getBreakpoint(window.innerWidth)
      : { breakpoint: 'desktop', cols: 6, isMobile: false }
  );

  useEffect(() => {
    const update = () => setInfo(getBreakpoint(window.innerWidth));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return info;
}
```

- [ ] **Step 4: Run to verify it passes**

```
npx vitest run lib/hooks/useBreakpoint.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/hooks/useBreakpoint.ts lib/hooks/useBreakpoint.test.ts
git commit -m "feat: add useBreakpoint hook for responsive column count"
```

---

### Task 2: `clampLayout` utility

**Files:**
- Modify: `lib/grid/engine.ts`
- Modify: `lib/grid/engine.test.ts`

**Interfaces:**
- Consumes: `getStrategy(mode: LayoutMode): LayoutStrategy` (already exported from `engine.ts`)
- Produces: `clampLayout(widgets: WidgetLayout[], cols: number, mode: LayoutMode): WidgetLayout[]`

- [ ] **Step 1: Write the failing tests**

Add at the bottom of `lib/grid/engine.test.ts`. Check if `WidgetLayout` and `Category` are already imported — add only what's missing:

```ts
import { clampLayout } from './engine';
import type { WidgetLayout, Category } from './types';

describe('clampLayout', () => {
  const make = (id: string, w: number, order: number): WidgetLayout => ({
    id, x: 0, y: 0, w, h: 1, category: 'health' as Category, order,
  });

  it('clamps all widget widths to col count', () => {
    const widgets = [make('a', 6, 0), make('b', 4, 1), make('c', 1, 2)];
    const result = clampLayout(widgets, 2, 'autoPack');
    expect(result.every((w) => w.w <= 2)).toBe(true);
  });

  it('repacks so no widget exceeds col bounds', () => {
    const widgets = [make('a', 3, 0), make('b', 3, 1)];
    const result = clampLayout(widgets, 2, 'autoPack');
    for (const w of result) {
      expect(w.x + w.w).toBeLessThanOrEqual(2);
    }
  });

  it('returns layout unchanged when cols >= all widget widths', () => {
    const widgets = [make('a', 2, 0)];
    const result = clampLayout(widgets, 6, 'autoPack');
    expect(result[0].w).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```
npx vitest run lib/grid/engine.test.ts
```
Expected: FAIL — `clampLayout is not exported`

- [ ] **Step 3: Add `clampLayout` to `engine.ts`**

Add after the closing brace of `getStrategy`, at the bottom of `lib/grid/engine.ts`:

```ts
export function clampLayout(
  widgets: WidgetLayout[],
  cols: number,
  mode: LayoutMode,
): WidgetLayout[] {
  const clamped = widgets.map((w) => ({ ...w, w: Math.min(w.w, cols) }));
  return getStrategy(mode).resolve(clamped);
}
```

The `WidgetLayout` import is already at the top of `engine.ts` — no change needed there.

- [ ] **Step 4: Run to verify it passes**

```
npx vitest run lib/grid/engine.test.ts
```
Expected: PASS (all existing + 3 new tests)

- [ ] **Step 5: Commit**

```bash
git add lib/grid/engine.ts lib/grid/engine.test.ts
git commit -m "feat: add clampLayout for ephemeral mobile column reflow"
```

---

### Task 3: Wire cols into grid metrics and BentoBoard

**Files:**
- Modify: `lib/hooks/useGridMetrics.ts`
- Modify: `components/board/BentoBoard.tsx`
- Modify: `components/board/BentoBoard.module.css`

**Interfaces:**
- Consumes: `clampLayout` (Task 2); `cols` passed by `AppShell` (wired in Task 4 — add param with default now so Task 4 is additive only)
- Produces: `useGridMetrics(..., cols?: number): GridMetrics` where `metrics.cols` equals the passed `cols` in vertical mode

- [ ] **Step 1: Update `useGridMetrics` signature and vertical branch**

In `lib/hooks/useGridMetrics.ts`, add `cols = COLS` as a fifth parameter:

```ts
export function useGridMetrics(
  boardRef: RefObject<HTMLElement | null>,
  scrollRef: RefObject<HTMLElement | null>,
  orientation: LayoutOrientation,
  hydrated = true,
  cols = COLS,
): GridMetrics {
```

In the `else` (vertical) branch, replace both `COLS` occurrences with the parameter:

```ts
// Replace:
const cellSize = (width - (COLS - 1) * GRID_GAP) / COLS;
setMetrics({ cellSize, gap: GRID_GAP, cols: COLS, rows: 'auto' });

// With:
const cellSize = (width - (cols - 1) * GRID_GAP) / cols;
setMetrics({ cellSize, gap: GRID_GAP, cols, rows: 'auto' });
```

Add `cols` to the `useEffect` dependency array:

```ts
}, [boardRef, scrollRef, orientation, hydrated, cols]);
```

- [ ] **Step 2: Update `BentoBoard.tsx` — rename committed selector and add clamp**

Add `clampLayout` to the import from `@/lib/grid/engine`:

```ts
import { getStrategy, clampLayout, type LayoutMode } from '@/lib/grid/engine';
```

Rename the store selector and compute the display-clamped committed:

```ts
// Replace:
const committed = useBoard((s) => s.widgets);

// With:
const storedWidgets = useBoard((s) => s.widgets);
const committed = metrics.cols < 6
  ? clampLayout(storedWidgets, metrics.cols, layoutMode)
  : storedWidgets;
```

- [ ] **Step 3: Update inline style for vertical mode — set `gridTemplateColumns` explicitly**

In `BentoBoard.tsx`, in the `style` object passed to the board `div`, update the vertical branch to include `gridTemplateColumns`:

```ts
// Replace the vertical branch (the else case):
: {
    gridAutoRows: `${metrics.cellSize}px`,
    '--cell-size': `${metrics.cellSize}px`,
  }

// With:
: {
    gridTemplateColumns: `repeat(${metrics.cols}, 1fr)`,
    gridAutoRows: `${metrics.cellSize}px`,
    '--cell-size': `${metrics.cellSize}px`,
  }
```

- [ ] **Step 4: Remove hardcoded `grid-template-columns` from CSS (now set inline)**

In `components/board/BentoBoard.module.css`, remove the `grid-template-columns` property from the vertical rule:

```css
/* Before */
.board[data-orientation="vertical"] {
  grid-template-columns: repeat(6, 1fr);
  width: 100%;
  max-width: 1260px;
  margin: 0 auto;
}

/* After */
.board[data-orientation="vertical"] {
  width: 100%;
  max-width: 1260px;
  margin: 0 auto;
}
```

- [ ] **Step 5: Type-check and test**

```
npx tsc --noEmit && npx vitest run
```
Expected: no errors, all tests pass

- [ ] **Step 6: Commit**

```bash
git add lib/hooks/useGridMetrics.ts components/board/BentoBoard.tsx components/board/BentoBoard.module.css
git commit -m "feat: wire cols param through useGridMetrics and BentoBoard for mobile reflow"
```

---

### Task 4: AppShell mobile shell layout

**Files:**
- Modify: `lib/state/boardStore.ts`
- Modify: `components/shell/AppShell.tsx`
- Modify: `components/shell/AppShell.module.css`

**Interfaces:**
- Consumes: `useBreakpoint()` (Task 1)
- Produces:
  - `setWidgetOrder(orderedIds: string[]): void` — new board store action
  - `isMobile`, `cols` available in `AppShell` for downstream use
  - Mobile shell: `1fr` grid, `BottomNav` slot, sidebar/FAB conditionally absent

- [ ] **Step 1: Add `setWidgetOrder` to `boardStore`**

Open `lib/state/boardStore.ts`. Find the store state interface (the one declaring `moveWidget`, `resizeWidget`, etc.) and add:

```ts
setWidgetOrder: (orderedIds: string[]) => void;
```

Find the corresponding implementation object (inside `create(...)`) and add:

```ts
setWidgetOrder: (orderedIds) =>
  set((s) => ({
    widgets: s.widgets.map((w) => ({
      ...w,
      order: orderedIds.indexOf(w.id),
    })),
  })),
```

- [ ] **Step 2: Import `useBreakpoint` in `AppShell` and derive `isMobile`/`cols`**

Add to the imports at the top of `components/shell/AppShell.tsx`:

```ts
import { useBreakpoint } from '@/lib/hooks/useBreakpoint';
```

Inside `AppShell()`, add after the first block of hook calls:

```ts
const { isMobile, cols } = useBreakpoint();
```

Pass `cols` to `useGridMetrics`:

```ts
// Before:
const metrics = useGridMetrics(boardRef, scrollRef, layoutOrientation, boardHydrated);
// After:
const metrics = useGridMetrics(boardRef, scrollRef, layoutOrientation, boardHydrated, cols);
```

Add the store action:

```ts
const setWidgetOrder = useBoard((s) => s.setWidgetOrder);
```

- [ ] **Step 3: Gate palette drag to close mobile sheet on drag start**

In `handleDragStart`, inside the `if (id.startsWith('palette:'))` block, add `setFabOpen(false)` before `setDrag`:

```ts
if (id.startsWith('palette:')) {
  const parsed = parsePaletteId(id);
  if (!parsed) return;
  setFabOpen(false); // closes desktop FAB panel and mobile sheet
  setDrag({ phase: 'dragging', activeId: id, targetKind: 'none', previewLayout: committed });
  return;
}
```

- [ ] **Step 4: Fork `handleDragEnd` for mobile — write order only**

In `handleDragEnd`, add a mobile guard block before the existing board-tile drag-end logic. Insert it immediately after the `palette:` id block ends (after its `return`) and before the existing `const ds = dragStateRef.current` line:

```ts
// Mobile: reorder only — write order field, preserve (x,y) coordinates
if (isMobile) {
  const ds = dragStateRef.current;
  if (ds.phase === 'dragging' && !ds.activeId.startsWith('palette:')) {
    const orderedIds = ds.previewLayout.map((w) => w.id);
    setWidgetOrder(orderedIds);
  }
  setDrag({ phase: 'idle' });
  return;
}
```

Add `isMobile`, `setWidgetOrder` to the `useCallback` dependency array for `handleDragEnd`.

- [ ] **Step 5: Conditionally render sidebar and FAB**

In the JSX return, wrap `<LeftBar />` and `<Fab ... />`:

```tsx
{!isMobile && <LeftBar />}
```

```tsx
{!isMobile && <Fab cellSize={metrics.cellSize} />}
```

- [ ] **Step 6: Add mobile CSS to `AppShell.module.css`**

```css
.shellMobile {
  display: grid;
  grid-template-columns: 1fr;
  height: 100vh;
  overflow: hidden;
}
.scrollMobile {
  flex: 1;
  overflow-y: auto;
  /* bottom padding = navbar height (56px) + safe area + board breathing room (24px) */
  padding: 0 16px calc(56px + env(safe-area-inset-bottom) + 24px);
  scrollbar-width: none;
}
.scrollMobile::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 7: Apply mobile CSS classes in JSX**

Switch the outer shell `div` class:

```tsx
<div className={isMobile ? styles.shellMobile : styles.shell}>
```

Switch the scroll container class:

```tsx
<div
  ref={scrollRef}
  className={
    layoutOrientation === 'horizontal'
      ? styles.scrollHorizontal
      : isMobile
        ? styles.scrollMobile
        : styles.scroll
  }
>
```

- [ ] **Step 8: Type-check and test**

```
npx tsc --noEmit && npx vitest run
```
Expected: no errors, all tests pass

- [ ] **Step 9: Commit**

```bash
git add lib/state/boardStore.ts components/shell/AppShell.tsx components/shell/AppShell.module.css
git commit -m "feat: mobile shell layout, useBreakpoint integration, mobile reorder action"
```

---

### Task 5: `BottomNav` component

**Files:**
- Create: `components/shell/BottomNav.tsx`
- Create: `components/shell/BottomNav.module.css`
- Modify: `components/shell/AppShell.tsx`

**Interfaces:**
- Consumes: `useSettings` (activeTags, toggleTag), `useUi` (manageMode, toggleManageMode), `useBoard` (widgets), `presentCategories`, `WIDGET_REGISTRY`
- Produces: `<BottomNav cellSize={number} sheetOpen={boolean} onSheetOpen={() => void} onSheetClose={() => void} />`

- [ ] **Step 1: Create `BottomNav.tsx`**

```tsx
// components/shell/BottomNav.tsx
'use client';
import { PencilLine, Plus, Check } from 'lucide-react';
import styles from './BottomNav.module.css';
import { useSettings } from '@/lib/state/settingsStore';
import { useUi } from '@/lib/state/uiStore';
import { useBoard } from '@/lib/state/boardStore';
import { presentCategories } from '@/lib/grid/categories';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';

interface BottomNavProps {
  sheetOpen: boolean;
  onSheetOpen: () => void;
  onSheetClose: () => void;
}

export function BottomNav({ sheetOpen, onSheetOpen, onSheetClose }: BottomNavProps) {
  const activeTags = useSettings((s) => s.activeTags);
  const toggleTag = useSettings((s) => s.toggleTag);
  const manageMode = useUi((s) => s.manageMode);
  const toggleManageMode = useUi((s) => s.toggleManageMode);
  const widgets = useBoard((s) => s.widgets);
  const availableTags = presentCategories(widgets);

  return (
    <nav className={styles.nav} aria-label="navigation">
      <div className={styles.chips}>
        {availableTags.map((c) => {
          const def = WIDGET_REGISTRY.find((d) => d.category === c)!;
          const Icon = def.icon;
          return (
            <button
              key={c}
              className={styles.chip}
              data-active={activeTags.includes(c)}
              onClick={() => toggleTag(c)}
              aria-pressed={activeTags.includes(c)}
              aria-label={def.label}
            >
              <Icon size={15} />
              <span className={styles.chipLabel}>{def.label}</span>
            </button>
          );
        })}
      </div>
      <button
        className={styles.editBtn}
        data-active={manageMode}
        onClick={toggleManageMode}
        aria-pressed={manageMode}
        aria-label={manageMode ? 'Done editing' : 'Edit widgets'}
      >
        {manageMode ? <Check size={18} /> : <PencilLine size={18} />}
      </button>
      <button
        className={styles.addBtn}
        onClick={sheetOpen ? onSheetClose : onSheetOpen}
        aria-label="Add widget"
        aria-expanded={sheetOpen}
      >
        <Plus size={20} />
      </button>
    </nav>
  );
}
```

- [ ] **Step 2: Create `BottomNav.module.css`**

```css
.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  padding-bottom: env(safe-area-inset-bottom);
  height: calc(56px + env(safe-area-inset-bottom));
  background: var(--surface-glass);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border-top: 1px solid var(--border-hairline);
  z-index: 30;
}
.chips {
  display: flex;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}
.chips::-webkit-scrollbar {
  display: none;
}
.chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  white-space: nowrap;
  font-size: 12px;
  transition: all 0.15s;
  flex-shrink: 0;
}
.chip[data-active='true'] {
  border-color: var(--accent);
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}
.chipLabel {
  font-size: 12px;
  font-weight: 500;
}
.editBtn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.editBtn[data-active='true'] {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}
.addBtn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
```

- [ ] **Step 3: Add `sheetOpen` state and render `BottomNav` in `AppShell`**

In `AppShell.tsx`, add import and state:

```ts
import { BottomNav } from './BottomNav';
// ...
const [sheetOpen, setSheetOpen] = useState(false);
```

In the JSX, inside the shell `div` after the `</div>` that wraps `.main`, add:

```tsx
{isMobile && (
  <BottomNav
    sheetOpen={sheetOpen}
    onSheetOpen={() => setSheetOpen(true)}
    onSheetClose={() => setSheetOpen(false)}
  />
)}
```

- [ ] **Step 4: Type-check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/shell/BottomNav.tsx components/shell/BottomNav.module.css components/shell/AppShell.tsx
git commit -m "feat: add BottomNav with filter chips, edit toggle, add button"
```

---

### Task 6: Bottom sheet palette

**Files:**
- Create: `components/shell/BottomSheet.tsx`
- Create: `components/shell/BottomSheet.module.css`
- Modify: `components/shell/AppShell.tsx`

**Interfaces:**
- Consumes: `WidgetCarousel` (existing — `cellSize: number, onClose: () => void`), `sheetOpen` / `setSheetOpen` from `AppShell`
- Produces: `<BottomSheet open={boolean} cellSize={number} onClose={() => void} />`

- [ ] **Step 1: Create `BottomSheet.tsx`**

```tsx
// components/shell/BottomSheet.tsx
'use client';
import { AnimatePresence, motion } from 'motion/react';
import styles from './BottomSheet.module.css';
import { WidgetCarousel } from './WidgetCarousel';

interface BottomSheetProps {
  open: boolean;
  cellSize: number;
  onClose: () => void;
}

export function BottomSheet({ open, cellSize, onClose }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sheet-backdrop"
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className={styles.sheet}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.9 }}
          >
            <div className={styles.handle} aria-hidden />
            <WidgetCarousel cellSize={cellSize} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Create `BottomSheet.module.css`**

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 40;
}
.sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface);
  border-radius: 20px 20px 0 0;
  border-top: 1px solid var(--border-hairline);
  z-index: 41;
  padding: 8px 0 calc(env(safe-area-inset-bottom) + 72px);
  max-height: 80vh;
  overflow: hidden;
}
.handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--border-hairline);
  margin: 0 auto 12px;
}
```

- [ ] **Step 3: Render `BottomSheet` in `AppShell` and close on palette drag**

Add import:

```ts
import { BottomSheet } from './BottomSheet';
```

In JSX, after `<BottomNav ... />`, add:

```tsx
{isMobile && (
  <BottomSheet
    open={sheetOpen}
    cellSize={metrics.cellSize}
    onClose={() => setSheetOpen(false)}
  />
)}
```

In `handleDragStart`, inside the `if (id.startsWith('palette:'))` block, the `setFabOpen(false)` line already exists from Task 4. Add `setSheetOpen(false)` on the line after:

```ts
setFabOpen(false);
setSheetOpen(false);
```

Add `setSheetOpen` to `handleDragStart`'s `useCallback` dependency array.

- [ ] **Step 4: Type-check**

```
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/shell/BottomSheet.tsx components/shell/BottomSheet.module.css components/shell/AppShell.tsx
git commit -m "feat: add BottomSheet palette for mobile widget adding"
```

---

### Task 7: Touch interaction model + resize handle touch target

**Files:**
- Create: `lib/hooks/useLongPress.ts`
- Modify: `components/shell/AppShell.tsx`
- Modify: `components/board/BentoBoard.tsx`
- Modify: `components/board/BentoBoard.module.css`
- Modify: `components/board/Widget.module.css`
- Modify: `components/board/ResizeHandle.module.css`
- Modify: `components/board/Widget.tsx` (read first — 100 lines)

**Interfaces:**
- Consumes: `isMobile` from `useBreakpoint` (Task 1, already in AppShell)
- Produces:
  - `useLongPress(cb, threshold): pointer event handlers`
  - `BentoBoard` prop: `touchDragEnabled: boolean`
  - CSS `--tile-touch-action` / `--tile-cursor` custom properties

- [ ] **Step 1: Gate DnD sensor in `handleDragStart`**

In `AppShell.tsx`, inside `handleDragStart`, after the palette block and before the existing `const widget = committed.find(...)` line, add:

```ts
// Non-palette drags on mobile only fire in edit mode
if (isMobile && !manageMode) return;
```

Add `isMobile` and `manageMode` to the `handleDragStart` `useCallback` dependency array.

- [ ] **Step 2: Create `useLongPress` hook**

```ts
// lib/hooks/useLongPress.ts
'use client';
import { useRef, useCallback } from 'react';

export function useLongPress(
  onLongPress: (() => void) | undefined,
  threshold = 500,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!onLongPress) return;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPosRef.current || timerRef.current === null) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.hypot(dx, dy) > 8) cancel();
  }, [cancel]);

  return { onPointerDown, onPointerMove, onPointerUp: cancel, onPointerCancel: cancel };
}
```

- [ ] **Step 3: Add `touchDragEnabled` prop to `BentoBoard`**

In `BentoBoard.tsx`, add to `BentoBoardProps`:

```ts
touchDragEnabled: boolean;
```

In the board `div`, add the data attribute:

```tsx
data-touch-drag={touchDragEnabled ? 'on' : 'off'}
```

In `AppShell.tsx`, pass the prop:

```tsx
<BentoBoard
  boardRef={boardRef}
  metrics={metrics}
  dragState={dragState}
  touchDragEnabled={!isMobile || manageMode}
/>
```

- [ ] **Step 4: CSS `touch-action` switching via custom properties**

In `BentoBoard.module.css`, add:

```css
.board[data-touch-drag='off'] {
  --tile-touch-action: auto;
  --tile-cursor: default;
}
.board[data-touch-drag='on'] {
  --tile-touch-action: none;
  --tile-cursor: grab;
}
```

In `Widget.module.css`, update `.tile` to consume the custom properties:

```css
.tile {
  /* replace the existing hardcoded values: */
  touch-action: var(--tile-touch-action, none);
  cursor: var(--tile-cursor, grab);
  /* keep all other existing properties unchanged */
}
.tile:active {
  cursor: var(--tile-cursor-active, grabbing);
}
```

Also add to `BentoBoard.module.css`:

```css
.board[data-touch-drag='off'] {
  --tile-cursor-active: default;
}
.board[data-touch-drag='on'] {
  --tile-cursor-active: grabbing;
}
```

- [ ] **Step 5: Wire `useLongPress` into `WidgetWithResize` in `BentoBoard`**

Read `Widget.tsx` to understand how dnd-kit's `listeners` are applied to the tile div before editing.

Add imports to `BentoBoard.tsx`:

```ts
import { useLongPress } from '@/lib/hooks/useLongPress';
```

Add to `WidgetWithResizeProps`:

```ts
isMobile: boolean;
onEnterManage: () => void;
```

Inside `WidgetWithResize`, add after the existing hooks:

```ts
const longPress = useLongPress(
  isMobile && !manageMode ? onEnterManage : undefined,
);
```

Pass `longPressHandlers` to `Widget`:

```tsx
<Widget
  widget={w}
  dimmed={dimmed}
  interactive={resizingId === null && !interactionsLocked}
  isSwapTarget={isSwapTarget}
  manageMode={manageMode}
  resizing={isResizing}
  snapTarget={isResizing ? (snapTarget?.name ?? null) : null}
  longPressHandlers={longPress}
>
```

In `Widget.tsx`, add `longPressHandlers` to the props interface:

```ts
longPressHandlers?: {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
};
```

On the tile `div`, merge with any existing dnd-kit `{...listeners}`. If listeners are spread as `{...listeners}`, replace with explicit handler merging — add `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel` that call both the dnd-kit listener and the long-press handler:

```tsx
onPointerDown={(e) => {
  listeners?.onPointerDown?.(e);
  longPressHandlers?.onPointerDown(e);
}}
onPointerMove={(e) => {
  listeners?.onPointerMove?.(e);
  longPressHandlers?.onPointerMove(e);
}}
onPointerUp={(e) => {
  listeners?.onPointerUp?.(e);
  longPressHandlers?.onPointerUp(e);
}}
onPointerCancel={(e) => {
  listeners?.onPointerCancel?.(e);
  longPressHandlers?.onPointerCancel(e);
}}
```

Remove the original `{...listeners}` spread if you merged manually.

Add `setManageMode` to `BentoBoard`:

```ts
const setManageMode = useUi((s) => s.setManageMode);
```

In the `.map()` call that renders `WidgetWithResize`, add:

```tsx
isMobile={metrics.cols < 6}
onEnterManage={() => {
  setManageMode(true);
  navigator.vibrate?.(10);
}}
```

- [ ] **Step 6: Resize handle touch target**

Read `components/board/ResizeHandle.module.css` first. Find the `.handle` rule and add minimum touch target for coarse pointers:

```css
@media (pointer: coarse) {
  .handle {
    min-width: 44px;
    min-height: 44px;
  }
}
```

- [ ] **Step 7: Type-check and test**

```
npx tsc --noEmit && npx vitest run
```
Expected: no errors, all tests pass

- [ ] **Step 8: Commit**

```bash
git add lib/hooks/useLongPress.ts components/shell/AppShell.tsx components/board/BentoBoard.tsx components/board/BentoBoard.module.css components/board/Widget.tsx components/board/Widget.module.css components/board/ResizeHandle.module.css
git commit -m "feat: touch interaction gating, long-press edit entry, touch-action CSS, resize handle target"
```

---

### Task 8: Widget content CSS scaling

**Files:**
- Modify: `lib/widgets/content/budget-summary.tsx` (and its CSS if it exists)
- Modify: `lib/widgets/content/activity-rings.tsx`
- Modify: `lib/widgets/content/calorie-tracker.tsx`
- Modify: `lib/widgets/content/steps.tsx`
- Modify: `lib/widgets/content/upcoming-events.tsx`
- Modify: `lib/widgets/content/mini-calendar.tsx`
- Modify: `lib/widgets/content/todays-schedule.tsx`
- Modify: `lib/widgets/content/habit-tracker.tsx`
- Modify: `lib/widgets/content/weather.tsx`
- Modify: `lib/widgets/content/daily-note.tsx`

**Note:** `--cell-size` is already set on `.board` by `BentoBoard` (Task 3). Widget content components inherit it as a CSS custom property. No prop changes needed.

**Multiplier reference:**

| Element | Multiplier | Desktop (~200px) | Tablet (~169px) | Phone (~153px) |
|---------|-----------|-----------------|----------------|---------------|
| Large value / heading | `* 0.13` | ~26px | ~22px | ~20px |
| Body / secondary text | `* 0.07` | ~14px | ~12px | ~11px |
| Small label / caption | `* 0.055` | ~11px | ~9px | ~8px |
| Icon span size | `* 0.18` | ~36px | ~30px | ~27px |

**Process for each widget file:**

1. Read the file to identify all hardcoded `fontSize`, `width`, `height` pixel values and Lucide icon `size` props
2. For `style={{ fontSize: 'Npx' }}` → replace with `style={{ fontSize: 'calc(var(--cell-size) * k)' }}`
3. For CSS module files with `font-size: Npx` → replace with `font-size: calc(var(--cell-size) * k)`
4. For Lucide `<Icon size={N} />` → wrap in `<span style={{ display: 'flex', width: 'calc(var(--cell-size) * 0.18)', height: 'calc(var(--cell-size) * 0.18)' }}><Icon /></span>` (Lucide inherits parent size via CSS when no `size` prop)

Work in batches of 2-3 widgets, type-check after each batch, commit after each batch.

- [ ] **Batch 1: `budget-summary` + `activity-rings`**

Read each file, apply multipliers, type-check: `npx tsc --noEmit`

```bash
git add lib/widgets/content/budget-summary.tsx lib/widgets/content/activity-rings.tsx
git commit -m "feat: css-scale budget-summary and activity-rings content"
```

- [ ] **Batch 2: `calorie-tracker` + `steps`**

```bash
git add lib/widgets/content/calorie-tracker.tsx lib/widgets/content/steps.tsx
git commit -m "feat: css-scale calorie-tracker and steps content"
```

- [ ] **Batch 3: `upcoming-events` + `mini-calendar`**

```bash
git add lib/widgets/content/upcoming-events.tsx lib/widgets/content/mini-calendar.tsx
git commit -m "feat: css-scale upcoming-events and mini-calendar content"
```

- [ ] **Batch 4: `todays-schedule` + `habit-tracker`**

```bash
git add lib/widgets/content/todays-schedule.tsx lib/widgets/content/habit-tracker.tsx
git commit -m "feat: css-scale todays-schedule and habit-tracker content"
```

- [ ] **Batch 5: `weather` + `daily-note`**

```bash
git add lib/widgets/content/weather.tsx lib/widgets/content/daily-note.tsx
git commit -m "feat: css-scale weather and daily-note content"
```

- [ ] **Final verification**

```
npx tsc --noEmit && npx vitest run
```
Expected: all pass
