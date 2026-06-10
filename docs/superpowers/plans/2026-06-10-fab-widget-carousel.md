# FAB Widget Carousel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the skeleton's minimal Fab (Task 16) with a polished FAB-to-carousel morph: a `+` button that transforms into a scrollable widget picker with category filter chips, click-to-add, and drag-to-place.

**Architecture:** The widget registry (`lib/widgets/registry.ts`) is the single seam for future real widget content — swap `WidgetSkeleton` for a real component per type without touching the carousel. Drag state lifts from `BentoBoard` into `useDragStore` (Zustand) so AppShell hosts one `DndContext` shared by board tiles and palette chips. The FAB morphs into the carousel panel via motion's `layoutId` FLIP. A transparent backdrop handles click-outside-to-close. `fabOpen` lives in `dragStore` so AppShell can close the carousel on a successful palette drop.

**Tech Stack:** Next.js App Router, TypeScript, React, `@dnd-kit/core`, `motion/react`, `zustand`, CSS Modules; Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-10-fab-widget-carousel-design.md`

**Prerequisites:** The skeleton plan (`docs/superpowers/plans/2026-06-10-bento-dashboard-skeleton.md`) must be fully complete before starting.

**Conventions:** TDD for stores and pure logic. UI tasks include interaction tests where jsdom can simulate the interaction; drag-to-place is manual only (pointer events). Commit after every task. Import alias `@/*` → repo root. Run tests with `npm run test -- <name>`.

---

## File map

**Create:**
```
lib/widgets/registry.ts
lib/state/dragStore.ts
components/shell/Fab.tsx + Fab.module.css
components/shell/WidgetCarousel.tsx + WidgetCarousel.module.css
components/shell/CarouselCard.tsx + CarouselCard.module.css
```

**Modify:**
```
components/widgets/WidgetSkeleton.tsx     — accept WidgetContentProps (adds w, h)
lib/state/boardStore.ts                   — addWidget gains optional targetCell
components/shell/AppShell.tsx             — host DndContext + DragOverlay, add Fab, pass boardRef+metrics down
components/board/BentoBoard.tsx           — remove DndContext, read dragStore, accept boardRef+metrics props
components/board/Widget.tsx              — render def.ContentComponent from registry
```

**Tests:**
```
lib/widgets/registry.test.ts
lib/state/dragStore.test.ts
lib/state/boardStore.test.ts             — append one targetCell test
components/shell/CarouselCard.test.tsx
components/shell/WidgetCarousel.test.tsx
components/shell/Fab.test.tsx
```

---

## Task 1: Widget registry & WidgetSkeleton update

**Files:**
- Modify: `components/widgets/WidgetSkeleton.tsx`
- Create: `lib/widgets/registry.ts`
- Test: `lib/widgets/registry.test.ts`

- [ ] **Step 1: Update `components/widgets/WidgetSkeleton.tsx` to accept WidgetContentProps**

`WidgetSkeleton` currently accepts only `{ category }`. The registry's `ContentComponent` slot types components as `React.ComponentType<WidgetContentProps>` which requires `{ category, w, h }`. Update the component to accept all three (w and h are available for future use but not rendered yet):

```tsx
import styles from './WidgetSkeleton.module.css';
import type { Category } from '@/lib/grid/types';

export interface WidgetContentProps {
  category: Category;
  w: number;
  h: number;
}

export function WidgetSkeleton({ category }: WidgetContentProps) {
  return (
    <div className={styles.body}>
      <span className={styles.dot} />
      {category}
    </div>
  );
}
```

- [ ] **Step 2: Write the failing test `lib/widgets/registry.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { WIDGET_REGISTRY } from './registry';

describe('WIDGET_REGISTRY', () => {
  it('has exactly 4 entries', () => {
    expect(WIDGET_REGISTRY).toHaveLength(4);
  });

  it('each entry has a non-empty supportedSizes array', () => {
    for (const def of WIDGET_REGISTRY) {
      expect(def.supportedSizes.length).toBeGreaterThan(0);
    }
  });

  it('each entry has a valid category matching its type', () => {
    const valid = ['finance', 'health', 'calendar', 'lifestyle'];
    for (const def of WIDGET_REGISTRY) {
      expect(valid).toContain(def.category);
      expect(def.type).toBe(def.category);
    }
  });

  it('each entry has a ContentComponent defined', () => {
    for (const def of WIDGET_REGISTRY) {
      expect(def.ContentComponent).toBeDefined();
      expect(typeof def.ContentComponent).toBe('function');
    }
  });

  it('finance entry supports 1x1, 2x2, and 4x2 sizes', () => {
    const finance = WIDGET_REGISTRY.find((d) => d.type === 'finance')!;
    const names = finance.supportedSizes.map((s) => s.name);
    expect(names).toContain('1×1');
    expect(names).toContain('2×2');
    expect(names).toContain('4×2');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- registry`
Expected: FAIL — cannot resolve `./registry`.

- [ ] **Step 4: Write `lib/widgets/registry.ts`**

```ts
import { WidgetSkeleton, type WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import type { Category } from '@/lib/grid/types';
import { SIZE_PRESETS, type SizePreset } from '@/lib/grid/sizes';
import type React from 'react';

export type { WidgetContentProps };

export interface WidgetDefinition {
  type: string;
  label: string;
  category: Category;
  accentColor: string;
  supportedSizes: SizePreset[];
  // TODO(widget-content): replace WidgetSkeleton with per-type content components when real content is built.
  //   anchor: lib/widgets/registry.ts
  //   sites: components/widgets/WidgetSkeleton.tsx, components/board/Widget.tsx
  ContentComponent: React.ComponentType<WidgetContentProps>;
}

const p = (name: string): SizePreset => SIZE_PRESETS.find((s) => s.name === name)!;

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    type: 'finance',
    label: 'Finance',
    category: 'finance',
    accentColor: '#6366f1',
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2'), p('4×2')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'health',
    label: 'Health',
    category: 'health',
    accentColor: '#10b981',
    supportedSizes: [p('1×1'), p('2×2'), p('2×3')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'calendar',
    label: 'Calendar',
    category: 'calendar',
    accentColor: '#f59e0b',
    supportedSizes: [p('1×2'), p('2×3'), p('3×3')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'lifestyle',
    label: 'Lifestyle',
    category: 'lifestyle',
    accentColor: '#ec4899',
    supportedSizes: [p('1×1'), p('2×1'), p('3×2'), p('4×4')],
    ContentComponent: WidgetSkeleton,
  },
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- registry`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add components/widgets/WidgetSkeleton.tsx lib/widgets/registry.ts lib/widgets/registry.test.ts
git commit -m "feat: widget definition registry with WidgetSkeleton content slot"
```

---

## Task 2: dragStore

Lifts the drag state (`activeId`, `preview`) out of `BentoBoard`'s local `useState` into a shared Zustand store. Adds `palettePreview` (landing footprint for palette drags) and `fabOpen` (so AppShell can close the carousel after a successful drop).

**Files:**
- Create: `lib/state/dragStore.ts`
- Test: `lib/state/dragStore.test.ts`

- [ ] **Step 1: Write the failing test `lib/state/dragStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useDragStore } from './dragStore';

describe('dragStore', () => {
  beforeEach(() => {
    useDragStore.setState({ activeId: null, preview: null, palettePreview: null, fabOpen: false });
  });

  it('initialises with null / false values', () => {
    const s = useDragStore.getState();
    expect(s.activeId).toBeNull();
    expect(s.preview).toBeNull();
    expect(s.palettePreview).toBeNull();
    expect(s.fabOpen).toBe(false);
  });

  it('setActiveId updates activeId', () => {
    useDragStore.getState().setActiveId('seed-0');
    expect(useDragStore.getState().activeId).toBe('seed-0');
  });

  it('setPreview updates preview', () => {
    const widgets = [{ id: 'a', x: 0, y: 0, w: 1, h: 1, category: 'finance' as const, order: 0 }];
    useDragStore.getState().setPreview(widgets);
    expect(useDragStore.getState().preview).toEqual(widgets);
  });

  it('setPalettePreview updates palettePreview', () => {
    const pp = { x: 2, y: 1, w: 2, h: 2, category: 'health' as const };
    useDragStore.getState().setPalettePreview(pp);
    expect(useDragStore.getState().palettePreview).toEqual(pp);
  });

  it('setFabOpen toggles fabOpen', () => {
    useDragStore.getState().setFabOpen(true);
    expect(useDragStore.getState().fabOpen).toBe(true);
    useDragStore.getState().setFabOpen(false);
    expect(useDragStore.getState().fabOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dragStore`
Expected: FAIL — cannot resolve `./dragStore`.

- [ ] **Step 3: Write `lib/state/dragStore.ts`**

```ts
import { create } from 'zustand';
import type { WidgetLayout, Category } from '@/lib/grid/types';

export interface PalettePreview {
  x: number;
  y: number;
  w: number;
  h: number;
  category: Category;
}

interface DragState {
  activeId: string | null;
  preview: WidgetLayout[] | null;
  palettePreview: PalettePreview | null;
  fabOpen: boolean;
  setActiveId: (id: string | null) => void;
  setPreview: (p: WidgetLayout[] | null) => void;
  setPalettePreview: (p: PalettePreview | null) => void;
  setFabOpen: (v: boolean) => void;
}

export const useDragStore = create<DragState>()((set) => ({
  activeId: null,
  preview: null,
  palettePreview: null,
  fabOpen: false,
  setActiveId: (activeId) => set({ activeId }),
  setPreview: (preview) => set({ preview }),
  setPalettePreview: (palettePreview) => set({ palettePreview }),
  setFabOpen: (fabOpen) => set({ fabOpen }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- dragStore`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/state/dragStore.ts lib/state/dragStore.test.ts
git commit -m "feat: shared drag store with palette preview and fab open state"
```

---

## Task 3: boardStore — addWidget with optional targetCell

**Files:**
- Modify: `lib/state/boardStore.ts`
- Test: `lib/state/boardStore.test.ts` (append one test)

- [ ] **Step 1: Write the new failing test — append to `lib/state/boardStore.test.ts`**

Add this test inside the existing `describe('boardStore')` block:

```ts
  it('places a widget at the target cell when targetCell is provided (pushCompact)', () => {
    useSettings.setState({ layoutMode: 'pushCompact' });
    useBoard.getState().addWidget('calendar', 1, 1, { x: 4, y: 0 });
    const ws = useBoard.getState().widgets;
    expect(ws).toHaveLength(1);
    expect(ws[0]).toMatchObject({ x: 4, y: 0 });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- boardStore`
Expected: FAIL — `addWidget` does not accept a 4th argument yet (TypeScript error or wrong placement).

- [ ] **Step 3: Update `addWidget` in `lib/state/boardStore.ts`**

In the `BoardState` interface, change the signature:
```ts
  addWidget: (category: Category, w: number, h: number, targetCell?: { x: number; y: number }) => void;
```

In the store implementation, update the `addWidget` action:
```ts
      addWidget: (category, w, h, targetCell) => {
        const order = get().widgets.reduce((max, x) => Math.max(max, x.order), -1) + 1;
        const widget: WidgetLayout = {
          id: newId(),
          x: targetCell?.x ?? 0,
          y: targetCell?.y ?? 0,
          w,
          h,
          category,
          order,
        };
        set({ widgets: strategy().preview(get().widgets, { kind: 'add', widget }) });
      },
```

- [ ] **Step 4: Run all boardStore tests to verify they pass**

Run: `npm run test -- boardStore`
Expected: PASS (4 tests — 3 existing + 1 new).

- [ ] **Step 5: Commit**

```bash
git add lib/state/boardStore.ts lib/state/boardStore.test.ts
git commit -m "feat: boardStore addWidget accepts optional targetCell for drag-to-place"
```

---

## Task 4: Lift DndContext from BentoBoard to AppShell

`BentoBoard` currently owns `DndContext`, `DragOverlay`, `useSensors`, and local `activeId`/`preview` state. This task moves all of that to `AppShell` so the carousel's palette chips (added in later tasks) can share the same drag context. `BentoBoard` becomes a pure board renderer that reads drag state from `dragStore`.

**Files:**
- Modify: `components/board/BentoBoard.tsx`
- Modify: `components/shell/AppShell.tsx`

- [ ] **Step 1: Rewrite `components/board/BentoBoard.tsx`**

Remove: `DndContext`, `DragOverlay`, `PointerSensor`, `useSensor`, `useSensors`, `DragStartEvent`, `DragMoveEvent` imports. Remove local `activeId`/`preview` useState. Remove drag event handlers. Accept `boardRef` and `metrics` as props (AppShell creates them so it can also use them for pointToCell during drag).

```tsx
'use client';
import { useRef } from 'react';
import { LayoutGroup, AnimatePresence } from 'motion/react';
import styles from './BentoBoard.module.css';
import { Widget } from './Widget';
import { DropPreview } from './DropPreview';
import { ResizeHandle } from './ResizeHandle';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';
import { useDragStore } from '@/lib/state/dragStore';
import { getStrategy } from '@/lib/grid/engine';
import { useDragResize } from '@/lib/hooks/useDragResize';
import type { WidgetLayout } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';
import type { RefObject } from 'react';
import { useState } from 'react';

interface BentoBoardProps {
  boardRef: RefObject<HTMLDivElement>;
  metrics: GridMetrics;
}

export function BentoBoard({ boardRef, metrics }: BentoBoardProps) {
  const committed = useBoard((s) => s.widgets);
  const resizeWidget = useBoard((s) => s.resizeWidget);
  const layoutMode = useSettings((s) => s.layoutMode);
  const activeTags = useSettings((s) => s.activeTags);
  const filterMode = useSettings((s) => s.filterMode);

  const activeId = useDragStore((s) => s.activeId);
  const preview = useDragStore((s) => s.preview);
  const palettePreview = useDragStore((s) => s.palettePreview);
  const setPreview = useDragStore((s) => s.setPreview);

  const [resizingId, setResizingId] = useState<string | null>(null);

  const base = preview ?? committed;
  const filtering = activeTags.length > 0;
  const matches = (cat: WidgetLayout['category']) => activeTags.includes(cat);
  const widgets =
    filtering && filterMode === 'hide'
      ? getStrategy(layoutMode).resolve(base.filter((w) => matches(w.category)))
      : base;
  const interactionsLocked = filtering && filterMode === 'hide';
  const activeWidget =
    activeId && !activeId.startsWith('palette:')
      ? widgets.find((w) => w.id === activeId) ?? null
      : null;

  function WidgetWithResize({ w, dimmed = false }: { w: WidgetLayout; dimmed?: boolean }) {
    const { onPointerDown, onPointerMove, onPointerUp } = useDragResize({
      startW: w.w,
      startH: w.h,
      metrics,
      onPreview: (nw, nh) =>
        setPreview(getStrategy(layoutMode).preview(committed, { kind: 'resize', id: w.id, w: nw, h: nh })),
      onCommit: (nw, nh) => {
        resizeWidget(w.id, nw, nh);
        setResizingId(null);
        setPreview(null);
      },
    });
    return (
      <Widget
        widget={w}
        dragging={w.id === activeId}
        dimmed={dimmed}
        interactive={resizingId === null && !interactionsLocked}
      >
        {!interactionsLocked && (
          <ResizeHandle
            onPointerDown={(e) => {
              setResizingId(w.id);
              setPreview(committed);
              onPointerDown(e);
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        )}
      </Widget>
    );
  }

  return (
    <div
      ref={boardRef}
      className={styles.board}
      style={{ gridAutoRows: `${metrics.cellSize}px` }}
    >
      <LayoutGroup>
        <AnimatePresence>
          {widgets.map((w) => (
            <WidgetWithResize
              key={w.id}
              w={w}
              dimmed={filtering && filterMode === 'dim' && !matches(w.category)}
            />
          ))}
        </AnimatePresence>
        {activeWidget && !interactionsLocked && <DropPreview widget={activeWidget} />}
        {palettePreview && (
          <DropPreview
            widget={{
              id: '__pal__',
              x: palettePreview.x,
              y: palettePreview.y,
              w: palettePreview.w,
              h: palettePreview.h,
              category: palettePreview.category,
              order: 0,
            }}
          />
        )}
      </LayoutGroup>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `components/shell/AppShell.tsx`**

AppShell now creates `boardRef` + `metrics`, owns `DndContext` + `DragOverlay`, handles all drag events, and routes palette drags separately from board-tile drags.

```tsx
'use client';
import { useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import styles from './AppShell.module.css';
import { ThemeController } from './ThemeController';
import { LeftBar } from './LeftBar';
import { BentoBoard } from '@/components/board/BentoBoard';
import { DragOverlayWidget } from '@/components/board/DragOverlayWidget';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';
import { useDragStore } from '@/lib/state/dragStore';
import { getStrategy } from '@/lib/grid/engine';
import { pointToCell } from '@/lib/grid/collision';
import { useGridMetrics } from '@/lib/hooks/useGridMetrics';
import type { Category, WidgetLayout } from '@/lib/grid/types';

export function AppShell() {
  const boardRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(boardRef);

  const committed = useBoard((s) => s.widgets);
  const moveWidget = useBoard((s) => s.moveWidget);
  const addWidget = useBoard((s) => s.addWidget);
  const layoutMode = useSettings((s) => s.layoutMode);

  const { activeId, preview, setActiveId, setPreview, setPalettePreview, setFabOpen } =
    useDragStore();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const isPaletteDrag = activeId?.startsWith('palette:') ?? false;

  const activeWidget: WidgetLayout | null = isPaletteDrag
    ? (() => {
        const parts = (activeId ?? '').split(':');
        const [w, h] = (parts[2] ?? '1x1').split('x').map(Number);
        return {
          id: activeId!,
          x: 0,
          y: 0,
          w,
          h,
          category: (parts[1] ?? 'finance') as Category,
          order: 0,
        };
      })()
    : (preview ?? committed).find((w) => w.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setPreview(committed);
  }

  function handleDragMove(e: DragMoveEvent) {
    const board = boardRef.current;
    const rect = e.active.rect.current.translated;
    if (!board || !rect) return;
    const b = board.getBoundingClientRect();
    const cell = pointToCell(rect.left - b.left, rect.top - b.top, metrics);
    const id = String(e.active.id);

    if (id.startsWith('palette:')) {
      const parts = id.split(':');
      const [w, h] = (parts[2] ?? '1x1').split('x').map(Number);
      setPalettePreview({ x: cell.x, y: cell.y, w, h, category: (parts[1] ?? 'finance') as Category });
    } else {
      setPreview(getStrategy(layoutMode).preview(committed, { kind: 'drag', id, targetCell: cell }));
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);

    if (id.startsWith('palette:')) {
      const parts = id.split(':');
      const cat = (parts[1] ?? 'finance') as Category;
      const [w, h] = (parts[2] ?? '1x1').split('x').map(Number);
      const pp = useDragStore.getState().palettePreview;
      addWidget(cat, w, h, pp ? { x: pp.x, y: pp.y } : undefined);
      setFabOpen(false);
    } else if (preview) {
      const moved = preview.find((w) => w.id === id);
      if (moved) moveWidget(id, { x: moved.x, y: moved.y });
    }

    setActiveId(null);
    setPreview(null);
    setPalettePreview(null);
  }

  function handleDragCancel() {
    setActiveId(null);
    setPreview(null);
    setPalettePreview(null);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={styles.shell}>
        <ThemeController />
        <LeftBar />
        <div className={styles.main}>
          <div className={styles.scroll}>
            <BentoBoard boardRef={boardRef} metrics={metrics} />
          </div>
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeWidget ? <DragOverlayWidget widget={activeWidget} metrics={metrics} /> : null}
      </DragOverlay>
      {/* Fab mounts here in Task 8 */}
    </DndContext>
  );
}
```

- [ ] **Step 3: Verify drag still works**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: board tiles still drag, resize, and reflow exactly as before. No console errors. Stop the server.

- [ ] **Step 4: Run full test suite**

Run: `npm run test`
Expected: all existing tests pass; no new failures.

- [ ] **Step 5: Commit**

```bash
git add components/board/BentoBoard.tsx components/shell/AppShell.tsx
git commit -m "refactor: lift DndContext to AppShell; BentoBoard reads drag state from dragStore"
```

---

## Task 5: Update Widget.tsx to render from registry

`Widget` currently hard-imports `WidgetSkeleton`. Change it to look up the widget's `WidgetDefinition` from `WIDGET_REGISTRY` and render `def.ContentComponent`. This is the single seam point — future real content is wired by swapping `ContentComponent` in the registry without touching `Widget`.

**Files:**
- Modify: `components/board/Widget.tsx`
- Modify: `components/board/DragOverlayWidget.tsx`

- [ ] **Step 1: Update `components/board/Widget.tsx`**

Replace the `WidgetSkeleton` import with a registry lookup:

```tsx
'use client';
import { type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useDraggable } from '@dnd-kit/core';
import styles from './Widget.module.css';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import type { WidgetLayout } from '@/lib/grid/types';

