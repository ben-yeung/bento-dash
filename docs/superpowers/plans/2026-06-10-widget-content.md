# Widget Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 4 skeleton widget types with 10 fully-specified content widgets (Finance, Health, Calendar, Lifestyle) each rendering distinct layouts per supported size.

**Architecture:** Add optional `widgetType` field to `WidgetLayout`; expand `WIDGET_REGISTRY` from 4 generic entries to 10 type-specific entries each with a `ContentComponent`; thread `widgetType` through the add/drag flow; constrain resize snap to each type's `supportedSizes`.

**Tech Stack:** Next.js App Router, TypeScript, React, CSS Modules, Zustand, motion/react, Lucide icons, Vitest + @testing-library/react

---

## File Map

| File | Change |
|---|---|
| `lib/grid/types.ts` | Add `widgetType?: string` to `WidgetLayout` |
| `lib/grid/sizes.ts` | Add `nearestPresetFrom(w, h, from)` |
| `lib/grid/sizes.test.ts` | Test `nearestPresetFrom` |
| `lib/data/seed.ts` | Add `widgetType` field to each seed widget |
| `lib/state/boardStore.ts` | Add `widgetType` param to `addWidget`; migration in `onRehydrateStorage` |
| `lib/state/boardStore.test.ts` | Update `addWidget` calls with `widgetType` |
| `lib/widgets/registry.ts` | Expand 4 → 10 entries with real `ContentComponent` refs |
| `lib/widgets/registry.test.ts` | Update tests for 10 entries; drop `type === category` assertion |
| `components/shell/WidgetCarousel.tsx` | Replace `ALL_FILTERS` map with explicit `CATEGORY_FILTERS`; update `handleAdd` signature |
| `components/shell/CarouselCard.tsx` | Add `widgetType` to `SizeChipProps`; update draggable id format |
| `components/shell/AppShell.tsx` | Update `parsePaletteId` to extract `widgetType`; pass to `addWidget` |
| `components/board/Widget.tsx` | Registry lookup by `widgetType`; render `ContentComponent` |
| `components/board/BentoBoard.tsx` | Pass `supportedSizes` to `useDragResize` via registry lookup |
| `lib/hooks/useDragResize.ts` | Accept optional `supportedSizes`; use `nearestPresetFrom` |
| `components/widgets/content/budget-summary.tsx` | Create |
| `components/widgets/content/activity-rings.tsx` | Create |
| `components/widgets/content/calorie-tracker.tsx` | Create |
| `components/widgets/content/steps.tsx` | Create |
| `components/widgets/content/upcoming-events.tsx` | Create |
| `components/widgets/content/mini-calendar.tsx` | Create |
| `components/widgets/content/todays-schedule.tsx` | Create |
| `components/widgets/content/habit-tracker.tsx` | Create |
| `components/widgets/content/weather.tsx` | Create |
| `components/widgets/content/daily-note.tsx` | Create |

---

## Task 1: Add `widgetType` to `WidgetLayout` and seed

**Files:**
- Modify: `lib/grid/types.ts`
- Modify: `lib/data/seed.ts`
- Modify: `components/board/Widget.test.tsx` (fixture update)
- Modify: `lib/state/boardStore.test.ts` (fixture update)

- [ ] **Step 1: Add `widgetType` to `WidgetLayout`**

In `lib/grid/types.ts`, add the optional field after `category`:

```ts
export interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  category: Category;
  order: number;
  widgetType?: string; // e.g. 'budget-summary', 'activity-rings'
}
```

- [ ] **Step 2: Update `seed.ts` with widgetType**

Replace `seedWidgets` in `lib/data/seed.ts`:

```ts
import type { Category, WidgetLayout } from '@/lib/grid/types';

export function seedWidgets(): WidgetLayout[] {
  const defs: Array<[Category, string, number, number, number, number]> = [
    ['finance',   'budget-summary',   2, 2, 0, 4],
    ['calendar',  'todays-schedule',  2, 3, 4, 0],
    ['health',    'activity-rings',   1, 1, 3, 3],
    ['lifestyle', 'habit-tracker',    3, 2, 0, 2],
    ['finance',   'budget-summary',   1, 1, 3, 2],
    ['health',    'activity-rings',   2, 1, 3, 5],
    ['calendar',  'todays-schedule',  1, 2, 2, 4],
    ['lifestyle', 'habit-tracker',    2, 2, 4, 3],
    ['finance',   'budget-summary',   4, 2, 0, 0],
    ['health',    'steps',            1, 1, 3, 4],
  ];
  return defs.map(([category, widgetType, w, h, x, y], i) => ({
    id: `seed-${i}`,
    x,
    y,
    w,
    h,
    category,
    widgetType,
    order: i,
  }));
}
```

- [ ] **Step 3: Update `Widget.test.tsx` fixture**

In `components/board/Widget.test.tsx`, add `widgetType` to the `w` fixture:

```ts
const w: WidgetLayout = { id: 'x1', x: 0, y: 0, w: 1, h: 1, category: 'finance', order: 0, widgetType: 'budget-summary' };
```

- [ ] **Step 4: Run tests**

```
npx vitest run
```

Expected: all tests pass (widgetType is optional so no downstream breakage yet).

- [ ] **Step 5: Commit**

```bash
git add lib/grid/types.ts lib/data/seed.ts components/board/Widget.test.tsx
git commit -m "feat: add widgetType field to WidgetLayout and seed"
```

---

## Task 2: Update `addWidget` and `onRehydrateStorage` migration

**Files:**
- Modify: `lib/state/boardStore.ts`
- Modify: `lib/state/boardStore.test.ts`

- [ ] **Step 1: Update `addWidget` signature**

In `lib/state/boardStore.ts`, update the interface and implementation:

```ts
interface BoardState {
  // ... existing fields ...
  addWidget: (category: Category, widgetType: string, w: number, h: number, targetCell?: { x: number; y: number }) => void;
  // ...
}
```

Update the implementation inside `create`:

```ts
addWidget: (category, widgetType, w, h, targetCell) => {
  const order = get().widgets.reduce((max, x) => Math.max(max, x.order), -1) + 1;
  const widget: WidgetLayout = {
    id: newId(),
    x: targetCell?.x ?? 0,
    y: targetCell?.y ?? 0,
    w,
    h,
    category,
    widgetType,
    order,
  };
  set({ widgets: strategy().preview(get().widgets, { kind: 'add', widget }) });
},
```

- [ ] **Step 2: Add migration in `onRehydrateStorage`**

In `lib/state/boardStore.ts`, update the persist config:

```ts
const WIDGET_TYPE_MIGRATION: Record<string, string> = {
  finance:   'budget-summary',
  health:    'activity-rings',
  calendar:  'upcoming-events',
  lifestyle: 'habit-tracker',
};

// Inside persist options:
{
  name: 'bento-board',
  onRehydrateStorage: () => (state) => {
    if (state) {
      state.widgets = state.widgets.map((w) =>
        w.widgetType ? w : { ...w, widgetType: WIDGET_TYPE_MIGRATION[w.category] ?? w.category }
      );
      state.reResolve();
    }
  },
}
```

