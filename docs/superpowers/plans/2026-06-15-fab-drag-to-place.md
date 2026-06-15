# FAB Drag-to-Place & Scaled Previews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "tap `+` → menu opens → drag a widget card onto the board" work end-to-end, with full live reflow during the drag and a scaled placeholder preview in the menu.

**Architecture:** Route palette drags through the same `dragState` pipeline the board-tile drags already use (a temp widget injected via `strategy.preview(committed, { kind:'add', widget })`), so reflow + ghost + overlay come for free. Make the whole carousel card the drag unit. Extract the duplicated em-scaling content wrapper into one `ScaledWidgetContent` seam shared by the board tile, the drag overlay, and the menu card. Delete the half-built `palettePreview` path.

**Tech Stack:** Next.js 16 / React 19, `@dnd-kit/core` 6, `motion` 12, `zustand` 5, Vitest 2 + Testing Library, CSS Modules.

**Reference spec:** `docs/superpowers/specs/2026-06-15-fab-drag-to-place-design.md`

**Conventions in this repo:**
- Tests are colocated (`Foo.tsx` + `Foo.test.tsx`). Run a single file with `npx vitest run <path>`. Run all with `npm test`.
- Commit messages use Conventional Commits (`feat:`, `refactor:`, `test:`, `chore:`). End each commit body with the `Co-Authored-By` trailer shown in Step "Commit" blocks.
- Each task ends green: `npm test` passes and the app compiles.

---

## File Structure

**New:**
- `components/widgets/ScaledWidgetContent.tsx` — the single em-scaling content seam (`{ category, w, h, ContentComponent }` → absolutely-positioned wrapper with the `font-size` clamp tied to `--cell-size`).
- `components/widgets/ScaledWidgetContent.test.tsx` — unit test for the seam.

**Modified:**
- `components/board/Widget.tsx` — render `ScaledWidgetContent` instead of the inline wrapper.
- `components/board/DragOverlayWidget.tsx` — render `ScaledWidgetContent` instead of the inline wrapper.
- `components/shell/CarouselCard.tsx` — whole card draggable at the default size; chips become click-only; preview shows the scaled placeholder; `metrics` prop removed.
- `components/shell/CarouselCard.test.tsx` — drop `metrics` prop; click the size chip by role (no `data-dragging`).
- `components/shell/WidgetCarousel.tsx` — remove `STUB_METRICS` and the `metrics` prop plumbing.
- `components/shell/AppShell.tsx` — palette drag routed through `dragState` with live reflow + drop-inside-board bounds check; stop using `palettePreview`/`paletteActiveId`.
- `components/board/BentoBoard.tsx` — remove the `palettePreview` `DropPreview` block and the now-unused `useDragStore` import.
- `lib/state/dragStore.ts` — remove dead `activeId`/`preview`/`palettePreview` (+ setters + `PalettePreview`); keep only `fabOpen`/`setFabOpen`.
- `lib/state/dragStore.test.ts` — test only `fabOpen`.

**Task order (each commit leaves working software):**
1. Extract `ScaledWidgetContent` (board tile + overlay refactor).
2. Carousel card becomes the drag unit + scaled preview (drag still works via the old `palettePreview` path → footprint-only).
3. Route palette drag through `dragState` (live reflow) + remove the `BentoBoard` palette block.
4. `dragStore` cleanup.

---

## Task 1: Extract `ScaledWidgetContent` seam

The em-scaling wrapper `<div style={{ position:'absolute', inset:0, fontSize:'clamp(8px, calc(var(--cell-size,100px)/10), 14px)' }}><ContentComponent .../></div>` is duplicated in `Widget.tsx` and `DragOverlayWidget.tsx`. Extract it so the menu card (Task 2) can reuse it and the future content redesign has one seam.

**Files:**
- Create: `components/widgets/ScaledWidgetContent.tsx`
- Test: `components/widgets/ScaledWidgetContent.test.tsx`
- Modify: `components/board/Widget.tsx`
- Modify: `components/board/DragOverlayWidget.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/widgets/ScaledWidgetContent.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScaledWidgetContent } from './ScaledWidgetContent';
import type { WidgetContentProps } from './WidgetSkeleton';

function Stub({ category, w, h }: WidgetContentProps) {
  return <div data-testid="stub">{`${category}-${w}x${h}`}</div>;
}

describe('ScaledWidgetContent', () => {
  it('renders the given ContentComponent with category and size', () => {
    render(<ScaledWidgetContent category="finance" w={2} h={3} ContentComponent={Stub} />);
    expect(screen.getByTestId('stub').textContent).toBe('finance-2x3');
  });

  it('applies the cell-size-relative font-size clamp on its wrapper', () => {
    render(<ScaledWidgetContent category="health" w={1} h={1} ContentComponent={Stub} />);
    const wrapper = screen.getByTestId('stub').parentElement!;
    expect(wrapper.style.fontSize).toContain('var(--cell-size');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/widgets/ScaledWidgetContent.test.tsx`
