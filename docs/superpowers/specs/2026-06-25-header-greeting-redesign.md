# Header Greeting Redesign

**Date:** 2026-06-25
**Status:** Approved

## Goal

Redistribute the `Banner` component so it uses the full header width, and enrich the date and weather elements so they stand out as real information rather than a dim subtitle footnote.

## Current state

`Banner.tsx` renders a two-column flex row:

- **Left:** greeting (`22px / 650`) stacked above a single subtitle line (`13px / var(--muted)`) that concatenates date and weather as plain text — `Wednesday, June 25 · 72° Sunny`
- **Right:** profile avatar

The left content occupies roughly the left 30% of the header width; the center is empty.

## Design

### Layout

Two-column flex row — `justify-content: space-between`, `align-items: center`. No change to the outer container padding (`26px 0 14px`).

### Left column

Vertical stack (`flex-direction: column`, `gap: 5px`):

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Greeting | 22px | 650 | `var(--text)` |
| Date | 14px | 450 | `#b0bac8` |

`#b0bac8` sits between `var(--muted)` (`#8b98ab`) and `var(--text)` (`#e6edf6`) — visible and distinct from the greeting without competing with it.

### Right column

Flex row, `align-items: center`, `gap: 14px`:

```
[ weather block ]  [ profile avatar ]
```

**Weather block** — vertical stack, right-aligned text:

| Row | Content | Size | Weight | Color |
|-----|---------|------|--------|-------|
| Top | `<emoji> <temp>°` | emoji 18px · temp 20px · gap 5px | 600 | `var(--text)` |
| Bottom | condition label | 12px | 400 | `var(--muted)` |

Example: top row `☀️ 72°`, bottom row `Sunny`.

### Emoji mapping

`Banner.tsx` derives a weather emoji from `weather.condition` (case-insensitive substring match):

| Condition contains | Emoji |
|--------------------|-------|
| `sunny` / `clear` | ☀️ |
| `cloud` / `overcast` | ☁️ |
| `rain` / `drizzle` / `shower` | 🌧️ |
| `snow` / `sleet` / `flurr` | 🌨️ |
| `thunder` / `storm` | ⛈️ |
| `fog` / `mist` / `haze` | 🌫️ |
| `wind` | 🌬️ |
| _(fallback)_ | 🌡️ |

A small pure function `conditionEmoji(condition: string): string` lives in `Banner.tsx`. If `useWeather()` is later replaced with a real API that returns a condition code, only this function needs updating.

## Files changed

| File | Change |
|------|--------|
| `components/shell/Banner.tsx` | Restructure JSX; add `conditionEmoji`; split date and weather into separate elements |
| `components/shell/Banner.module.css` | Replace `.sub` with `.date` and `.weatherBlock` / `.weatherTop` / `.weatherCond` styles |

## Out of scope

- Replacing `useWeather()` with a real API — tracked separately as `TODO(real-weather)` in `lib/hooks/useWeather.ts`
- Responsive breakpoints below the sidebar-collapse threshold
- Light theme adjustments (date color `#b0bac8` reads well on both themes; verify visually)

## Mockups

Brainstorm session mockups are in `.superpowers/brainstorm/5170-1782415951/content/`.
