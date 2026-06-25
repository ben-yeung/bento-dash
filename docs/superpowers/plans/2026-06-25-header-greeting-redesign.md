# Header Greeting Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redistribute the Banner header component so greeting + date sit on the left and weather (stacked, with emoji) + profile avatar sit on the right, making better use of horizontal space.

**Architecture:** Two self-contained changes — (1) add a pure `conditionEmoji` helper with unit tests, then (2) restructure the Banner JSX and replace the single `.sub` CSS class with focused per-element classes. No new dependencies.

**Tech Stack:** Next.js 16, React, CSS Modules, Vitest 2 + jsdom 24 + @testing-library/react

## Global Constraints

- Node 20.18 — do NOT upgrade vitest, jsdom, or any pinned packages
- `npm run lint` is broken project-wide — use `npx tsc --noEmit` and `npx vitest run` to verify instead
- No new npm dependencies
- CSS Modules only (no Tailwind, no inline styles in production code)
- Date color `#b0bac8` is a hardcoded value — no CSS variable exists for it yet

---

### Task 1: `conditionEmoji` helper + unit tests

**Files:**
- Modify: `components/shell/Banner.tsx` — export `conditionEmoji` as a named function
- Create: `components/shell/Banner.test.tsx` — unit tests for `conditionEmoji`

**Interfaces:**
- Produces: `export function conditionEmoji(condition: string): string` — consumed by Task 2's Banner JSX

---

- [ ] **Step 1: Write the failing test file**

Create `components/shell/Banner.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { conditionEmoji } from './Banner';

describe('conditionEmoji', () => {
  it('returns ☀️ for Sunny', () => expect(conditionEmoji('Sunny')).toBe('☀️'));
  it('returns ☀️ for Clear', () => expect(conditionEmoji('Clear')).toBe('☀️'));
  it('returns ☁️ for Cloudy', () => expect(conditionEmoji('Cloudy')).toBe('☁️'));
  it('returns ☁️ for Overcast', () => expect(conditionEmoji('Overcast')).toBe('☁️'));
  it('returns 🌧️ for Rain', () => expect(conditionEmoji('Rain')).toBe('🌧️'));
  it('returns 🌧️ for Light Drizzle', () => expect(conditionEmoji('Light Drizzle')).toBe('🌧️'));
  it('returns 🌧️ for Heavy Showers', () => expect(conditionEmoji('Heavy Showers')).toBe('🌧️'));
  it('returns 🌨️ for Snow', () => expect(conditionEmoji('Snow')).toBe('🌨️'));
  it('returns 🌨️ for Sleet', () => expect(conditionEmoji('Sleet')).toBe('🌨️'));
  it('returns 🌨️ for Light Flurries', () => expect(conditionEmoji('Light Flurries')).toBe('🌨️'));
  it('returns ⛈️ for Thunderstorm', () => expect(conditionEmoji('Thunderstorm')).toBe('⛈️'));
  it('returns ⛈️ for Storm', () => expect(conditionEmoji('Storm')).toBe('⛈️'));
  it('returns 🌫️ for Fog', () => expect(conditionEmoji('Fog')).toBe('🌫️'));
  it('returns 🌫️ for Mist', () => expect(conditionEmoji('Mist')).toBe('🌫️'));
  it('returns 🌫️ for Haze', () => expect(conditionEmoji('Haze')).toBe('🌫️'));
  it('returns 🌬️ for Windy', () => expect(conditionEmoji('Windy')).toBe('🌬️'));
  it('is case-insensitive', () => {
    expect(conditionEmoji('SUNNY')).toBe('☀️');
    expect(conditionEmoji('partly cloudy')).toBe('☁️');
  });
  it('returns 🌡️ for unknown condition', () => expect(conditionEmoji('Tropical Cyclone')).toBe('🌡️'));
  it('returns 🌡️ for empty string', () => expect(conditionEmoji('')).toBe('🌡️'));
});
```

- [ ] **Step 2: Run test — verify it fails with import error**

```bash
npx vitest run components/shell/Banner.test.tsx
```

Expected: FAIL — `conditionEmoji` is not exported from `./Banner`

- [ ] **Step 3: Add `conditionEmoji` to `Banner.tsx`**

Add the export above the `Banner` component (leave the rest of the file untouched for now):