Expected: FAIL — cannot resolve `./ScaledWidgetContent`.

- [ ] **Step 3: Create the component**

Create `components/widgets/ScaledWidgetContent.tsx`:

```tsx
import type { CSSProperties, ComponentType } from 'react';
import type { WidgetContentProps } from './WidgetSkeleton';
import type { Category } from '@/lib/grid/types';

interface ScaledWidgetContentProps {
  category: Category;
  w: number;
  h: number;
  ContentComponent: ComponentType<WidgetContentProps>;
}

// Single em-scaling seam: content authored in em units scales with the
// ancestor's `--cell-size`. Used by the board tile, the drag overlay, and
// the carousel card. When real widget content replaces the skeleton, this
// is the only place that wiring lives.
export function ScaledWidgetContent({ category, w, h, ContentComponent }: ScaledWidgetContentProps) {
  const style: CSSProperties = {
    position: 'absolute',
    inset: 0,
    fontSize: 'clamp(8px, calc(var(--cell-size, 100px) / 10), 14px)',
  };
  return (
    <div style={style}>
      <ContentComponent category={category} w={w} h={h} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/widgets/ScaledWidgetContent.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Refactor `Widget.tsx` to use the seam**

In `components/board/Widget.tsx`, add the import near the other component imports:

```tsx
import { ScaledWidgetContent } from '@/components/widgets/ScaledWidgetContent';
```

Replace this block (currently lines ~68-70):

```tsx
      <div style={{ position: 'absolute', inset: 0, fontSize: 'clamp(8px, calc(var(--cell-size, 100px) / 10), 14px)' }}>
        <ContentComponent category={widget.category} w={widget.w} h={widget.h} />
      </div>
```

with:

```tsx
      <ScaledWidgetContent
        category={widget.category}
        w={widget.w}
        h={widget.h}
        ContentComponent={ContentComponent}
      />
```

Leave the existing `const ContentComponent = def?.ContentComponent ?? WidgetSkeleton;` line unchanged.

- [ ] **Step 6: Refactor `DragOverlayWidget.tsx` to use the seam**

Rewrite `components/board/DragOverlayWidget.tsx` to:

```tsx
'use client';
import type { CSSProperties } from 'react';
import styles from './Widget.module.css';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import { ScaledWidgetContent } from '@/components/widgets/ScaledWidgetContent';
import type { WidgetLayout } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';
import { cellSpanToPixels } from '@/lib/grid/collision';

export function DragOverlayWidget({ widget, metrics }: { widget: WidgetLayout; metrics: GridMetrics }) {
  const { width, height } = cellSpanToPixels(widget.w, widget.h, metrics);
  const def = WIDGET_REGISTRY.find((d) => d.type === widget.widgetType);
  const ContentComponent = def?.ContentComponent ?? WidgetSkeleton;
  return (
    <div
      className={`${styles.tile} glass`}
      style={{
        width,
        height,
        cursor: 'grabbing',
        transform: 'scale(1.03)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
        '--cell-size': `${metrics.cellSize}px`,
      } as CSSProperties}
    >
      <ScaledWidgetContent category={widget.category} w={widget.w} h={widget.h} ContentComponent={ContentComponent} />
    </div>
  );
}
```

- [ ] **Step 7: Run the full suite to verify nothing broke**

Run: `npm test`
Expected: PASS (all existing tests + the 2 new ones).

- [ ] **Step 8: Commit**

```bash
git add components/widgets/ScaledWidgetContent.tsx components/widgets/ScaledWidgetContent.test.tsx components/board/Widget.tsx components/board/DragOverlayWidget.tsx
git commit -m "$(cat <<'EOF'
refactor: extract ScaledWidgetContent em-scaling seam

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Carousel card becomes the drag unit + scaled preview

Make the whole `CarouselCard` draggable at the widget's default size (`supportedSizes[0]`). The `PointerSensor`'s 4px activation distance means a click still toggles the size picker while a >4px drag starts the palette drag. Size chips lose their drag and become click-only. The card preview renders the scaled placeholder via `ScaledWidgetContent`. Remove the unused `metrics` prop / `STUB_METRICS`.

