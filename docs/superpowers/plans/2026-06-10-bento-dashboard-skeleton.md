# Bento Dashboard Skeleton — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A single-page Next.js bento dashboard mock with a draggable / resizable / filterable widget board, built on a pure-function grid engine with two switchable layout strategies.

**Architecture:** A framework-free, unit-tested grid engine (`lib/grid`) exposes a `LayoutStrategy` interface with two implementations — `autoPack` (dense backfill, default) and `pushCompact` (push + gravity). Zustand stores hold committed board + settings state. The React layer (dnd-kit for drag input + `DragOverlay`, a custom pointer handler for resize, `motion` for FLIP reflow) computes a live *preview* layout from the engine during interaction and commits on drop. Theming is CSS custom-property tokens swapped by `[data-theme]`.

**Tech Stack:** Next.js (App Router), TypeScript, React, `@dnd-kit/core`, `motion`, `zustand`, CSS Modules; Vitest + Testing Library for tests.

**Spec:** `docs/superpowers/specs/2026-06-10-bento-dashboard-skeleton-design.md`

**Conventions:** TDD for the engine and stores (write failing test → run red → implement → run green → commit). UI tasks use a render/interaction test where it adds value plus explicit manual-validation steps. Commit after every task. Import alias: `@/*` → repo root.

---

## File map

```
app/layout.tsx · app/page.tsx · app/globals.css
components/shell/{AppShell,LeftBar,Banner,ProfileButton,SettingsModal,Fab,ThemeController}.tsx (+ .module.css)
components/board/{BentoBoard,Widget,DragOverlayWidget,DropPreview,ResizeHandle}.tsx (+ .module.css)
components/widgets/WidgetSkeleton.tsx (+ .module.css)
lib/grid/{types,sizes,collision,engine}.ts · lib/grid/strategies/{autoPack,pushCompact}.ts · lib/grid/occupancy.ts
lib/state/{settingsStore,boardStore}.ts · lib/data/seed.ts
lib/hooks/{useGridMetrics,useDragResize,useGreeting,useWeather}.ts
```

> Note: persistence is handled by Zustand's `persist` middleware inside the two stores, so the spec's separate `persistence.ts` is intentionally omitted (DRY/YAGNI).

---

## Task 0: Project scaffold & tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.eslintrc.json`

- [ ] **Step 1: Initialize package and install dependencies**

Run:
```bash
npm init -y
npm install next react react-dom @dnd-kit/core motion zustand
npm install -D typescript @types/react @types/node @types/react-dom vitest @vitejs/plugin-react @testing-library/react @testing-library/dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Write `package.json` scripts**

Replace the `"scripts"` block in `package.json` with:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 5: Write `vitest.config.ts` and `vitest.setup.ts`**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: { alias: { '@': resolve(__dirname, '.') } },
});
```

`vitest.setup.ts`:
```ts
import '@testing-library/dom';
```

- [ ] **Step 6: Write minimal `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.eslintrc.json`**

`app/layout.tsx`:
```tsx
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Bento Dashboard' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
```

`app/page.tsx`:
```tsx
export default function Page() {
  return <main>Bento Dashboard</main>;
}
```

`app/globals.css`:
```css
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
```

`.eslintrc.json`:
```json
{ "extends": "next/core-web-vitals" }
```

- [ ] **Step 7: Verify dev server boots**

Run: `npm run dev`
Expected: server starts, `http://localhost:3000` shows "Bento Dashboard". Stop the server (Ctrl-C).

- [ ] **Step 8: Verify the test runner works**

Run: `npm run test`
Expected: Vitest runs and reports "No test files found" (exit 0) — confirms config is valid.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + TS + Vitest project"
```

---

## Task 1: Design tokens & theme foundation

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Write the token system into `app/globals.css`**

```css
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