```tsx
'use client';
import { type ReactNode } from 'react';
import styles from './Banner.module.css';
import { useGreeting } from '@/lib/hooks/useGreeting';
import { useWeather } from '@/lib/hooks/useWeather';
import { useProfile } from '@/lib/state/profileStore';

export function conditionEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('sunny') || c.includes('clear')) return '☀️';
  if (c.includes('cloud') || c.includes('overcast')) return '☁️';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return '🌧️';
  if (c.includes('snow') || c.includes('sleet') || c.includes('flurr')) return '🌨️';
  if (c.includes('thunder') || c.includes('storm')) return '⛈️';
  if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return '🌫️';
  if (c.includes('wind')) return '🌬️';
  return '🌡️';
}

export function Banner({ profileSlot }: { profileSlot?: ReactNode }) {
  const greeting = useGreeting();
  const weather = useWeather();
  const { displayName } = useProfile();
  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return (
    <header className={styles.banner}>
      <div>
        <div className={styles.greet}>{greeting}, {displayName || 'there'}</div>
        <div className={styles.sub}>
          {date} · {weather.temp}° {weather.condition}
        </div>
      </div>
      <div className={styles.right}>{profileSlot}</div>
    </header>
  );
}
```

- [ ] **Step 4: Run test — verify all pass**

```bash
npx vitest run components/shell/Banner.test.tsx
```

Expected: PASS — 19 tests

- [ ] **Step 5: Commit**

```bash
git add components/shell/Banner.tsx components/shell/Banner.test.tsx
git commit -m "feat: add conditionEmoji helper to Banner"
```

---

### Task 2: Restructure Banner JSX and CSS

**Files:**
- Modify: `components/shell/Banner.tsx` — restructure JSX to use new layout
- Modify: `components/shell/Banner.module.css` — replace `.sub` with `.date`, `.weatherBlock`, `.weatherTop`, `.weatherCond`; add `.left`; update `.banner` alignment

**Interfaces:**
- Consumes: `conditionEmoji(condition: string): string` from Task 1
- Produces: updated Banner component — same props, same `profileSlot` API, visual output changed

---

- [ ] **Step 1: Replace `Banner.module.css` entirely**

```css
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 26px 0 14px;
}
.left {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.greet {
  font-size: 22px;
  font-weight: 650;
  letter-spacing: -0.01em;
}
.date {
  font-size: 14px;
  font-weight: 450;
  color: #b0bac8;
}
.right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.weatherBlock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}
.weatherTop {
  display: flex;
  align-items: center;
  gap: 5px;
  line-height: 1;
}
.weatherEmoji {
  font-size: 18px;
}
.weatherTemp {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.weatherCond {
  font-size: 12px;
  color: var(--muted);
}
```

- [ ] **Step 2: Restructure `Banner.tsx` JSX**

Replace the full file:

```tsx
'use client';
import { type ReactNode } from 'react';
import styles from './Banner.module.css';
import { useGreeting } from '@/lib/hooks/useGreeting';
import { useWeather } from '@/lib/hooks/useWeather';
import { useProfile } from '@/lib/state/profileStore';

export function conditionEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('sunny') || c.includes('clear')) return '☀️';
  if (c.includes('cloud') || c.includes('overcast')) return '☁️';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return '🌧️';
  if (c.includes('snow') || c.includes('sleet') || c.includes('flurr')) return '🌨️';
  if (c.includes('thunder') || c.includes('storm')) return '⛈️';
  if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return '🌫️';
  if (c.includes('wind')) return '🌬️';
  return '🌡️';
}

export function Banner({ profileSlot }: { profileSlot?: ReactNode }) {
  const greeting = useGreeting();
  const weather = useWeather();
  const { displayName } = useProfile();
  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return (
    <header className={styles.banner}>
      <div className={styles.left}>
        <div className={styles.greet}>{greeting}, {displayName || 'there'}</div>
        <div className={styles.date}>{date}</div>
      </div>
      <div className={styles.right}>
        <div className={styles.weatherBlock}>
          <div className={styles.weatherTop}>
            <span className={styles.weatherEmoji}>{conditionEmoji(weather.condition)}</span>
            <span className={styles.weatherTemp}>{weather.temp}°</span>
          </div>
          <div className={styles.weatherCond}>{weather.condition}</div>
        </div>
        {profileSlot}
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run components/shell/Banner.test.tsx
```

Expected: PASS — 19 tests (same as Task 1; the `conditionEmoji` export is unchanged)

- [ ] **Step 5: Verify visually in the running app**

```bash
npm run dev
```

Open `http://localhost:3000`. The header should show:
- Left: greeting on top, date (`Wednesday, June 25`) below in a slightly lighter colour
- Right: stacked weather (emoji + `72°` on top, `Sunny` below) next to the profile avatar
- No content in the center gap — that space is now intentionally open

- [ ] **Step 6: Commit**

```bash
git add components/shell/Banner.tsx components/shell/Banner.module.css
git commit -m "feat: redesign Banner header — enriched date/weather, horizontal distribution"
```