After this task the drag still routes through the *existing* `AppShell` palette path (footprint-only preview) — Task 3 upgrades it to live reflow.

**Files:**
- Modify: `components/shell/CarouselCard.tsx`
- Modify: `components/shell/CarouselCard.test.tsx`
- Modify: `components/shell/WidgetCarousel.tsx`

- [ ] **Step 1: Update the test for the new contract**

Rewrite `components/shell/CarouselCard.test.tsx` to:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { CarouselCard } from './CarouselCard';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';

const def = WIDGET_REGISTRY.find((d) => d.type === 'budget-summary')!;

function Wrapper({ children }: { children: React.ReactNode }) {
  return <DndContext>{children}</DndContext>;
}

describe('CarouselCard', () => {
  it('renders the card label', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} isOpen={false} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByText('Budget Summary')).toBeDefined();
  });

  it('calls onToggle when the card preview is clicked', async () => {
    const onToggle = vi.fn();
    render(
      <Wrapper>
        <CarouselCard definition={def} isOpen={false} onToggle={onToggle} onAdd={vi.fn()} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Budget Summary/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('shows size chips when isOpen is true', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} isOpen={true} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.getByRole('button', { name: '1×1' })).toBeDefined();
    expect(screen.getByRole('button', { name: '2×2' })).toBeDefined();
  });

  it('hides size chips when isOpen is false', () => {
    render(
      <Wrapper>
        <CarouselCard definition={def} isOpen={false} onToggle={vi.fn()} onAdd={vi.fn()} />
      </Wrapper>,
    );
    expect(screen.queryByRole('button', { name: '1×1' })).toBeNull();
  });

  it('calls onAdd with correct w,h when a size chip is clicked', async () => {
    const onAdd = vi.fn();
    render(
      <Wrapper>
        <CarouselCard definition={def} isOpen={true} onToggle={vi.fn()} onAdd={onAdd} />
      </Wrapper>,
    );
    await userEvent.click(screen.getByRole('button', { name: '2×2' }));
    expect(onAdd).toHaveBeenCalledWith(2, 2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/shell/CarouselCard.test.tsx`
Expected: FAIL — TypeScript/runtime error because `CarouselCard` still requires the `metrics` prop and the size chip still carries `data-dragging` (the new label-only assertions may also mismatch).

- [ ] **Step 3: Rewrite `CarouselCard.tsx`**

Replace the entire contents of `components/shell/CarouselCard.tsx` with:

```tsx
'use client';
import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useDraggable } from '@dnd-kit/core';
import styles from './CarouselCard.module.css';
import { ScaledWidgetContent } from '@/components/widgets/ScaledWidgetContent';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import type { WidgetDefinition } from '@/lib/widgets/registry';
import type { SizePreset } from '@/lib/grid/sizes';

// Cell size (px) used to scale the placeholder preview inside the menu card.
// Smaller than a board cell so the widget reads as a shrunk-down tile.
const MENU_PREVIEW_CELL = 34;

interface SizeChipProps {
  preset: SizePreset;
  onAdd: (w: number, h: number) => void;
}

function SizeChip({ preset, onAdd }: SizeChipProps) {
  return (
    <button
      type="button"
      className={styles.sizeChip}
      onClick={() => onAdd(preset.w, preset.h)}
    >
      {preset.name}
    </button>
  );
}

export interface CarouselCardProps {
  definition: WidgetDefinition;
  isOpen: boolean;
  onToggle: () => void;
  onAdd: (w: number, h: number) => void;
}

export function CarouselCard({ definition, isOpen, onToggle, onAdd }: CarouselCardProps) {
  // The whole card is the drag unit; default size is the first supported size.
  const defaultSize = definition.supportedSizes[0];
  const dragId = `palette:${definition.category}:${definition.type}:${defaultSize.w}x${defaultSize.h}`;
  const { listeners, attributes, setNodeRef, isDragging } = useDraggable({ id: dragId });
  const ContentComponent = definition.ContentComponent ?? WidgetSkeleton;

  return (
    <div className={styles.card}>
      <button
        ref={setNodeRef}
        type="button"
        className={styles.preview}
        style={{ '--cell-size': `${MENU_PREVIEW_CELL}px` } as CSSProperties}
        data-dragging={isDragging}
        onClick={() => { if (!isDragging) onToggle(); }}
        aria-expanded={isOpen}
        aria-label={definition.label}
        {...listeners}
        {...attributes}
      >
        <ScaledWidgetContent
          category={definition.category}
          w={defaultSize.w}
          h={defaultSize.h}
          ContentComponent={ContentComponent}
        />
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
                <SizeChip key={preset.name} preset={preset} onAdd={onAdd} />
              ))}
            </div>
            <span className={styles.hint}>click to add · drag card to place</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Drop `STUB_METRICS` / `metrics` from `WidgetCarousel.tsx`**

In `components/shell/WidgetCarousel.tsx`:

Remove the now-unused import line:

```tsx
import type { GridMetrics } from '@/lib/grid/collision';
```

Remove the constant:

```tsx
const STUB_METRICS: GridMetrics = { cellSize: 80, gap: 12, cols: 6 };
```

Change the `CarouselCard` usage from:

```tsx
            <CarouselCard
              key={def.type}
              definition={def}
              metrics={STUB_METRICS}
              isOpen={selectedType === def.type}
              onToggle={() => setSelectedType(selectedType === def.type ? null : def.type)}
              onAdd={(w, h) => handleAdd(def.category, def.type, w, h)}
            />
```

to:

```tsx
            <CarouselCard
              key={def.type}
              definition={def}
              isOpen={selectedType === def.type}
              onToggle={() => setSelectedType(selectedType === def.type ? null : def.type)}
              onAdd={(w, h) => handleAdd(def.category, def.type, w, h)}
            />
```

- [ ] **Step 5: Run the card + carousel tests**

Run: `npx vitest run components/shell/CarouselCard.test.tsx components/shell/WidgetCarousel.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/shell/CarouselCard.tsx components/shell/CarouselCard.test.tsx components/shell/WidgetCarousel.tsx
git commit -m "$(cat <<'EOF'
feat: make carousel card the drag unit with scaled preview

Card drags at its default (first supported) size; size chips are
click-to-add only. Preview renders the scaled placeholder via
ScaledWidgetContent. Drops STUB_METRICS plumbing.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Route palette drag through `dragState` (live reflow) + remove `BentoBoard` palette block

Replace the separate `palettePreview` path with the board-tile pipeline: a palette drag becomes a temp widget injected via `strategy.preview(committed, { kind:'add', widget })`, so existing widgets reflow live and the ghost/overlay render from `previewLayout`. Add a drop-inside-board bounds check.

**Files:**
- Modify: `components/shell/AppShell.tsx`
- Modify: `components/board/BentoBoard.tsx`

This task is verified manually (pointer-level dnd-kit interactions are too low-level for jsdom). Keep `npm test` green throughout.

- [ ] **Step 1: Rewrite the palette branches in `AppShell.tsx`**

In `components/shell/AppShell.tsx`:

(a) Remove the `paletteActiveId` state and the `setPalettePreview` destructure. Change:

```tsx
  const { setPalettePreview, setFabOpen } = useDragStore();
```

to:

```tsx
  const setFabOpen = useDragStore((s) => s.setFabOpen);
```

and delete this line:

```tsx
  const [paletteActiveId, setPaletteActiveId] = useState<string | null>(null);
```

(b) Replace the `paletteInfo` / `activeWidget` derivation:

```tsx
  const paletteInfo = paletteActiveId ? parsePaletteId(paletteActiveId) : null;
  const activeWidget: WidgetLayout | null = paletteInfo
    ? { id: paletteActiveId!, x: 0, y: 0, w: paletteInfo.w, h: paletteInfo.h, category: paletteInfo.cat, widgetType: paletteInfo.widgetType, order: 0 }
    : dragState.phase === 'dragging'
      ? dragState.previewLayout.find((w) => w.id === dragState.activeId) ?? null
      : null;
```

with:

```tsx
  const paletteInfo =
    dragState.phase === 'dragging' && dragState.activeId.startsWith('palette:')
      ? parsePaletteId(dragState.activeId)
      : null;
  const activeWidget: WidgetLayout | null = paletteInfo
    ? { id: dragState.activeId, x: 0, y: 0, w: paletteInfo.w, h: paletteInfo.h, category: paletteInfo.cat, widgetType: paletteInfo.widgetType, order: 0 }
    : dragState.phase === 'dragging'
      ? dragState.previewLayout.find((w) => w.id === dragState.activeId) ?? null
      : null;
```

Note: `dragState.activeId` is non-null inside the `phase === 'dragging'` guard, so no `!` is needed.

(c) Replace the palette branch of `handleDragStart`. Change:

```tsx
    if (id.startsWith('palette:')) {
      setPaletteActiveId(id);
      return;
    }
```

to:

```tsx
    if (id.startsWith('palette:')) {
      const parsed = parsePaletteId(id);
      if (!parsed) return;
      // Seed previewLayout as committed; the first move computes the add-preview
      // (temp widget) so existing widgets reflow around the landing spot.
      setDragState({ phase: 'dragging', activeId: id, targetKind: 'none', previewLayout: committed });
      return;
    }
```

(d) Replace the palette branch of `handleDragMove`. Change:

```tsx
    if (id.startsWith('palette:')) {
      const board = boardRef.current;
      const rect = e.active.rect.current.translated;
      if (!board || !rect) return;
      const b = board.getBoundingClientRect();
      const cell = pointToCell(rect.left - b.left, rect.top - b.top, metrics);
      const parsed = parsePaletteId(id);
      if (!parsed) return;
      setPalettePreview({ x: cell.x, y: cell.y, w: parsed.w, h: parsed.h, category: parsed.cat });
      return;
    }
```

to:

```tsx
    if (id.startsWith('palette:')) {
      const parsed = parsePaletteId(id);
      const board = boardRef.current;
      const rect = e.active.rect.current.translated;
      if (!parsed || !board || !rect) return;
      const b = board.getBoundingClientRect();
      const cell = pointToCell(rect.left - b.left, rect.top - b.top, metrics);
      const order = committed.reduce((max, x) => Math.max(max, x.order), -1) + 1;
      const temp: WidgetLayout = {
        id,
        x: cell.x,
        y: cell.y,
        w: parsed.w,
        h: parsed.h,
        category: parsed.cat,
        widgetType: parsed.widgetType,
        order,
      };
      const previewLayout = getStrategy(layoutMode).preview(committed, { kind: 'add', widget: temp });
      setDragState({ phase: 'dragging', activeId: id, targetKind: 'insert', previewLayout });
      return;
    }
```

(e) Replace the palette branch of `handleDragEnd`. Change:

```tsx
    if (id.startsWith('palette:')) {
      const parsed = parsePaletteId(id);
      if (parsed) {
        const pp = useDragStore.getState().palettePreview;
        addWidget(parsed.cat, parsed.widgetType, parsed.w, parsed.h, pp ? { x: pp.x, y: pp.y } : undefined);
        setFabOpen(false);
      }
      setPaletteActiveId(null);
      setPalettePreview(null);
      return;
    }
```

to:

```tsx
    if (id.startsWith('palette:')) {
      const parsed = parsePaletteId(id);
      const board = boardRef.current;
      const rect = e.active.rect.current.translated;
      // Only commit if the dragged card's center is inside the board.
      let inside = false;
      if (board && rect) {
        const b = board.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        inside = cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom;
      }
      const placed =
        dragState.phase === 'dragging'
          ? dragState.previewLayout.find((w) => w.id === id)
          : null;
      if (parsed && inside && placed) {
        addWidget(parsed.cat, parsed.widgetType, parsed.w, parsed.h, { x: placed.x, y: placed.y });
        setFabOpen(false);
      }
      setDragState({ phase: 'idle' });
      return;
    }
```

(f) Simplify the palette handling in `handleDragCancel`. Change:

```tsx
  function handleDragCancel() {
    setDragState({ phase: 'idle' });
    setPaletteActiveId(null);
    setPalettePreview(null);
  }
```

to:

```tsx
  function handleDragCancel() {
    setDragState({ phase: 'idle' });
  }
```

- [ ] **Step 2: Remove the palette block from `BentoBoard.tsx`**

In `components/board/BentoBoard.tsx`:

Delete the import:

```tsx
import { useDragStore } from '@/lib/state/dragStore';
```

Delete the selector line:

```tsx
  const palettePreview = useDragStore((s) => s.palettePreview);
```

Delete the trailing block (currently lines ~228-240):

```tsx
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
```

The remaining `activeWidget` `DropPreview` block already renders the landing ghost for palette drags now that they flow through `dragState` (the temp widget is in `previewLayout`, `targetKind === 'insert'`).

- [ ] **Step 3: Run the full suite**

Run: `npm test`
Expected: PASS (no test asserts the removed palette behavior; `dragStore` still exposes `palettePreview` until Task 4, so nothing fails to compile).

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open the app, then:
1. Click the `+` FAB → carousel opens.
2. Press-drag a widget **card** onto the board. Confirm: existing widgets reflow live as you move, and a ghost footprint marks the landing spot.
3. Release over the board → the widget is added at the previewed spot and the carousel closes.
4. Open the carousel again, start a card drag, release **outside** the board → nothing is added and the carousel stays open.
5. Click (no drag) a card → its size picker still expands; clicking a size chip adds at that size and closes the carousel.

Expected: all five behave as described.

- [ ] **Step 5: Commit**

```bash
git add components/shell/AppShell.tsx components/board/BentoBoard.tsx
git commit -m "$(cat <<'EOF'
feat: live reflow when dragging widgets from the FAB onto the board

Route palette drags through the board-tile dragState pipeline (temp
widget via strategy add-preview) for live reflow + landing ghost.
Add a drop-inside-board bounds check. Remove the palettePreview path.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `dragStore` cleanup

`activeId` / `preview` / `palettePreview` (and their setters and the `PalettePreview` interface) are now dead — only `fabOpen` / `setFabOpen` are used. Remove the rest.

**Files:**
- Modify: `lib/state/dragStore.ts`
- Modify: `lib/state/dragStore.test.ts`

- [ ] **Step 1: Trim the test to `fabOpen` only**

Replace the entire contents of `lib/state/dragStore.test.ts` with:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { useDragStore } from './dragStore';

describe('dragStore', () => {
  beforeEach(() => {
    useDragStore.setState({ fabOpen: false });
  });

  it('initialises with fabOpen false', () => {
    expect(useDragStore.getState().fabOpen).toBe(false);
  });

  it('setFabOpen toggles fabOpen', () => {
    useDragStore.getState().setFabOpen(true);
    expect(useDragStore.getState().fabOpen).toBe(true);
    useDragStore.getState().setFabOpen(false);
    expect(useDragStore.getState().fabOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/state/dragStore.test.ts`
Expected: PASS actually is possible here since the store still has `fabOpen`; but the old fields are still present. To make this a real red→green, first confirm the suite is green, then proceed to trim the store. (If you prefer strict TDD, temporarily assert `expect('activeId' in useDragStore.getState()).toBe(false)` to see it fail, then remove that line after Step 3.)

- [ ] **Step 3: Trim `dragStore.ts`**

Replace the entire contents of `lib/state/dragStore.ts` with:

```tsx
import { create } from 'zustand';

interface DragStore {
  fabOpen: boolean;
  setFabOpen: (v: boolean) => void;
}

export const useDragStore = create<DragStore>()((set) => ({
  fabOpen: false,
  setFabOpen: (fabOpen) => set({ fabOpen }),
}));
```

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: PASS. (If anything references the removed fields, the failure names the file — there should be none after Tasks 1-3.)

- [ ] **Step 5: Type-check the build**

Run: `npx tsc --noEmit`
Expected: no errors. (Catches any lingering reference to `palettePreview` / `setPalettePreview` / `activeId` / `preview` / `PalettePreview`.)

- [ ] **Step 6: Commit**

```bash
git add lib/state/dragStore.ts lib/state/dragStore.test.ts
git commit -m "$(cat <<'EOF'
chore: trim dragStore to fabOpen only

Remove dead activeId/preview/palettePreview state now that palette
drags flow through AppShell dragState.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

- [ ] Run `npm test` — all green.
- [ ] Run `npx tsc --noEmit` — no type errors.
- [ ] Run `npm run dev` and re-confirm the five manual checks from Task 3, Step 4.
- [ ] `grep -rn "palettePreview\|paletteActiveId\|STUB_METRICS" components lib` returns nothing.

---

## Spec coverage map

| Spec section | Task |
|--------------|------|
| §3.1 Unify palette drag into board pipeline; remove `palettePreview` | Task 3 (+ Task 4 store trim) |
| §3.2 Whole card is the drag unit; chips click-only; default = `supportedSizes[0]` | Task 2 |
| §3.3 Extract `ScaledWidgetContent`; 3 consumers; menu `--cell-size` | Task 1 (+ Task 2 menu consumer) |
| §4 AppShell palette handlers (start/move/end/cancel) + bounds check | Task 3 |
| §5 Files | Tasks 1-4 |
| §6 Testing (`ScaledWidgetContent`, `CarouselCard`, routing, manual reflow) | Tasks 1-3 |
| §7 Out of scope — `defaultSize` registry field, auto-scroll, kbd/touch | not implemented (intentional) |