interface WidgetProps {
  widget: WidgetLayout;
  dragging?: boolean;
  dimmed?: boolean;
  interactive?: boolean;
  children?: ReactNode;
}

export function Widget({
  widget,
  dragging = false,
  dimmed = false,
  interactive = true,
  children,
}: WidgetProps) {
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
      transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.7 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: dimmed ? 0.18 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={styles.tile}
      style={style}
      data-dragging={dragging}
      data-dimmed={dimmed}
      ref={setNodeRef}
      {...(interactive ? listeners : {})}
      {...attributes}
    >
      {ContentComponent && (
        <ContentComponent category={widget.category} w={widget.w} h={widget.h} />
      )}
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Update `components/board/DragOverlayWidget.tsx`**

Replace the `WidgetSkeleton` import with a registry lookup:

```tsx
'use client';
import styles from './Widget.module.css';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import type { WidgetLayout } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';
import { cellSpanToPixels } from '@/lib/grid/collision';

export function DragOverlayWidget({ widget, metrics }: { widget: WidgetLayout; metrics: GridMetrics }) {
  const { width, height } = cellSpanToPixels(widget.w, widget.h, metrics);
  const def = WIDGET_REGISTRY.find((d) => d.category === widget.category);
  const ContentComponent = def?.ContentComponent;
  return (
    <div
      className={`${styles.tile} glass`}
      style={{
        width,
        height,
        cursor: 'grabbing',
        transform: 'scale(1.03)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
      }}
    >
      {ContentComponent && (
        <ContentComponent category={widget.category} w={widget.w} h={widget.h} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify board still renders correctly**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: board widgets still show their category label via `WidgetSkeleton` (same appearance). Drag and resize still work. No console errors. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add components/board/Widget.tsx components/board/DragOverlayWidget.tsx
git commit -m "feat: Widget renders ContentComponent from registry — seam for future content"
```

---

## Task 6: CarouselCard

A single widget preview card with a pop-up size picker. The picker expands upward from the card when clicked. Each size chip is a dnd-kit draggable (id = `"palette:<category>:<w>x<h>"`); clicking a chip without dragging calls `onAdd`.

**Files:**
- Create: `components/shell/CarouselCard.tsx`, `components/shell/CarouselCard.module.css`
- Test: `components/shell/CarouselCard.test.tsx`

- [ ] **Step 1: Write the failing test `components/shell/CarouselCard.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { CarouselCard } from './CarouselCard';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import type { GridMetrics } from '@/lib/grid/collision';

const metrics: GridMetrics = { cellSize: 100, gap: 12, cols: 6 };
const def = WIDGET_REGISTRY.find((d) => d.type === 'finance')!;

function Wrapper({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>;
}

describe('CarouselCard', () => {
  it('renders the card label', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} metrics={metrics} isOpen={false} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });

  it('calls onToggle when the card preview is clicked', async () => {
    const onToggle = vi.fn();
    render(
      <Wrapper>
        <CarouselCard definition={def} metrics={metrics} isOpen={false} onToggle={onToggle} onAdd={vi.fn()} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Finance/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('shows size chips when isOpen is true', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} metrics={metrics} isOpen={true} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByRole('button', { name: '1×1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2×2' })).toBeInTheDocument();
  });

  it('hides size chips when isOpen is false', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} metrics={metrics} isOpen={false} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.queryByRole('button', { name: '1×1' })).not.toBeInTheDocument();
  });

  it('calls onAdd with correct w,h when a size chip is clicked', async () => {
    const onAdd = vi.fn();
    render(
      <Wrapper>
        <CarouselCard definition={def} metrics={metrics} isOpen={true} onToggle={vi.fn()} onAdd={onAdd} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole('button', { name: '2×2' }));
    expect(onAdd).toHaveBeenCalledWith(2, 2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- CarouselCard`
Expected: FAIL — cannot resolve `./CarouselCard`.

- [ ] **Step 3: Write `components/shell/CarouselCard.module.css`**

```css
.card {
  position: relative;
  flex-shrink: 0;
}

.preview {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  border: 1px solid var(--border-hairline);
  background: var(--surface-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  color: var(--text);
}

.preview:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.label {
  font-size: 11px;
  color: var(--muted);
  text-transform: capitalize;
}

.picker {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface);
  border: 1px solid var(--border-hairline);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
  z-index: 110;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
  transform-origin: bottom center;
}

.picker::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 6px;
  background: var(--surface);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

.pickerLabel {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sizeChip {
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-hairline);
  background: var(--surface-2);
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
  touch-action: none;
  transition: background 0.1s ease, border-color 0.1s ease;
}

.sizeChip:hover {
  background: color-mix(in srgb, var(--accent) 16%, var(--surface-2));
  border-color: var(--accent);
}

.sizeChip[data-dragging='true'] {
  opacity: 0.4;
}

.hint {
  font-size: 10px;
  color: var(--muted);
  text-align: center;
}
```

- [ ] **Step 4: Write `components/shell/CarouselCard.tsx`**

```tsx
'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useDraggable } from '@dnd-kit/core';
import styles from './CarouselCard.module.css';
import type { WidgetDefinition } from '@/lib/widgets/registry';
import type { SizePreset } from '@/lib/grid/sizes';
import type { GridMetrics } from '@/lib/grid/collision';
import type { Category } from '@/lib/grid/types';

interface SizeChipProps {
  preset: SizePreset;
  category: Category;
  onAdd: (w: number, h: number) => void;
}

function SizeChip({ preset, category, onAdd }: SizeChipProps) {
  const { listeners, attributes, setNodeRef, isDragging } = useDraggable({
    id: `palette:${category}:${preset.w}x${preset.h}`,
  });
  return (
    <button
      ref={setNodeRef}
      className={styles.sizeChip}
      {...listeners}
      {...attributes}
      data-dragging={isDragging}
      onClick={() => onAdd(preset.w, preset.h)}
    >
      {preset.name}
    </button>
  );
}

export interface CarouselCardProps {
  definition: WidgetDefinition;
  metrics: GridMetrics;
  isOpen: boolean;
  onToggle: () => void;
  onAdd: (w: number, h: number) => void;
}

export function CarouselCard({ definition, metrics: _metrics, isOpen, onToggle, onAdd }: CarouselCardProps) {
  return (
    <div className={styles.card}>
      <button
        className={styles.preview}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={definition.label}
      >
        <span className={styles.dot} style={{ background: definition.accentColor }} />
        <span className={styles.label}>{definition.label}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.picker}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          >
            <span className={styles.pickerLabel}>{definition.label}</span>
            <div className={styles.chips}>
              {definition.supportedSizes.map((preset) => (
                <SizeChip
                  key={preset.name}
                  preset={preset}
                  category={definition.category}
                  onAdd={onAdd}
                />
              ))}
            </div>
            <span className={styles.hint}>click to add · drag to place</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- CarouselCard`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add components/shell/CarouselCard.tsx components/shell/CarouselCard.module.css components/shell/CarouselCard.test.tsx
git commit -m "feat: CarouselCard with size picker and draggable chips"
```

---

## Task 7: WidgetCarousel

The expanded carousel panel. Shows category filter chips and a horizontally scrollable row of `CarouselCard` components. Only one card's size picker is open at a time. Filtering removes non-matching cards with `AnimatePresence` exit.

**Files:**
- Create: `components/shell/WidgetCarousel.tsx`, `components/shell/WidgetCarousel.module.css`
- Test: `components/shell/WidgetCarousel.test.tsx`

- [ ] **Step 1: Write the failing test `components/shell/WidgetCarousel.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { WidgetCarousel } from './WidgetCarousel';
import { useDragStore } from '@/lib/state/dragStore';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';

vi.mock('@/lib/state/boardStore', () => ({
  useBoard: vi.fn(),
}));

const mockAddWidget = vi.fn();

function Wrapper({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>;
}

describe('WidgetCarousel', () => {
  beforeEach(() => {
    vi.mocked(useBoard).mockImplementation((sel: any) =>
      sel({ widgets: [], addWidget: mockAddWidget, moveWidget: vi.fn(), removeWidget: vi.fn(), resizeWidget: vi.fn(), reResolve: vi.fn(), setWidgets: vi.fn() }),
    );
    useSettings.setState({ layoutMode: 'autoPack' });
    useDragStore.setState({ fabOpen: true });
    mockAddWidget.mockClear();
  });

  it('renders all 4 widget cards', () => {
    render(<Wrapper><WidgetCarousel onClose={vi.fn()} /></Wrapper>);
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Lifestyle')).toBeInTheDocument();
  });

  it('clicking a card opens its size picker', async () => {
    render(<Wrapper><WidgetCarousel onClose={vi.fn()} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: /Finance/i }));
    expect(screen.getByRole('button', { name: '1×1' })).toBeInTheDocument();
  });

  it('clicking a second card closes the first picker and opens the new one', async () => {
    render(<Wrapper><WidgetCarousel onClose={vi.fn()} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: /Finance/i }));
    expect(screen.getByRole('button', { name: '1×1' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Health/i }));
    // Finance size chips gone, Health chips appear
    expect(screen.queryByRole('button', { name: '2×1' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1×1' })).toBeInTheDocument(); // health also has 1x1
  });

  it('clicking a size chip calls addWidget and then onClose', async () => {
    const onClose = vi.fn();
    render(<Wrapper><WidgetCarousel onClose={onClose} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: /Finance/i }));
    await userEvent.click(screen.getByRole('button', { name: '1×1' }));
    expect(mockAddWidget).toHaveBeenCalledWith('finance', 1, 1);
    expect(onClose).toHaveBeenCalled();
  });

  it('filter chip "Health" shows only Health card', async () => {
    render(<Wrapper><WidgetCarousel onClose={vi.fn()} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'Health' }));
    expect(screen.queryByText('Finance')).not.toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- WidgetCarousel`
Expected: FAIL — cannot resolve `./WidgetCarousel`.

- [ ] **Step 3: Write `components/shell/WidgetCarousel.module.css`**

```css
.panel {
  position: relative;
  background: var(--surface-glass);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid var(--border-hairline);
  border-radius: 22px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(580px, calc(100vw - 120px));
  transform-origin: bottom right;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.closeBtn {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--muted);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 1;
}

.closeBtn:hover {
  color: var(--text);
  background: var(--surface-2);
}

.filters {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.filters::-webkit-scrollbar {
  display: none;
}

.filterChip {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.filterChip:hover {
  color: var(--text);
}

.filterChip[data-active='true'] {
  border-color: var(--accent);
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}

.cards {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 4px 2px 8px;
}

.cards::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 4: Write `components/shell/WidgetCarousel.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import styles from './WidgetCarousel.module.css';
import { CarouselCard } from './CarouselCard';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { useBoard } from '@/lib/state/boardStore';
import type { Category } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';

const ALL_FILTERS: Array<{ label: string; value: Category | null }> = [
  { label: 'All', value: null },
  { label: 'Finance', value: 'finance' },
  { label: 'Health', value: 'health' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Lifestyle', value: 'lifestyle' },
];

const STUB_METRICS: GridMetrics = { cellSize: 80, gap: 12, cols: 6 };

interface WidgetCarouselProps {
  onClose: () => void;
}

export function WidgetCarousel({ onClose }: WidgetCarouselProps) {
  const addWidget = useBoard((s) => s.addWidget);
  const [activeFilter, setActiveFilter] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const visibleDefs = activeFilter
    ? WIDGET_REGISTRY.filter((d) => d.category === activeFilter)
    : WIDGET_REGISTRY;

  function handleAdd(category: Category, w: number, h: number) {
    addWidget(category, w, h);
    onClose();
  }

  return (
    <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <span className={styles.title}>Add widget</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className={styles.filters}>
        {ALL_FILTERS.map((f) => (
          <button
            key={f.label}
            className={styles.filterChip}
            data-active={activeFilter === f.value}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.cards}>
        <AnimatePresence>
          {visibleDefs.map((def) => (
            <CarouselCard
              key={def.type}
              definition={def}
              metrics={STUB_METRICS}
              isOpen={selectedType === def.type}
              onToggle={() => setSelectedType(selectedType === def.type ? null : def.type)}
              onAdd={(w, h) => handleAdd(def.category, w, h)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- WidgetCarousel`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add components/shell/WidgetCarousel.tsx components/shell/WidgetCarousel.module.css components/shell/WidgetCarousel.test.tsx
git commit -m "feat: WidgetCarousel with filter chips and single-picker-open constraint"
```

---

## Task 8: Fab component

The FAB button and its morph into the `WidgetCarousel` panel. Uses motion's `layoutId="fab-morph"` so dnd-kit's FLIP engine transitions the circle shape into the carousel panel shape (and back). A transparent backdrop closes the panel on outside click.

**Files:**
- Create: `components/shell/Fab.tsx`, `components/shell/Fab.module.css`
- Test: `components/shell/Fab.test.tsx`
- Modify: `components/shell/AppShell.tsx` — add `<Fab />` inside DndContext

- [ ] **Step 1: Write the failing test `components/shell/Fab.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { Fab } from './Fab';
import { useDragStore } from '@/lib/state/dragStore';
import { useBoard } from '@/lib/state/boardStore';

vi.mock('./WidgetCarousel', () => ({
  WidgetCarousel: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="carousel">
      <button onClick={onClose}>close-carousel</button>
    </div>
  ),
}));

vi.mock('@/lib/state/boardStore', () => ({
  useBoard: vi.fn(),
}));

vi.mocked(useBoard).mockImplementation((sel: any) =>
  sel({ widgets: [], addWidget: vi.fn(), moveWidget: vi.fn(), removeWidget: vi.fn(), resizeWidget: vi.fn(), reResolve: vi.fn(), setWidgets: vi.fn() }),
);

function Wrapper({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>;
}

describe('Fab', () => {
  beforeEach(() => {
    useDragStore.setState({ fabOpen: false });
  });

  it('renders the + button when closed', () => {
    render(<Wrapper><Fab /></Wrapper>);
    expect(screen.getByRole('button', { name: /open widget carousel/i })).toBeInTheDocument();
    expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
  });

  it('opens the carousel when the FAB is clicked', async () => {
    render(<Wrapper><Fab /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: /open widget carousel/i }));
    expect(useDragStore.getState().fabOpen).toBe(true);
    expect(screen.getByTestId('carousel')).toBeInTheDocument();
  });

  it('closes the carousel when the close button inside it is clicked', async () => {
    useDragStore.setState({ fabOpen: true });
    render(<Wrapper><Fab /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'close-carousel' }));
    expect(useDragStore.getState().fabOpen).toBe(false);
  });

  it('closes when the backdrop is clicked', async () => {
    useDragStore.setState({ fabOpen: true });
    render(<Wrapper><Fab /></Wrapper>);
    await userEvent.click(screen.getByTestId('fab-backdrop'));
    expect(useDragStore.getState().fabOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- Fab`
Expected: FAIL — cannot resolve `./Fab`.

- [ ] **Step 3: Write `components/shell/Fab.module.css`**

```css
.anchor {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: transparent;
}

.fabBtn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  color: #fff;
  font-size: 26px;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.45);
  transition: box-shadow 0.15s ease;
}

.fabBtn:hover {
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.6);
}
```

- [ ] **Step 4: Write `components/shell/Fab.tsx`**

```tsx
'use client';
import { AnimatePresence, motion } from 'motion/react';
import styles from './Fab.module.css';
import { WidgetCarousel } from './WidgetCarousel';
import { useDragStore } from '@/lib/state/dragStore';

const SPRING_OPEN = { type: 'spring' as const, stiffness: 320, damping: 28, mass: 0.9 };
const SPRING_CLOSE = { type: 'spring' as const, stiffness: 380, damping: 36, mass: 0.85 };

export function Fab() {
  const fabOpen = useDragStore((s) => s.fabOpen);
  const setFabOpen = useDragStore((s) => s.setFabOpen);

  return (
    <div className={styles.anchor}>
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            data-testid="fab-backdrop"
            key="backdrop"
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {!fabOpen ? (
          <motion.button
            key="fab-btn"
            layoutId="fab-morph"
            className={styles.fabBtn}
            aria-label="Open widget carousel"
            onClick={() => setFabOpen(true)}
            transition={SPRING_CLOSE}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
          >
            +
          </motion.button>
        ) : (
          <motion.div
            key="fab-carousel"
            layoutId="fab-morph"
            transition={SPRING_OPEN}
            style={{ transformOrigin: 'bottom right' }}
          >
            <WidgetCarousel onClose={() => setFabOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- Fab`
Expected: PASS (4 tests).

- [ ] **Step 6: Add `<Fab />` to `AppShell.tsx`**

In `components/shell/AppShell.tsx`, add the import:
```tsx
import { Fab } from './Fab';
```

Replace the `{/* Fab mounts here in Task 8 */}` comment with:
```tsx
      <Fab />
```

- [ ] **Step 7: Verify the full flow manually**

Run: `npm run dev`, open `http://localhost:3000`.

Expected:
- A purple circle FAB appears bottom-right above any bottom bar.
- Clicking it morphs into the floating carousel panel (spring animation, grows from bottom-right).
- The carousel shows "Add widget" header, category filter chips, and 4 widget cards.
- Clicking a card expands the size picker upward.
- Clicking a size chip adds a widget to the board and closes the carousel.
- Clicking outside the panel (backdrop) collapses it back to the FAB circle.
- Clicking `×` also closes it.
- The board stays interactive behind the backdrop.

Stop the server.

- [ ] **Step 8: Commit**

```bash
git add components/shell/Fab.tsx components/shell/Fab.module.css components/shell/Fab.test.tsx components/shell/AppShell.tsx
git commit -m "feat: FAB morphs into widget carousel with layoutId FLIP animation"
```

---

## Task 9: Full suite verification

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests pass. If any test fails, fix it before continuing.

- [ ] **Step 2: Verify drag-to-place manually**

Run: `npm run dev`, open `http://localhost:3000`.

Sequence to test:
1. Click the FAB to open the carousel.
2. Click "Finance" card to expand its size picker.
3. Press and hold a size chip (e.g. "2×2"), then drag it onto the board.
4. While dragging: a dashed ghost footprint appears on the board showing where the widget will land.
5. Release on the board: the widget is added at the target cell, the carousel closes, and the board reflows.
6. Open the carousel again; drag a chip and release outside the board area — nothing is added, the carousel stays open.

Expected for all of the above to work correctly. Stop the server.

- [ ] **Step 3: Verify category filtering in carousel**

Run: `npm run dev`, open `http://localhost:3000`.

1. Open FAB carousel.
2. Click "Health" filter chip — only the Health card should be visible.
3. Click "All" — all 4 cards return.
4. Click a filter chip a second time (same chip) — it should toggle off (return to All).

Stop the server.

- [ ] **Step 4: Commit**

If no fixes were needed, create a verification-only commit:
```bash
git commit --allow-empty -m "chore: verify fab carousel full flow — all tests green"
```

If fixes were needed, stage and commit those changes with a descriptive message.

---

## TODO stubs left for future passes

```
// TODO(widget-content): replace WidgetSkeleton with per-type content components.
//   anchor: lib/widgets/registry.ts
//   sites: components/widgets/WidgetSkeleton.tsx, components/board/Widget.tsx
//   — add real Finance, Health, Calendar, Lifestyle components and swap ContentComponent in WIDGET_REGISTRY

// TODO(filter-drag): allow drag/resize within a filtered subset while filterMode=hide is active.
//   anchor: components/board/BentoBoard.tsx
//   — currently interactions are locked while a hide-filter is active

// TODO(carousel-a11y): keyboard navigation within carousel — tab through cards, arrow keys for size chips.
//   anchor: components/shell/WidgetCarousel.tsx
```
