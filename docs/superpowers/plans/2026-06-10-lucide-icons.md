# Lucide Icons Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate lucide-react icons to replace text abbreviations and unicode characters across the LeftBar and WidgetCarousel filter row.

**Architecture:** Add `icon: LucideIcon` to `WidgetDefinition` in the registry (single source of truth); LeftBar and WidgetCarousel both derive icons from the registry at render time. The `All` filter icon (`LayoutGrid`) lives as a local constant in the carousel since it is not a category.

**Tech Stack:** lucide-react, Next.js (app router), React 19, Vitest + Testing Library

---

## File Map

| File | Change |
|---|---|
| `package.json` | add `lucide-react` dependency |
| `lib/widgets/registry.ts` | add `icon: LucideIcon` to interface + populate entries |
| `lib/widgets/registry.test.ts` | add icon field test |
| `components/shell/LeftBar.tsx` | icon-only chips + PencilLine manage toggle |
| `components/shell/LeftBar.test.tsx` | update accessible name queries ('Fin'→'Finance', 'Life'→'Lifestyle', 'Cal'→'Calendar') |
| `components/shell/WidgetCarousel.tsx` | ALL_FILTERS gains icon field derived from registry; chips render icon instead of text |

---

## Task 1: Install lucide-react

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install lucide-react
```

Expected: resolves without error; `lucide-react` appears in `dependencies` in `package.json`.

- [ ] **Step 2: Verify install**

```bash
npm ls lucide-react
```

Expected: prints a line like `lucide-react@x.x.x`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install lucide-react"
```

---

## Task 2: Add icon field to WidgetDefinition and populate registry

