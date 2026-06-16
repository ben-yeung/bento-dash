# Widget Content Rescale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-layout and re-scale all 10 existing widget content components so each size variant fills its tile and scales consistently from a single cell-size–derived token system.

**Architecture:** Introduce a board-uniform token scale (`scale.ts`) derived from `--cell-size`; make each tile a CSS size-container in `Widget.tsx`; extract shared presentational sub-components into `components/widgets/content/_shared/`; rewrite each content component as header/body/footer fill-grids using those tokens and sub-components. No registry, sizes, drag/resize, store, or seed changes.

**Tech Stack:** Next.js App Router, TypeScript, React, inline styles + CSS vars, Vitest + @testing-library/react, jsdom.

**Spec:** `docs/superpowers/specs/2026-06-15-widget-content-rescale-design.md`
**Canonical visual reference (read before each widget task):** `.superpowers/brainstorm/997-1781557254/content/all-widgets-passover-v3.html` — open it; each `<div class="cell">` is the exact target layout/scale for one widget×size, driven by a single `--cell` var. The mockup uses bordered-circle rings + CSS heatmaps as approximations; production uses the shared SVG/grid components from Tasks 3–4.

---

## Conventions for translating the mockup → React

The mockup is plain HTML with these classes. Map them to tokens/components:

| Mockup | Production |
|---|---|
| `class="l"` (uppercase muted) | `<Header label="…" />` or `style={{ fontSize: cell(SCALE.fontLabel), textTransform:'uppercase', letterSpacing:'.07em', color:'var(--muted)' }}` |
| `class="d"` | `fontSize: cell(SCALE.fontDetail), color:'var(--muted)'` |
| `class="t"` | `fontSize: cell(SCALE.fontTitle), fontWeight:600` |
| `class="v"` | `fontSize: cell(SCALE.fontValue), fontWeight:700` |
| `class="h"` | `fontSize: cell(SCALE.fontHero), fontWeight:800` |
| `class="g3"` | `display:'grid', gridTemplateRows:'auto 1fr auto', gap: cell(SCALE.gap), height:'100%'` |
| `class="in"` | the absolute-inset padded wrapper (already provided by `Widget.tsx`; components render their own `g3`/flex inside) |
| `calc(var(--cell)*X)` | `cell(X)` helper |
| bordered-circle ring | `<Donut>` / `<ConcRings>` |
| `class="chip"` | `<EventChip>` |
| `class="seg"` | `<SegmentedBar>` |
| `class="swk"` + day header | `<WeekHeatmap>` |
| 🔥 + count | `<StreakBadge>` |

All per-size pixel ratios (`0.30`, `1.15`, etc.) come straight from the mockup's inline `calc(var(--cell)*…)` values — copy them.

---

## File Structure

| File | Responsibility |
|---|---|
| `components/widgets/content/scale.ts` | Token ratios + `cell()` + `tokenStyle()` helpers |
| `components/widgets/content/scale.test.ts` | Token invariants |
| `components/board/Widget.tsx` | Tile wrapper: set token CSS vars + `container-type:size` |
| `components/widgets/content/_shared/index.ts` | Barrel re-export |
| `components/widgets/content/_shared/Header.tsx` | Top-left label + optional aside |
| `components/widgets/content/_shared/Donut.tsx` | Single thin SVG ring + center label/sub |
| `components/widgets/content/_shared/ConcRings.tsx` | 3 concentric thin rings |
| `components/widgets/content/_shared/Bars.tsx` | `ProgressBar`, `SegmentedBar`, `MetricBar` |
| `components/widgets/content/_shared/StatStrip.tsx` | Row of `{label,value}` columns |
| `components/widgets/content/_shared/EventChip.tsx` | Time-left / title-right colored chip |
| `components/widgets/content/_shared/WeekHeatmap.tsx` | Day-letter header + colored 7×N grid |
| `components/widgets/content/_shared/StreakBadge.tsx` | 🔥 + white count |
| `components/widgets/content/_shared/TransactionRow.tsx` | Horizontal merchant/amount cells |
| `components/widgets/content/<type>.tsx` (×10) | Rewritten per-size layouts |
| `components/widgets/content/<type>.test.tsx` (×10) | Render-all-sizes smoke + key-content tests |

