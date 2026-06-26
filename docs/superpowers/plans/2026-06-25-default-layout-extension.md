# Default Layout Extension + Settings Log Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the default seed layout from 10 to 20 widgets (each type at two contrasting sizes) and add a "Log Layout" debug button to the settings modal.

**Architecture:** Two independent changes — `lib/data/seed.ts` gains 10 more explicit `[category, type, w, h, x, y]` tuples (section 2, rows 6–10, perfectly flush), and `components/shell/SettingsModal.tsx` gets a button in the footer that calls `useBoard.getState().widgets` and logs it. No grid engine or widget component changes.

**Tech Stack:** TypeScript, React, Vitest, @testing-library/react, Zustand (`useBoard`)

## Global Constraints

- All new widget sizes must appear in each widget's `supportedSizes` in `lib/widgets/registry.ts`
- Section 1 (rows 0–5) in `seed.ts` must not change
- No new widget types, no grid engine changes
- Log button is always visible; no dev-mode gate
- Test runner: `npx vitest run` (vitest@2, Node 20.18 — do not upgrade)
- Lint is broken project-wide (`npm run lint` fails); use `npx tsc --noEmit` and `npx vitest run` to verify

---

## File Map

| File | Change |
|---|---|
| `lib/data/seed.ts` | Add 10 entries to `defs` array (section 2) |
| `lib/data/seed.test.ts` | New — unit tests for seedWidgets shape and count |
| `components/shell/SettingsModal.tsx` | Add "Log Layout" button in footer |
| `components/shell/SettingsModal.test.tsx` | Add test for log button |

---

### Task 1: Extend seedWidgets to 20 entries

**Files:**
- Create: `lib/data/seed.test.ts`
- Modify: `lib/data/seed.ts`

**Interfaces:**
- Produces: `seedWidgets()` returns 20 `WidgetLayout` objects with ids `seed-0` through `seed-19`

- [ ] **Step 1: Write the failing test**

Create `lib/data/seed.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { seedWidgets } from './seed';

describe('seedWidgets', () => {
  it('returns exactly 20 widgets', () => {
    expect(seedWidgets()).toHaveLength(20);
  });

  it('section 1 (indices 0-9) is unchanged', () => {
    const widgets = seedWidgets();
    // Row 0-1: budget-summary 4×2 at (0,0)
    expect(widgets[0]).toMatchObject({ widgetType: 'budget-summary', w: 4, h: 2, x: 0, y: 0 });
    // weather 2×1 at (4,0)
    expect(widgets[1]).toMatchObject({ widgetType: 'weather', w: 2, h: 1, x: 4, y: 0 });
    // steps 2×1 at (4,1)
    expect(widgets[2]).toMatchObject({ widgetType: 'steps', w: 2, h: 1, x: 4, y: 1 });
    // habit-tracker 3×2 at (0,4)
    expect(widgets[8]).toMatchObject({ widgetType: 'habit-tracker', w: 3, h: 2, x: 0, y: 4 });
    // daily-note 3×2 at (3,4)
    expect(widgets[9]).toMatchObject({ widgetType: 'daily-note', w: 3, h: 2, x: 3, y: 4 });
  });

  it('section 2 (indices 10-19) has correct positions and sizes', () => {
    const widgets = seedWidgets();
    // Row 6-7: budget-summary 2×2 at (0,6)
    expect(widgets[10]).toMatchObject({ widgetType: 'budget-summary', w: 2, h: 2, x: 0, y: 6 });
    // steps 2×2 at (2,6)
    expect(widgets[11]).toMatchObject({ widgetType: 'steps', w: 2, h: 2, x: 2, y: 6 });
    // mini-calendar 2×2 at (4,6)
    expect(widgets[12]).toMatchObject({ widgetType: 'mini-calendar', w: 2, h: 2, x: 4, y: 6 });
    // Row 8-9: upcoming-events 2×2 at (0,8)
    expect(widgets[13]).toMatchObject({ widgetType: 'upcoming-events', w: 2, h: 2, x: 0, y: 8 });
    // calorie-tracker 2×2 at (2,8)
    expect(widgets[14]).toMatchObject({ widgetType: 'calorie-tracker', w: 2, h: 2, x: 2, y: 8 });
    // daily-note 2×2 at (4,8)
    expect(widgets[15]).toMatchObject({ widgetType: 'daily-note', w: 2, h: 2, x: 4, y: 8 });
    // Row 10: todays-schedule 2×1 at (0,10)
    expect(widgets[16]).toMatchObject({ widgetType: 'todays-schedule', w: 2, h: 1, x: 0, y: 10 });
    // habit-tracker 2×1 at (2,10)
    expect(widgets[17]).toMatchObject({ widgetType: 'habit-tracker', w: 2, h: 1, x: 2, y: 10 });
    // weather 1×1 at (4,10)
    expect(widgets[18]).toMatchObject({ widgetType: 'weather', w: 1, h: 1, x: 4, y: 10 });
    // activity-rings 1×1 at (5,10)
    expect(widgets[19]).toMatchObject({ widgetType: 'activity-rings', w: 1, h: 1, x: 5, y: 10 });
  });

  it('each widget has a unique id', () => {
    const ids = seedWidgets().map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('section 2 rows are flush (each row sums to 6 columns)', () => {
    const widgets = seedWidgets().slice(10);
    // Row 6-7: w=2+2+2=6
    const row6 = widgets.filter((w) => w.y === 6);
    expect(row6.reduce((s, w) => s + w.w, 0)).toBe(6);
    // Row 8-9: w=2+2+2=6
    const row8 = widgets.filter((w) => w.y === 8);
    expect(row8.reduce((s, w) => s + w.w, 0)).toBe(6);
    // Row 10: w=2+2+1+1=6
    const row10 = widgets.filter((w) => w.y === 10);
    expect(row10.reduce((s, w) => s + w.w, 0)).toBe(6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run lib/data/seed.test.ts
```