**Files:**
- Modify: `lib/widgets/registry.ts`
- Modify: `lib/widgets/registry.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test to `lib/widgets/registry.test.ts`:

```ts
it('each entry has an icon component defined', () => {
  for (const def of WIDGET_REGISTRY) {
    expect(def.icon).toBeDefined();
    expect(typeof def.icon).toBe('function');
  }
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm test -- registry
```

Expected: FAIL — `def.icon` is undefined (property does not exist yet).

- [ ] **Step 3: Update registry.ts**

Replace the full content of `lib/widgets/registry.ts` with:

```ts
import { WidgetSkeleton, type WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import type { Category } from '@/lib/grid/types';
import { SIZE_PRESETS, type SizePreset } from '@/lib/grid/sizes';
import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, Heart, CalendarDays, Sparkles } from 'lucide-react';

export type { WidgetContentProps };

export interface WidgetDefinition {
  type: string;
  label: string;
  category: Category;
  accentColor: string;
  icon: LucideIcon;
  supportedSizes: SizePreset[];
  // TODO(widget-content): replace WidgetSkeleton with per-type content components when real content is built.
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
    icon: TrendingUp,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2'), p('4×2')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'health',
    label: 'Health',
    category: 'health',
    accentColor: '#10b981',
    icon: Heart,
    supportedSizes: [p('1×1'), p('2×2'), p('2×3')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'calendar',
    label: 'Calendar',
    category: 'calendar',
    accentColor: '#f59e0b',
    icon: CalendarDays,
    supportedSizes: [p('1×2'), p('2×3'), p('3×3')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'lifestyle',
    label: 'Lifestyle',
    category: 'lifestyle',
    accentColor: '#ec4899',
    icon: Sparkles,
    supportedSizes: [p('1×1'), p('2×1'), p('3×2'), p('4×4')],
    ContentComponent: WidgetSkeleton,
  },
];
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- registry
```

Expected: all 6 tests PASS (5 existing + 1 new icon test).

- [ ] **Step 5: Commit**

```bash
git add lib/widgets/registry.ts lib/widgets/registry.test.ts
git commit -m "feat: add icon field to WidgetDefinition with lucide icons per category"
```

---

## Task 3: Update LeftBar

**Files:**
- Modify: `components/shell/LeftBar.tsx`
- Modify: `components/shell/LeftBar.test.tsx`

**Context:** The current chips have no `aria-label` — their accessible name comes from text content ('Fin', 'Life', 'Health', 'Cal'). After this change they render icons with `aria-label={def.label}` ('Finance', 'Lifestyle', 'Health', 'Calendar'). Tests that query by 'Fin', 'Life', 'Cal' must be updated; 'Health' stays the same.

- [ ] **Step 1: Update the failing tests**

Replace the full content of `components/shell/LeftBar.test.tsx` with:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
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
    expect(screen.queryByRole('button', { name: 'Finance' })).toBeNull();
    render(<LeftBar />);
    expect(screen.getByRole('button', { name: 'Finance' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Health' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Lifestyle' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Calendar' })).toBeNull();
  });

  it('drops a chip after its last widget is removed from the board', () => {
    const { rerender } = render(<LeftBar />);
    expect(screen.getByRole('button', { name: 'Health' })).toBeTruthy();
    act(() => {
      useBoard.setState({ widgets: [w('a', 'finance')] });
    });
    rerender(<LeftBar />);
    expect(screen.queryByRole('button', { name: 'Health' })).toBeNull();
  });

  it('toggles a category tag in the settings store on click', async () => {
    render(<LeftBar />);
    await userEvent.click(screen.getByRole('button', { name: 'Finance' }));
    expect(useSettings.getState().activeTags).toEqual(['finance']);
    await userEvent.click(screen.getByRole('button', { name: 'Finance' }));
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

- [ ] **Step 2: Run to verify tests fail**

```bash
npm test -- LeftBar
```

Expected: FAIL — `getByRole('button', { name: 'Finance' })` not found (current chip text is 'Fin').

- [ ] **Step 3: Update LeftBar.tsx**

Replace the full content of `components/shell/LeftBar.tsx` with:

```tsx
'use client';
import { PencilLine } from 'lucide-react';
import styles from './LeftBar.module.css';
import { useSettings } from '@/lib/state/settingsStore';
import { useUi } from '@/lib/state/uiStore';
import { useBoard } from '@/lib/state/boardStore';
import { presentCategories } from '@/lib/grid/categories';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';

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
        <PencilLine size={18} />
      </button>
      <div className={styles.divider} />
      {availableTags.map((c) => {
        const def = WIDGET_REGISTRY.find((d) => d.category === c)!;
        const Icon = def.icon;
        return (
          // TODO(leftbar-expand): render Icon + def.label side-by-side when sidebar is in expanded mode
          <button
            key={c}
            className={styles.chip}
            data-active={activeTags.includes(c)}
            onClick={() => toggleTag(c)}
            aria-pressed={activeTags.includes(c)}
            aria-label={def.label}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </aside>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- LeftBar
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/shell/LeftBar.tsx components/shell/LeftBar.test.tsx
git commit -m "feat: replace LeftBar text chips with lucide icons, PencilLine for manage toggle"
```

---

## Task 4: Update WidgetCarousel filter chips

**Files:**
- Modify: `components/shell/WidgetCarousel.tsx`

**Context:** Filter chip tests already query by `aria-label="Filter: X"` (not text content), so they will continue to pass without test changes. The `ALL_FILTERS` array is rebuilt to derive category icons from the registry, eliminating the duplicated label strings.

- [ ] **Step 1: Run existing carousel tests to establish baseline**

```bash
npm test -- WidgetCarousel
```

Expected: all 5 tests PASS (confirming nothing is broken before the change).

- [ ] **Step 2: Update WidgetCarousel.tsx**

Replace the full content of `components/shell/WidgetCarousel.tsx` with:

```tsx
'use client';
import { useState } from 'react';
import { LayoutGrid, type LucideIcon } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import styles from './WidgetCarousel.module.css';
import { CarouselCard } from './CarouselCard';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { useBoard } from '@/lib/state/boardStore';
import type { Category } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';

interface FilterEntry {
  label: string;
  value: Category | null;
  Icon: LucideIcon;
}

const ALL_FILTERS: FilterEntry[] = [
  { label: 'All', value: null, Icon: LayoutGrid },
  ...WIDGET_REGISTRY.map((d) => ({ label: d.label, value: d.category, Icon: d.icon })),
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
            aria-label={`Filter: ${f.label}`}
          >
            <f.Icon size={16} />
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

- [ ] **Step 3: Run all tests to verify everything passes**

```bash
npm test
```

Expected: all test suites PASS with no regressions.

- [ ] **Step 4: Commit**

```bash
git add components/shell/WidgetCarousel.tsx
git commit -m "feat: replace WidgetCarousel filter chips with lucide icons derived from registry"
```
