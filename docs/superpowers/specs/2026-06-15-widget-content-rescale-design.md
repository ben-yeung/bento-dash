# Widget Content Rescale Design

**Date:** 2026-06-15
**Supersedes the scaling approach in:** `2026-06-10-widget-content-design.md` (the 10-widget catalog and supported sizes stay; only the sizing/layout system and the per-size layouts change)
**Mockups:** `.superpowers/brainstorm/997-1781557254/content/` — `redesign-direction-v2.html`, `redesign-direction-v3.html`, `schedule-rightalign-v4.html`

---

## Problem

The first widget-content implementation laid every size variant out in `px`, then a later pass wrapped each tile in `font-size: calc(var(--cell-size) / 10)` and converted `px` → `em` to make content scale. In practice the result is wrong (see the screenshot diagnosis):

1. **Dead space.** Layouts were authored sparse — corner-anchoring, `margin-top: auto`, `justify-content: space-between` — so on real (large) tiles the slack becomes a void in the middle. Example: Budget 3×2 has the donut floating top-left and "Remaining" floating bottom-left with an empty center.
2. **Weak hierarchy.** Hero data (money, times) is not large enough; supporting labels are a fraction of the tile. The eye has nothing to land on.
3. **Imbalance.** When the hero *was* enlarged, corner labels became tiny relative to it (~5:1), looking unbalanced.
4. **Inconsistency across widgets.** Because each file picked its own `em` multipliers ad hoc, the same conceptual element (e.g. an uppercase label) renders at different sizes across widgets.
5. **Single-axis base.** `--cell-size / 10` tracks only the square cell edge; the fixed 12px grid gap is not part of the unit, so the em coordinate system drifts ~3% as the cell size changes.

## Goals

- Keep the existing content patterns and the 10-widget catalog + supported sizes. This is a re-layout and re-scale, **not** new widget types.
- **Zoom to fill:** each size variant is authored to fill its tile and scales as a unit; bigger screen → proportionally bigger content.
- Hero data dominates; supporting detail uses leftover space instead of padding.
- One shared, board-uniform scale so every widget looks consistent.
- Tune the reference at **1080p (cell ≈ 200px)**; scale cleanly up to 2k/4k.

## Non-goals

- No new widget types, no changes to `supportedSizes`, the registry shape, drag/resize, or persistence.
- No content-aware reflow breakpoints (we chose zoom-to-fill, not "show more detail"). A larger *preset* gets a distinct authored layout; the same preset on a larger *screen* just scales.

---

## Scaling foundation

### Master unit + token scale