---

## Task 1: Scale tokens

**Files:**
- Create: `components/widgets/content/scale.ts`
- Test: `components/widgets/content/scale.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// components/widgets/content/scale.test.ts
import { describe, it, expect } from 'vitest';
import { SCALE, cell } from './scale';

describe('SCALE tokens', () => {
  it('font ratios are strictly increasing label < detail < title < value < hero', () => {
    const { fontLabel, fontDetail, fontTitle, fontValue, fontHero } = SCALE;
    expect(fontLabel).toBeLessThan(fontDetail);
    expect(fontDetail).toBeLessThan(fontTitle);
    expect(fontTitle).toBeLessThan(fontValue);
    expect(fontValue).toBeLessThan(fontHero);
  });

  it('cell() emits a calc expression against --cell-size', () => {
    expect(cell(0.5)).toBe('calc(var(--cell-size, 100px) * 0.5)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/widgets/content/scale.test.ts`
Expected: FAIL — `Cannot find module './scale'`.

- [ ] **Step 3: Implement `scale.ts`**

```ts
// components/widgets/content/scale.ts
import type React from 'react';

export const SCALE = {
  pad: 0.09,
  gap: 0.06,
  fontLabel: 0.075,
  fontDetail: 0.095,
  fontTitle: 0.13,
  fontValue: 0.18,
  fontHero: 0.27,
} as const;

/** A length that scales with the board cell size. */
export function cell(ratio: number): string {
  return `calc(var(--cell-size, 100px) * ${ratio})`;
}

/** CSS custom properties for the tile wrapper (optional convenience). */
export function tokenStyle(): React.CSSProperties {
  return {
    ['--w-pad' as string]: cell(SCALE.pad),
    ['--w-gap' as string]: cell(SCALE.gap),
    ['--w-font-label' as string]: cell(SCALE.fontLabel),
    ['--w-font-detail' as string]: cell(SCALE.fontDetail),
    ['--w-font-title' as string]: cell(SCALE.fontTitle),
    ['--w-font-value' as string]: cell(SCALE.fontValue),
    ['--w-font-hero' as string]: cell(SCALE.fontHero),
  } as React.CSSProperties;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/widgets/content/scale.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/widgets/content/scale.ts components/widgets/content/scale.test.ts
git commit -m "feat: add widget content scale tokens"
```

---

## Task 2: Tile wrapper — tokens + container

**Files:**
- Modify: `components/board/Widget.tsx:68-70`

- [ ] **Step 1: Replace the em-scaling wrapper**

In `components/board/Widget.tsx`, add the import near the other imports:

```tsx
import { tokenStyle } from '@/components/widgets/content/scale';
```

Replace the existing wrapper div (currently `<div style={{ position: 'absolute', inset: 0, fontSize: 'clamp(8px, calc(var(--cell-size, 100px) / 10), 14px)' }}>`):

```tsx
      <div
        style={{
          position: 'absolute',
          inset: 0,
          containerType: 'size',
          color: 'var(--text)',
          ...tokenStyle(),
        }}
      >
        <ContentComponent category={widget.category} w={widget.w} h={widget.h} />
      </div>
```

- [ ] **Step 2: Run the existing Widget tests**

