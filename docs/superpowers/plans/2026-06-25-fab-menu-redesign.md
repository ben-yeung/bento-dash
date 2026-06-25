# FAB Menu Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the narrow carousel FAB panel with a full-width bottom sheet that has a browse state (1×1 tile row) and a size-picker state (proportional size variants, grows upward), while preserving all existing drag-and-drop pipeline code unchanged.

**Architecture:** `Fab.tsx` morphs between a fixed bottom-right button and a `position: fixed; bottom: 0; left: 0; right: 0` full-width panel. `WidgetCarousel` (the panel content) manages `selectedWidget` state to switch between browse and size-picker content via `AnimatePresence mode="wait"`. Panel height is controlled via Framer Motion `layout` on the outer `motion.div`; `WidgetCarousel` sets its own height inline so the parent auto-animates. `CarouselCard` is deleted and replaced by `BrowseTile` (1×1 preview) and `SizePickerTile` (proportional preview).

**Tech Stack:** React 18, Next.js, Framer Motion (`motion/react`), dnd-kit (`@dnd-kit/core`), Vitest + @testing-library/react, CSS Modules.

## Global Constraints

- Do NOT touch `AppShell.tsx` drag handlers (`handleDragStart`, `handleDragMove`, `handleDragEnd`), `dragStore.ts`, `boardStore.ts`, `lib/grid/engine.ts`, `lib/grid/collision.ts`, `lib/widgets/registry.ts`, or `ScaledWidgetContent.tsx`.
- Palette drag ID format must remain `palette:${category}:${widgetType}:${w}x${h}` — `parsePaletteId` in `AppShell.tsx` depends on it.
- Spring configs: `SPRING_OPEN = { type:'spring', stiffness:320, damping:28, mass:0.9 }`, `SPRING_CLOSE = { type:'spring', stiffness:380, damping:36, mass:0.85 }`. Reuse; do not introduce new configs.
- `GRID_GAP = 12` (from `lib/grid/types.ts`). Import it; do not hardcode 12.
- Test runner: `npx vitest run --reporter=verbose` — do not use `npm test`.
- Node version is 20.18 — no syntax or API that requires Node 22+.
- `npm run lint` is broken project-wide (Next 16 toolchain issue). Use `npx tsc --noEmit` for type-checking.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `components/shell/Fab.tsx` | Full-width panel shape, `layout` prop for height animation, forward `cellSize` |
| Modify | `components/shell/Fab.module.css` | `fabBtn` self-positioned fixed; new `.panel` full-width; remove `.anchor`/`.carouselWrapper` |
| Modify | `components/shell/AppShell.tsx` | Pass `cellSize={metrics.cellSize}` to `<Fab />` |
| Rewrite | `components/shell/WidgetCarousel.tsx` | Browse + size-picker state machine, height computation |
| Rewrite | `components/shell/WidgetCarousel.module.css` | Remove width cap; full-width panel styles |
| Create | `components/shell/BrowseTile.tsx` | Draggable 1×1 preview tile for browse state |
| Create | `components/shell/BrowseTile.module.css` | Tile + label styles |
| Create | `components/shell/BrowseTile.test.tsx` | Unit tests |
| Create | `components/shell/SizePickerTile.tsx` | Draggable proportional preview tile for size-picker state |
| Create | `components/shell/SizePickerTile.module.css` | Proportional tile + dimension label styles |
| Create | `components/shell/SizePickerTile.test.tsx` | Unit tests |
| Rewrite | `components/shell/WidgetCarousel.test.tsx` | Update for new browse/size-picker API |
| Delete | `components/shell/CarouselCard.tsx` | Replaced by BrowseTile + SizePickerTile |
| Delete | `components/shell/CarouselCard.module.css` | No longer needed |
| Delete | `components/shell/CarouselCard.test.tsx` | Tests for deleted component |

---

## Task 1: Restructure `Fab.tsx` for full-width panel and thread `cellSize`

**Files:**
- Modify: `components/shell/AppShell.tsx` (line ~18 where `<Fab />` is rendered)
- Modify: `components/shell/Fab.tsx`
- Modify: `components/shell/Fab.module.css`

**Interfaces:**
- Produces: `Fab({ cellSize: number })` — all downstream tasks rely on this prop

- [ ] **Step 1: Add `cellSize` prop to `Fab` and pass it from `AppShell`**

In `AppShell.tsx`, find the `<Fab />` JSX (currently line ~18 in the return). Change it to:
```tsx
<Fab cellSize={metrics.cellSize} />
```