All sizing derives from a single board-uniform unit, the existing `--cell-size` (px, set on `.board` in `BentoBoard.tsx`). Because every cell on the board is the same size, deriving tokens from `--cell-size` makes a "label" the same physical size on **every** widget → consistency (fixes problem #4), while still growing with the screen (zoom-to-fill, fixes #2/#5).

Add a token block, scoped to the tile content wrapper, expressed as ratios of `--cell-size`. Reference values are quoted at cell = 200px (1080p target).

| Token | Ratio of cell | @200px | Use |
|---|---|---|---|
| `--w-pad` | `0.09` | 18px | tile padding |
| `--w-gap` | `0.06` | 12px | region / row gap |
| `--w-font-label` | `0.075` | 15px | uppercase context labels |
| `--w-font-detail` | `0.085` | 17px | secondary / supporting text |
| `--w-font-title` | `0.11` | 22px | widget title, list item titles |
| `--w-font-value` | `0.16` | 32px | secondary metrics, list times |
| `--w-font-hero` | `0.27` | 54px | the one hero figure per layout |

Notes:
- These are **multiples of `--cell-size`** (e.g. `--w-font-hero: calc(var(--cell-size) * 0.27)`), so they scale with the board and stay uniform across tiles.
- The hero:label ratio is ~3.5:1 (was ~5:1) — the balance the user approved in v3.
- A layout chooses which token its hero uses. Small tiles (1×1) may promote a value to hero scale; large tiles (4×2) may use an even larger one-off (`calc(var(--cell-size) * 0.32)`) — those are explicit per-layout choices, not automatic.

### Where the tokens live

- Define the ratios as constants in one place: `components/widgets/content/scale.ts` (exported `SCALE` object) **and** mirror them as CSS custom properties so both inline-styled components and any CSS can use them.
- The tile content wrapper in `components/board/Widget.tsx` sets the CSS vars and becomes a **CSS container**:
  ```tsx
  <div
    style={{
      position: 'absolute', inset: 0,
      containerType: 'size',
      // tokens, all derived from --cell-size which is inherited from .board
      ['--w-pad' as string]: 'calc(var(--cell-size) * 0.09)',
      ['--w-gap' as string]: 'calc(var(--cell-size) * 0.06)',
      ['--w-font-label' as string]: 'calc(var(--cell-size) * 0.075)',
      // …rest of the tokens…
    } as React.CSSProperties}
  >
    <ContentComponent category={widget.category} w={widget.w} h={widget.h} />
  </div>
  ```
  This replaces the current `fontSize: calc(var(--cell-size,100px)/10)` wrapper.
- `containerType: size` lets graphical elements use container units where useful (see Charts).

### Layout primitive: fill-the-box grid

Every multi-row variant is a CSS grid with explicit regions so it fills top-to-bottom (fixes #1):

```
grid-template-rows: auto  1fr  auto;   /* header / body / footer */
```

- **header** (`auto`): context label + title, and/or a right-aligned secondary stat.
- **body** (`1fr`): the hero zone — expands to consume free space; the hero is centered or top-aligned within it.
- **footer** (`auto`): supporting detail (bars, stat strips, category rows).

Lists that should distribute evenly (schedule, events, habits, meals) use an inner grid with `grid-auto-rows: 1fr; gap: var(--w-gap)` so rows grow to fill instead of clumping at the top or stretching into one big gap. **No `margin: auto` / `justify-content: space-between` to push content to opposite edges** — that was the source of the voids.

### Charts / SVG

SVGs keep an intrinsic `viewBox` (so internal geometry stays proportional) and are sized in the same scale system rather than fixed px:
- Donuts / rings: size from a value token, e.g. `width: calc(var(--cell-size) * 1.1)` on 2×2, or `min(80cqw, 80cqh)` where they should simply fill their cell.
- Bar charts: the chart container is `flex: 1` (fills the body); bars use `flex` weights for width and `%`/`cqh` for height, so the chart fills its region at any scale.

This removes the remaining fixed-px graphics that didn't track the text.

---

## Shared sub-components

Extract repeated pieces into `components/widgets/content/_shared/` so density/scale are defined once (kills inconsistency, shrinks each widget file):

| Component | Props | Used by |
|---|---|---|
| `Header` | `label`, `title`, optional `aside` | every 2×2+ widget |
| `Donut` | `pct`, `centerLabel`, `centerSub?`, color | budget (sm), calorie, activity 1×1 |
| `Ring` / `ConcRings` | per-ring pct + color | activity-rings |
| `SegmentedBar` | segments `[{weight,color}]`, optional remainder | budget |
| `ProgressBar` | `pct`, color | calorie, steps |
| `StatStrip` | `[{label,value}]` | steps, calorie, weather |
| `EventChip` | `time`, `duration?`, `title`, color, `align` | schedule, upcoming-events |

All consume the token vars, so a `Header` label is identical everywhere.

---

## Per-widget layout direction

The hero of each layout is **bold**. All multi-row variants use the header/body/footer fill grid. Calendar-family titles are **right-aligned with time on the left** (user request). Donut is reserved for **small** budget sizes.

### Finance

**Budget Summary** — `1×1`, `2×2`, `3×2`, `4×2`
- **1×1:** "Jun" label; **donut** hero centered, center label `$1.5k`.
- **2×2:** label header; **donut** hero (large) centered, center `$1.5k` / "left of $5k".
- **3×2:** header (`June 2026 · Monthly Budget` + "15 days left"); body hero = **`$3,500`** with `/ $5,000` at value scale + "$1,500 left · on track" detail; footer = **segmented bar** + 4 labeled category amounts. (v3 left tile.)
- **4×2:** same as 3×2 but the footer category breakdown spreads to 4 columns with the bar full-width; hero may use the larger one-off ratio.

### Health

**Activity Rings** — `1×1`, `2×1`, `2×2`, `3×2`
- **1×1:** concentric rings fill the tile.
- **2×1:** rings left (fill height), 3 stat rows right (Move/Exercise/Stand) at detail scale, value bold.
- **2×2:** header; body = rings hero centered; footer = 3 stat rows.
- **3×2:** rings hero left (fill); center = per-metric progress bars at value scale; right = weekly mini bars.

**Calorie Tracker** — `1×1`, `2×1`, `2×2`, `3×2`
- **1×1:** donut hero, center `1,840`.
- **2×1:** hero `1,840` + `/ 2,400` detail; progress bar fills width.
- **2×2:** header; hero `1,840 / 2,400 kcal`; progress bar; macros stat strip footer.
- **3×2:** left column hero + bar + macro bars; right column meal log (`EventChip`-style rows distributed `1fr`).

**Steps** — `1×1`, `2×1`, `2×2`, `3×2`
- **1×1:** "Steps" label; hero step count (accent); thin progress bar; "82% of 10k" detail.
- **2×1:** hero count + `/ 10,000`; bar; Distance/Active inline.
- **2×2:** hero count; bar; Distance/Active/Floors `StatStrip` footer.
- **3×2:** hero count header; **hourly bar chart fills the body** (`flex:1`); `StatStrip` footer.

### Calendar

**Upcoming Events** — `1×1`, `2×1`, `2×2`, `3×2`
- **1×1:** "Next · 9:00" label; event name hero (right/left as fits small); color dot + "in 25 min".
- **2×1:** 2 `EventChip` rows.
- **2×2:** header; event chips distributed `1fr`, **time left / title right-aligned**, color left bar.
- **3×2:** chips with duration + optional subtitle, distributed `1fr`.

**Mini Calendar** — `1×1`, `2×2`, `3×2`, `3×3`
- **1×1:** month (accent) + hero day number + weekday + event dot.
- **2×2 / 3×2 / 3×3:** month grid fills the body with `grid-template-columns: repeat(7,1fr)` and `grid-auto-rows: 1fr` so the weeks fill the tile; today highlighted; event dots. 3×3 adds month/year header + nav.

**Today's Schedule** — `1×2`, `2×2`, `2×3`
- All sizes: header + timeline of `EventChip`s, **time left / title right-aligned**, color left bar, distributed `grid-auto-rows: 1fr`. Times at value scale, titles at title scale, duration at label scale. (v4 mockup.) Larger sizes show more events + a "now" marker.

### Lifestyle

**Habit Tracker** — `1×1`, `2×1`, `2×2`, `3×2`
- **1×1:** "Habits" label; `3/5` hero; two rows of dots.
- **2×1:** header left, `3/5` hero right; single row of dots filling width.
- **2×2:** header (`Done 3/5`); habit rows (dot + name + done indicator) distributed `1fr`.
- **3×2:** left = habit rows; right = **weekly heatmap that fills its column** (`grid-template-columns: repeat(7,1fr)`, `grid-auto-rows: 1fr`) — fixes the tiny floating grid.

**Weather** — `1×1`, `2×1`, `2×2`, `3×2`
- **1×1:** icon + hero `72°` + "Sunny"; city top-right.
- **2×1:** icon | hero temp + H/L | city/feels-like.
- **2×2:** header + icon; hero temp + condition; `StatStrip` (H/L/Wind/UV) footer.
- **3×2:** header; current row; **5-day forecast strip fills the footer** (`repeat(5,1fr)`).

**Daily Note** — `1×1`, `2×2`, `2×3`, `3×2`
- **1×1:** date label + pencil; note text fills (clamp).
- **2×2:** header + note body fills.
- **2×3:** header + note; checklist footer (rows distributed).
- **3×2:** note left, vertical divider, checklist right (rows distributed `1fr`).

---

## Files

| File | Change |
|---|---|
| `app/globals.css` | (optional) bump `.board` `max-width` for true 2k/4k growth — see Open question |
| `components/widgets/content/scale.ts` | **Create** — `SCALE` ratio constants + a helper that emits the CSS-var style object |
| `components/board/Widget.tsx` | Replace the `font-size/10` wrapper with the token + `container-type: size` wrapper |
| `components/widgets/content/_shared/*` | **Create** shared sub-components (`Header`, `Donut`, `Ring`, `SegmentedBar`, `ProgressBar`, `StatStrip`, `EventChip`) |
| `components/widgets/content/budget-summary.tsx` | Rewrite layouts (number-hero large, donut small) |
| `components/widgets/content/activity-rings.tsx` | Rewrite layouts |
| `components/widgets/content/calorie-tracker.tsx` | Rewrite layouts |
| `components/widgets/content/steps.tsx` | Rewrite layouts |
| `components/widgets/content/upcoming-events.tsx` | Rewrite layouts (right-aligned titles) |
| `components/widgets/content/mini-calendar.tsx` | Rewrite layouts (fill grid) |
| `components/widgets/content/todays-schedule.tsx` | Rewrite layouts (right-aligned, fill) |
| `components/widgets/content/habit-tracker.tsx` | Rewrite layouts (fill heatmap) |
| `components/widgets/content/weather.tsx` | Rewrite layouts |
| `components/widgets/content/daily-note.tsx` | Rewrite layouts |

No changes to `registry.ts`, `sizes.ts`, drag/resize, store, or seed.

---

## Testing

- The existing component tests assert each widget renders for its supported sizes without throwing — keep those green through the rewrite.
- Add a token test for `scale.ts`: ratios present and monotonic (`label < detail < title < value < hero`).
- Visual verification at the three cell sizes that matter: small (~120px), 1080p reference (~200px), and a forced large (~360px, simulating an uncapped 4k board) — confirm no overflow/clipping and no central voids. This is a manual `/verify`-style check, not an automated assertion.

---

## Open question (deferred, non-blocking)

`max-width: 1260px` on `.board` caps the cell at ~200px, so the dashboard does **not** grow on 2k/4k — it just gains margin. The token system tuned at 1080p stays correct either way. If we later want the board to actually fill larger screens, raise/remove `max-width` (and optionally clamp `--cell-size`). Tracked as `TODO(board-maxwidth-2k)` in `app/globals.css` at implementation time. Not part of this work unless requested.