- [ ] **Step 3: Update `boardStore.test.ts`**

Update all `addWidget` calls to include `widgetType` as the second argument:

```ts
useBoard.getState().addWidget('finance', 'budget-summary', 2, 2);
useBoard.getState().addWidget('health', 'activity-rings', 2, 2);
// etc. — every addWidget call in the file needs the widgetType argument
```

Full updated calls:
- `addWidget('finance', 'budget-summary', 2, 2)`
- `addWidget('health', 'activity-rings', 2, 2)`
- `addWidget('finance', 'budget-summary', 1, 1)`
- `addWidget('health', 'activity-rings', 1, 1)`
- `addWidget('finance', 'budget-summary', 1, 1)` (resize test)
- `addWidget('calendar', 'todays-schedule', 1, 1, { x: 4, y: 0 })` (pushCompact test)
- `addWidget('finance', 'budget-summary', 1, 1)` (activeTags prune tests)
- `addWidget('health', 'activity-rings', 1, 1)` (activeTags prune tests)
- `addWidget('finance', 'budget-summary', 2, 1)` (swap test)
- `addWidget('health', 'activity-rings', 2, 1)` (swap test)

- [ ] **Step 4: Run tests**

```
npx vitest run lib/state/boardStore.test.ts
```

Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/state/boardStore.ts lib/state/boardStore.test.ts
git commit -m "feat: add widgetType param to addWidget and migration for persisted boards"
```

---

## Task 3: Thread `widgetType` through carousel and palette drag

**Files:**
- Modify: `components/shell/WidgetCarousel.tsx`
- Modify: `components/shell/CarouselCard.tsx`
- Modify: `components/shell/AppShell.tsx`

- [ ] **Step 1: Update `WidgetCarousel.tsx`**

Replace the `ALL_FILTERS` map (which produces duplicates at 10 entries) with an explicit list, and update `handleAdd`:

```tsx
import { LayoutGrid, TrendingUp, Heart, CalendarDays, Sparkles } from 'lucide-react';