Expected: FAIL — "expected 10 to equal 20"

- [ ] **Step 3: Extend seed.ts with section 2**

Replace the contents of `lib/data/seed.ts` with:

```typescript
import type { Category, WidgetLayout } from '@/lib/grid/types';

export function seedWidgets(): WidgetLayout[] {
  const defs: Array<[Category, string, number, number, number, number]> = [
    // — Section 1: original sizes (rows 0–5) —
    // Row 0-1: hero + stacked accent column (4+2 = 6)
    ['finance',   'budget-summary',   4, 2, 0, 0],
    ['lifestyle', 'weather',          2, 1, 4, 0],
    ['health',    'steps',            2, 1, 4, 1],
    // Row 2-3: small pair + schedule + activity (1+1+2+2 = 6)
    ['calendar',  'mini-calendar',    1, 1, 0, 2],
    ['calendar',  'upcoming-events',  1, 1, 1, 2],
    ['calendar',  'todays-schedule',  2, 2, 2, 2],
    ['health',    'activity-rings',   2, 2, 4, 2],
    // Row 3: calorie bar fills under small pair
    ['health',    'calorie-tracker',  2, 1, 0, 3],
    // Row 4-5: wide pair (3+3 = 6)
    ['lifestyle', 'habit-tracker',    3, 2, 0, 4],
    ['lifestyle', 'daily-note',       3, 2, 3, 4],

    // — Section 2: alternative sizes (rows 6–10) —
    // Row 6-7: three 2×2 (2+2+2 = 6)
    ['finance',   'budget-summary',   2, 2, 0, 6],
    ['health',    'steps',            2, 2, 2, 6],
    ['calendar',  'mini-calendar',    2, 2, 4, 6],
    // Row 8-9: three 2×2 (2+2+2 = 6)
    ['calendar',  'upcoming-events',  2, 2, 0, 8],
    ['health',    'calorie-tracker',  2, 2, 2, 8],
    ['lifestyle', 'daily-note',       2, 2, 4, 8],
    // Row 10: two 2×1 + two 1×1 (2+2+1+1 = 6)
    ['calendar',  'todays-schedule',  2, 1, 0, 10],
    ['lifestyle', 'habit-tracker',    2, 1, 2, 10],
    ['lifestyle', 'weather',          1, 1, 4, 10],
    ['health',    'activity-rings',   1, 1, 5, 10],
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

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run lib/data/seed.test.ts
```

Expected: PASS — all 5 tests green

- [ ] **Step 5: Run full test suite to check for regressions**

```
npx vitest run
```

Expected: all tests pass. The existing `SettingsModal.test.tsx` line that reads `expect(useBoard.getState().widgets.length).toBe(seedWidgets().length)` will dynamically match the new count of 20 — no change needed.

- [ ] **Step 6: Type-check**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```
git add lib/data/seed.ts lib/data/seed.test.ts
git commit -m "feat: extend default layout to 20 widgets with alternative size instances"
```

---

### Task 2: Add "Log Layout" button to settings modal

**Files:**
- Modify: `components/shell/SettingsModal.tsx`
- Modify: `components/shell/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `useBoard` from `@/lib/state/boardStore` (already imported in SettingsModal.tsx at line 8)
- `useBoard.getState().widgets` — `WidgetLayout[]`

- [ ] **Step 1: Write the failing test**

Add this test to `components/shell/SettingsModal.test.tsx`, inside the `describe('SettingsModal')` block, after the existing tests:

```typescript
  it('log layout button logs current widgets to console', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const widgets = useBoard.getState().widgets;
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /log layout/i }));
    expect(spy).toHaveBeenCalledWith(widgets);
    spy.mockRestore();
  });
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run components/shell/SettingsModal.test.tsx
```

Expected: FAIL — "Unable to find an accessible element with the role 'button' and name /log layout/i"

- [ ] **Step 3: Add the button to SettingsModal.tsx**

In `components/shell/SettingsModal.tsx`, find the footer `<div className={styles.footer}>` (line 235). Add the log button as the first child, before the reset button:

```tsx
        <div className={styles.footer}>
          <button
            className={styles.reset}
            type="button"
            onClick={() => console.log(useBoard.getState().widgets)}
          >
            Log Layout
          </button>
          <button
            className={confirmingReset ? styles.resetConfirm : styles.reset}
            type="button"
            onBlur={() => setConfirmingReset(false)}
            onClick={() => {
              if (!confirmingReset) {
                setConfirmingReset(true);
              } else {
                s.resetSettings();
                useBoard.getState().resetBoard();
                p.resetProfile();
                onClose();
              }
            }}
          >
            {confirmingReset ? 'Confirm reset — tap again' : 'Reset to defaults'}
          </button>
          <button className={styles.close} onClick={onClose} type="button">Done</button>
        </div>
```

`useBoard` is already imported at line 8 — no new import needed.

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run components/shell/SettingsModal.test.tsx
```

Expected: PASS — all tests green including the new one

- [ ] **Step 5: Run full test suite**

```
npx vitest run
```

Expected: all tests pass

- [ ] **Step 6: Type-check**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```
git add components/shell/SettingsModal.tsx components/shell/SettingsModal.test.tsx
git commit -m "feat: add Log Layout debug button to settings modal"
```