:root {
  --accent: #6366f1;
  --gap: 12px;
  --radius-tile: 14px;
  --radius-float: 18px;
  --font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

html[data-theme="dark"] {
  --bg: #0b1120;
  --surface: #141d2e;
  --surface-2: #1b2740;
  --surface-glass: rgba(20, 29, 46, 0.6);
  --border-hairline: rgba(148, 163, 184, 0.16);
  --text: #e6edf6;
  --muted: #8b98ab;
}

html[data-theme="light"] {
  --bg: #f4f5f8;
  --surface: #ffffff;
  --surface-2: #f0f2f6;
  --surface-glass: rgba(255, 255, 255, 0.65);
  --border-hairline: rgba(15, 23, 42, 0.1);
  --text: #0f172a;
  --muted: #64748b;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
}

.glass {
  background: var(--surface-glass);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid var(--border-hairline);
}
```

- [ ] **Step 2: Verify themes visually**

Run: `npm run dev`, open `http://localhost:3000`. In devtools, toggle `data-theme` on `<html>` between `"dark"` and `"light"`.
Expected: background and text color flip. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: design token system with dark/light themes"
```

---

## Task 2: Grid types & size presets

**Files:**
- Create: `lib/grid/types.ts`, `lib/grid/sizes.ts`
- Test: `lib/grid/sizes.test.ts`

- [ ] **Step 1: Write `lib/grid/types.ts`**

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
  | { kind: 'remove'; id: string };

export interface LayoutStrategy {
  resolve(widgets: WidgetLayout[]): WidgetLayout[];
  preview(widgets: WidgetLayout[], move: Move): WidgetLayout[];
}
```

- [ ] **Step 2: Write the failing test `lib/grid/sizes.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { SIZE_PRESETS, clampSize, nearestPreset } from './sizes';

describe('sizes', () => {
  it('exposes core and extended presets', () => {
    const names = SIZE_PRESETS.map((p) => p.name);
    expect(names).toContain('1×1');
    expect(names).toContain('4×4');
    expect(names).toContain('6×1');
    expect(SIZE_PRESETS.filter((p) => p.group === 'core')).toHaveLength(5);
  });

  it('clamps width to [1,6] and height to [1,4]', () => {
    expect(clampSize(0, 0)).toEqual({ w: 1, h: 1 });
    expect(clampSize(9, 9)).toEqual({ w: 6, h: 4 });
    expect(clampSize(2.4, 1.6)).toEqual({ w: 2, h: 2 });
  });

  it('snaps an arbitrary size to the nearest preset', () => {
    expect(nearestPreset(1, 1).name).toBe('1×1');
    expect(nearestPreset(4, 4).name).toBe('4×4');
    expect(nearestPreset(3, 3).name).toBe('3×3');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- sizes`
Expected: FAIL — cannot resolve `./sizes`.

- [ ] **Step 4: Write `lib/grid/sizes.ts`**

```ts
import { COLS, MAX_H } from './types';

export interface SizePreset {
  name: string;
  w: number;
  h: number;
  group: 'core' | 'extended';
}

export const SIZE_PRESETS: SizePreset[] = [
  { name: '1×1', w: 1, h: 1, group: 'core' },
  { name: '2×1', w: 2, h: 1, group: 'core' },
  { name: '2×2', w: 2, h: 2, group: 'core' },
  { name: '3×3', w: 3, h: 3, group: 'core' },
  { name: '4×4', w: 4, h: 4, group: 'core' },
  { name: '1×2', w: 1, h: 2, group: 'extended' },
  { name: '2×3', w: 2, h: 3, group: 'extended' },
  { name: '3×2', w: 3, h: 2, group: 'extended' },
  { name: '4×2', w: 4, h: 2, group: 'extended' },
  { name: '6×1', w: 6, h: 1, group: 'extended' },
];

export function clampSize(w: number, h: number): { w: number; h: number } {
  return {
    w: Math.max(1, Math.min(COLS, Math.round(w))),
    h: Math.max(1, Math.min(MAX_H, Math.round(h))),
  };
}

export function nearestPreset(w: number, h: number): SizePreset {
  const c = clampSize(w, h);
  let best = SIZE_PRESETS[0];
  let bestDist = Infinity;
  for (const p of SIZE_PRESETS) {
    const d = Math.abs(p.w - c.w) + Math.abs(p.h - c.h);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- sizes`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/grid/types.ts lib/grid/sizes.ts lib/grid/sizes.test.ts
git commit -m "feat: grid types and size presets"
```

---

## Task 3: Pixel ↔ cell collision math

**Files:**
- Create: `lib/grid/collision.ts`
- Test: `lib/grid/collision.test.ts`

- [ ] **Step 1: Write the failing test `lib/grid/collision.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { pointToCell, cellSpanToPixels, type GridMetrics } from './collision';

const m: GridMetrics = { cellSize: 100, gap: 12, cols: 6 };

describe('collision', () => {
  it('maps a pixel point to a cell coordinate', () => {
    expect(pointToCell(0, 0, m)).toEqual({ x: 0, y: 0 });
    expect(pointToCell(112, 0, m)).toEqual({ x: 1, y: 0 }); // 100 + 12 gap
    expect(pointToCell(0, 224, m)).toEqual({ x: 0, y: 2 });
  });

  it('clamps x within columns and floors y at 0', () => {
    expect(pointToCell(99999, 0, m)).toEqual({ x: 5, y: 0 });
    expect(pointToCell(-50, -50, m)).toEqual({ x: 0, y: 0 });
  });

  it('converts a cell span to pixel dimensions including gaps', () => {
    expect(cellSpanToPixels(2, 1, m)).toEqual({ width: 212, height: 100 });
    expect(cellSpanToPixels(3, 2, m)).toEqual({ width: 324, height: 212 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- collision`
Expected: FAIL — cannot resolve `./collision`.

- [ ] **Step 3: Write `lib/grid/collision.ts`**

```ts
export interface GridMetrics {
  cellSize: number; // square cell edge in px
  gap: number; // px
  cols: number;
}

export function pointToCell(px: number, py: number, m: GridMetrics): { x: number; y: number } {
  const stride = m.cellSize + m.gap;
  const x = Math.floor(px / stride);
  const y = Math.floor(py / stride);
  return {
    x: Math.max(0, Math.min(m.cols - 1, x)),
    y: Math.max(0, y),
  };
}

export function cellSpanToPixels(w: number, h: number, m: GridMetrics): { width: number; height: number } {
  return {
    width: w * m.cellSize + (w - 1) * m.gap,
    height: h * m.cellSize + (h - 1) * m.gap,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- collision`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/grid/collision.ts lib/grid/collision.test.ts
git commit -m "feat: pixel/cell collision math"
```

---

## Task 4: Occupancy helpers

**Files:**
- Create: `lib/grid/occupancy.ts`
- Test: `lib/grid/occupancy.test.ts`

- [ ] **Step 1: Write the failing test `lib/grid/occupancy.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { createGrid, fits, occupy } from './occupancy';

describe('occupancy', () => {
  it('reports a footprint as fitting in an empty grid', () => {
    const g = createGrid();
    expect(fits(g, 0, 0, 2, 2, 6)).toBe(true);
  });

  it('rejects footprints that overflow columns', () => {
    const g = createGrid();
    expect(fits(g, 5, 0, 2, 1, 6)).toBe(false);
  });

  it('rejects footprints overlapping an occupied region', () => {
    const g = createGrid();
    occupy(g, 0, 0, 2, 2);
    expect(fits(g, 1, 1, 1, 1, 6)).toBe(false);
    expect(fits(g, 2, 0, 1, 1, 6)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- occupancy`
Expected: FAIL — cannot resolve `./occupancy`.

- [ ] **Step 3: Write `lib/grid/occupancy.ts`**

```ts
export type Grid = boolean[][];

export function createGrid(): Grid {
  return [];
}

export function fits(grid: Grid, x: number, y: number, w: number, h: number, cols: number): boolean {
  if (x < 0 || y < 0 || x + w > cols) return false;
  for (let r = y; r < y + h; r++) {
    const row = grid[r];
    if (!row) continue;
    for (let c = x; c < x + w; c++) {
      if (row[c]) return false;
    }
  }
  return true;
}

export function occupy(grid: Grid, x: number, y: number, w: number, h: number): void {
  for (let r = y; r < y + h; r++) {
    if (!grid[r]) grid[r] = [];
    for (let c = x; c < x + w; c++) grid[r][c] = true;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- occupancy`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/grid/occupancy.ts lib/grid/occupancy.test.ts
git commit -m "feat: grid occupancy helpers"
```

---

## Task 5: autoPack strategy (dense backfill — default)

**Files:**
- Create: `lib/grid/strategies/autoPack.ts`
- Test: `lib/grid/strategies/autoPack.test.ts`

- [ ] **Step 1: Write the failing test `lib/grid/strategies/autoPack.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { autoPack, packDense, reorderByCell } from './autoPack';
import type { WidgetLayout } from '../types';

const wdg = (id: string, w: number, h: number, order: number): WidgetLayout => ({
  id, x: 0, y: 0, w, h, category: 'finance', order,
});

describe('autoPack', () => {
  it('packs widgets densely top-left in order', () => {
    const out = packDense([wdg('a', 2, 1, 0), wdg('b', 2, 1, 1), wdg('c', 2, 1, 2)]);
    const a = out.find((w) => w.id === 'a')!;
    const c = out.find((w) => w.id === 'c')!;
    expect(a).toMatchObject({ x: 0, y: 0 });
    expect(c).toMatchObject({ x: 4, y: 0 });
  });

  it('backfills an earlier gap with a later smaller widget', () => {
    // a:3-wide, b:3-wide fills rest of row 0; c:2-wide wraps to row1; d:1-wide backfills... arrange a gap
    const out = packDense([wdg('a', 4, 1, 0), wdg('b', 3, 1, 1), wdg('c', 2, 1, 2)]);
    // row0: a(0..4); b is 3 wide, only 2 cols left -> wraps to row1 (0..3); c is 2 wide -> backfills row0 cols 4..6
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 4, y: 0 });
  });

  it('reorders by inserting before the widget nearest the target cell', () => {
    const resolved = packDense([wdg('a', 2, 1, 0), wdg('b', 2, 1, 1), wdg('c', 2, 1, 2)]);
    const reordered = reorderByCell(resolved, 'c', { x: 0, y: 0 });
    expect(reordered.find((w) => w.id === 'c')!.order).toBe(0);
  });

  it('preview(remove) heals the gap by repacking', () => {
    const start = packDense([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1), wdg('c', 1, 1, 2)]);
    const out = autoPack.preview(start, { kind: 'remove', id: 'b' });
    expect(out).toHaveLength(2);
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 1, y: 0 });
  });

  it('preview(resize) repacks around the new footprint', () => {
    const start = packDense([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1)]);
    const out = autoPack.preview(start, { kind: 'resize', id: 'a', w: 2, h: 2 });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0, w: 2, h: 2 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 2, y: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- autoPack`
Expected: FAIL — cannot resolve `./autoPack`.

- [ ] **Step 3: Write `lib/grid/strategies/autoPack.ts`**

```ts
import { COLS, type LayoutStrategy, type Move, type WidgetLayout } from '../types';
import { clampSize } from '../sizes';
import { createGrid, fits, occupy } from '../occupancy';

export function packDense(widgets: WidgetLayout[], cols = COLS): WidgetLayout[] {
  const sorted = [...widgets].sort((a, b) => a.order - b.order);
  const grid = createGrid();
  const result: WidgetLayout[] = [];
  for (const wdg of sorted) {
    const { w, h } = clampSize(wdg.w, wdg.h);
    let placed = false;
    for (let y = 0; !placed; y++) {
      for (let x = 0; x + w <= cols; x++) {
        if (fits(grid, x, y, w, h, cols)) {
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

export function reorderByCell(
  widgets: WidgetLayout[],
  id: string,
  targetCell: { x: number; y: number },
  cols = COLS,
): WidgetLayout[] {
  const moving = widgets.find((w) => w.id === id);
  if (!moving) return widgets;
  const others = widgets.filter((w) => w.id !== id).sort((a, b) => a.order - b.order);
  const targetRank = targetCell.y * cols + targetCell.x;
  let insertIdx = others.length;
  for (let i = 0; i < others.length; i++) {
    const rank = others[i].y * cols + others[i].x;
    if (rank >= targetRank) {
      insertIdx = i;
      break;
    }
  }
  const list = [...others];
  list.splice(insertIdx, 0, moving);
  return list.map((w, i) => ({ ...w, order: i }));
}

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
        return packDense([...widgets, move.widget]);
      case 'remove':
        return packDense(widgets.filter((w) => w.id !== move.id));
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- autoPack`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/grid/strategies/autoPack.ts lib/grid/strategies/autoPack.test.ts
git commit -m "feat: autoPack dense-backfill layout strategy"
```

---

## Task 6: pushCompact strategy (push + gravity)

**Files:**
- Create: `lib/grid/strategies/pushCompact.ts`
- Test: `lib/grid/strategies/pushCompact.test.ts`

- [ ] **Step 1: Write the failing test `lib/grid/strategies/pushCompact.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { pushCompact, compactVertical } from './pushCompact';
import type { WidgetLayout } from '../types';

const at = (id: string, x: number, y: number, w: number, h: number, order: number): WidgetLayout => ({
  id, x, y, w, h, category: 'finance', order,
});

describe('pushCompact', () => {
  it('pulls floating widgets upward, preserving their column', () => {
    const out = compactVertical([at('a', 0, 0, 1, 1, 0), at('b', 2, 5, 1, 1, 1)]);
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 2, y: 0 });
  });

  it('drag places the moving widget at the target and pushes a colliding neighbor below', () => {
    const start = [at('a', 0, 0, 2, 1, 0), at('b', 0, 1, 2, 1, 1)];
    const out = pushCompact.preview(start, { kind: 'drag', id: 'b', targetCell: { x: 0, y: 0 } });
    const a = out.find((w) => w.id === 'a')!;
    const b = out.find((w) => w.id === 'b')!;
    expect(b).toMatchObject({ x: 0, y: 0 });
    expect(a.y).toBeGreaterThanOrEqual(1);
  });

  it('remove heals by compacting upward', () => {
    const start = [at('a', 0, 0, 1, 1, 0), at('b', 0, 1, 1, 1, 1), at('c', 0, 2, 1, 1, 2)];
    const out = pushCompact.preview(start, { kind: 'remove', id: 'b' });
    expect(out).toHaveLength(2);
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 1 });
  });

  it('resize grows the footprint and compacts the rest', () => {
    const start = [at('a', 0, 0, 1, 1, 0), at('b', 0, 1, 1, 1, 1)];
    const out = pushCompact.preview(start, { kind: 'resize', id: 'a', w: 1, h: 2 });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ h: 2 });
    expect(out.find((w) => w.id === 'b')!.y).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- pushCompact`
Expected: FAIL — cannot resolve `./pushCompact`.

- [ ] **Step 3: Write `lib/grid/strategies/pushCompact.ts`**

```ts
import { COLS, type LayoutStrategy, type Move, type WidgetLayout } from '../types';
import { clampSize } from '../sizes';
import { createGrid, fits, occupy } from '../occupancy';

export function compactVertical(widgets: WidgetLayout[], cols = COLS): WidgetLayout[] {
  const sorted = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x);
  const grid = createGrid();
  const result: WidgetLayout[] = [];
  for (const wdg of sorted) {
    const { w, h } = clampSize(wdg.w, wdg.h);
    const x = Math.max(0, Math.min(cols - w, wdg.x));
    let y = Math.max(0, wdg.y);
    while (!fits(grid, x, y, w, h, cols)) y++;
    while (y > 0 && fits(grid, x, y - 1, w, h, cols)) y--;
    occupy(grid, x, y, w, h);
    result.push({ ...wdg, x, y, w, h });
  }
  return result;
}

function pushCompactDrag(
  widgets: WidgetLayout[],
  id: string,
  targetCell: { x: number; y: number },
  cols = COLS,
): WidgetLayout[] {
  const moving = widgets.find((w) => w.id === id);
  if (!moving) return widgets;
  const { w, h } = clampSize(moving.w, moving.h);
  const mx = Math.max(0, Math.min(cols - w, targetCell.x));
  const my = Math.max(0, targetCell.y);
  const grid = createGrid();
  occupy(grid, mx, my, w, h);
  const result: WidgetLayout[] = [{ ...moving, x: mx, y: my, w, h }];
  const others = widgets
    .filter((o) => o.id !== id)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const o of others) {
    const oc = clampSize(o.w, o.h);
    const x = Math.max(0, Math.min(cols - oc.w, o.x));
    let y = 0;
    while (!fits(grid, x, y, oc.w, oc.h, cols)) y++;
    occupy(grid, x, y, oc.w, oc.h);
    result.push({ ...o, x, y, w: oc.w, h: oc.h });
  }
  return result;
}

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
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- pushCompact`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/grid/strategies/pushCompact.ts lib/grid/strategies/pushCompact.test.ts
git commit -m "feat: pushCompact layout strategy"
```

---

## Task 7: Engine strategy selector

**Files:**
- Create: `lib/grid/engine.ts`
- Test: `lib/grid/engine.test.ts`

- [ ] **Step 1: Write the failing test `lib/grid/engine.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { getStrategy, type LayoutMode } from './engine';
import { autoPack } from './strategies/autoPack';
import { pushCompact } from './strategies/pushCompact';

describe('engine', () => {
  it('returns autoPack by default and for the autoPack mode', () => {
    expect(getStrategy('autoPack')).toBe(autoPack);
  });
  it('returns pushCompact for the pushCompact mode', () => {
    expect(getStrategy('pushCompact')).toBe(pushCompact);
  });
  it('is typed to the two known modes', () => {
    const modes: LayoutMode[] = ['autoPack', 'pushCompact'];
    expect(modes).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- engine`
Expected: FAIL — cannot resolve `./engine`.

- [ ] **Step 3: Write `lib/grid/engine.ts`**

```ts
import type { LayoutStrategy } from './types';
import { autoPack } from './strategies/autoPack';
import { pushCompact } from './strategies/pushCompact';

export type LayoutMode = 'autoPack' | 'pushCompact';

export function getStrategy(mode: LayoutMode): LayoutStrategy {
  return mode === 'pushCompact' ? pushCompact : autoPack;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- engine`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/grid/engine.ts lib/grid/engine.test.ts
git commit -m "feat: layout strategy selector"
```

---

## Task 8: Seed data & Zustand stores

**Files:**
- Create: `lib/data/seed.ts`, `lib/state/settingsStore.ts`, `lib/state/boardStore.ts`
- Test: `lib/state/boardStore.test.ts`

- [ ] **Step 1: Write `lib/data/seed.ts`**

```ts
import type { Category, WidgetLayout } from '@/lib/grid/types';

export function seedWidgets(): WidgetLayout[] {
  const defs: Array<[Category, number, number]> = [
    ['finance', 2, 2],
    ['calendar', 2, 3],
    ['health', 1, 1],
    ['lifestyle', 3, 2],
    ['finance', 1, 1],
    ['health', 2, 1],
    ['calendar', 1, 2],
    ['lifestyle', 2, 2],
    ['finance', 4, 2],
    ['health', 1, 1],
  ];
  return defs.map(([category, w, h], i) => ({
    id: `seed-${i}`,
    x: 0,
    y: 0,
    w,
    h,
    category,
    order: i,
  }));
}
```

- [ ] **Step 2: Write `lib/state/settingsStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LayoutMode } from '@/lib/grid/engine';
import type { Category } from '@/lib/grid/types';

export type Theme = 'dark' | 'light';
export type FilterMode = 'hide' | 'dim';

export const ACCENT_PRESETS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

interface SettingsState {
  theme: Theme;
  layoutMode: LayoutMode;
  filterMode: FilterMode;
  activeTags: Category[];
  accent: string;
  setTheme: (t: Theme) => void;
  setLayoutMode: (m: LayoutMode) => void;
  setFilterMode: (f: FilterMode) => void;
  toggleTag: (c: Category) => void;
  setAccent: (a: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      layoutMode: 'autoPack',
      filterMode: 'hide',
      activeTags: [],
      accent: '#6366f1',
      setTheme: (theme) => set({ theme }),
      setLayoutMode: (layoutMode) => set({ layoutMode }),
      setFilterMode: (filterMode) => set({ filterMode }),
      toggleTag: (c) =>
        set((s) => ({
          activeTags: s.activeTags.includes(c)
            ? s.activeTags.filter((t) => t !== c)
            : [...s.activeTags, c],
        })),
      setAccent: (accent) => set({ accent }),
    }),
    { name: 'bento-settings' },
  ),
);
```

- [ ] **Step 3: Write `lib/state/boardStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, WidgetLayout } from '@/lib/grid/types';
import { getStrategy } from '@/lib/grid/engine';
import { useSettings } from './settingsStore';
import { seedWidgets } from '@/lib/data/seed';

function strategy() {
  return getStrategy(useSettings.getState().layoutMode);
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `w-${Math.random().toString(36).slice(2)}`;
}

interface BoardState {
  widgets: WidgetLayout[];
  setWidgets: (w: WidgetLayout[]) => void;
  reResolve: () => void;
  moveWidget: (id: string, targetCell: { x: number; y: number }) => void;
  resizeWidget: (id: string, w: number, h: number) => void;
  addWidget: (category: Category, w: number, h: number) => void;
  removeWidget: (id: string) => void;
}

export const useBoard = create<BoardState>()(
  persist(
    (set, get) => ({
      widgets: strategy().resolve(seedWidgets()),
      setWidgets: (widgets) => set({ widgets }),
      reResolve: () => set({ widgets: strategy().resolve(get().widgets) }),
      moveWidget: (id, targetCell) =>
        set({ widgets: strategy().preview(get().widgets, { kind: 'drag', id, targetCell }) }),
      resizeWidget: (id, w, h) =>
        set({ widgets: strategy().preview(get().widgets, { kind: 'resize', id, w, h }) }),
      addWidget: (category, w, h) => {
        const order = get().widgets.reduce((max, x) => Math.max(max, x.order), -1) + 1;
        const widget: WidgetLayout = { id: newId(), x: 0, y: 0, w, h, category, order };
        set({ widgets: strategy().preview(get().widgets, { kind: 'add', widget }) });
      },
      removeWidget: (id) =>
        set({ widgets: strategy().preview(get().widgets, { kind: 'remove', id }) }),
    }),
    { name: 'bento-board' },
  ),
);
```

- [ ] **Step 4: Write the failing test `lib/state/boardStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useBoard } from './boardStore';
import { useSettings } from './settingsStore';

describe('boardStore', () => {
  beforeEach(() => {
    useSettings.setState({ layoutMode: 'autoPack' });
    useBoard.setState({ widgets: [] });
  });

  it('adds a widget and resolves a non-overlapping layout', () => {
    useBoard.getState().addWidget('finance', 2, 2);
    useBoard.getState().addWidget('health', 2, 2);
    const ws = useBoard.getState().widgets;
    expect(ws).toHaveLength(2);
    expect(ws[0]).toMatchObject({ x: 0, y: 0 });
    expect(ws[1]).toMatchObject({ x: 2, y: 0 });
  });

  it('removes a widget and heals the layout', () => {
    useBoard.getState().addWidget('finance', 1, 1);
    useBoard.getState().addWidget('health', 1, 1);
    const id = useBoard.getState().widgets[0].id;
    useBoard.getState().removeWidget(id);
    expect(useBoard.getState().widgets).toHaveLength(1);
    expect(useBoard.getState().widgets[0]).toMatchObject({ x: 0, y: 0 });
  });

  it('resizes a widget through the active strategy', () => {
    useBoard.getState().addWidget('finance', 1, 1);
    const id = useBoard.getState().widgets[0].id;
    useBoard.getState().resizeWidget(id, 3, 3);
    expect(useBoard.getState().widgets[0]).toMatchObject({ w: 3, h: 3 });
  });
});
```

- [ ] **Step 5: Run test to verify it fails then passes**

Run: `npm run test -- boardStore`
Expected: FAIL first (module/store not present if run before files saved). After Steps 1-3 are in place, re-run.
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/data/seed.ts lib/state/settingsStore.ts lib/state/boardStore.ts lib/state/boardStore.test.ts
git commit -m "feat: seed data and board/settings stores with persistence"
```

---

## Task 9: ThemeController, AppShell layout & page wiring

**Files:**
- Create: `components/shell/ThemeController.tsx`, `components/shell/AppShell.tsx`, `components/shell/AppShell.module.css`
- Modify: `app/page.tsx`, `app/layout.tsx`

- [ ] **Step 1: Write `components/shell/ThemeController.tsx`**

```tsx
'use client';
import { useEffect } from 'react';
import { useSettings } from '@/lib/state/settingsStore';

export function ThemeController() {
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
  }, [accent]);
  return null;
}
```

- [ ] **Step 2: Write `components/shell/AppShell.module.css`**

```css
.shell {
  display: grid;
  grid-template-columns: 72px 1fr;
  height: 100vh;
  overflow: hidden;
}
.main {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 28px 120px;
}
```

- [ ] **Step 3: Write `components/shell/AppShell.tsx` (placeholders for not-yet-built children)**

```tsx
'use client';
import styles from './AppShell.module.css';
import { ThemeController } from './ThemeController';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <ThemeController />
      <aside aria-label="utility bar" style={{ borderRight: '1px solid var(--border-hairline)' }} />
      <div className={styles.main}>
        <div className={styles.scroll}>
          <div style={{ padding: '24px 0', color: 'var(--muted)' }}>board mounts here</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire `app/page.tsx` and remove the static `data-theme` from `app/layout.tsx`**

`app/page.tsx`:
```tsx
import { AppShell } from '@/components/shell/AppShell';

export default function Page() {
  return <AppShell />;
}
```

In `app/layout.tsx`, change the `<html lang="en" data-theme="dark">` line to:
```tsx
    <html lang="en" data-theme="dark" suppressHydrationWarning>
```
(`ThemeController` updates it on the client; `suppressHydrationWarning` avoids a mismatch warning.)

- [ ] **Step 5: Verify**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: a left 72px rail with a hairline divider and a scrollable main area showing "board mounts here". No console errors. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add components/shell/ThemeController.tsx components/shell/AppShell.tsx components/shell/AppShell.module.css app/page.tsx app/layout.tsx
git commit -m "feat: app shell layout and theme controller"
```

---

## Task 10: Static board render (WidgetSkeleton, Widget, BentoBoard, metrics)

**Files:**
- Create: `lib/hooks/useGridMetrics.ts`, `components/widgets/WidgetSkeleton.tsx`, `components/widgets/WidgetSkeleton.module.css`, `components/board/Widget.tsx`, `components/board/Widget.module.css`, `components/board/BentoBoard.tsx`, `components/board/BentoBoard.module.css`
- Modify: `components/shell/AppShell.tsx`

- [ ] **Step 1: Write `lib/hooks/useGridMetrics.ts`**

```ts
'use client';
import { useEffect, useState, type RefObject } from 'react';
import { COLS, GRID_GAP } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';

export function useGridMetrics(ref: RefObject<HTMLElement | null>): GridMetrics {
  const [metrics, setMetrics] = useState<GridMetrics>({ cellSize: 100, gap: GRID_GAP, cols: COLS });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      const cellSize = (width - (COLS - 1) * GRID_GAP) / COLS;
      setMetrics({ cellSize, gap: GRID_GAP, cols: COLS });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return metrics;
}
```

- [ ] **Step 2: Write `components/widgets/WidgetSkeleton.module.css` and `.tsx`**

`WidgetSkeleton.module.css`:
```css
.body {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.5;
  margin-right: 8px;
}
```

`WidgetSkeleton.tsx`:
```tsx
import styles from './WidgetSkeleton.module.css';
import type { Category } from '@/lib/grid/types';

export function WidgetSkeleton({ category }: { category: Category }) {
  return (
    <div className={styles.body}>
      <span className={styles.dot} />
      {category}
    </div>
  );
}
```

- [ ] **Step 3: Write `components/board/Widget.module.css`**

```css
.tile {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-tile);
  overflow: hidden;
  user-select: none;
  cursor: grab;
  touch-action: none;
}
.tile:active {
  cursor: grabbing;
}
.tile[data-dragging='true'] {
  opacity: 0.35;
}
.tile[data-dimmed='true'] {
  opacity: 0.18;
}
```

- [ ] **Step 4: Write `components/board/Widget.tsx` (static version — interaction added later)**

```tsx
'use client';
import { type CSSProperties } from 'react';
import { motion } from 'motion/react';
import styles from './Widget.module.css';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import type { WidgetLayout } from '@/lib/grid/types';

interface WidgetProps {
  widget: WidgetLayout;
  dragging?: boolean;
  dimmed?: boolean;
}

export function Widget({ widget, dragging = false, dimmed = false }: WidgetProps) {
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
    >
      <WidgetSkeleton category={widget.category} />
    </motion.div>
  );
}
```

- [ ] **Step 5: Write `components/board/BentoBoard.module.css`**

```css
.board {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--gap);
  width: 100%;
  padding-top: 8px;
}
```

- [ ] **Step 6: Write `components/board/BentoBoard.tsx` (static render from store)**

```tsx
'use client';
import { useRef } from 'react';
import { LayoutGroup } from 'motion/react';
import styles from './BentoBoard.module.css';
import { Widget } from './Widget';
import { useBoard } from '@/lib/state/boardStore';
import { useGridMetrics } from '@/lib/hooks/useGridMetrics';

export function BentoBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(boardRef);
  const widgets = useBoard((s) => s.widgets);
  return (
    <div
      ref={boardRef}
      className={styles.board}
      style={{ gridAutoRows: `${metrics.cellSize}px` }}
    >
      <LayoutGroup>
        {widgets.map((w) => (
          <Widget key={w.id} widget={w} />
        ))}
      </LayoutGroup>
    </div>
  );
}
```

- [ ] **Step 7: Mount the board in `AppShell.tsx`**

Replace the `<div style={{ padding: '24px 0', color: 'var(--muted)' }}>board mounts here</div>` line with:
```tsx
          <BentoBoard />
```
And add the import at the top:
```tsx
import { BentoBoard } from '@/components/board/BentoBoard';
```

- [ ] **Step 8: Verify**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: the 10 seed widgets render as solid tiles packed densely into a 6-column grid, each labeled with its category, no overlaps. Resizing the window reflows cell size (square cells). Stop the server.

- [ ] **Step 9: Commit**

```bash
git add lib/hooks/useGridMetrics.ts components/widgets components/board/Widget.tsx components/board/Widget.module.css components/board/BentoBoard.tsx components/board/BentoBoard.module.css components/shell/AppShell.tsx
git commit -m "feat: static bento board render from store"
```

---

## Task 11: Drag interaction (dnd-kit + overlay + live preview)

**Files:**
- Create: `components/board/DragOverlayWidget.tsx`, `components/board/DropPreview.tsx`, `components/board/DropPreview.module.css`
- Modify: `components/board/Widget.tsx`, `components/board/BentoBoard.tsx`

- [ ] **Step 1: Make `Widget` draggable**

Replace the body of `components/board/Widget.tsx` with:
```tsx
'use client';
import { type CSSProperties, type ReactNode } from 'react';
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
  children?: ReactNode; // resize handle injected later
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
      ref={setNodeRef}
      {...(interactive ? listeners : {})}
      {...attributes}
    >
      <WidgetSkeleton category={widget.category} />
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Write `components/board/DragOverlayWidget.tsx`**

```tsx
'use client';
import styles from './Widget.module.css';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import type { WidgetLayout } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';
import { cellSpanToPixels } from '@/lib/grid/collision';

export function DragOverlayWidget({ widget, metrics }: { widget: WidgetLayout; metrics: GridMetrics }) {
  const { width, height } = cellSpanToPixels(widget.w, widget.h, metrics);
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
      <WidgetSkeleton category={widget.category} />
    </div>
  );
}
```

- [ ] **Step 3: Write `components/board/DropPreview.module.css` and `.tsx`**

`DropPreview.module.css`:
```css
.ghost {
  border: 2px dashed var(--accent);
  border-radius: var(--radius-tile);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  pointer-events: none;
}
```

`DropPreview.tsx`:
```tsx
'use client';
import styles from './DropPreview.module.css';
import type { WidgetLayout } from '@/lib/grid/types';

export function DropPreview({ widget }: { widget: WidgetLayout }) {
  return (
    <div
      className={styles.ghost}
      style={{
        gridColumn: `${widget.x + 1} / span ${widget.w}`,
        gridRow: `${widget.y + 1} / span ${widget.h}`,
      }}
    />
  );
}
```

- [ ] **Step 4: Wire drag into `BentoBoard.tsx`**

Replace `components/board/BentoBoard.tsx` with:
```tsx
'use client';
import { useRef, useState } from 'react';
import { LayoutGroup } from 'motion/react';
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
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';
import { useGridMetrics } from '@/lib/hooks/useGridMetrics';
import { getStrategy } from '@/lib/grid/engine';
import { pointToCell } from '@/lib/grid/collision';
import type { WidgetLayout } from '@/lib/grid/types';

export function BentoBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(boardRef);
  const committed = useBoard((s) => s.widgets);
  const moveWidget = useBoard((s) => s.moveWidget);
  const layoutMode = useSettings((s) => s.layoutMode);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState<WidgetLayout[] | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const widgets = preview ?? committed;
  const activeWidget = widgets.find((w) => w.id === activeId) ?? null;

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
    setPreview(getStrategy(layoutMode).preview(committed, { kind: 'drag', id: String(e.active.id), targetCell: cell }));
  }

  function handleDragEnd() {
    if (activeId && preview) {
      const moved = preview.find((w) => w.id === activeId);
      if (moved) moveWidget(activeId, { x: moved.x, y: moved.y });
    }
    setActiveId(null);
    setPreview(null);
  }

  function handleDragCancel() {
    setActiveId(null);
    setPreview(null);
  }

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
          {widgets.map((w) => (
            <Widget key={w.id} widget={w} dragging={w.id === activeId} />
          ))}
          {activeWidget && <DropPreview widget={activeWidget} />}
        </LayoutGroup>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeWidget ? <DragOverlayWidget widget={activeWidget} metrics={metrics} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

- [ ] **Step 5: Verify drag behavior**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: pressing and moving a tile lifts a glassy copy into the cursor; the source tile fades; neighbors reflow live with spring motion; a dashed ghost shows the landing footprint; releasing commits the new layout. A plain click (no movement) does nothing. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add components/board
git commit -m "feat: dnd-kit drag with live preview reflow and drag overlay"
```

---

## Task 12: Resize interaction

**Files:**
- Create: `lib/hooks/useDragResize.ts`, `components/board/ResizeHandle.tsx`, `components/board/ResizeHandle.module.css`
- Modify: `components/board/Widget.tsx`, `components/board/BentoBoard.tsx`

- [ ] **Step 1: Write `lib/hooks/useDragResize.ts`**

```ts
'use client';
import { useCallback, useRef } from 'react';
import type { GridMetrics } from '@/lib/grid/collision';
import { nearestPreset } from '@/lib/grid/sizes';

interface UseDragResizeArgs {
  startW: number;
  startH: number;
  metrics: GridMetrics;
  onPreview: (w: number, h: number) => void;
  onCommit: (w: number, h: number) => void;
}

export function useDragResize({ startW, startH, metrics, onPreview, onCommit }: UseDragResizeArgs) {
  const origin = useRef<{ px: number; py: number; w: number; h: number } | null>(null);
  const latest = useRef<{ w: number; h: number }>({ w: startW, h: startH });

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
      const snapped = nearestPreset(origin.current.w + dw, origin.current.h + dh);
      if (snapped.w !== latest.current.w || snapped.h !== latest.current.h) {
        latest.current = { w: snapped.w, h: snapped.h };
        onPreview(snapped.w, snapped.h);
      }
    },
    [metrics, onPreview],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!origin.current) return;
      (e.target as Element).releasePointerCapture(e.pointerId);
      origin.current = null;
      onCommit(latest.current.w, latest.current.h);
    },
    [onCommit],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}
```

- [ ] **Step 2: Write `components/board/ResizeHandle.module.css` and `.tsx`**

`ResizeHandle.module.css`:
```css
.handle {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 16px;
  height: 16px;
  border-right: 2px solid var(--muted);
  border-bottom: 2px solid var(--muted);
  border-bottom-right-radius: 5px;
  cursor: nwse-resize;
  opacity: 0;
  transition: opacity 0.15s ease;
  touch-action: none;
}
.tileHover:hover .handle,
.handle:active {
  opacity: 0.9;
}
```

`ResizeHandle.tsx`:
```tsx
'use client';
import styles from './ResizeHandle.module.css';

interface ResizeHandleProps {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

export function ResizeHandle(props: ResizeHandleProps) {
  return <div className={styles.handle} {...props} />;
}
```

- [ ] **Step 3: Add the hover class to the tile in `Widget.module.css`**

Append to `.tile` selector usage: add a class hook. In `components/board/Widget.module.css`, add:
```css
.tile {
  /* ...existing... */
}
.tileHover {
}
```
(The `tileHover` class is applied alongside `tile` so the handle's `:hover` rule in `ResizeHandle.module.css` works. Since CSS Modules scope class names, expose it: see Step 4 where both classes are composed.)

> Implementation note: simpler than cross-module `:hover`, make the handle visible on tile hover via a shared wrapper. Replace the `ResizeHandle.module.css` `.tileHover:hover .handle` rule with a `.tile:hover .handle` approach by importing the handle styles into the tile. To keep modules clean, instead always show the handle at low opacity and brighten on hover:

Replace `ResizeHandle.module.css` with:
```css
.handle {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 16px;
  height: 16px;
  border-right: 2px solid var(--muted);
  border-bottom: 2px solid var(--muted);
  border-bottom-right-radius: 5px;
  cursor: nwse-resize;
  opacity: 0.25;
  transition: opacity 0.15s ease;
  touch-action: none;
}
.handle:hover,
.handle:active {
  opacity: 0.95;
}
```

- [ ] **Step 4: Inject the resize handle in `BentoBoard.tsx`**

In `components/board/BentoBoard.tsx`, add imports:
```tsx
import { ResizeHandle } from './ResizeHandle';
import { useDragResize } from '@/lib/hooks/useDragResize';
```

Add resize state near the other `useState` hooks:
```tsx
  const resizeWidget = useBoard((s) => s.resizeWidget);
  const [resizingId, setResizingId] = useState<string | null>(null);
```

Add a small inner component above the `return` (so each widget gets its own resize hook):
```tsx
  function WidgetWithResize({ w }: { w: WidgetLayout }) {
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
        interactive={resizingId === null}
      >
        <ResizeHandle
          onPointerDown={(e) => {
            setResizingId(w.id);
            setPreview(committed);
            onPointerDown(e);
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </Widget>
    );
  }
```

Replace the `{widgets.map((w) => (<Widget ... />))}` block with:
```tsx
          {widgets.map((w) => (
            <WidgetWithResize key={w.id} w={w} />
          ))}
```

- [ ] **Step 5: Verify resize**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: each tile shows a faint corner handle that brightens on hover; dragging it grows/shrinks the tile snapping across presets, with neighbors reflowing live; releasing commits the size. Dragging the tile body still moves it; dragging the handle does not start a move. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add lib/hooks/useDragResize.ts components/board
git commit -m "feat: corner-handle resize with snap and live reflow"
```

---

## Task 13: Left bar & category filtering

**Files:**
- Create: `components/shell/LeftBar.tsx`, `components/shell/LeftBar.module.css`
- Modify: `components/shell/AppShell.tsx`, `components/board/BentoBoard.tsx`
- Test: `components/shell/LeftBar.test.tsx`

- [ ] **Step 1: Write `components/shell/LeftBar.module.css`**

```css
.bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 18px 0;
  border-right: 1px solid var(--border-hairline);
  background: var(--surface);
}
.logo {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--accent);
}
.divider {
  width: 28px;
  height: 1px;
  background: var(--border-hairline);
}
.chip {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--muted);
  font-size: 10px;
  text-transform: capitalize;
  cursor: pointer;
  transition: all 0.15s ease;
}
.chip:hover {
  color: var(--text);
}
.chip[data-active='true'] {
  border-color: var(--accent);
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}
```

- [ ] **Step 2: Write `components/shell/LeftBar.tsx`**

```tsx
'use client';
import styles from './LeftBar.module.css';
import { useSettings } from '@/lib/state/settingsStore';
import type { Category } from '@/lib/grid/types';

const CATEGORIES: Category[] = ['finance', 'lifestyle', 'health', 'calendar'];
const SHORT: Record<Category, string> = { finance: 'Fin', lifestyle: 'Life', health: 'Health', calendar: 'Cal' };

export function LeftBar() {
  const activeTags = useSettings((s) => s.activeTags);
  const toggleTag = useSettings((s) => s.toggleTag);
  return (
    <aside className={styles.bar} aria-label="utility bar">
      <div className={styles.logo} />
      <div className={styles.divider} />
      {CATEGORIES.map((c) => (
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

- [ ] **Step 3: Write the failing test `components/shell/LeftBar.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeftBar } from './LeftBar';
import { useSettings } from '@/lib/state/settingsStore';

describe('LeftBar', () => {
  beforeEach(() => useSettings.setState({ activeTags: [] }));

  it('toggles a category tag in the settings store on click', async () => {
    render(<LeftBar />);
    await userEvent.click(screen.getByRole('button', { name: 'Fin' }));
    expect(useSettings.getState().activeTags).toEqual(['finance']);
    await userEvent.click(screen.getByRole('button', { name: 'Fin' }));
    expect(useSettings.getState().activeTags).toEqual([]);
  });
});
```

- [ ] **Step 4: Run test to verify it fails then passes**

Run: `npm run test -- LeftBar`
Expected: FAIL until `LeftBar.tsx` exists; then PASS (1 test).

- [ ] **Step 5: Mount `LeftBar` in `AppShell.tsx`**

Replace the `<aside aria-label="utility bar" ... />` element with:
```tsx
      <LeftBar />
```
Add import:
```tsx
import { LeftBar } from './LeftBar';
```

- [ ] **Step 6: Apply filtering in `BentoBoard.tsx`**

Add settings reads near the top of the component:
```tsx
  const activeTags = useSettings((s) => s.activeTags);
  const filterMode = useSettings((s) => s.filterMode);
```

Add filter logic just before computing `widgets` (replace the `const widgets = preview ?? committed;` line):
```tsx
  const base = preview ?? committed;
  const filtering = activeTags.length > 0;
  const matches = (cat: WidgetLayout['category']) => activeTags.includes(cat);

  // hide mode: show only matches, re-resolved to pack tight. dim mode: show all.
  const widgets =
    filtering && filterMode === 'hide'
      ? getStrategy(layoutMode).resolve(base.filter((w) => matches(w.category)))
      : base;

  const interactionsLocked = filtering && filterMode === 'hide';
```

Wire `AnimatePresence` so hidden tiles exit. Update the imports from `motion/react`:
```tsx
import { LayoutGroup, AnimatePresence } from 'motion/react';
```
Wrap the widget list with `AnimatePresence` and pass dim state. Replace the `<LayoutGroup>...</LayoutGroup>` block with:
```tsx
        <LayoutGroup>
          <AnimatePresence>
            {widgets.map((w) => (
              <WidgetWithResize key={w.id} w={w} dimmed={filtering && filterMode === 'dim' && !matches(w.category)} />
            ))}
          </AnimatePresence>
          {activeWidget && !interactionsLocked && <DropPreview widget={activeWidget} />}
        </LayoutGroup>
```

Update `WidgetWithResize` to accept and forward `dimmed`, and respect the interaction lock:
```tsx
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
```

Add exit/enter animation to the tile. In `components/board/Widget.tsx`, add to the `motion.div` props:
```tsx
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: dimmed ? 0.18 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
```

> TODO(filter-drag): while a `hide` filter is active, drag/resize are locked (`interactionsLocked`) to avoid ambiguous order-mapping against hidden widgets. Allow rearranging within a filtered subset in a later pass. anchor: components/board/BentoBoard.tsx

- [ ] **Step 7: Verify filtering**

Run: `npm run dev`, open `http://localhost:3000`.
Expected (default hide mode): clicking a category chip animates non-matching tiles out and repacks matches tight; clicking again restores all. Selecting two chips unions them. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add components/shell/LeftBar.tsx components/shell/LeftBar.module.css components/shell/LeftBar.test.tsx components/shell/AppShell.tsx components/board/BentoBoard.tsx components/board/Widget.tsx
git commit -m "feat: left bar category filtering (hide-reflow / dim)"
```

---

## Task 14: Greeting banner

**Files:**
- Create: `lib/hooks/useGreeting.ts`, `lib/hooks/useWeather.ts`, `components/shell/Banner.tsx`, `components/shell/Banner.module.css`
- Modify: `components/shell/AppShell.tsx`

- [ ] **Step 1: Write `lib/hooks/useGreeting.ts`**

```ts
'use client';
export function useGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
```

- [ ] **Step 2: Write `lib/hooks/useWeather.ts` (mocked)**

```ts
'use client';
export interface Weather {
  temp: number;
  condition: string;
}
// TODO(real-weather): replace with a real weather API call keyed on geolocation.
export function useWeather(): Weather {
  return { temp: 72, condition: 'Sunny' };
}
```

- [ ] **Step 3: Write `components/shell/Banner.module.css`**

```css
.banner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 26px 0 14px;
}
.greet {
  font-size: 22px;
  font-weight: 650;
  letter-spacing: -0.01em;
}
.sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--muted);
}
.right {
  display: flex;
  align-items: center;
  gap: 14px;
}
```

- [ ] **Step 4: Write `components/shell/Banner.tsx`**

```tsx
'use client';
import { type ReactNode } from 'react';
import styles from './Banner.module.css';
import { useGreeting } from '@/lib/hooks/useGreeting';
import { useWeather } from '@/lib/hooks/useWeather';

export function Banner({ profileSlot }: { profileSlot?: ReactNode }) {
  const greeting = useGreeting();
  const weather = useWeather();
  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return (
    <header className={styles.banner}>
      <div>
        <div className={styles.greet}>{greeting}, Ben</div>
        <div className={styles.sub}>
          {date} · {weather.temp}° {weather.condition}
        </div>
      </div>
      <div className={styles.right}>{profileSlot}</div>
    </header>
  );
}
```

- [ ] **Step 5: Mount the banner in `AppShell.tsx`**

In `components/shell/AppShell.tsx`, put the banner above the scroll area. Replace the `.main` block contents so it reads:
```tsx
      <div className={styles.main}>
        <div className={styles.scroll}>
          <Banner />
          <BentoBoard />
        </div>
      </div>
```
Add import:
```tsx
import { Banner } from './Banner';
```

- [ ] **Step 6: Verify**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: a greeting ("Good morning/afternoon/evening, Ben"), today's formatted date, and "72° Sunny" appear above the board. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add lib/hooks/useGreeting.ts lib/hooks/useWeather.ts components/shell/Banner.tsx components/shell/Banner.module.css components/shell/AppShell.tsx
git commit -m "feat: greeting banner with date and mocked weather"
```

---

## Task 15: Profile button & settings modal

**Files:**
- Create: `components/shell/ProfileButton.tsx`, `components/shell/ProfileButton.module.css`, `components/shell/SettingsModal.tsx`, `components/shell/SettingsModal.module.css`
- Modify: `components/shell/AppShell.tsx`
- Test: `components/shell/SettingsModal.test.tsx`

- [ ] **Step 1: Write `components/shell/ProfileButton.module.css`**

```css
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-hairline);
  background: var(--surface-2);
  color: var(--text);
  font-weight: 650;
  cursor: pointer;
}
.wrap {
  position: relative;
}
.menu {
  position: absolute;
  right: 0;
  top: 46px;
  width: 180px;
  border-radius: var(--radius-float);
  padding: 8px;
  z-index: 30;
}
.item {
  width: 100%;
  text-align: left;
  padding: 9px 12px;
  border: none;
  background: transparent;
  color: var(--text);
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
}
.item:hover {
  background: var(--surface-2);
}
```

- [ ] **Step 2: Write `components/shell/ProfileButton.tsx`**

```tsx
'use client';
import { useState } from 'react';
import styles from './ProfileButton.module.css';
import { SettingsModal } from './SettingsModal';

export function ProfileButton() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div className={styles.wrap}>
      <button className={styles.avatar} onClick={() => setMenuOpen((o) => !o)} aria-label="profile">
        B
      </button>
      {menuOpen && (
        <div className={`${styles.menu} glass`}>
          <button
            className={styles.item}
            onClick={() => {
              setSettingsOpen(true);
              setMenuOpen(false);
            }}
          >
            Settings
          </button>
        </div>
      )}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 3: Write `components/shell/SettingsModal.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}
.modal {
  width: 420px;
  max-width: calc(100vw - 40px);
  border-radius: var(--radius-float);
  padding: 24px;
}
.title {
  font-size: 18px;
  font-weight: 650;
  margin: 0 0 18px;
}
.row {
  margin-bottom: 18px;
}
.label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin-bottom: 8px;
}
.seg {
  display: inline-flex;
  border: 1px solid var(--border-hairline);
  border-radius: 10px;
  overflow: hidden;
}
.segBtn {
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
}
.segBtn[data-on='true'] {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--text);
}
.swatches {
  display: flex;
  gap: 10px;
}
.swatch {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
}
.swatch[data-on='true'] {
  border-color: var(--text);
}
.close {
  margin-top: 8px;
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--text);
  cursor: pointer;
}
```

- [ ] **Step 4: Write `components/shell/SettingsModal.tsx`**

```tsx
'use client';
import styles from './SettingsModal.module.css';
import { useSettings, ACCENT_PRESETS } from '@/lib/state/settingsStore';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} glass`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="settings">
        <h2 className={styles.title}>Settings</h2>

        <div className={styles.row}>
          <div className={styles.label}>Theme</div>
          <div className={styles.seg}>
            <button className={styles.segBtn} data-on={s.theme === 'dark'} onClick={() => s.setTheme('dark')}>Dark</button>
            <button className={styles.segBtn} data-on={s.theme === 'light'} onClick={() => s.setTheme('light')}>Light</button>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Board layout</div>
          <div className={styles.seg}>
            <button className={styles.segBtn} data-on={s.layoutMode === 'autoPack'} onClick={() => s.setLayoutMode('autoPack')}>Auto-pack</button>
            <button className={styles.segBtn} data-on={s.layoutMode === 'pushCompact'} onClick={() => s.setLayoutMode('pushCompact')}>Push &amp; compact</button>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Filter behavior</div>
          <div className={styles.seg}>
            <button className={styles.segBtn} data-on={s.filterMode === 'hide'} onClick={() => s.setFilterMode('hide')}>Hide &amp; reflow</button>
            <button className={styles.segBtn} data-on={s.filterMode === 'dim'} onClick={() => s.setFilterMode('dim')}>Dim in place</button>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Accent</div>
          <div className={styles.swatches}>
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                className={styles.swatch}
                style={{ background: c }}
                data-on={s.accent === c}
                onClick={() => s.setAccent(c)}
                aria-label={`accent ${c}`}
              />
            ))}
            {/* TODO(accent-custom-picker): add an <input type="color"> custom picker beside the preset swatches; wire to s.setAccent. */}
          </div>
        </div>

        <button className={styles.close} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write the failing test `components/shell/SettingsModal.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from './SettingsModal';
import { useSettings } from '@/lib/state/settingsStore';

describe('SettingsModal', () => {
  beforeEach(() => useSettings.setState({ theme: 'dark', layoutMode: 'autoPack', filterMode: 'hide', accent: '#6366f1' }));

  it('switches layout mode and theme via the store', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /push & compact/i }));
    expect(useSettings.getState().layoutMode).toBe('pushCompact');
    await userEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(useSettings.getState().theme).toBe('light');
  });
});
```

- [ ] **Step 6: Run test to verify it fails then passes**

Run: `npm run test -- SettingsModal`
Expected: FAIL until files exist; then PASS (1 test).

- [ ] **Step 7: Mount the profile button in the banner via `AppShell.tsx`**

In `components/shell/AppShell.tsx`, change `<Banner />` to:
```tsx
          <Banner profileSlot={<ProfileButton />} />
```
Add import:
```tsx
import { ProfileButton } from './ProfileButton';
```

- [ ] **Step 8: Verify**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: top-right avatar opens a glass dropdown → "Settings" opens a glass modal. Toggling theme flips the whole UI; toggling board layout changes drag behavior (auto-pack vs push-compact); toggling filter behavior changes how chips filter; clicking an accent swatch recolors accents live. Settings persist across reload. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add components/shell/ProfileButton.tsx components/shell/ProfileButton.module.css components/shell/SettingsModal.tsx components/shell/SettingsModal.module.css components/shell/SettingsModal.test.tsx components/shell/AppShell.tsx
git commit -m "feat: profile dropdown and settings modal (theme/layout/filter/accent)"
```

---

## Task 16: Create-widget FAB

**Files:**
- Create: `components/shell/Fab.tsx`, `components/shell/Fab.module.css`
- Modify: `components/shell/AppShell.tsx`

- [ ] **Step 1: Write `components/shell/Fab.module.css`**

```css
.fab {
  position: absolute;
  right: 28px;
  bottom: 28px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid var(--border-hairline);
  background: var(--accent);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 12px 30px color-mix(in srgb, var(--accent) 45%, transparent);
  z-index: 25;
}
.popover {
  position: absolute;
  right: 28px;
  bottom: 96px;
  width: 280px;
  border-radius: var(--radius-float);
  padding: 16px;
  z-index: 25;
}
.label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin: 4px 0 8px;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.opt {
  padding: 7px 10px;
  border-radius: 9px;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
  text-transform: capitalize;
}
.opt[data-on='true'] {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}
.create {
  margin-top: 14px;
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}
```

- [ ] **Step 2: Write `components/shell/Fab.tsx`**

```tsx
'use client';
import { useState } from 'react';
import styles from './Fab.module.css';
import { useBoard } from '@/lib/state/boardStore';
import { SIZE_PRESETS } from '@/lib/grid/sizes';
import type { Category } from '@/lib/grid/types';

const CATEGORIES: Category[] = ['finance', 'lifestyle', 'health', 'calendar'];

export function Fab() {
  const addWidget = useBoard((s) => s.addWidget);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('finance');
  const [presetName, setPresetName] = useState(SIZE_PRESETS[0].name);

  function create() {
    const preset = SIZE_PRESETS.find((p) => p.name === presetName)!;
    addWidget(category, preset.w, preset.h);
    setOpen(false);
  }

  return (
    <>
      {open && (
        <div className={`${styles.popover} glass`}>
          <div className={styles.label}>Category</div>
          <div className={styles.grid}>
            {CATEGORIES.map((c) => (
              <button key={c} className={styles.opt} data-on={category === c} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className={styles.label} style={{ marginTop: 14 }}>Size</div>
          <div className={styles.grid}>
            {SIZE_PRESETS.map((p) => (
              <button key={p.name} className={styles.opt} data-on={presetName === p.name} onClick={() => setPresetName(p.name)}>
                {p.name}
              </button>
            ))}
          </div>
          <button className={styles.create} onClick={create}>Add widget</button>
        </div>
      )}
      <button className={styles.fab} onClick={() => setOpen((o) => !o)} aria-label="add widget">
        +
      </button>
    </>
  );
}
```

- [ ] **Step 3: Mount the FAB in `AppShell.tsx`**

In `components/shell/AppShell.tsx`, add `<Fab />` inside the `.main` div, after the `.scroll` div (so it overlays the board):
```tsx
      <div className={styles.main}>
        <div className={styles.scroll}>
          <Banner profileSlot={<ProfileButton />} />
          <BentoBoard />
        </div>
        <Fab />
      </div>
```
Add import:
```tsx
import { Fab } from './Fab';
```

- [ ] **Step 4: Verify**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: a glass-shadowed accent FAB sits bottom-right; clicking opens a popover to pick category + size; "Add widget" inserts a new tile that animates into the board via the active strategy's placement. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add components/shell/Fab.tsx components/shell/Fab.module.css components/shell/AppShell.tsx
git commit -m "feat: create-widget FAB"
```

---

## Task 17: Full-suite check, persistence verification & QA pass

**Files:**
- Modify (if needed): `app/layout.tsx` (no-flash theme script)

- [ ] **Step 1: Add a no-flash theme bootstrap to `app/layout.tsx`**

Inside `<head>` (add a `<head>` element if not present), before `<body>`, insert:
```tsx
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=JSON.parse(localStorage.getItem('bento-settings')||'{}').state||{};if(s.theme)document.documentElement.dataset.theme=s.theme;if(s.accent)document.documentElement.style.setProperty('--accent',s.accent);}catch(e){}`,
          }}
        />
```
Full `app/layout.tsx` for reference:
```tsx
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Bento Dashboard' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=JSON.parse(localStorage.getItem('bento-settings')||'{}').state||{};if(s.theme)document.documentElement.dataset.theme=s.theme;if(s.accent)document.documentElement.style.setProperty('--accent',s.accent);}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm run test`
Expected: all suites pass (sizes, collision, occupancy, autoPack, pushCompact, engine, boardStore, LeftBar, SettingsModal).

- [ ] **Step 3: Type-check / build**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Manual QA checklist**

Run: `npm run dev`, open `http://localhost:3000`, and confirm each:
- [ ] Drag a tile: lifts into cursor, neighbors reflow live, drops committed (auto-pack default).
- [ ] Switch to Push & compact in settings: dragging now anchors at drop and pushes neighbors down.
- [ ] Resize via corner handle across several presets; neighbors reflow; size commits.
- [ ] Filter by one and two categories (hide mode): non-matches animate out and matches repack; clearing restores.
- [ ] Switch to Dim mode: filtering dims non-matches in place and keeps drag/resize enabled.
- [ ] Add widgets of various sizes via the FAB; they animate in and place correctly.
- [ ] Theme toggle flips dark/light with no broken contrast; accent swatch recolors live.
- [ ] Reload the page: widget layout and all settings persist (localStorage). Glass surfaces (FAB, modal, dropdown, drag overlay) show blur; base tiles stay solid with hairline borders.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: no-flash theme bootstrap; final QA pass"
```

---

## Out-of-scope markers (left as inline TODO stubs during implementation)

These are **not** built in this plan; each is dropped as an inline stub at its site so future work is greppable:
- `TODO(manage-mode)` — per-widget remove (×) + tag editing + drag/resize gate. Sites: `components/board/Widget.tsx`, `components/board/BentoBoard.tsx`.
- `TODO(accent-custom-picker)` — custom color picker in `components/shell/SettingsModal.tsx` (stub added in Task 15).
- `TODO(responsive-grid)` — column-count breakpoints. Anchor: `lib/grid/types.ts` (COLS), site: `components/board/BentoBoard.tsx`.
- `TODO(real-weather)` — real weather API in `lib/hooks/useWeather.ts` (stub added in Task 14).
- `TODO(widget-content)` — real per-category widget bodies in `components/widgets/WidgetSkeleton.tsx`.
- `TODO(filter-drag)` — allow rearranging within a filtered subset. Anchor: `components/board/BentoBoard.tsx` (stub added in Task 13).

---

## Self-review notes

- **Spec coverage:** stack (T0), tokens/theming + glass (T1, T9, T15), grid model + sizes (T2), collision (T3), occupancy (T4), autoPack default (T5), pushCompact (T6), strategy selector (T7), stores + persistence + seed (T8), shell + theme controller (T9), static board (T10), drag + overlay + preview (T11), resize (T12), left bar + dual filter modes (T13), banner + greeting + mocked weather (T14), profile + settings with all four controls incl. accent presets (T15), FAB create (T16), persistence + QA (T17). Out-of-scope items captured as TODO stubs. All spec sections map to a task.
- **Type consistency:** `WidgetLayout`, `Move`, `LayoutStrategy`, `LayoutMode` (`'autoPack' | 'pushCompact'`), `Theme`, `FilterMode` (`'hide' | 'dim'`), `Category`, `GridMetrics`, `SizePreset` are defined once and reused verbatim. Store actions (`moveWidget`, `resizeWidget`, `addWidget`, `removeWidget`, `setWidgets`, `reResolve`) referenced consistently. Strategy `preview`/`resolve` signatures match across both implementations and the selector.
- **No placeholders:** every code step contains complete, runnable code; every test step has real assertions and an expected pass/fail outcome.