const CATEGORY_FILTERS: FilterEntry[] = [
  { label: 'All',       value: null,        Icon: LayoutGrid  },
  { label: 'Finance',   value: 'finance',   Icon: TrendingUp  },
  { label: 'Health',    value: 'health',    Icon: Heart       },
  { label: 'Calendar',  value: 'calendar',  Icon: CalendarDays },
  { label: 'Lifestyle', value: 'lifestyle', Icon: Sparkles    },
];
```

Update `handleAdd` to accept `widgetType`:

```tsx
function handleAdd(category: Category, widgetType: string, w: number, h: number) {
  addWidget(category, widgetType, w, h);
  onClose();
}
```

Update the `onAdd` prop passed to `CarouselCard`:

```tsx
onAdd={(w, h) => handleAdd(def.category, def.type, w, h)}
```

Replace `ALL_FILTERS` with `CATEGORY_FILTERS` in the JSX:

```tsx
{CATEGORY_FILTERS.map((f) => (
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
```

- [ ] **Step 2: Update `CarouselCard.tsx`**

Add `widgetType` to `SizeChipProps` and update the draggable id:

```tsx
interface SizeChipProps {
  preset: SizePreset;
  category: Category;
  widgetType: string;
  onAdd: (w: number, h: number) => void;
}

function SizeChip({ preset, category, widgetType, onAdd }: SizeChipProps) {
  const { listeners, attributes, setNodeRef, isDragging } = useDraggable({
    id: `palette:${category}:${widgetType}:${preset.w}x${preset.h}`,
  });
  // ... rest unchanged
}
```

Pass `widgetType` when rendering chips inside `CarouselCard`:

```tsx
{definition.supportedSizes.map((preset) => (
  <SizeChip
    key={preset.name}
    preset={preset}
    category={definition.category}
    widgetType={definition.type}
    onAdd={onAdd}
  />
))}
```

- [ ] **Step 3: Update `AppShell.tsx` — `parsePaletteId`**

The drag id is now `palette:{cat}:{widgetType}:{w}x{h}`. Update `parsePaletteId`:

```ts
function parsePaletteId(id: string): { cat: Category; widgetType: string; w: number; h: number } | null {
  if (!id.startsWith('palette:')) return null;
  const parts = id.split(':');
  // parts: ['palette', cat, widgetType, 'WxH']
  if (parts.length !== 4) return null;
  const [, cat, widgetType, size] = parts;
  const [w, h] = (size ?? '').split('x').map(Number);
  if (!cat || !widgetType || Number.isNaN(w) || Number.isNaN(h) || w < 1 || h < 1) return null;
  return { cat: cat as Category, widgetType, w, h };
}
```

Update the `handleDragEnd` call that uses `parsePaletteId` result. Find where `addWidget` is called with palette data and add `widgetType`:

```ts
addWidget(parsed.cat, parsed.widgetType, parsed.w, parsed.h, targetCell);
```

- [ ] **Step 4: Run tests**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/shell/WidgetCarousel.tsx components/shell/CarouselCard.tsx components/shell/AppShell.tsx
git commit -m "feat: thread widgetType through carousel and palette drag"
```

---

## Task 4: Wire `ContentComponent` in `Widget.tsx`

**Files:**
- Modify: `components/board/Widget.tsx`

- [ ] **Step 1: Update `Widget.tsx` to do registry lookup**

Replace the hardcoded `<WidgetSkeleton>` with a registry lookup:

```tsx
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
// remove the direct WidgetSkeleton import once registry handles fallback

// Inside the component body, before the return:
const def = WIDGET_REGISTRY.find((d) => d.type === widget.widgetType);
const ContentComponent = def?.ContentComponent ?? WidgetSkeleton;
```

Replace the `<WidgetSkeleton>` in the JSX:

```tsx
<ContentComponent category={widget.category} w={widget.w} h={widget.h} />
```

- [ ] **Step 2: Run tests**

```
npx vitest run components/board/Widget.test.tsx
```

Expected: all tests pass (fixture has `widgetType: 'budget-summary'` but registry still has WidgetSkeleton as ContentComponent, so output is identical).

- [ ] **Step 3: Commit**

```bash
git add components/board/Widget.tsx
git commit -m "feat: wire ContentComponent in Widget via registry lookup"
```

---

## Task 5: Expand WIDGET_REGISTRY 4 → 10 and update tests

**Files:**
- Modify: `lib/widgets/registry.ts`
- Modify: `lib/widgets/registry.test.ts`

- [ ] **Step 1: Write failing tests**

Replace `lib/widgets/registry.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import { WIDGET_REGISTRY } from './registry';

describe('WIDGET_REGISTRY', () => {
  it('has exactly 10 entries', () => {
    expect(WIDGET_REGISTRY).toHaveLength(10);
  });

  it('each entry has a non-empty supportedSizes array', () => {
    for (const def of WIDGET_REGISTRY) {
      expect(def.supportedSizes.length).toBeGreaterThan(0);
    }
  });

  it('each entry has a valid category', () => {
    const valid = ['finance', 'health', 'calendar', 'lifestyle'];
    for (const def of WIDGET_REGISTRY) {
      expect(valid).toContain(def.category);
    }
  });

  it('each entry has a ContentComponent defined', () => {
    for (const def of WIDGET_REGISTRY) {
      expect(def.ContentComponent).toBeDefined();
      expect(typeof def.ContentComponent).toBe('function');
    }
  });

  it('budget-summary supports 1×1, 2×2, 3×2, and 4×2', () => {
    const def = WIDGET_REGISTRY.find((d) => d.type === 'budget-summary')!;
    const names = def.supportedSizes.map((s) => s.name);
    expect(names).toContain('1×1');
    expect(names).toContain('2×2');
    expect(names).toContain('3×2');
    expect(names).toContain('4×2');
  });

  it('has one entry per expected type', () => {
    const types = WIDGET_REGISTRY.map((d) => d.type);
    expect(types).toContain('budget-summary');
    expect(types).toContain('activity-rings');
    expect(types).toContain('calorie-tracker');
    expect(types).toContain('steps');
    expect(types).toContain('upcoming-events');
    expect(types).toContain('mini-calendar');
    expect(types).toContain('todays-schedule');
    expect(types).toContain('habit-tracker');
    expect(types).toContain('weather');
    expect(types).toContain('daily-note');
  });

  it('each entry has an icon component defined', () => {
    for (const def of WIDGET_REGISTRY) {
      expect(def.icon).toBeDefined();
      expect(def.icon).not.toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```
npx vitest run lib/widgets/registry.test.ts
```

Expected: FAIL — "has exactly 10 entries" fails (length is 4).

- [ ] **Step 3: Expand the registry**

Replace `lib/widgets/registry.ts` with:

```ts
import { WidgetSkeleton, type WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import type { Category } from '@/lib/grid/types';
import { SIZE_PRESETS, type SizePreset } from '@/lib/grid/sizes';
import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  TrendingUp, Activity, Flame, Footprints,
  CalendarDays, Calendar, Clock,
  CheckCircle, CloudSun, Pencil,
} from 'lucide-react';

export type { WidgetContentProps };

export interface WidgetDefinition {
  type: string;
  label: string;
  category: Category;
  accentColor: string;
  icon: LucideIcon;
  supportedSizes: SizePreset[];
  // TODO(widget-content): ContentComponent is WidgetSkeleton until each type's component is built in Tasks 7-16.
  ContentComponent: React.ComponentType<WidgetContentProps>;
}

const p = (name: string): SizePreset => SIZE_PRESETS.find((s) => s.name === name)!;

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  // Finance
  {
    type: 'budget-summary',
    label: 'Budget Summary',
    category: 'finance',
    accentColor: '#6366f1',
    icon: TrendingUp,
    supportedSizes: [p('1×1'), p('2×2'), p('3×2'), p('4×2')],
    ContentComponent: WidgetSkeleton,
  },
  // Health
  {
    type: 'activity-rings',
    label: 'Activity Rings',
    category: 'health',
    accentColor: '#ff6b6b',
    icon: Activity,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'calorie-tracker',
    label: 'Calories',
    category: 'health',
    accentColor: '#ff6b6b',
    icon: Flame,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'steps',
    label: 'Steps',
    category: 'health',
    accentColor: '#38bdf8',
    icon: Footprints,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: WidgetSkeleton,
  },
  // Calendar
  {
    type: 'upcoming-events',
    label: 'Upcoming Events',
    category: 'calendar',
    accentColor: '#3b82f6',
    icon: CalendarDays,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'mini-calendar',
    label: 'Mini Calendar',
    category: 'calendar',
    accentColor: '#3b82f6',
    icon: Calendar,
    supportedSizes: [p('1×1'), p('2×2'), p('3×2'), p('3×3')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'todays-schedule',
    label: "Today's Schedule",
    category: 'calendar',
    accentColor: '#3b82f6',
    icon: Clock,
    supportedSizes: [p('1×2'), p('2×2'), p('2×3')],
    ContentComponent: WidgetSkeleton,
  },
  // Lifestyle
  {
    type: 'habit-tracker',
    label: 'Habit Tracker',
    category: 'lifestyle',
    accentColor: '#10b981',
    icon: CheckCircle,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'weather',
    label: 'Weather',
    category: 'lifestyle',
    accentColor: '#38bdf8',
    icon: CloudSun,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'daily-note',
    label: 'Daily Note',
    category: 'lifestyle',
    accentColor: '#6366f1',
    icon: Pencil,
    supportedSizes: [p('1×1'), p('2×2'), p('2×3'), p('3×2')],
    ContentComponent: WidgetSkeleton,
  },
];
```

- [ ] **Step 4: Run tests**

```
npx vitest run lib/widgets/registry.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/widgets/registry.ts lib/widgets/registry.test.ts
git commit -m "feat: expand WIDGET_REGISTRY to 10 typed entries"
```

---

## Task 6: Add `nearestPresetFrom` and constrain resize snapping

**Files:**
- Modify: `lib/grid/sizes.ts`
- Modify: `lib/grid/sizes.test.ts`
- Modify: `lib/hooks/useDragResize.ts`
- Modify: `components/board/BentoBoard.tsx`

- [ ] **Step 1: Write failing test**

Add to `lib/grid/sizes.test.ts`:

```ts
import { SIZE_PRESETS, clampSize, nearestPreset, nearestPresetFrom } from './sizes';

// inside describe('sizes'):
it('nearestPresetFrom snaps to nearest within a restricted set', () => {
  const allowed = [SIZE_PRESETS.find((p) => p.name === '1×1')!, SIZE_PRESETS.find((p) => p.name === '2×2')!];
  // 3×1 is closest to 2×2 within the allowed set (no 2×1 or 3×2 available)
  expect(nearestPresetFrom(3, 1, allowed).name).toBe('2×2');
  // 1×1 exact match
  expect(nearestPresetFrom(1, 1, allowed).name).toBe('1×1');
});

it('nearestPresetFrom falls back to full SIZE_PRESETS when given empty array', () => {
  expect(nearestPresetFrom(1, 1, []).name).toBe('1×1');
});
```

- [ ] **Step 2: Run to confirm failure**

```
npx vitest run lib/grid/sizes.test.ts
```

Expected: FAIL — `nearestPresetFrom` is not exported.

- [ ] **Step 3: Implement `nearestPresetFrom`**

Add to `lib/grid/sizes.ts`:

```ts
export function nearestPresetFrom(w: number, h: number, from: SizePreset[]): SizePreset {
  const pool = from.length > 0 ? from : SIZE_PRESETS;
  const c = clampSize(w, h);
  let best = pool[0];
  let bestDist = Infinity;
  for (const p of pool) {
    const d = Math.abs(p.w - c.w) + Math.abs(p.h - c.h);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}
```

- [ ] **Step 4: Run tests**

```
npx vitest run lib/grid/sizes.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Update `useDragResize.ts`**

Add optional `supportedSizes` param and use `nearestPresetFrom`:

```ts
import { clampSize, nearestPreset, nearestPresetFrom, type SizePreset } from '@/lib/grid/sizes';

interface UseDragResizeArgs {
  startW: number;
  startH: number;
  metrics: GridMetrics;
  supportedSizes?: SizePreset[];
  onPreview: (w: number, h: number) => void;
  onIndicator: (preset: SizePreset) => void;
  onCommit: (w: number, h: number) => void;
}

export function useDragResize({ startW, startH, metrics, supportedSizes, onPreview, onIndicator, onCommit }: UseDragResizeArgs) {
  // ...
  const latestSnap = useRef<SizePreset>(
    supportedSizes?.length ? nearestPresetFrom(startW, startH, supportedSizes) : nearestPreset(startW, startH)
  );

  // In onPointerMove, replace:
  //   const snap = nearestPreset(raw.w, raw.h);
  // with:
  const snap = supportedSizes?.length
    ? nearestPresetFrom(raw.w, raw.h, supportedSizes)
    : nearestPreset(raw.w, raw.h);
  // ...rest of hook unchanged
}
```

- [ ] **Step 6: Update `BentoBoard.tsx` to pass `supportedSizes`**

In `WidgetWithResizeProps`, add:
```ts
supportedSizes?: SizePreset[];
```

In `WidgetWithResize`, pass it to `useDragResize`:
```ts
const { onPointerDown, onPointerMove, onPointerUp } = useDragResize({
  startW: w.w,
  startH: w.h,
  metrics,
  supportedSizes,
  onPreview: ...,
  onIndicator: setSnapTarget,
  onCommit: ...,
});
```

In `BentoBoard`, import `WIDGET_REGISTRY` and look up `supportedSizes` when rendering each widget:

```tsx
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';

// Inside the .map() call:
const def = WIDGET_REGISTRY.find((d) => d.type === w.widgetType);

<WidgetWithResize
  key={w.id}
  w={w}
  supportedSizes={def?.supportedSizes}
  // ...other props unchanged
/>
```

Also update the `setSnapTarget` initial value in `WidgetWithResize` to use `nearestPresetFrom`:

```tsx
// In ResizeHandle onPointerDown:
setSnapTarget(
  supportedSizes?.length
    ? nearestPresetFrom(w.w, w.h, supportedSizes)
    : nearestPreset(w.w, w.h)
);
```

Import `nearestPresetFrom` in `BentoBoard.tsx`:

```ts
import { nearestPreset, nearestPresetFrom, type SizePreset } from '@/lib/grid/sizes';
```

- [ ] **Step 7: Run all tests**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add lib/grid/sizes.ts lib/grid/sizes.test.ts lib/hooks/useDragResize.ts components/board/BentoBoard.tsx
git commit -m "feat: add nearestPresetFrom and constrain resize snap to supportedSizes"
```

---

## Task 7: `budget-summary` content component

**Files:**
- Create: `components/widgets/content/budget-summary.tsx`

Design tokens (all via CSS variables from `globals.css`): `--text`, `--muted`, `--surface`, `--border-hairline`.

- [ ] **Step 1: Create the component**

```tsx
// components/widgets/content/budget-summary.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';

const ACCENT = '#6366f1';
const SPENT = 3500;
const TOTAL = 5000;
const REMAINING = TOTAL - SPENT;
const PCT = Math.round((SPENT / TOTAL) * 100);

const CATS = [
  { label: 'Housing',  amount: 1400, color: '#6366f1' },
  { label: 'Food',     amount:  800, color: '#8b5cf6' },
  { label: 'Transport',amount:  600, color: '#a78bfa' },
  { label: 'Other',    amount:  700, color: '#c4b5fd' },
];

function DonutRing({ size, pct, label }: { size: number; pct: number; label: string }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={ACCENT} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill="var(--text)" fontSize={size > 60 ? 13 : 10} fontWeight={600}>
        {label}
      </text>
    </svg>
  );
}

function Header({ ctx, title }: { ctx: string; title: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ctx}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
    </div>
  );
}

function StackedBar() {
  return (
    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', margin: '6px 0' }}>
      {CATS.map((c) => (
        <div key={c.label} style={{ flex: c.amount, background: c.color }} />
      ))}
    </div>
  );
}

export function BudgetSummary({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jun</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DonutRing size={64} pct={PCT} label={`$${(REMAINING/1000).toFixed(1)}k`} />
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Header ctx="June 2026" title="Budget" />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>${SPENT.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>/ ${TOTAL.toLocaleString()}</div>
          </div>
        </div>
        <StackedBar />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {CATS.map((c) => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
              <span style={{ flex: 1, color: 'var(--muted)' }}>{c.label}</span>
              <span>${c.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (w === 3 && h === 2) {
    return (
      <div style={{ ...s, flexDirection: 'row', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <DonutRing size={80} pct={PCT} label={`${PCT}%`} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>${SPENT.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>/ ${TOTAL.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header ctx="June 2026" title="Monthly Budget" />
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 'auto' }}>Remaining</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: ACCENT }}>${REMAINING.toLocaleString()}</div>
          <StackedBar />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {CATS.map((c) => (
              <div key={c.label} style={{ display: 'flex', gap: 5, fontSize: 10, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: 1, background: c.color }} />
                <span style={{ flex: 1, color: 'var(--muted)' }}>{c.label}</span>
                <span>${c.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4×2
  return (
    <div style={s}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <Header ctx="June 2026" title="Monthly Budget" />
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>${SPENT.toLocaleString()}</span>
          <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 6 }}>/ ${TOTAL.toLocaleString()}</span>
        </div>
      </div>
      <StackedBar />
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {CATS.map((c) => (
          <div key={c.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: c.color }} />
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>${c.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register in registry**

In `lib/widgets/registry.ts`, import and wire up:

```ts
import { BudgetSummary } from '@/components/widgets/content/budget-summary';
// ...
// In the budget-summary entry:
ContentComponent: BudgetSummary,
```

- [ ] **Step 3: Run tests**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add components/widgets/content/budget-summary.tsx lib/widgets/registry.ts
git commit -m "feat: add BudgetSummary content component"
```

---

## Task 8: `activity-rings` content component

**Files:**
- Create: `components/widgets/content/activity-rings.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/widgets/content/activity-rings.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';

const MOVE_COLOR     = '#ff6b6b';
const EXERCISE_COLOR = '#ffd93d';
const STAND_COLOR    = '#6bcb77';

const RINGS = [
  { label: 'Move',     color: MOVE_COLOR,     pct: 78, value: '520', unit: 'CAL' },
  { label: 'Exercise', color: EXERCISE_COLOR, pct: 60, value: '36',  unit: 'MIN' },
  { label: 'Stand',    color: STAND_COLOR,    pct: 92, value: '11',  unit: 'HRS' },
];

function ConcRings({ size }: { size: number }) {
  const gap = 5;
  const strokeWidth = Math.max(4, size / 16);
  return (
    <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      {RINGS.map((ring, i) => {
        const r = size / 2 - strokeWidth / 2 - i * (strokeWidth + gap);
        const circ = 2 * Math.PI * r;
        const dash = (ring.pct / 100) * circ;
        return (
          <g key={ring.label}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
            <circle
              cx={size/2} cy={size/2} r={r} fill="none"
              stroke={ring.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              transform={`rotate(-90 ${size/2} ${size/2})`}
            />
          </g>
        );
      })}
    </svg>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Activity</div>
    </div>
  );
}

export function ActivityRings({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={{ ...s, alignItems: 'center', justifyContent: 'center' }}>
        <ConcRings size={60} />
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Activity</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ConcRings size={52} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {RINGS.map((ring) => (
              <div key={ring.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, whiteSpace: 'nowrap' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ring.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--muted)' }}>{ring.label}</span>
                <span style={{ marginLeft: 'auto', paddingLeft: 8 }}>{ring.value} <span style={{ color: 'var(--muted)', fontSize: 9 }}>{ring.unit}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    const points = [0, 20, 40, 60, 80, 100].map((t, i) => {
      const x = (i / 5) * 140;
      return RINGS.map((ring) => {
        const base = ring.pct * 0.6;
        const val = Math.min(ring.pct, base + t * 0.004 * ring.pct);
        return `${x},${50 - val * 0.45}`;
      });
    });
    return (
      <div style={s}>
        <Header />
        <svg width="100%" height={55} viewBox="0 0 140 55" preserveAspectRatio="none" style={{ marginBottom: 6 }}>
          {RINGS.map((ring, ri) => (
            <polyline key={ring.label}
              points={points.map((pt) => pt[ri]).join(' ')}
              fill="none" stroke={ring.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
            />
          ))}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {RINGS.map((ring) => (
            <div key={ring.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ring.color }} />
              <span style={{ flex: 1, color: 'var(--muted)' }}>{ring.label}</span>
              <span>{ring.value} <span style={{ color: 'var(--muted)', fontSize: 9 }}>{ring.unit}</span></span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  const WEEK_DAYS = ['M','T','W','T','F','S','S'];
  const weekData = RINGS.map((ring) =>
    WEEK_DAYS.map((_, i) => Math.round(ring.pct * (0.5 + Math.random() * 0.6)))
  );

  return (
    <div style={{ ...s, flexDirection: 'row', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ConcRings size={88} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
        {RINGS.map((ring) => (
          <div key={ring.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
              <span style={{ color: ring.color }}>{ring.label}</span>
              <span>{ring.value} <span style={{ color: 'var(--muted)', fontSize: 9 }}>{ring.unit}</span></span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${ring.pct}%`, background: ring.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ width: 52 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          {WEEK_DAYS.map((d) => (
            <div key={d} style={{ fontSize: 8, color: 'var(--muted)', width: 6, textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        {RINGS.map((ring, ri) => (
          <div key={ring.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            {WEEK_DAYS.map((_, di) => (
              <div key={di} style={{
                width: 6, height: 10, borderRadius: 1,
                background: weekData[ri][di] > 70 ? ring.color : 'rgba(255,255,255,0.08)',
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register in registry**

```ts
import { ActivityRings } from '@/components/widgets/content/activity-rings';
// In activity-rings entry:
ContentComponent: ActivityRings,
```

- [ ] **Step 3: Commit**

```bash
git add components/widgets/content/activity-rings.tsx lib/widgets/registry.ts
git commit -m "feat: add ActivityRings content component"
```

---

## Task 9: `calorie-tracker` content component

**Files:**
- Create: `components/widgets/content/calorie-tracker.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/widgets/content/calorie-tracker.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';

const ACCENT = '#ff6b6b';
const CONSUMED = 1840;
const GOAL = 2400;
const PCT = Math.round((CONSUMED / GOAL) * 100);
const MACROS = [
  { label: 'Protein', g: 142, color: '#6366f1' },
  { label: 'Carbs',   g: 198, color: '#ffd93d' },
  { label: 'Fat',     g: 68,  color: '#ff6b6b'  },
];
const MEALS = [
  { name: 'Breakfast', cal: 420 },
  { name: 'Lunch',     cal: 680 },
  { name: 'Snack',     cal: 210 },
  { name: 'Dinner',    cal: 530 },
];

function DonutRing({ size }: { size: number }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = (PCT / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={ACCENT} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill="var(--text)" fontSize={size > 60 ? 13 : 10} fontWeight={600}>
        {CONSUMED.toLocaleString()}
      </text>
    </svg>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Calories</div>
    </div>
  );
}

function ProgressBar() {
  return (
    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', margin: '6px 0' }}>
      <div style={{ height: '100%', width: `${PCT}%`, background: '#6bcb77', borderRadius: 3 }} />
    </div>
  );
}

export function CalorieTracker({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={{ ...s, alignItems: 'center', justifyContent: 'center' }}>
        <DonutRing size={72} />
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Calories</div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{CONSUMED.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>/ {GOAL.toLocaleString()}</div>
        <ProgressBar />
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Header />
          <div style={{ textAlign: 'right', fontSize: 11 }}>
            <span>{CONSUMED.toLocaleString()}</span>
            <span style={{ color: 'var(--muted)' }}> / {GOAL.toLocaleString()} kcal</span>
          </div>
        </div>
        <ProgressBar />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {MACROS.map((m) => (
            <div key={m.label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: m.color }}>{m.g}g</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={{ ...s, flexDirection: 'row', gap: 10 }}>
      <div style={{ flex: 1 }}>
        <Header />
        <div style={{ fontSize: 11, marginBottom: 4 }}>
          <span>{CONSUMED.toLocaleString()}</span>
          <span style={{ color: 'var(--muted)' }}> / {GOAL.toLocaleString()} kcal</span>
        </div>
        <ProgressBar />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {MACROS.map((m) => (
            <div key={m.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span style={{ color: 'var(--muted)' }}>{m.label}</span>
                <span>{m.g}g</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ height: '100%', width: `${Math.min(100, m.g / 2)}%`, background: m.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 1, background: 'var(--border-hairline)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MEALS.map((meal) => (
            <div key={meal.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--muted)' }}>{meal.name}</span>
              <span>{meal.cal} kcal</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register in registry**

```ts
import { CalorieTracker } from '@/components/widgets/content/calorie-tracker';
// In calorie-tracker entry:
ContentComponent: CalorieTracker,
```

- [ ] **Step 3: Commit**

```bash
git add components/widgets/content/calorie-tracker.tsx lib/widgets/registry.ts
git commit -m "feat: add CalorieTracker content component"
```

---

## Task 10: `steps` content component

**Files:**
- Create: `components/widgets/content/steps.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/widgets/content/steps.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';

const ACCENT = '#38bdf8';
const STEPS = 8190;
const GOAL = 10000;
const PCT = Math.round((STEPS / GOAL) * 100);

const HOURLY = [
  { hour: '6am', steps: 320 },
  { hour: '7am', steps: 1100 },
  { hour: '8am', steps: 480 },
  { hour: '9am', steps: 310 },
  { hour: '10am', steps: 220 },
  { hour: '11am', steps: 190 },
  { hour: '12pm', steps: 980 },
  { hour: '1pm', steps: 640 },
  { hour: '2pm', steps: 410 },
  { hour: '3pm', steps: 280 },
  { hour: '4pm', steps: 1260 },
];
const MAX_H_STEPS = Math.max(...HOURLY.map((h) => h.steps));

export function Steps({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  function ProgressBar() {
    return (
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', margin: '5px 0' }}>
        <div style={{ height: '100%', width: `${PCT}%`, background: ACCENT, borderRadius: 3 }} />
      </div>
    );
  }

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Steps</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: ACCENT, lineHeight: 1.2, marginTop: 2 }}>{STEPS.toLocaleString()}</div>
        <ProgressBar />
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{PCT}% of 10k</div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: ACCENT }}>{STEPS.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>/ {GOAL.toLocaleString()}</div>
        </div>
        <ProgressBar />
        <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
          <div><span style={{ color: 'var(--muted)' }}>Dist </span>5.2 km</div>
          <div><span style={{ color: 'var(--muted)' }}>Active </span>44 min</div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ fontSize: 32, fontWeight: 700, color: ACCENT, lineHeight: 1 }}>{STEPS.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>steps today</div>
        <ProgressBar />
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {[
            { label: 'Distance', val: '5.2 km' },
            { label: 'Active',   val: '44 min' },
            { label: 'Floors',   val: '8'       },
          ].map((m) => (
            <div key={m.label} style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{m.val}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2 — hourly bar chart
  const barW = 14;
  const chartH = 70;
  return (
    <div style={s}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: ACCENT }}>{STEPS.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>/ {GOAL.toLocaleString()} steps</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
        {HOURLY.map((item, i) => {
          const isLast = i === HOURLY.length - 1;
          const bh = Math.max(4, (item.steps / MAX_H_STEPS) * chartH);
          return (
            <div key={item.hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {isLast && <div style={{ fontSize: 8, color: 'var(--muted)', marginBottom: 2 }}>now</div>}
              <div style={{
                width: barW, height: bh, borderRadius: 3,
                background: isLast ? ACCENT : 'rgba(56,189,248,0.35)',
              }} />
              {i % 3 === 0 && <div style={{ fontSize: 7, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{item.hour}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border-hairline)', paddingTop: 6 }}>
        {[{ label: 'Distance', val: '5.2 km' }, { label: 'Active', val: '44 min' }, { label: 'Floors', val: '8' }].map((m) => (
          <div key={m.label}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{m.val}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register**

```ts
import { Steps } from '@/components/widgets/content/steps';
// ContentComponent: Steps,
```

- [ ] **Step 3: Commit**

```bash
git add components/widgets/content/steps.tsx lib/widgets/registry.ts
git commit -m "feat: add Steps content component"
```

---

## Task 11: `upcoming-events` content component

**Files:**
- Create: `components/widgets/content/upcoming-events.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/widgets/content/upcoming-events.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';

const EVENTS = [
  { title: 'Team standup',     time: '9:00 AM',  color: '#3b82f6', subtitle: 'Video call' },
  { title: 'Design review',    time: '11:30 AM', color: '#8b5cf6', subtitle: 'Room 2B'    },
  { title: 'Lunch with Alex',  time: '12:30 PM', color: '#ec4899', subtitle: ''            },
  { title: 'Sprint planning',  time: '2:00 PM',  color: '#10b981', subtitle: 'All-hands'  },
  { title: 'Client call',      time: '4:00 PM',  color: '#f59e0b', subtitle: 'Zoom'       },
];

function Header() {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Events</div>
    </div>
  );
}

export function UpcomingEvents({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    const ev = EVENTS[0];
    return (
      <div style={{ ...s, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, paddingLeft: 14 }}>{ev.time}</div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {EVENTS.slice(0, 3).map((ev) => (
            <div key={ev.title} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
              <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: 10 }}>{ev.time}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <Header />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
          {EVENTS.slice(0, 4).map((ev) => (
            <div key={ev.title} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{ev.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={s}>
      <Header />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        {EVENTS.map((ev) => (
          <div key={ev.title} style={{ display: 'flex', gap: 0 }}>
            <div style={{ width: 3, borderRadius: 2, background: ev.color, marginRight: 10, flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                {ev.time}{ev.subtitle ? ` · ${ev.subtitle}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register**

```ts
import { UpcomingEvents } from '@/components/widgets/content/upcoming-events';
// ContentComponent: UpcomingEvents,
```

- [ ] **Step 3: Commit**

```bash
git add components/widgets/content/upcoming-events.tsx lib/widgets/registry.ts
git commit -m "feat: add UpcomingEvents content component"
```

---

## Task 12: `mini-calendar` content component

**Files:**
- Create: `components/widgets/content/mini-calendar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/widgets/content/mini-calendar.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';

const MONTH = 'June';
const YEAR  = 2026;
const TODAY = 10;
const DAYS_IN_MONTH = 30;
const FIRST_DOW = 1; // 0=Sun, Monday=1 for June 2026
const EVENT_DAYS = new Set([3, 7, 10, 15, 18, 22, 25]);
const ACCENT = '#3b82f6';
const DOW_LABELS = ['M','T','W','T','F','S','S'];

function buildGrid(): (number | null)[][] {
  const rows: (number | null)[][] = [];
  let row: (number | null)[] = Array(FIRST_DOW).fill(null);
  for (let d = 1; d <= DAYS_IN_MONTH; d++) {
    row.push(d);
    if (row.length === 7) { rows.push(row); row = []; }
  }
  if (row.length > 0) { while (row.length < 7) row.push(null); rows.push(row); }
  return rows;
}
const GRID = buildGrid();

function MonthGrid({ showNav }: { showNav?: boolean }) {
  return (
    <div>
      {showNav && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600 }}>{MONTH} {YEAR}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 14, color: 'var(--muted)', cursor: 'default' }}>‹</span>
            <span style={{ fontSize: 14, color: 'var(--muted)', cursor: 'default' }}>›</span>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {DOW_LABELS.map((d) => (
          <div key={d} style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'center', paddingBottom: 2 }}>{d}</div>
        ))}
        {GRID.flat().map((day, i) => (
          <div key={i} style={{
            fontSize: 10, textAlign: 'center', padding: '2px 0',
            borderRadius: 4,
            background: day === TODAY ? ACCENT : 'transparent',
            color: day === TODAY ? '#fff' : day ? 'var(--text)' : 'transparent',
            position: 'relative',
          }}>
            {day ?? '·'}
            {day && EVENT_DAYS.has(day) && day !== TODAY && (
              <div style={{
                width: 3, height: 3, borderRadius: '50%', background: ACCENT,
                position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)',
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniCalendar({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={{ ...s, alignItems: 'flex-start', justifyContent: 'center', gap: 1 }}>
        <div style={{ fontSize: 10, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{MONTH.slice(0,3)}</div>
        <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{TODAY}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>Wednesday</div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT, marginTop: 4 }} />
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={{ ...s }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{MONTH} {YEAR}</div>
        <MonthGrid />
      </div>
    );
  }

  if (w === 3 && h === 2) {
    return (
      <div style={s}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{MONTH} {YEAR}</div>
        <MonthGrid />
      </div>
    );
  }

  // 3×3
  return (
    <div style={s}>
      <MonthGrid showNav />
    </div>
  );
}
```

- [ ] **Step 2: Register**

```ts
import { MiniCalendar } from '@/components/widgets/content/mini-calendar';
// ContentComponent: MiniCalendar,
```

- [ ] **Step 3: Commit**

```bash
git add components/widgets/content/mini-calendar.tsx lib/widgets/registry.ts
git commit -m "feat: add MiniCalendar content component"
```

---

## Task 13: `todays-schedule` content component

**Files:**
- Create: `components/widgets/content/todays-schedule.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/widgets/content/todays-schedule.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';

const TIMELINE = [
  { time: '9:00',  title: 'Team standup',    color: '#3b82f6', duration: 30  },
  { time: '10:00', title: 'Deep work',        color: '#8b5cf6', duration: 90  },
  { time: '11:30', title: 'Design review',    color: '#ec4899', duration: 60  },
  { time: '12:30', title: 'Lunch',            color: '#10b981', duration: 60  },
  { time: '2:00',  title: 'Sprint planning',  color: '#f59e0b', duration: 60  },
  { time: '3:00',  title: 'Client call',      color: '#3b82f6', duration: 45  },
  { time: '4:00',  title: 'Code review',      color: '#8b5cf6', duration: 30  },
];
const NOW_LABEL = '2:35';

export function TodaysSchedule({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  const visible = h <= 2 ? TIMELINE.slice(0, h === 1 ? 3 : 5) : TIMELINE;

  function EventRow({ ev }: { ev: typeof TIMELINE[0] }) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', minHeight: 36 }}>
        <div style={{ width: 36, textAlign: 'right', fontSize: 10, color: 'var(--muted)', paddingTop: 2, flexShrink: 0 }}>{ev.time}</div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
          <div style={{ width: 3, borderRadius: 2, background: ev.color }} />
          <div style={{ fontSize: 12, paddingTop: 2 }}>{ev.title}</div>
        </div>
      </div>
    );
  }

  if (w === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Today</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
          {visible.map((ev) => <EventRow key={ev.title} ev={ev} />)}
        </div>
      </div>
    );
  }

  const showNow = h >= 2;
  return (
    <div style={s}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Schedule</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden', position: 'relative' }}>
        {showNow && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
            <div style={{ width: 36, textAlign: 'right', fontSize: 10, color: '#38bdf8', flexShrink: 0 }}>{NOW_LABEL}</div>
            <div style={{ flex: 1, height: 1, background: '#38bdf8' }} />
          </div>
        )}
        {visible.map((ev) => <EventRow key={ev.title} ev={ev} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register**

```ts
import { TodaysSchedule } from '@/components/widgets/content/todays-schedule';
// ContentComponent: TodaysSchedule,
```

- [ ] **Step 3: Commit**

```bash
git add components/widgets/content/todays-schedule.tsx lib/widgets/registry.ts
git commit -m "feat: add TodaysSchedule content component"
```

---

## Task 14: `habit-tracker` content component

**Files:**
- Create: `components/widgets/content/habit-tracker.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/widgets/content/habit-tracker.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';

const ACCENT = '#10b981';
const HABITS = [
  { name: 'Morning run',        done: true  },
  { name: 'Read 30 min',        done: true  },
  { name: 'Meditate',           done: true  },
  { name: 'Limited Screentime', done: false },
  { name: 'Workout',            done: false },
];
const DONE_COUNT = HABITS.filter((h) => h.done).length;
const WEEK_DAYS = ['M','T','W','T','F','S','S'];
// Random-but-stable completion map for weekly heatmap
const WEEK_DONE: boolean[][] = HABITS.map((hab, hi) =>
  WEEK_DAYS.map((_, di) => (hi + di) % 3 !== 0)
);

function HabitDot({ size, done }: { size: number; done: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: done ? ACCENT : 'transparent',
      border: done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {done && (
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" fill="none">
          <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export function HabitTracker({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Habits</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>{DONE_COUNT}/{HABITS.length}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {HABITS.slice(0, 3).map((h) => <HabitDot key={h.name} size={20} done={h.done} />)}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {HABITS.slice(3).map((h) => <HabitDot key={h.name} size={20} done={h.done} />)}
          </div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={{ ...s, flexDirection: 'row', alignItems: 'center', gap: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: 'auto' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Habits</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: ACCENT, marginRight: 8 }}>{DONE_COUNT}/{HABITS.length}</div>
          {HABITS.map((h) => <HabitDot key={h.name} size={28} done={h.done} />)}
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Habits</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>Done</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: ACCENT }}>{DONE_COUNT}/{HABITS.length}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {HABITS.map((hab) => (
            <div key={hab.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HabitDot size={18} done={hab.done} />
              <span style={{ flex: 1, fontSize: 12 }}>{hab.name}</span>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: hab.done ? ACCENT : 'transparent',
                border: hab.done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
              }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={{ ...s, flexDirection: 'row', gap: 12 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Habits</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {HABITS.map((hab) => (
            <div key={hab.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: hab.done ? ACCENT : 'transparent',
                border: hab.done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
              }} />
              <span style={{ flex: 1, fontSize: 11 }}>{hab.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 1, background: 'var(--border-hairline)' }} />
      <div style={{ width: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          {WEEK_DAYS.map((d) => (
            <div key={d} style={{ fontSize: 8, color: 'var(--muted)', width: 10, textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        {HABITS.map((hab, hi) => (
          <div key={hab.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            {WEEK_DAYS.map((_, di) => (
              <div key={di} style={{
                width: 10, height: 10, borderRadius: 2,
                background: WEEK_DONE[hi][di] ? ACCENT : 'rgba(255,255,255,0.08)',
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register**

```ts
import { HabitTracker } from '@/components/widgets/content/habit-tracker';
// ContentComponent: HabitTracker,
```

- [ ] **Step 3: Commit**

```bash
git add components/widgets/content/habit-tracker.tsx lib/widgets/registry.ts
git commit -m "feat: add HabitTracker content component"
```

---

## Task 15: `weather` content component

**Files:**
- Create: `components/widgets/content/weather.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/widgets/content/weather.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';

const ACCENT = '#38bdf8';
const STATS = { temp: 72, condition: 'Sunny', feelsLike: 70, high: 78, low: 62, wind: '8 mph', humidity: '62%', uv: 6 };
const FORECAST = [
  { day: 'Thu', icon: '☀️', high: 76, low: 60 },
  { day: 'Fri', icon: '⛅', high: 71, low: 58 },
  { day: 'Sat', icon: '🌧️', high: 63, low: 55 },
  { day: 'Sun', icon: '⛅', high: 68, low: 57 },
  { day: 'Mon', icon: '☀️', high: 74, low: 61 },
];

function SunIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx={18} cy={18} r={7} fill="#ffd93d" />
      {[0,45,90,135,180,225,270,315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 18 + 10 * Math.cos(rad);
        const y1 = 18 + 10 * Math.sin(rad);
        const x2 = 18 + 14 * Math.cos(rad);
        const y2 = 18 + 14 * Math.sin(rad);
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffd93d" strokeWidth={2} strokeLinecap="round" />;
      })}
    </svg>
  );
}

export function Weather({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SunIcon size={24} />
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>SF</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>{STATS.temp}°</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{STATS.condition}</div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={{ ...s, flexDirection: 'row', alignItems: 'center', gap: 0 }}>
        {/* col 1: icon + condition */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 44 }}>
          <SunIcon size={36} />
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{STATS.condition}</div>
        </div>
        {/* col 2: temp + H/L */}
        <div style={{ flex: 1, paddingLeft: 8 }}>
          <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{STATS.temp}°</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>H:{STATS.high}° L:{STATS.low}°</div>
        </div>
        {/* col 3: city + feels like */}
        <div style={{ textAlign: 'right', fontSize: 11 }}>
          <div style={{ fontWeight: 600, lineHeight: 1.3 }}>San<br />Francisco</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Feels like {STATS.feelsLike}°</div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>San Francisco</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Weather</div>
          </div>
          <SunIcon size={28} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{STATS.temp}°</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{STATS.condition} · Feels like {STATS.feelsLike}°</div>
        </div>
        <div style={{ height: 1, background: 'var(--border-hairline)', margin: '8px 0' }} />
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'H', val: `${STATS.high}°` },
            { label: 'L', val: `${STATS.low}°`  },
            { label: 'Wind', val: STATS.wind     },
            { label: 'UV',   val: String(STATS.uv) },
          ].map((m) => (
            <div key={m.label} style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{m.val}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={s}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>San Francisco</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Weather</div>
        </div>
        <SunIcon size={28} />
        <div style={{ marginLeft: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>{STATS.temp}°</span>
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>{STATS.condition}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 11 }}>
          {[
            { label: 'H/L', val: `${STATS.high}°/${STATS.low}°` },
            { label: 'Wind',  val: STATS.wind   },
            { label: 'Hum',   val: STATS.humidity },
            { label: 'UV',    val: String(STATS.uv) },
          ].map((m) => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600 }}>{m.val}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--border-hairline)', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {FORECAST.map((day) => (
          <div key={day.day} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{day.day}</div>
            <div style={{ fontSize: 16, margin: '2px 0' }}>{day.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>{day.high}°</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{day.low}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register**

```ts
import { Weather } from '@/components/widgets/content/weather';
// ContentComponent: Weather,
```

- [ ] **Step 3: Commit**

```bash
git add components/widgets/content/weather.tsx lib/widgets/registry.ts
git commit -m "feat: add Weather content component"
```

---

## Task 16: `daily-note` content component

**Files:**
- Create: `components/widgets/content/daily-note.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/widgets/content/daily-note.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';

const ACCENT = '#6366f1';
const NOTE_TEXT = "Had a productive morning — finished the widget design spec and got sign-off. Need to follow up with the team about the sprint planning agenda and check in on the backend ticket.";
const CHECKLIST = [
  { text: 'Follow up on backend ticket', done: true  },
  { text: 'Sprint planning agenda',      done: true  },
  { text: 'Review PR #47',               done: false },
  { text: 'Team check-in at 3pm',        done: false },
];

function PencilIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CheckItem({ text, done }: { text: string; done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        background: done ? ACCENT : 'transparent',
        border: done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {done && <svg width={9} height={9} viewBox="0 0 12 12" fill="none">
          <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>}
      </div>
      <span style={{
        fontSize: 11,
        color: done ? 'var(--muted)' : 'var(--text)',
        textDecoration: done ? 'line-through' : 'none',
      }}>{text}</span>
    </div>
  );
}

export function DailyNote({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>Jun 10</div>
          <PencilIcon size={14} />
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text)',
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', lineHeight: 1.4,
        }}>{NOTE_TEXT}</div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>June 10</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Daily Note</div>
          </div>
          <PencilIcon size={16} />
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text)', overflow: 'hidden' }}>{NOTE_TEXT}</div>
      </div>
    );
  }

  if (w === 2 && h === 3) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>June 10</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Daily Note</div>
          </div>
          <PencilIcon size={16} />
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, flex: 1, overflow: 'hidden' }}>{NOTE_TEXT}</div>
        <div style={{ height: 1, background: 'var(--border-hairline)', margin: '8px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {CHECKLIST.slice(0, 3).map((item) => <CheckItem key={item.text} {...item} />)}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={{ ...s, flexDirection: 'row', gap: 12 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>June 10</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Daily Note</div>
          </div>
          <PencilIcon size={16} />
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, overflow: 'hidden', flex: 1 }}>{NOTE_TEXT}</div>
      </div>
      <div style={{ width: 1, background: 'var(--border-hairline)' }} />
      <div style={{ width: 130, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-start' }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Checklist</div>
        {CHECKLIST.map((item) => <CheckItem key={item.text} {...item} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register**

```ts
import { DailyNote } from '@/components/widgets/content/daily-note';
// ContentComponent: DailyNote,
```

- [ ] **Step 3: Run all tests**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add components/widgets/content/daily-note.tsx lib/widgets/registry.ts
git commit -m "feat: add DailyNote content component"
```

---

## Post-implementation checklist

- [ ] All 10 content components render without errors in the browser
- [ ] Resizing a widget snaps only to its `supportedSizes` presets
- [ ] Adding a widget from the palette or carousel creates a widget with the correct `widgetType`
- [ ] Refreshing the page with an old board (no `widgetType`) migrates correctly — each widget shows its default content component
- [ ] Category filter chips in carousel show 4 chips (Finance, Health, Calendar, Lifestyle) — no duplicates
- [ ] `npx vitest run` passes fully