Run: `npx vitest run components/board/Widget.test.tsx`
Expected: PASS (existing tests render `Widget` and don't assert on the old font-size).

- [ ] **Step 3: Commit**

```bash
git add components/board/Widget.tsx
git commit -m "feat: tile wrapper sets scale tokens and becomes a size container"
```

---

## Task 3: Shared primitives — rings & bars

**Files:**
- Create: `components/widgets/content/_shared/Donut.tsx`
- Create: `components/widgets/content/_shared/ConcRings.tsx`
- Create: `components/widgets/content/_shared/Bars.tsx`
- Create: `components/widgets/content/_shared/Header.tsx`
- Test: `components/widgets/content/_shared/shared.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/widgets/content/_shared/shared.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Donut } from './Donut';
import { ConcRings } from './ConcRings';
import { ProgressBar, SegmentedBar, MetricBar } from './Bars';
import { Header } from './Header';

describe('shared primitives render', () => {
  it('Donut shows its center label', () => {
    const { getByText } = render(<Donut pct={70} color="#6366f1" size={0.6} label="$1.5k" sub="left" />);
    expect(getByText('$1.5k')).toBeTruthy();
    expect(getByText('left')).toBeTruthy();
  });
  it('ConcRings renders an svg', () => {
    const { container } = render(<ConcRings size={0.6} rings={[{ pct: 80, color: '#ff6b6b' }]} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
  it('ProgressBar/SegmentedBar/MetricBar render', () => {
    const { container: a } = render(<ProgressBar pct={50} color="#38bdf8" />);
    const { container: b } = render(<SegmentedBar segments={[{ weight: 1, color: '#6366f1' }]} remainder={2} />);
    const { getByText } = render(<MetricBar label="Move" color="#ff6b6b" current="520" goal="650" pct={78} />);
    expect(a.firstChild).toBeTruthy();
    expect(b.firstChild).toBeTruthy();
    expect(getByText('520/650')).toBeTruthy();
  });
  it('Header shows label and aside', () => {
    const { getByText } = render(<Header label="Today" aside={<span>Wed</span>} />);
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Wed')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/widgets/content/_shared/shared.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `Donut.tsx`**

```tsx
// components/widgets/content/_shared/Donut.tsx
import { cell, SCALE } from '../scale';

interface DonutProps {
  pct: number;            // 0–100 arc fill
  color: string;
  size: number;           // ring diameter as ratio of cell
  stroke?: number;        // band thickness as ratio of cell
  label?: string;
  sub?: string;
}

export function Donut({ pct, color, size, stroke = 0.05, label, sub }: DonutProps) {
  const R = 50;
  const sw = (stroke / size) * 100;      // stroke in viewBox units
  const r = R - sw / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div style={{ position: 'relative', width: cell(size), height: cell(size), flexShrink: 0 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      {(label || sub) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {label && <div style={{ fontSize: cell(size * 0.28), fontWeight: 800, lineHeight: 1 }}>{label}</div>}
          {sub && <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Implement `ConcRings.tsx`**

```tsx
// components/widgets/content/_shared/ConcRings.tsx
import { cell } from '../scale';

interface Ring { pct: number; color: string }
interface ConcRingsProps { size: number; rings: Ring[]; stroke?: number }

const TRACK = ['#3a2530', '#3a3520', '#23362a'];

export function ConcRings({ size, rings, stroke = 0.055 }: ConcRingsProps) {
  const R = 50;
  const sw = (stroke / size) * 100;
  return (
    <svg width={cell(size)} height={cell(size)} viewBox="0 0 100 100"
      style={{ display: 'block', flexShrink: 0, transform: 'rotate(-90deg)' }}>
      {rings.map((ring, i) => {
        const r = R - sw / 2 - i * (sw * 1.6);
        const circ = 2 * Math.PI * r;
        const dash = (Math.min(100, ring.pct) / 100) * circ;
        return (
          <g key={i}>
            <circle cx="50" cy="50" r={r} fill="none" stroke={TRACK[i % TRACK.length]} strokeWidth={sw} />
            <circle cx="50" cy="50" r={r} fill="none" stroke={ring.color} strokeWidth={sw}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 5: Implement `Bars.tsx`**

```tsx
// components/widgets/content/_shared/Bars.tsx
import { cell, SCALE } from '../scale';

export function ProgressBar({ pct, color, height = 0.05 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height: cell(height), borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
    </div>
  );
}

export function SegmentedBar({ segments, remainder = 0, height = 0.07 }:
  { segments: { weight: number; color: string }[]; remainder?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', height: cell(height), borderRadius: 999, overflow: 'hidden' }}>
      {segments.map((s, i) => <div key={i} style={{ flex: s.weight, background: s.color }} />)}
      {remainder > 0 && <div style={{ flex: remainder, background: 'rgba(255,255,255,0.06)' }} />}
    </div>
  );
}

export function MetricBar({ label, color, current, goal, pct }:
  { label: string; color: string; current: string; goal: string; pct: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: cell(SCALE.fontDetail) }}>
        <span style={{ color }}>{label}</span>
        <b style={{ color: 'var(--text)' }}>{current}/{goal}</b>
      </div>
      <ProgressBar pct={pct} color={color} />
    </div>
  );
}
```

- [ ] **Step 6: Implement `Header.tsx`**

```tsx
// components/widgets/content/_shared/Header.tsx
import type { ReactNode } from 'react';
import { cell, SCALE } from '../scale';

export function Header({ label, aside }: { label: string; aside?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase',
        letterSpacing: '0.07em', color: 'var(--muted)' }}>{label}</div>
      {aside}
    </div>
  );
}
```

- [ ] **Step 7: Run to verify it passes**

Run: `npx vitest run components/widgets/content/_shared/shared.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add components/widgets/content/_shared/Donut.tsx components/widgets/content/_shared/ConcRings.tsx components/widgets/content/_shared/Bars.tsx components/widgets/content/_shared/Header.tsx components/widgets/content/_shared/shared.test.tsx
git commit -m "feat: shared widget primitives (Donut, ConcRings, Bars, Header)"
```

---

## Task 4: Shared primitives — chips, heatmap, streak, transactions

**Files:**
- Create: `components/widgets/content/_shared/EventChip.tsx`
- Create: `components/widgets/content/_shared/StatStrip.tsx`
- Create: `components/widgets/content/_shared/WeekHeatmap.tsx`
- Create: `components/widgets/content/_shared/StreakBadge.tsx`
- Create: `components/widgets/content/_shared/TransactionRow.tsx`
- Create: `components/widgets/content/_shared/index.ts`
- Test: `components/widgets/content/_shared/shared2.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/widgets/content/_shared/shared2.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EventChip } from './EventChip';
import { StatStrip } from './StatStrip';
import { WeekHeatmap } from './WeekHeatmap';
import { StreakBadge } from './StreakBadge';
import { TransactionRow } from './TransactionRow';

describe('shared primitives 2', () => {
  it('EventChip shows time and title', () => {
    const { getByText } = render(<EventChip time="9:00" title="Standup" color="#3b82f6" duration="30m" />);
    expect(getByText('9:00')).toBeTruthy();
    expect(getByText('Standup')).toBeTruthy();
  });
  it('StatStrip shows each value', () => {
    const { getByText } = render(<StatStrip items={[{ label: 'Dist', value: '5.2km' }]} />);
    expect(getByText('5.2km')).toBeTruthy();
  });
  it('WeekHeatmap renders day headers', () => {
    const { getAllByText } = render(<WeekHeatmap rows={[{ color: '#10b981', days: [true, false, true, true, false, true, false] }]} />);
    expect(getAllByText('S').length).toBeGreaterThan(0);
  });
  it('StreakBadge shows the count', () => {
    const { getByText } = render(<StreakBadge count={5} />);
    expect(getByText('5')).toBeTruthy();
  });
  it('TransactionRow shows merchant and amount', () => {
    const { getByText } = render(<TransactionRow items={[{ merchant: 'Uber', amount: '$23' }]} />);
    expect(getByText('Uber')).toBeTruthy();
    expect(getByText('$23')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/widgets/content/_shared/shared2.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `EventChip.tsx`**

```tsx
// components/widgets/content/_shared/EventChip.tsx
import { cell, SCALE } from '../scale';

interface EventChipProps {
  time: string; title: string; color: string; duration?: string;
  variant?: 'row' | 'stack';   // stack = time top-left, title bottom-right (1×2 schedule)
}

function tint(hex: string) { return `${hex}1f`; } // ~12% alpha

export function EventChip({ time, title, color, duration, variant = 'row' }: EventChipProps) {
  const base: React.CSSProperties = {
    display: 'flex', borderRadius: cell(0.06), padding: `${cell(0.05)} ${cell(0.07)}`,
    background: tint(color), borderLeft: `${cell(0.025)} solid ${color}`, gap: cell(0.07),
  };
  const timeEl = <span style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 700, color: 'var(--text)', lineHeight: 1, whiteSpace: 'nowrap' }}>{time}</span>;
  const titleEl = <span style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 400, lineHeight: 1.1 }}>{title}</span>;
  const durEl = duration && <span style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{duration}</span>;

  if (variant === 'stack') {
    return (
      <div style={{ ...base, flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch', gap: cell(0.02) }}>
        {timeEl}
        <span style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 400, textAlign: 'right' }}>{title}</span>
      </div>
    );
  }
  return (
    <div style={{ ...base, alignItems: 'center' }}>
      <div>{timeEl}{durEl && <div>{durEl}</div>}</div>
      <span style={{ flex: 1, textAlign: 'right', fontSize: cell(SCALE.fontTitle), fontWeight: 400 }}>{title}</span>
    </div>
  );
}
```

- [ ] **Step 4: Implement `StatStrip.tsx`**

```tsx
// components/widgets/content/_shared/StatStrip.tsx
import { cell, SCALE } from '../scale';

export function StatStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: cell(0.06) }}>
      {items.map((it) => (
        <div key={it.label} style={{ flex: 1 }}>
          <div style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 600 }}>{it.value}</div>
          <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Implement `WeekHeatmap.tsx`**

```tsx
// components/widgets/content/_shared/WeekHeatmap.tsx
import { cell } from '../scale';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function WeekHeatmap({ rows }: { rows: { color: string; days: boolean[] }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: cell(0.02),
        marginBottom: cell(0.025), placeItems: 'center' }}>
        {DAYS.map((d, i) => <span key={i} style={{ fontSize: cell(0.07), color: 'var(--muted)' }}>{d}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: '1fr',
        gap: cell(0.02), flex: 1, minHeight: cell(0.7) }}>
        {rows.flatMap((row, ri) =>
          row.days.map((on, di) => (
            <i key={`${ri}-${di}`} style={{ borderRadius: 2, background: on ? row.color : 'rgba(255,255,255,0.08)' }} />
          )),
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Implement `StreakBadge.tsx`**

```tsx
// components/widgets/content/_shared/StreakBadge.tsx
import { cell } from '../scale';

export function StreakBadge({ count }: { count: number }) {
  return (
    <span style={{ fontSize: cell(0.12), color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>
      🔥 {count}
    </span>
  );
}
```

- [ ] **Step 7: Implement `TransactionRow.tsx`**

```tsx
// components/widgets/content/_shared/TransactionRow.tsx
import { cell, SCALE } from '../scale';

export function TransactionRow({ items }: { items: { merchant: string; amount: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: cell(0.05) }}>
      {items.map((t) => (
        <div key={t.merchant} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: cell(0.05),
          padding: `${cell(0.05)} ${cell(0.06)}`, display: 'flex', flexDirection: 'column', gap: cell(0.02) }}>
          <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{t.merchant}</div>
          <div style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 600, textAlign: 'right' }}>{t.amount}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Implement the barrel `index.ts`**

```ts
// components/widgets/content/_shared/index.ts
export { Header } from './Header';
export { Donut } from './Donut';
export { ConcRings } from './ConcRings';
export { ProgressBar, SegmentedBar, MetricBar } from './Bars';
export { StatStrip } from './StatStrip';
export { EventChip } from './EventChip';
export { WeekHeatmap } from './WeekHeatmap';
export { StreakBadge } from './StreakBadge';
export { TransactionRow } from './TransactionRow';
```

- [ ] **Step 9: Run to verify it passes**

Run: `npx vitest run components/widgets/content/_shared/shared2.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 10: Commit**

```bash
git add components/widgets/content/_shared/
git commit -m "feat: shared widget primitives (EventChip, StatStrip, WeekHeatmap, StreakBadge, TransactionRow)"
```

---

## Task 5: Rewrite `budget-summary` (worked template)

**Files:**
- Modify: `components/widgets/content/budget-summary.tsx`
- Test: `components/widgets/content/budget-summary.test.tsx`

This task is the **fully-worked pattern** for Tasks 6–14. Read the `budget-summary` tiles in the mockup; the code below matches them.

- [ ] **Step 1: Write the failing test**

```tsx
// components/widgets/content/budget-summary.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BudgetSummary } from './budget-summary';

const SIZES = [[1, 1], [2, 2], [3, 2], [4, 2]] as const;

describe('BudgetSummary', () => {
  it('renders every supported size without throwing', () => {
    for (const [w, h] of SIZES) {
      const { container } = render(<BudgetSummary category="finance" w={w} h={h} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
  it('shows the spent hero on the 3×2', () => {
    const { getByText } = render(<BudgetSummary category="finance" w={3} h={2} />);
    expect(getByText('$3,500')).toBeTruthy();
    expect(getByText('$1,500 left')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run components/widgets/content/budget-summary.test.tsx`
Expected: FAIL — assertion on new text / current component differs.

- [ ] **Step 3: Implement the component**

```tsx
// components/widgets/content/budget-summary.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { cell, SCALE } from './scale';
import { Header, Donut, SegmentedBar, TransactionRow } from './_shared';

const CATS = [
  { label: 'Housing', amount: '$1,400', weight: 14, color: '#6366f1' },
  { label: 'Food', amount: '$800', weight: 8, color: '#8b5cf6' },
  { label: 'Transport', amount: '$600', weight: 6, color: '#a78bfa' },
  { label: 'Other', amount: '$700', weight: 7, color: '#c4b5fd' },
];
const TXNS = [
  { merchant: 'Whole Foods', amount: '$84' }, { merchant: 'Uber', amount: '$23' },
  { merchant: 'Netflix', amount: '$16' }, { merchant: 'Amazon', amount: '$52' },
  { merchant: 'Shell', amount: '$45' },
];
const GREEN = '#6bd99a';

const root: React.CSSProperties = { position: 'absolute', inset: 0, padding: cell(SCALE.pad),
  display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const g3: React.CSSProperties = { display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap), height: '100%' };

function Legend({ cols }: { cols: number }) {
  return (
    <div style={{ display: 'flex', gap: cell(0.08) }}>
      {CATS.slice(0, cols).map((c) => (
        <div key={c.label} style={{ flex: 1 }}>
          <div style={{ width: cell(0.06), height: cell(0.06), borderRadius: 3, background: c.color }} />
          <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{c.label}</div>
          <div style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 600 }}>{c.amount}</div>
        </div>
      ))}
    </div>
  );
}

export function BudgetSummary({ w, h }: WidgetContentProps) {
  if (w === 1 && h === 1) {
    return (
      <div style={root}>
        <div style={{ fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>Jun</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Donut pct={70} color="#6366f1" size={0.62} label="$1.5k" sub="left" />
        </div>
      </div>
    );
  }
  if (w === 2 && h === 2) {
    return (
      <div style={{ ...root, ...g3 }}>
        <Header label="June · Budget" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Donut pct={70} color="#6366f1" size={1.32} stroke={0.075} label="$1.5k" sub="left of $5k" />
        </div>
        <div />
      </div>
    );
  }
  // 3×2 and 4×2 share the layout; 4×2 just has 5 txns + 4 legend cols (3×2 = 4 txns, 4 cols)
  const txns = w >= 4 ? TXNS : TXNS.slice(0, 4);
  return (
    <div style={{ ...root, ...g3 }}>
      <Header label="June 2026 · Monthly Budget"
        aside={<div style={{ fontSize: cell(0.15), fontWeight: 700, color: GREEN }}>$1,500 left</div>} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: cell(0.07) }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: cell(0.06) }}>
            <div style={{ fontSize: cell(0.30), fontWeight: 800 }}>$3,500</div>
            <div style={{ fontSize: cell(SCALE.fontValue), fontWeight: 500, color: 'var(--muted)' }}>/ $5,000</div>
          </div>
          <div style={{ fontSize: cell(0.095), color: GREEN, marginTop: cell(0.02) }}>on track for the month</div>
        </div>
        <div>
          <div style={{ fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: cell(0.035) }}>Recent</div>
          <TransactionRow items={txns} />
        </div>
      </div>
      <div>
        <div style={{ marginBottom: cell(0.06) }}>
          <SegmentedBar segments={CATS.map((c) => ({ weight: c.weight, color: c.color }))} remainder={15} height={w >= 4 ? 0.1 : 0.07} />
        </div>
        <Legend cols={4} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run components/widgets/content/budget-summary.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/widgets/content/budget-summary.tsx components/widgets/content/budget-summary.test.tsx
git commit -m "feat: rescale BudgetSummary content (donut small, number hero + transactions large)"
```

---

## Tasks 6–14: Rewrite the remaining nine components

Each task follows the **exact same five steps** as Task 5: write the render-all-sizes + key-text test → run (fail) → implement from the mockup tile using the shared components and `cell()`/`SCALE` tokens → run (pass) → commit. For every task:

- Open the matching widget section in `all-widgets-passover-v3.html` and translate each `<div class="cell">` tile to a `if (w===… && h===…)` branch, copying its inline `calc(var(--cell)*X)` ratios via `cell(X)`.
- Use `root`/`g3` style objects as in Task 5.
- Keep the `WidgetContentProps` signature and the registry import name unchanged.
- The test always renders every supported size (smoke) plus 1–2 key-text assertions named below.

### Task 6: `activity-rings`
- Sizes: `1×1, 2×1, 2×2, 3×2`. Colors Move `#ff6b6b` / Exercise `#ffd93d` / Stand `#6bcb77`.
- Use `<ConcRings>` (diameters per mockup: 0.56 / 0.50 / 0.80 / 1.15). 2×1 adds "Activity" `<Header>` + 3 stat rows; 2×2 shows all **3** stat rows; 3×2 = rings left + stacked column of 3 `<MetricBar>` + divider + recent-workouts list (Morning Run 320, Cycle 180, Walk 90, Yoga 60).
- Test key text: `getByText('Move')` on 2×1; renders all sizes.

### Task 7: `calorie-tracker`
- Sizes: `1×1, 2×1, 2×2, 3×2`. Green ring `#6bcb77`.
- 1×1 `<Donut size={0.72}>` center `1,840` sub `CAL`; 2×1 "Calories" `<Header>` + `1,840` + `/ 2,400` (cell(0.13)) + `<ProgressBar>` + P/C/F macro row; 2×2 ring (1.18) + P/C/F `<StatStrip>`; 3×2 ring (1.15, `flexShrink:0`) + stacked column of 3 macro `<MetricBar>` (Protein 142/160g, Carbs 198/230g, Fat 68/80g) + divider + meal log (Breakfast 420 / Lunch 680 / Snack 210 / Dinner 530).
- Test key text: `getByText('CAL')` on 1×1.

### Task 8: `steps`
- Sizes: `1×1, 2×1, 2×2, 3×2`. Accent `#38bdf8`.
- 1×1 "Steps" label + hero count + bar + "82% of 10k"; 2×1 "Steps" `<Header>` + count `/ 10,000` + bar + Dist/Active; 2×2 + Distance/Active/Floors `<StatStrip>`; 3×2 "Steps" label left + `8,190 / 10,000` aside (value scale, no %), **hourly bar chart fills body** with am/pm x-axis (`6am 8am 10am 12pm 2pm 4pm` under 11 bars), `<StatStrip>` footer.
- Test key text: `getByText('Steps')` present on 2×1.

### Task 9: `upcoming-events`
- Sizes: `1×1, 2×1, 2×2, 3×2`. Per-event colors `#3b82f6 / #8b5cf6 / #ec4899 / #10b981 / #6366f1`.
- Use `<EventChip>` (row variant). 1×1 = "Next" label + time hero + title + dot/"in 25 min"; others = chips distributed in a `display:grid; gridAutoRows:1fr; gap` body. 3×2 chips include duration + subtitle.
- Test key text: `getByText('Team standup')`.

### Task 10: `mini-calendar`
- Sizes: `1×1, 2×2, 3×2, 3×3`. Accent `#3b82f6`.
- 1×1 = month + hero day `10` + weekday. Grid sizes use `display:grid; gridTemplateColumns:'repeat(7,1fr)'; gridAutoRows:'1fr'; placeItems:'center'`, **Sun→Sat** header `S M T W T F S`, **one leading blank** (June 1 2026 = Monday), today `10` = filled accent circle. Day font `cell(0.10–0.13)`. 3×3 adds nav arrows + more weeks.
- Test: renders all sizes; `getByText('10')` present.

### Task 11: `todays-schedule`
- Sizes: `1×2, 2×2, 2×3`. `<EventChip>` timeline distributed `gridAutoRows:1fr`. **1×2 uses `<EventChip variant="stack">`** (time top-left, title bottom-right). 2×3 includes duration.
- Test key text: `getByText('Team standup')`.

### Task 12: `habit-tracker`
- Sizes: `1×1, 2×1, 2×2, 3×2`. Per-habit colors amber/green/indigo/pink/sky; pending dot `#2a3550`.
- 1×1 = "Habits" + `3/5` + dots in **3-top/2-bottom** (dot `cell(0.20)`); 2×1 = `<Header label="Today's Habits" aside={3/5}>` + row of dots each with `<StreakBadge>` beneath, vertically centered; 2×2 = habit rows (dot `cell(0.10)` + name + `<StreakBadge count=week>`), distributed `1fr`; 3×2 = `<Header>` + body split: left habit list (distributed) + `<WeekHeatmap rows=[…]>`. Week counts must equal heatmap day-true counts (Run 5, Read 6, Meditate 5, Workout 4).
- Test key text: `getByText('Morning run')` on 2×2; `getAllByText('S')` (heatmap header) on 3×2.

### Task 13: `weather`
- Sizes: `1×1, 2×1, 2×2, 3×2`. Sky accent.
- 1×1 = icon + city top-right + temp `cell(0.32)` bottom-right; 2×1 = icon | temp+H/L | city/feels; 2×2 = `<Header>`+icon + temp `cell(0.40)` + "Sunny · H/L" + **3-day forecast** row footer; 3×2 = temp `cell(0.42)` + H/L/Wind/UV band + **5-day forecast** strip (`repeat(5,1fr)`, icons `cell(0.16)`).
- Test key text: `getByText('72°')` present.

### Task 14: `daily-note`
- Sizes: `1×1, 2×2, 2×3, 3×2`. Accent `#6366f1`.
- 1×1 = date + pencil header + **checklist only** (no note text); 2×2 = header + note body; 2×3 = header + note + checklist footer; 3×2 = note left + divider + checklist right.
- Test key text: 1×1 shows a checklist item (`getByText('Review PR')`), not the prose note.

For each task, the commit message is `feat: rescale <Name> content` and the test file is `components/widgets/content/<type>.test.tsx`.

---

## Task 15: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the whole suite**

Run: `npx vitest run`
Expected: PASS — all new content tests + existing suite green.

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit` then `npm run lint`
Expected: no errors.

- [ ] **Step 3: Visual check at three cell sizes**

Use the `/run` or `/verify` skill to launch the app. Confirm against the mockup at: a small board (cell ≈ 120px), 1080p (cell ≈ 200px), and a wide window (cell near the 200px cap). For each: no overflow/clipping, no central voids, donuts thin, calendar Sun→Sat, event time bolder than title, habit colors + streak counts correct. This is a manual check, not an assertion.

- [ ] **Step 4: Commit any fixes from the visual pass, then finish**

```bash
git add -A && git commit -m "fix: visual polish from widget rescale verification"
```

Then use the `superpowers:finishing-a-development-branch` skill to decide merge/PR.

---

## Notes

- **`TODO(board-maxwidth-2k)`** — the board's `max-width: 1260px` caps the cell at ~200px (no growth on 2k/4k, only margin). The token scale stays correct regardless. If true large-screen growth is wanted later, raise/remove `max-width` in `app/globals.css` and optionally clamp `--cell-size`. Add this stub inline at that site if/when touched. Out of scope here.
- The mockup's emoji weather/check glyphs (☀️ ⛅ ☑) are placeholders; swap for the existing Lucide icons used elsewhere in the component if preferred — keep them sized via `cell()`.