In `Fab.tsx`, update the component signature:
```tsx
export function Fab({ cellSize }: { cellSize: number }) {
```
And forward it to `WidgetCarousel`:
```tsx
<WidgetCarousel cellSize={cellSize} onClose={() => setFabOpen(false)} />
```

In `WidgetCarousel.tsx`, update the props interface (keep existing body unchanged for now — this step is just plumbing):
```tsx
interface WidgetCarouselProps {
  cellSize: number;
  onClose: () => void;
}
export function WidgetCarousel({ cellSize, onClose }: WidgetCarouselProps) {
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no errors related to `cellSize`.

- [ ] **Step 3: Restructure `Fab.tsx` for full-width panel**

Replace the full contents of `Fab.tsx` with:

```tsx
'use client';
import { AnimatePresence, motion } from 'motion/react';
import styles from './Fab.module.css';
import { WidgetCarousel } from './WidgetCarousel';
import { useDragStore } from '@/lib/state/dragStore';

const SPRING_OPEN  = { type: 'spring' as const, stiffness: 320, damping: 28,  mass: 0.9  };
const SPRING_CLOSE = { type: 'spring' as const, stiffness: 380, damping: 36,  mass: 0.85 };

export function Fab({ cellSize }: { cellSize: number }) {
  const fabOpen    = useDragStore((s) => s.fabOpen);
  const setFabOpen = useDragStore((s) => s.setFabOpen);

  return (
    <>
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
            animate={{ borderRadius: '26px' }}
            aria-label="Open widget menu"
            onClick={() => setFabOpen(true)}
            transition={SPRING_CLOSE}
          >
            +
          </motion.button>
        ) : (
          <motion.div
            key="fab-panel"
            layoutId="fab-morph"
            layout
            className={styles.panel}
            animate={{ borderRadius: '22px 22px 0 0' }}
            transition={SPRING_OPEN}
          >
            <WidgetCarousel cellSize={cellSize} onClose={() => setFabOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

Key changes from original:
- Removed the `<div className={styles.anchor}>` wrapper
- `fabBtn` is now self-positioned (see CSS step below)
- Panel uses `className={styles.panel}` (new full-width class) instead of `styles.carouselWrapper`
- Added `layout` prop so Framer Motion auto-animates height changes when `WidgetCarousel` changes internal height

- [ ] **Step 4: Rewrite `Fab.module.css`**

Replace the full contents:

```css
/* Full-width bottom panel — morphs from/to the FAB button */
.panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface-2);
  border: 1px solid var(--border-hairline);
  border-bottom: none;
  z-index: 100;
  overflow: hidden;
}

/* FAB button — self-positioned bottom-right */
.fabBtn {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 100;
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

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: transparent;
}
```

- [ ] **Step 5: Verify TypeScript compiles and no import errors**

```
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/shell/AppShell.tsx components/shell/Fab.tsx components/shell/Fab.module.css
git commit -m "refactor: Fab full-width panel shape, thread cellSize prop"
```

---

## Task 2: Create `BrowseTile` component

**Files:**
- Create: `components/shell/BrowseTile.tsx`
- Create: `components/shell/BrowseTile.module.css`
- Create: `components/shell/BrowseTile.test.tsx`

**Interfaces:**
- Consumes: `WidgetDefinition` from `@/lib/widgets/registry`, `ScaledWidgetContent` from `@/components/widgets/ScaledWidgetContent`
- Produces: `BrowseTile({ definition: WidgetDefinition, onSelect: () => void, cellSize: number })` — used by `WidgetCarousel` in Task 3

- [ ] **Step 1: Write the failing tests**

Create `components/shell/BrowseTile.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { BrowseTile } from './BrowseTile';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';

const def = WIDGET_REGISTRY.find((d) => d.type === 'budget-summary')!;

function Wrapper({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  return <DndContext sensors={sensors}>{children}</DndContext>;
}

describe('BrowseTile', () => {
  it('renders the widget label', () => {
    render(
      <Wrapper>
        <BrowseTile definition={def} onSelect={vi.fn()} cellSize={120} />
      </Wrapper>,
    );
    expect(screen.getByText('Budget Summary')).toBeDefined();
  });

  it('applies cellSize as width and height on the tile', () => {
    render(
      <Wrapper>
        <BrowseTile definition={def} onSelect={vi.fn()} cellSize={120} />
      </Wrapper>,
    );
    const tile = screen.getByRole('button', { name: 'Budget Summary' });
    expect(tile.style.width).toBe('120px');
    expect(tile.style.height).toBe('120px');
  });

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn();
    render(
      <Wrapper>
        <BrowseTile definition={def} onSelect={onSelect} cellSize={120} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Budget Summary' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('uses the first supported size in the drag id', () => {
    render(
      <Wrapper>
        <BrowseTile definition={def} onSelect={vi.fn()} cellSize={120} />
      </Wrapper>,
    );
    // budget-summary first size is 1×1 → id palette:finance:budget-summary:1x1
    const tile = screen.getByRole('button', { name: 'Budget Summary' });
    expect(tile.dataset.draggableNodeRef ?? tile.getAttribute('data-testid') ?? tile.id).toBeDefined();
    // The drag id is set on the dnd-kit node; verify via aria attribute set by useDraggable
    expect(tile.getAttribute('aria-describedby')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run components/shell/BrowseTile.test.tsx --reporter=verbose
```
Expected: FAIL — `BrowseTile` module not found.

- [ ] **Step 3: Create `BrowseTile.module.css`**

```css
.wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.tile {
  position: relative;
  border-radius: var(--radius-tile);
  border: 1px solid var(--border-hairline);
  background: var(--surface);
  overflow: hidden;
  cursor: grab;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
}

.tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  border-color: var(--w-accent, var(--accent));
}

.tile[data-dragging='true'] {
  opacity: 0.4;
  cursor: grabbing;
}

.accentBar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--w-accent, var(--accent));
}

.label {
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
  font-weight: 500;
  text-align: center;
}
```

- [ ] **Step 4: Create `BrowseTile.tsx`**

```tsx
'use client';
import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import styles from './BrowseTile.module.css';
import { ScaledWidgetContent } from '@/components/widgets/ScaledWidgetContent';
import type { WidgetDefinition } from '@/lib/widgets/registry';

interface BrowseTileProps {
  definition: WidgetDefinition;
  onSelect: () => void;
  cellSize: number;
}

export function BrowseTile({ definition, onSelect, cellSize }: BrowseTileProps) {
  const defaultSize = definition.supportedSizes[0];
  const dragId = `palette:${definition.category}:${definition.type}:${defaultSize.w}x${defaultSize.h}`;

  const { listeners, attributes, setNodeRef, isDragging } = useDraggable({ id: dragId });

  return (
    <div className={styles.wrap}>
      <button
        ref={setNodeRef}
        type="button"
        className={styles.tile}
        style={
          {
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            '--cell-size': `${cellSize}px`,
            '--w-accent': definition.accentColor,
          } as CSSProperties
        }
        data-dragging={isDragging}
        onClick={() => { if (!isDragging) onSelect(); }}
        aria-label={definition.label}
        {...listeners}
        {...attributes}
      >
        <ScaledWidgetContent
          category={definition.category}
          w={1}
          h={1}
          ContentComponent={definition.ContentComponent}
        />
        <div className={styles.accentBar} />
      </button>
      <span className={styles.label}>{definition.label}</span>
    </div>
  );
}
```

Note: `w={1} h={1}` is intentional — all browse tiles render as a 1×1 thumbnail regardless of the widget's first supported size. The content component uses these values to decide its layout density.

- [ ] **Step 5: Run tests to confirm they pass**

```
npx vitest run components/shell/BrowseTile.test.tsx --reporter=verbose
```
Expected: all 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add components/shell/BrowseTile.tsx components/shell/BrowseTile.module.css components/shell/BrowseTile.test.tsx
git commit -m "feat: BrowseTile — 1x1 draggable preview tile for FAB browse state"
```

---

## Task 3: Rewrite `WidgetCarousel` browse state

**Files:**
- Rewrite: `components/shell/WidgetCarousel.tsx`
- Rewrite: `components/shell/WidgetCarousel.module.css`
- Rewrite: `components/shell/WidgetCarousel.test.tsx`

**Interfaces:**
- Consumes: `BrowseTile` from `./BrowseTile`
- Produces: `WidgetCarousel({ cellSize: number, onClose: () => void })` — used by `Fab.tsx`

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `components/shell/WidgetCarousel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { WidgetCarousel } from './WidgetCarousel';
import { useBoard } from '@/lib/state/boardStore';

vi.mock('@/lib/state/boardStore', () => ({ useBoard: vi.fn() }));

const mockAddWidget = vi.fn();

function Wrapper({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  return <DndContext sensors={sensors}>{children}</DndContext>;
}

describe('WidgetCarousel', () => {
  beforeEach(() => {
    vi.mocked(useBoard).mockImplementation((sel: any) =>
      sel({ widgets: [], addWidget: mockAddWidget, moveWidget: vi.fn(), removeWidget: vi.fn(), resizeWidget: vi.fn(), reResolve: vi.fn(), setWidgets: vi.fn() }),
    );
    mockAddWidget.mockClear();
  });

  it('renders all 10 widget tiles in browse state', () => {
    render(<Wrapper><WidgetCarousel cellSize={120} onClose={vi.fn()} /></Wrapper>);
    expect(screen.getByRole('button', { name: 'Budget Summary' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Activity Rings' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Calories' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Steps' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Upcoming Events' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Mini Calendar' })).toBeDefined();
    expect(screen.getByRole('button', { name: "Today's Schedule" })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Habit Tracker' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Weather' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Daily Note' })).toBeDefined();
  });

  it('filter chip "Health" shows only Health widget tiles', async () => {
    render(<Wrapper><WidgetCarousel cellSize={120} onClose={vi.fn()} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: /Filter: Health/i }));
    expect(screen.queryByRole('button', { name: 'Budget Summary' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Activity Rings' })).toBeDefined();
  });

  it('clicking a tile transitions to size-picker for that widget', async () => {
    render(<Wrapper><WidgetCarousel cellSize={120} onClose={vi.fn()} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'Budget Summary' }));
    // Size-picker header shows "Budget Summary" as the title
    expect(screen.getByText('Budget Summary')).toBeDefined();
    // Back button is present
    expect(screen.getByRole('button', { name: /Widgets/i })).toBeDefined();
    // Browse tiles are gone
    expect(screen.queryByRole('button', { name: 'Activity Rings' })).toBeNull();
  });

  it('back button in size-picker returns to browse state', async () => {
    render(<Wrapper><WidgetCarousel cellSize={120} onClose={vi.fn()} /></Wrapper>);
    await userEvent.click(screen.getByRole('button', { name: 'Budget Summary' }));
    await userEvent.click(screen.getByRole('button', { name: /Widgets/i }));
    // Browse tiles are back
    expect(screen.getByRole('button', { name: 'Activity Rings' })).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run components/shell/WidgetCarousel.test.tsx --reporter=verbose
```
Expected: some FAIL (tile click → size-picker tests will fail; render test may still pass with old code).

- [ ] **Step 3: Rewrite `WidgetCarousel.module.css`**

```css
.panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px 20px;
  /* Width is 100% — panel fills the parent .panel from Fab.module.css */
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.filters {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
  flex: 1;
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

.closeBtn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--muted);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.closeBtn:hover {
  color: var(--text);
  background: var(--surface);
}

.tileRow {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 2px 0 4px;
  /* padding-inline leaves room so first/last tiles don't clip against panel edge */
  padding-inline: 2px;
}

.tileRow::-webkit-scrollbar {
  display: none;
}

/* Size-picker state */
.pickerHeader {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.backBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 8px;
  border-radius: 20px;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.backBtn:hover {
  color: var(--text);
  background: var(--surface);
}

.pickerTitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.sizeRow {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  align-items: flex-end;
  padding: 2px 0 4px;
  padding-inline: 2px;
}

.sizeRow::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 4: Rewrite `WidgetCarousel.tsx` (browse state only — size-picker wired in Task 5)**

```tsx
'use client';
import { useState } from 'react';
import {
  LayoutGrid, TrendingUp, Heart, CalendarDays, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GRID_GAP } from '@/lib/grid/types';
import styles from './WidgetCarousel.module.css';
import { BrowseTile } from './BrowseTile';
import { WIDGET_REGISTRY, type WidgetDefinition } from '@/lib/widgets/registry';
import type { Category } from '@/lib/grid/types';

interface FilterEntry {
  label: string;
  value: Category | null;
  Icon: LucideIcon;
}

const CATEGORY_FILTERS: FilterEntry[] = [
  { label: 'All',       value: null,        Icon: LayoutGrid   },
  { label: 'Finance',   value: 'finance',   Icon: TrendingUp   },
  { label: 'Health',    value: 'health',    Icon: Heart        },
  { label: 'Calendar',  value: 'calendar',  Icon: CalendarDays },
  { label: 'Lifestyle', value: 'lifestyle', Icon: Sparkles     },
];

// Vertical space taken up by header + label row + top/bottom padding (px)
const CHROME_BROWSE      = 52 + 32 + 24; // padding + filter row + tile label
const CHROME_PICKER      = 52 + 36 + 24; // padding + picker header + tile label

interface WidgetCarouselProps {
  cellSize: number;
  onClose: () => void;
}

export function WidgetCarousel({ cellSize, onClose }: WidgetCarouselProps) {
  const [activeFilter, setActiveFilter]     = useState<Category | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<WidgetDefinition | null>(null);

  const visibleDefs = activeFilter
    ? WIDGET_REGISTRY.filter((d) => d.category === activeFilter)
    : WIDGET_REGISTRY;

  const browseHeight = cellSize + CHROME_BROWSE;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {selectedWidget === null ? (
        <motion.div
          key="browse"
          className={styles.panel}
          style={{ height: browseHeight }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div className={styles.filters}>
              {CATEGORY_FILTERS.map((f) => (
                <button
                  key={f.label}
                  className={styles.filterChip}
                  data-active={activeFilter === f.value}
                  onClick={() => setActiveFilter(f.value)}
                  aria-label={`Filter: ${f.label}`}
                >
                  <f.Icon size={14} />
                  <span style={{ marginLeft: 4 }}>{f.label}</span>
                </button>
              ))}
            </div>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className={styles.tileRow}>
            {visibleDefs.map((def) => (
              <BrowseTile
                key={def.type}
                definition={def}
                cellSize={cellSize}
                onSelect={() => setSelectedWidget(def)}
              />
            ))}
          </div>
        </motion.div>
      ) : (
        /* Size-picker state — wired in Task 5 */
        <motion.div
          key="picker"
          className={styles.panel}
          style={{ height: browseHeight }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.pickerHeader}>
            <button
              className={styles.backBtn}
              onClick={() => setSelectedWidget(null)}
              aria-label="Back to Widgets"
            >
              ← Widgets
            </button>
            <span className={styles.pickerTitle}>{selectedWidget.label}</span>
          </div>
          {/* TODO(fab-size-picker): size tile row — wired in Task 5 */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 5: Run tests to confirm browse-state tests pass**

```
npx vitest run components/shell/WidgetCarousel.test.tsx --reporter=verbose
```
Expected: the 4 new tests all PASS (the size-picker click test passes because the back button and title are already rendered).

- [ ] **Step 6: Commit**

```bash
git add components/shell/WidgetCarousel.tsx components/shell/WidgetCarousel.module.css components/shell/WidgetCarousel.test.tsx
git commit -m "feat: WidgetCarousel browse state — full-width panel, filter chips, BrowseTile row"
```

---

## Task 4: Create `SizePickerTile` component

**Files:**
- Create: `components/shell/SizePickerTile.tsx`
- Create: `components/shell/SizePickerTile.module.css`
- Create: `components/shell/SizePickerTile.test.tsx`

**Interfaces:**
- Consumes: `WidgetDefinition`, `SizePreset`, `ScaledWidgetContent`
- Produces: `SizePickerTile({ definition: WidgetDefinition, size: SizePreset, onAdd: (w: number, h: number) => void, cellSize: number, gap: number })` — used by `WidgetCarousel` in Task 5

- [ ] **Step 1: Write the failing tests**

Create `components/shell/SizePickerTile.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SizePickerTile } from './SizePickerTile';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { SIZE_PRESETS } from '@/lib/grid/sizes';

const def    = WIDGET_REGISTRY.find((d) => d.type === 'budget-summary')!;
const size2x2 = SIZE_PRESETS.find((s) => s.name === '2×2')!;
const size4x2 = SIZE_PRESETS.find((s) => s.name === '4×2')!;

function Wrapper({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  return <DndContext sensors={sensors}>{children}</DndContext>;
}

describe('SizePickerTile', () => {
  it('renders the dimension label', () => {
    render(
      <Wrapper>
        <SizePickerTile definition={def} size={size2x2} onAdd={vi.fn()} cellSize={120} gap={12} />
      </Wrapper>,
    );
    expect(screen.getByText('2 × 2')).toBeDefined();
  });

  it('applies proportional width and height for a 2×2 tile at cellSize=120 gap=12', () => {
    render(
      <Wrapper>
        <SizePickerTile definition={def} size={size2x2} onAdd={vi.fn()} cellSize={120} gap={12} />
      </Wrapper>,
    );
    const tile = screen.getByRole('button', { name: /2 × 2/i });
    // width = 2*120 + (2-1)*12 = 252
    expect(tile.style.width).toBe('252px');
    // height = 2*120 + (2-1)*12 = 252
    expect(tile.style.height).toBe('252px');
  });

  it('applies correct width and height for a 4×2 tile at cellSize=120 gap=12', () => {
    render(
      <Wrapper>
        <SizePickerTile definition={def} size={size4x2} onAdd={vi.fn()} cellSize={120} gap={12} />
      </Wrapper>,
    );
    const tile = screen.getByRole('button', { name: /4 × 2/i });
    // width = 4*120 + (4-1)*12 = 516
    expect(tile.style.width).toBe('516px');
    // height = 2*120 + (2-1)*12 = 252
    expect(tile.style.height).toBe('252px');
  });

  it('calls onAdd with correct w and h when clicked', async () => {
    const onAdd = vi.fn();
    render(
      <Wrapper>
        <SizePickerTile definition={def} size={size2x2} onAdd={onAdd} cellSize={120} gap={12} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole('button', { name: /2 × 2/i }));
    expect(onAdd).toHaveBeenCalledWith(2, 2);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run components/shell/SizePickerTile.test.tsx --reporter=verbose
```
Expected: FAIL — `SizePickerTile` module not found.

- [ ] **Step 3: Create `SizePickerTile.module.css`**

```css
.wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.tile {
  position: relative;
  border-radius: var(--radius-tile);
  border: 1px solid var(--border-hairline);
  background: var(--surface);
  overflow: hidden;
  cursor: grab;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
}

.tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  border-color: var(--w-accent, var(--accent));
}

.tile[data-dragging='true'] {
  opacity: 0.4;
  cursor: grabbing;
}

.accentBar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--w-accent, var(--accent));
}

.dimLabel {
  font-size: 10px;
  color: var(--muted);
  white-space: nowrap;
  font-weight: 500;
  text-align: center;
}
```

- [ ] **Step 4: Create `SizePickerTile.tsx`**

```tsx
'use client';
import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import styles from './SizePickerTile.module.css';
import { ScaledWidgetContent } from '@/components/widgets/ScaledWidgetContent';
import type { WidgetDefinition } from '@/lib/widgets/registry';
import type { SizePreset } from '@/lib/grid/sizes';

interface SizePickerTileProps {
  definition: WidgetDefinition;
  size: SizePreset;
  onAdd: (w: number, h: number) => void;
  cellSize: number;
  gap: number;
}

export function SizePickerTile({ definition, size, onAdd, cellSize, gap }: SizePickerTileProps) {
  const dragId = `palette:${definition.category}:${definition.type}:${size.w}x${size.h}`;
  const { listeners, attributes, setNodeRef, isDragging } = useDraggable({ id: dragId });

  const tileW = size.w * cellSize + (size.w - 1) * gap;
  const tileH = size.h * cellSize + (size.h - 1) * gap;

  return (
    <div className={styles.wrap}>
      <button
        ref={setNodeRef}
        type="button"
        className={styles.tile}
        style={
          {
            width: `${tileW}px`,
            height: `${tileH}px`,
            '--cell-size': `${cellSize}px`,
            '--w-accent': definition.accentColor,
          } as CSSProperties
        }
        data-dragging={isDragging}
        onClick={() => { if (!isDragging) onAdd(size.w, size.h); }}
        aria-label={`${size.w} × ${size.h}`}
        {...listeners}
        {...attributes}
      >
        <ScaledWidgetContent
          category={definition.category}
          w={size.w}
          h={size.h}
          ContentComponent={definition.ContentComponent}
        />
        <div className={styles.accentBar} />
      </button>
      <span className={styles.dimLabel}>{size.w} × {size.h}</span>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```
npx vitest run components/shell/SizePickerTile.test.tsx --reporter=verbose
```
Expected: all 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add components/shell/SizePickerTile.tsx components/shell/SizePickerTile.module.css components/shell/SizePickerTile.test.tsx
git commit -m "feat: SizePickerTile — proportional draggable tile for FAB size-picker state"
```

---

## Task 5: Wire size-picker state and height animation into `WidgetCarousel`

**Files:**
- Modify: `components/shell/WidgetCarousel.tsx`

**Interfaces:**
- Consumes: `SizePickerTile` from `./SizePickerTile`, `useBoard` from `@/lib/state/boardStore`, `GRID_GAP` from `@/lib/grid/types`

- [ ] **Step 1: Add a failing test for the click-to-add path**

Append to `components/shell/WidgetCarousel.test.tsx` inside the `describe` block:

```tsx
  it('clicking a size tile in size-picker calls addWidget and onClose', async () => {
    const onClose = vi.fn();
    render(<Wrapper><WidgetCarousel cellSize={120} onClose={onClose} /></Wrapper>);
    // Enter size-picker for Budget Summary
    await userEvent.click(screen.getByRole('button', { name: 'Budget Summary' }));
    // Click the 2×2 size tile
    await userEvent.click(screen.getByRole('button', { name: '2 × 2' }));
    expect(mockAddWidget).toHaveBeenCalledWith('finance', 'budget-summary', 2, 2);
    expect(onClose).toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run test to confirm it fails**

```
npx vitest run components/shell/WidgetCarousel.test.tsx --reporter=verbose
```
Expected: the new `clicking a size tile` test FAIL — size tiles are not rendered yet.

- [ ] **Step 3: Wire size-picker content into `WidgetCarousel.tsx`**

Replace the full contents of `components/shell/WidgetCarousel.tsx`:

```tsx
'use client';
import { useState } from 'react';
import {
  LayoutGrid, TrendingUp, Heart, CalendarDays, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GRID_GAP } from '@/lib/grid/types';
import styles from './WidgetCarousel.module.css';
import { BrowseTile } from './BrowseTile';
import { SizePickerTile } from './SizePickerTile';
import { WIDGET_REGISTRY, type WidgetDefinition } from '@/lib/widgets/registry';
import { useBoard } from '@/lib/state/boardStore';
import type { Category } from '@/lib/grid/types';

interface FilterEntry {
  label: string;
  value: Category | null;
  Icon: LucideIcon;
}

const CATEGORY_FILTERS: FilterEntry[] = [
  { label: 'All',       value: null,        Icon: LayoutGrid   },
  { label: 'Finance',   value: 'finance',   Icon: TrendingUp   },
  { label: 'Health',    value: 'health',    Icon: Heart        },
  { label: 'Calendar',  value: 'calendar',  Icon: CalendarDays },
  { label: 'Lifestyle', value: 'lifestyle', Icon: Sparkles     },
];

// Vertical chrome outside the tile area (px) — padding + header row + tile label
const CHROME_BROWSE = 52 + 32 + 24;
const CHROME_PICKER = 52 + 36 + 24;

function pickerHeight(def: WidgetDefinition, cellSize: number): number {
  const maxH = Math.max(...def.supportedSizes.map((s) => s.h));
  return maxH * cellSize + (maxH - 1) * GRID_GAP + CHROME_PICKER;
}

interface WidgetCarouselProps {
  cellSize: number;
  onClose: () => void;
}

export function WidgetCarousel({ cellSize, onClose }: WidgetCarouselProps) {
  const addWidget = useBoard((s) => s.addWidget);
  const [activeFilter, setActiveFilter]     = useState<Category | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<WidgetDefinition | null>(null);

  const visibleDefs = activeFilter
    ? WIDGET_REGISTRY.filter((d) => d.category === activeFilter)
    : WIDGET_REGISTRY;

  const browseH = cellSize + CHROME_BROWSE;

  function handleAdd(category: Category, widgetType: string, w: number, h: number) {
    addWidget(category, widgetType, w, h);
    onClose();
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {selectedWidget === null ? (
        <motion.div
          key="browse"
          className={styles.panel}
          style={{ height: browseH }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div className={styles.filters}>
              {CATEGORY_FILTERS.map((f) => (
                <button
                  key={f.label}
                  className={styles.filterChip}
                  data-active={activeFilter === f.value}
                  onClick={() => setActiveFilter(f.value)}
                  aria-label={`Filter: ${f.label}`}
                >
                  <f.Icon size={14} />
                  <span style={{ marginLeft: 4 }}>{f.label}</span>
                </button>
              ))}
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>

          <div className={styles.tileRow}>
            {visibleDefs.map((def) => (
              <BrowseTile
                key={def.type}
                definition={def}
                cellSize={cellSize}
                onSelect={() => setSelectedWidget(def)}
              />
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="picker"
          className={styles.panel}
          style={{ height: pickerHeight(selectedWidget, cellSize) }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.pickerHeader}>
            <button
              className={styles.backBtn}
              onClick={() => setSelectedWidget(null)}
              aria-label="Back to Widgets"
            >
              ← Widgets
            </button>
            <span className={styles.pickerTitle}>{selectedWidget.label}</span>
          </div>

          <div className={styles.sizeRow}>
            {selectedWidget.supportedSizes.map((size) => (
              <SizePickerTile
                key={size.name}
                definition={selectedWidget}
                size={size}
                cellSize={cellSize}
                gap={GRID_GAP}
                onAdd={(w, h) => handleAdd(selectedWidget.category, selectedWidget.type, w, h)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Run all WidgetCarousel tests**

```
npx vitest run components/shell/WidgetCarousel.test.tsx --reporter=verbose
```
Expected: all 5 tests PASS.

- [ ] **Step 5: Run the full test suite to check for regressions**

```
npx vitest run --reporter=verbose
```
Expected: all tests PASS. If `CarouselCard.test.tsx` fails because `CarouselCard` still exists but is now unused — that is fine; it is deleted in Task 6.

- [ ] **Step 6: Commit**

```bash
git add components/shell/WidgetCarousel.tsx components/shell/WidgetCarousel.test.tsx
git commit -m "feat: WidgetCarousel size-picker state — proportional tiles, height animation, click-to-add"
```

---

## Task 6: Delete `CarouselCard` and verify no remaining usages

**Files:**
- Delete: `components/shell/CarouselCard.tsx`
- Delete: `components/shell/CarouselCard.module.css`
- Delete: `components/shell/CarouselCard.test.tsx`

- [ ] **Step 1: Verify no remaining imports of `CarouselCard`**

```
npx tsc --noEmit 2>&1 | grep -i carousel
```

Also run:
```bash
grep -r "CarouselCard" components/ lib/ app/ --include="*.tsx" --include="*.ts"
```
Expected: no results (only the files about to be deleted should reference it).

- [ ] **Step 2: Delete the three files**

```bash
git rm components/shell/CarouselCard.tsx components/shell/CarouselCard.module.css components/shell/CarouselCard.test.tsx
```

- [ ] **Step 3: Run full test suite and type check**

```
npx vitest run --reporter=verbose
npx tsc --noEmit
```
Expected: all tests PASS, no type errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: delete CarouselCard — replaced by BrowseTile and SizePickerTile"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Full-width panel, flat bottom, rounded top → Task 1 (`Fab.module.css` `.panel`)
- [x] `cellSize` from `AppShell` → `Fab` → `WidgetCarousel` → Task 1
- [x] Browse state: filter chips + single scrolling row of 1×1 tiles at `cellSize` → Task 3
- [x] Tile label below → `BrowseTile.module.css` `.label`, Task 2
- [x] Accent bar → `BrowseTile` `.accentBar`, `SizePickerTile` `.accentBar`
- [x] Drag from browse = first supported size → `BrowseTile` `dragId` uses `supportedSizes[0]`
- [x] Click browse tile → size-picker → Task 3 + 5 (`onSelect` → `setSelectedWidget`)
- [x] Size-picker: back button, selected widget name → Task 3 + 5
- [x] Size-picker: proportional tiles → `SizePickerTile` width/height formula
- [x] Size-picker: tiles align to bottom edge → `WidgetCarousel.module.css` `.sizeRow { align-items: flex-end }`
- [x] Drag from size-picker = specific WxH → `SizePickerTile` `dragId`
- [x] Click size tile → `addWidget` + `onClose` → Task 5 `handleAdd`
- [x] Panel grows upward for size-picker → `pickerHeight()` + Framer Motion `layout` on outer `motion.div` in `Fab.tsx`
- [x] Height stays at browse height when maxVariantH=1 → `pickerHeight` formula: `1*cellSize + 0*gap + CHROME_PICKER` ≈ browse height (CHROME_PICKER is 4px taller than CHROME_BROWSE — a negligible difference; both use the same cell row)
- [x] `AnimatePresence mode="wait"` crossfade → Task 3 + 5
- [x] `setFabOpen(false)` on drop preserved → unchanged in `AppShell.tsx`
- [x] Delete `CarouselCard` → Task 6

**Type consistency check:**
- `BrowseTile` props: `definition: WidgetDefinition, onSelect: () => void, cellSize: number` ✓ used in Task 3
- `SizePickerTile` props: `definition: WidgetDefinition, size: SizePreset, onAdd: (w,h)=>void, cellSize: number, gap: number` ✓ used in Task 5
- `WidgetCarousel` props: `cellSize: number, onClose: () => void` ✓ matches `Fab.tsx` call site in Task 1
- `handleAdd` in `WidgetCarousel` signature: `(category: Category, widgetType: string, w: number, h: number)` ✓ matches `boardStore.addWidget` signature
- `pickerHeight(def, cellSize)` returns `number` ✓ used as `style={{ height: pickerHeight(...) }}`
