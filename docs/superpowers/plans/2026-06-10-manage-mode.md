# Manage Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a transient, button-toggled "manage mode" to the bento dashboard that surfaces a floating per-tile delete control, plus an always-on "smart" left-bar filter whose chips derive from the tags currently in use.

**Architecture:** A new pure module (`lib/grid/categories.ts`) derives the in-use category set and reconciles the active filter; a new non-persisted Zustand store (`lib/state/uiStore.ts`) holds the `manageMode` flag. `boardStore.removeWidget` gains a reconciliation step. The shell (`LeftBar`) and board (`Widget`, `BentoBoard`) read these to render the toggle and the delete ×. Manage mode is purely additive — drag/resize stay always-on.

**Tech Stack:** Next.js (App Router), TypeScript, React, `@dnd-kit/core`, `motion`, `zustand`, CSS Modules; Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-10-manage-mode-design.md`

**Prerequisite:** The bento dashboard skeleton (`docs/superpowers/plans/2026-06-10-bento-dashboard-skeleton.md`) must be implemented first. This plan resolves that skeleton's `TODO(manage-mode)` stubs in `components/board/Widget.tsx` and `components/board/BentoBoard.tsx`, and amends its `LeftBar` (skeleton Task 13).

**Conventions:** TDD for pure helpers and stores (write failing test → run red → implement → run green → commit). UI tasks use a render/interaction test plus explicit manual-validation steps. Commit after every task. Import alias: `@/*` → repo root.

---

## File map

```
lib/grid/categories.ts          (new)  CATEGORY_ORDER, presentCategories, reconcileActiveTags
lib/grid/categories.test.ts     (new)
lib/state/uiStore.ts            (new)  useUi: manageMode flag (NOT persisted)
lib/state/uiStore.test.ts       (new)
lib/state/boardStore.ts         (modify) removeWidget reconciles activeTags
lib/state/boardStore.test.ts    (modify) add reconciliation tests
components/shell/LeftBar.tsx     (modify) derived chips + manage toggle
components/shell/LeftBar.module.css (modify) .manageToggle style
components/shell/LeftBar.test.tsx (modify) add derived-chips + toggle tests
components/shell/Fab.tsx          (modify) import CATEGORY_ORDER (DRY)
components/board/Widget.tsx       (modify) floating × delete button (resolves TODO(manage-mode))
components/board/Widget.module.css (modify) .close style
components/board/Widget.test.tsx  (new)  × visibility + delete + no-drag-on-× 
components/board/BentoBoard.tsx   (modify) read manageMode, pass to Widget (resolves TODO(manage-mode))
```

---

## Task 1: Categories module (derive + reconcile)

**Files:**
- Create: `lib/grid/categories.ts`
- Test: `lib/grid/categories.test.ts`
- Modify: `components/shell/Fab.tsx` (DRY: import `CATEGORY_ORDER`)

- [ ] **Step 1: Write the failing test `lib/grid/categories.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { CATEGORY_ORDER, presentCategories, reconcileActiveTags } from './categories';
import type { WidgetLayout } from './types';

const w = (id: string, category: WidgetLayout['category']): WidgetLayout => ({
  id, x: 0, y: 0, w: 1, h: 1, category, order: 0,
});

describe('categories', () => {
  it('exposes the four canonical categories in order', () => {
    expect(CATEGORY_ORDER).toEqual(['finance', 'lifestyle', 'health', 'calendar']);
  });

  it('presentCategories returns in-use categories in canonical order', () => {
    const widgets = [w('a', 'health'), w('b', 'finance'), w('c', 'health')];
    expect(presentCategories(widgets)).toEqual(['finance', 'health']);
  });

  it('presentCategories returns [] for an empty board', () => {
    expect(presentCategories([])).toEqual([]);
  });

  it('reconcileActiveTags drops tags no longer present', () => {
    expect(reconcileActiveTags(['health', 'finance'], ['finance'])).toEqual(['finance']);
  });

  it('reconcileActiveTags keeps all present tags and handles empty inputs', () => {
    expect(reconcileActiveTags(['finance'], ['finance', 'health'])).toEqual(['finance']);
    expect(reconcileActiveTags([], ['finance'])).toEqual([]);
    expect(reconcileActiveTags(['health'], [])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- categories`
Expected: FAIL — cannot resolve `./categories`.

- [ ] **Step 3: Write `lib/grid/categories.ts`**

```ts
import type { Category, WidgetLayout } from './types';

export const CATEGORY_ORDER: Category[] = ['finance', 'lifestyle', 'health', 'calendar'];

export function presentCategories(widgets: WidgetLayout[]): Category[] {
  return CATEGORY_ORDER.filter((c) => widgets.some((w) => w.category === c));
}

export function reconcileActiveTags(activeTags: Category[], present: Category[]): Category[] {
  return activeTags.filter((t) => present.includes(t));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- categories`
Expected: PASS (5 tests).

- [ ] **Step 5: Refactor `components/shell/Fab.tsx` to use `CATEGORY_ORDER` (DRY)**

In `components/shell/Fab.tsx`, remove the local declaration:
```tsx
const CATEGORIES: Category[] = ['finance', 'lifestyle', 'health', 'calendar'];
```
Add an import near the other `@/lib` imports:
```tsx
import { CATEGORY_ORDER } from '@/lib/grid/categories';
```
Then replace the one usage `{CATEGORIES.map((c) => (` with:
```tsx
{CATEGORY_ORDER.map((c) => (
```
(The `import type { Category }` line stays — `Category` is still used for the `useState<Category>` type.)

- [ ] **Step 6: Verify the suite still passes**

Run: `npm run test`
Expected: all suites PASS (no regression in the Fab path; categories green).

- [ ] **Step 7: Commit**

```bash
git add lib/grid/categories.ts lib/grid/categories.test.ts components/shell/Fab.tsx
git commit -m "feat: category-derivation helpers (smart filter source of truth)"
```

---

## Task 2: UI store (manage-mode flag)

**Files:**
- Create: `lib/state/uiStore.ts`
- Test: `lib/state/uiStore.test.ts`

- [ ] **Step 1: Write the failing test `lib/state/uiStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useUi } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => useUi.setState({ manageMode: false }));

  it('defaults manageMode to false', () => {
    expect(useUi.getState().manageMode).toBe(false);
  });

  it('toggleManageMode flips the flag', () => {
    useUi.getState().toggleManageMode();
    expect(useUi.getState().manageMode).toBe(true);
    useUi.getState().toggleManageMode();
    expect(useUi.getState().manageMode).toBe(false);
  });

  it('setManageMode sets the flag explicitly', () => {
    useUi.getState().setManageMode(true);
    expect(useUi.getState().manageMode).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- uiStore`
Expected: FAIL — cannot resolve `./uiStore`.

- [ ] **Step 3: Write `lib/state/uiStore.ts`**

```ts
import { create } from 'zustand';

interface UiState {
  manageMode: boolean;
  setManageMode: (on: boolean) => void;
  toggleManageMode: () => void;
}

// Transient UI state — deliberately NOT persisted (a reload should never
// land the user inside manage mode).
export const useUi = create<UiState>((set) => ({
  manageMode: false,
  setManageMode: (manageMode) => set({ manageMode }),
  toggleManageMode: () => set((s) => ({ manageMode: !s.manageMode })),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- uiStore`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/state/uiStore.ts lib/state/uiStore.test.ts
git commit -m "feat: non-persisted UI store for manage mode flag"
```

---

## Task 3: boardStore.removeWidget reconciles the filter

**Files:**
- Modify: `lib/state/boardStore.ts`
- Test: `lib/state/boardStore.test.ts` (add cases)

- [ ] **Step 1: Add failing tests to `lib/state/boardStore.test.ts`**

Append these cases inside the existing `describe('boardStore', ...)` block (the file's `beforeEach` already resets `layoutMode` to `'autoPack'` and clears widgets):

```ts
  it('prunes activeTags when the last widget of an active tag is removed', () => {
    useSettings.setState({ activeTags: ['finance', 'health'] });
    useBoard.getState().addWidget('finance', 1, 1);
    useBoard.getState().addWidget('health', 1, 1);
    const healthId = useBoard.getState().widgets.find((w) => w.category === 'health')!.id;
    useBoard.getState().removeWidget(healthId);
    expect(useSettings.getState().activeTags).toEqual(['finance']);
  });

  it('leaves activeTags untouched when the removed widget tag still has siblings', () => {
    useSettings.setState({ activeTags: ['finance'] });
    useBoard.getState().addWidget('finance', 1, 1);
    useBoard.getState().addWidget('finance', 1, 1);
    const id = useBoard.getState().widgets[0].id;
    useBoard.getState().removeWidget(id);
    expect(useSettings.getState().activeTags).toEqual(['finance']);
  });
```

Ensure `useSettings` is imported at the top of the test file (the skeleton test already imports it):
```ts
import { useSettings } from './settingsStore';
```

- [ ] **Step 2: Run tests to verify the new cases fail**

Run: `npm run test -- boardStore`
Expected: FAIL — the two new cases fail because `removeWidget` does not yet touch `activeTags` (the first expects `['finance']` but gets `['finance','health']`).

- [ ] **Step 3: Update `removeWidget` in `lib/state/boardStore.ts`**

Add the import near the existing `@/lib/grid` imports:
```ts
import { presentCategories, reconcileActiveTags } from '@/lib/grid/categories';
```

Replace the existing `removeWidget` action:
```ts
      removeWidget: (id) =>
        set({ widgets: strategy().preview(get().widgets, { kind: 'remove', id }) }),
```
with:
```ts
      removeWidget: (id) => {
        const widgets = strategy().preview(get().widgets, { kind: 'remove', id });
        set({ widgets });
        // Smart filter: if that was the last widget of a tag the user is
        // filtering on, drop the now-empty tag so the filter can't stick.
        const { activeTags } = useSettings.getState();
        const reconciled = reconcileActiveTags(activeTags, presentCategories(widgets));
        if (reconciled.length !== activeTags.length) {
          useSettings.setState({ activeTags: reconciled });
        }
      },
```
(`useSettings` is already imported in `boardStore.ts` for the strategy selector.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- boardStore`
Expected: PASS (all prior cases plus the 2 new ones).

- [ ] **Step 5: Commit**

```bash
git add lib/state/boardStore.ts lib/state/boardStore.test.ts
git commit -m "feat: reconcile active filter tags on widget removal"
```

---

## Task 4: LeftBar — derived chips + manage toggle

**Files:**
- Modify: `components/shell/LeftBar.tsx`
- Modify: `components/shell/LeftBar.module.css`
- Test: `components/shell/LeftBar.test.tsx` (add cases)

- [ ] **Step 1: Add the `.manageToggle` style to `components/shell/LeftBar.module.css`**

Append:
```css
.manageToggle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s ease;
}
.manageToggle:hover {
  color: var(--text);
}
.manageToggle[data-active='true'] {
  border-color: var(--accent);
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}
```

- [ ] **Step 2: Rewrite `components/shell/LeftBar.tsx`**

Replace the whole file with:
```tsx
'use client';
import styles from './LeftBar.module.css';
import { useSettings } from '@/lib/state/settingsStore';
import { useUi } from '@/lib/state/uiStore';
import { useBoard } from '@/lib/state/boardStore';
import { presentCategories } from '@/lib/grid/categories';
import type { Category } from '@/lib/grid/types';

const SHORT: Record<Category, string> = { finance: 'Fin', lifestyle: 'Life', health: 'Health', calendar: 'Cal' };

export function LeftBar() {
  const activeTags = useSettings((s) => s.activeTags);
  const toggleTag = useSettings((s) => s.toggleTag);
  const manageMode = useUi((s) => s.manageMode);
  const toggleManageMode = useUi((s) => s.toggleManageMode);
  const widgets = useBoard((s) => s.widgets);
  const availableTags = presentCategories(widgets);

  return (
    <aside className={styles.bar} aria-label="utility bar">
      <div className={styles.logo} />
      <button
        className={styles.manageToggle}
        data-active={manageMode}
        onClick={toggleManageMode}
        aria-pressed={manageMode}
        aria-label="Toggle manage mode"
        title="Manage widgets"
      >
        ✎
      </button>
      <div className={styles.divider} />
      {availableTags.map((c) => (
        <button
          key={c}
          className={styles.chip}
          data-active={activeTags.includes(c)}
          onClick={() => toggleTag(c)}
          aria-pressed={activeTags.includes(c)}
        >
          {SHORT[c]}
        </button>
      ))}
    </aside>
  );
}
```

- [ ] **Step 3: Add failing tests to `components/shell/LeftBar.test.tsx`**

Replace the file with (keeps the original toggle-tag test, adds derived-chip and manage-toggle coverage):
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeftBar } from './LeftBar';
import { useSettings } from '@/lib/state/settingsStore';
import { useUi } from '@/lib/state/uiStore';
import { useBoard } from '@/lib/state/boardStore';
import type { WidgetLayout } from '@/lib/grid/types';

const w = (id: string, category: WidgetLayout['category']): WidgetLayout => ({
  id, x: 0, y: 0, w: 1, h: 1, category, order: 0,
});

describe('LeftBar', () => {
  beforeEach(() => {
    useSettings.setState({ activeTags: [] });
    useUi.setState({ manageMode: false });
    useBoard.setState({ widgets: [w('a', 'finance'), w('b', 'health')] });
  });

  it('renders a chip only for each in-use category', () => {
    expect(screen.queryByRole('button', { name: 'Fin' })).toBeNull();
    render(<LeftBar />);
    expect(screen.getByRole('button', { name: 'Fin' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Health' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Life' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cal' })).toBeNull();
  });

  it('drops a chip after its last widget is removed from the board', () => {
    const { rerender } = render(<LeftBar />);
    expect(screen.getByRole('button', { name: 'Health' })).toBeTruthy();
    useBoard.setState({ widgets: [w('a', 'finance')] });
    rerender(<LeftBar />);
    expect(screen.queryByRole('button', { name: 'Health' })).toBeNull();
  });

  it('toggles a category tag in the settings store on click', async () => {
    render(<LeftBar />);
    await userEvent.click(screen.getByRole('button', { name: 'Fin' }));
    expect(useSettings.getState().activeTags).toEqual(['finance']);
    await userEvent.click(screen.getByRole('button', { name: 'Fin' }));
    expect(useSettings.getState().activeTags).toEqual([]);
  });

  it('manage toggle flips the ui store and reflects aria-pressed', async () => {
    render(<LeftBar />);
    const toggle = screen.getByRole('button', { name: 'Toggle manage mode' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(toggle);
    expect(useUi.getState().manageMode).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- LeftBar`
Expected: PASS (4 tests). If the first assertion line (`queryByRole` before `render`) errors, it confirms nothing is rendered yet — it should return null cleanly.

- [ ] **Step 5: Verify in the running app**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: the left rail shows a pencil (✎) toggle below the logo; the filter chips below it correspond only to categories present in the seed data. Clicking the toggle highlights it (accent). Stop the server.

- [ ] **Step 6: Commit**

```bash
git add components/shell/LeftBar.tsx components/shell/LeftBar.module.css components/shell/LeftBar.test.tsx
git commit -m "feat: derived filter chips and manage-mode toggle in left bar"
```

---

## Task 5: Widget — floating delete × (resolves TODO(manage-mode))

**Files:**
- Modify: `components/board/Widget.tsx`
- Modify: `components/board/Widget.module.css`
- Test: `components/board/Widget.test.tsx` (new)

- [ ] **Step 1: Add the `.close` style to `components/board/Widget.module.css`**

Append:
```css
.close {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--border-hairline);
  background: var(--surface-2);
  color: var(--text);
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
.close:hover {
  border-color: var(--accent);
}
```

- [ ] **Step 2: Update `components/board/Widget.tsx`**

This replaces the skeleton's `TODO(manage-mode)` stub. Replace the whole file with:
```tsx
'use client';
import { type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useDraggable } from '@dnd-kit/core';
import styles from './Widget.module.css';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import { useBoard } from '@/lib/state/boardStore';
import type { WidgetLayout } from '@/lib/grid/types';

interface WidgetProps {
  widget: WidgetLayout;
  dragging?: boolean;
  dimmed?: boolean;
  interactive?: boolean;
  manageMode?: boolean;
  children?: ReactNode; // resize handle injected by BentoBoard
}

export function Widget({
  widget,
  dragging = false,
  dimmed = false,
  interactive = true,
  manageMode = false,
  children,
}: WidgetProps) {
  const removeWidget = useBoard((s) => s.removeWidget);
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: widget.id,
    disabled: !interactive,
  });
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
      <WidgetSkeleton category={widget.category} />
      {manageMode && (
        <motion.button
          type="button"
          className={styles.close}
          aria-label="Delete widget"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          // Stop the pointer-down from reaching the tile's drag listeners,
          // so clicking × never starts a drag.
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

> Note: this assumes skeleton Task 13 already added the `initial`/`animate`/`exit` props to the `motion.div`; the block above includes them verbatim so the file is correct whether or not they were present.

- [ ] **Step 3: Write the failing test `components/board/Widget.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { type ComponentProps } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { Widget } from './Widget';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';
import type { WidgetLayout } from '@/lib/grid/types';

const w: WidgetLayout = { id: 'x1', x: 0, y: 0, w: 1, h: 1, category: 'finance', order: 0 };

function renderWidget(props: Partial<ComponentProps<typeof Widget>> = {}) {
  return render(
    <DndContext>
      <Widget widget={w} {...props} />
    </DndContext>,
  );
}

describe('Widget delete control', () => {
  beforeEach(() => {
    useSettings.setState({ layoutMode: 'autoPack', activeTags: [] });
    useBoard.setState({ widgets: [w] });
  });

  it('does not render the × outside manage mode', () => {
    renderWidget({ manageMode: false });
    expect(screen.queryByRole('button', { name: 'Delete widget' })).toBeNull();
  });

  it('renders the × in manage mode and removes the widget on click', async () => {
    renderWidget({ manageMode: true });
    const close = screen.getByRole('button', { name: 'Delete widget' });
    await userEvent.click(close);
    expect(useBoard.getState().widgets.find((x) => x.id === 'x1')).toBeUndefined();
  });

  it('stops pointer-down propagation on the × (so it cannot start a drag)', () => {
    let parentSawPointerDown = false;
    render(
      <DndContext>
        <div onPointerDown={() => { parentSawPointerDown = true; }}>
          <Widget widget={w} manageMode />
        </div>
      </DndContext>,
    );
    const close = screen.getByRole('button', { name: 'Delete widget' });
    // The tile's drag listeners sit on an ancestor; if × stops propagation,
    // a bubbling parent handler must NOT see the pointer-down.
    fireEvent.pointerDown(close);
    expect(parentSawPointerDown).toBe(false);
  });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- Widget`
Expected: PASS (3 tests). The first run (before Step 2 is saved) would fail to find the × / the file; after Step 2 it passes.

- [ ] **Step 5: Commit**

```bash
git add components/board/Widget.tsx components/board/Widget.module.css components/board/Widget.test.tsx
git commit -m "feat: floating delete control on tiles in manage mode"
```

---

## Task 6: BentoBoard — wire manageMode to tiles (resolves TODO(manage-mode))

**Files:**
- Modify: `components/board/BentoBoard.tsx`

- [ ] **Step 1: Read `manageMode` and pass it to each `Widget`**

This replaces the skeleton's `TODO(manage-mode)` stub in `BentoBoard.tsx`.

Add the import near the other store imports:
```tsx
import { useUi } from '@/lib/state/uiStore';
```

Add this read alongside the other store reads near the top of the `BentoBoard` component (next to `const layoutMode = useSettings((s) => s.layoutMode);`):
```tsx
  const manageMode = useUi((s) => s.manageMode);
```

In the `WidgetWithResize` inner component, pass `manageMode` to `Widget`. Update the `<Widget ...>` opening tag so it reads:
```tsx
      <Widget
        widget={w}
        dragging={w.id === activeId}
        dimmed={dimmed}
        interactive={resizingId === null && !interactionsLocked}
        manageMode={manageMode}
      >
```

- [ ] **Step 2: Typecheck / build sanity**

Run: `npm run build`
Expected: compiles with no TypeScript errors (confirms the `manageMode` prop threads through correctly).

- [ ] **Step 3: Manual end-to-end verification**

Run: `npm run dev`, open `http://localhost:3000`.
Expected:
- Click the ✎ toggle in the left rail → every tile shows a floating × at its top-right; the toggle is highlighted.
- Click a tile's × → that tile animates out and neighbors reflow; no drag is triggered by the click.
- Delete every widget of one category (e.g. all `health` tiles) → that category's filter chip disappears from the left rail. If that category was an active filter, the filter clears it (board no longer stuck empty).
- Add a widget of a removed category via the FAB → its chip reappears.
- Drag and resize still work whether manage mode is on or off.
- Toggle manage mode off → the × controls disappear.
Stop the server.

- [ ] **Step 4: Commit**

```bash
git add components/board/BentoBoard.tsx
git commit -m "feat: thread manage mode through the board to tiles"
```

---

## Task 7: Full-suite check & QA pass

**Files:** none (verification only)

- [ ] **Step 1: Run the entire test suite**

Run: `npm run test`
Expected: all suites pass — including the skeleton's (`sizes`, `collision`, `occupancy`, `autoPack`, `pushCompact`, `engine`, `boardStore`, `LeftBar`, plus the new `categories`, `uiStore`, `Widget`).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Persistence sanity check**

Run: `npm run dev`, open `http://localhost:3000`.
- Turn manage mode ON, then reload the page.
Expected: manage mode is OFF after reload (it is not persisted), while the board layout and settings persist as before. Stop the server.

- [ ] **Step 4: Final commit (if any QA fixups were needed)**

```bash
git add -A
git commit -m "chore: manage mode QA pass"
```
(If no changes were needed, skip this commit.)

---

## Notes on deferred work

Inline `TODO` stubs carried from the spec (do not implement this pass):
- `TODO(manage-mode-reconcile-setwidgets)` — route any future bulk board-replacement path through `reconcileActiveTags`. Anchor: spec §5.2; site: `lib/state/boardStore.ts`.
- `TODO(manage-mode-stronger-signal)` — optional stronger manage-on visual treatment (dashed outlines / banner). Anchor: spec §6.4; sites: `components/board/BentoBoard.tsx`, `components/board/Widget.module.css`.
```
