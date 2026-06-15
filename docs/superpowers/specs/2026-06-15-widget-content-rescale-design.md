# Widget Content Rescale Design

**Date:** 2026-06-15
**Supersedes the scaling approach in:** `2026-06-10-widget-content-design.md` (the 10-widget catalog and supported sizes stay; only the sizing/layout system and the per-size layouts change)
**Canonical reference (visual source of truth):** `.superpowers/brainstorm/997-1781557254/content/all-widgets-passover-v3.html` — every widget × supported size at the final scale/layout, driven by a single `--cell` so proportions match production. Earlier exploration: `redesign-direction-v2.html`, `redesign-direction-v3.html`. The mockup uses bordered-circle rings and CSS heatmaps as approximations; production uses SVG equivalents (see Charts/SVG).

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
| `--w-font-detail` | `0.095` | 19px | secondary / supporting text |
| `--w-font-title` | `0.13` | 26px | widget title, list item titles, event titles |
| `--w-font-value` | `0.18` | 36px | secondary metrics, list times, streak counts |
| `--w-font-hero` | `0.27` | 54px | the one hero figure per layout |

Notes:
- These are **multiples of `--cell-size`** (e.g. `--w-font-hero: calc(var(--cell-size) * 0.27)`), so they scale with the board and stay uniform across tiles.
- These were tuned interactively against the full passover mockup (see Canonical reference) using Steps as the baseline widget.
- A layout chooses which token its hero uses, and may apply a **per-layout one-off ratio** when the hero should be bigger/smaller than the standard token. Settled examples (ratio of cell):
  - Budget 3×2/4×2 spent hero `0.30`; budget 2×2 donut center `0.24`; the "left" remaining figure `0.15`.
  - Calorie ring center `0.18–0.20`; calorie 2×1 count `0.22`; "/ goal" sub `0.13`.
  - Weather 1×1 temp `0.32`, 2×2 `0.40`, 3×2 `0.42`; forecast icons `0.16`.
  - Mini-calendar day grid `0.10–0.13`; 1×1 day number `0.34`.
  - Streak count `0.12`; heatmap/mini-cell square `0.06`; habit dots `0.10` (2×2/3×2), `0.20` (1×1/2×1).

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

All graphical elements are sized in the same `--cell-size` scale system, never fixed px:
- **Rings/donuts are thin strokes at a generous diameter.** The mockup approximates them with a bordered circle (`border-width ≈ 0.05–0.075 × cell`, two sides accented). The real component should use an SVG `viewBox` + `stroke-dasharray` for an arbitrary-percentage arc, but the **visual intent is a thin band, not a thick pie** — this was an explicit correction. Diameters (ratio of cell): budget 1×1 `0.62`, budget 2×2 `1.32`; calorie 1×1 `0.72`, 2×2 `1.18`, 3×2 `1.15`; activity concentric outer `0.56` (1×1) / `0.50` (2×1) / `0.80` (2×2) / `1.15` (3×2), inner rings at `0.66×` and `0.34×` of the outer. Calorie rings use the **green** accent `#6bcb77` (matching the 2×1 progress bar), not red.
- **Bar charts:** chart container is `flex: 1` (fills the body); bars use `flex` weights for width and `%` height of the container, so the chart fills its region at any scale. The Steps 3×2 chart has a labelled **am/pm hourly x-axis** beneath the bars.
- **Heatmaps / mini grids** (habit week, mini-calendar): CSS grid `repeat(7, 1fr)` × `grid-auto-rows: 1fr` filling the region; cells `border-radius: 2px`.

This removes the fixed-px graphics that didn't track the text.

---

## Conventions (settled during the passover)

These apply across widgets so the board reads consistently:

- **Top-left label:** every multi-cell tile carries an uppercase muted `--w-font-label` context label in the header's top-left (the "2×2 style"), including the 3×2/4×2 sizes. 1×1 tiles may use it or go label-less when the hero needs the room.
- **Calendar weeks run Sunday → Saturday** (header `S M T W T F S`); the mini-calendar offsets the first day accordingly (June 2026 starts Monday → one leading blank). Today is highlighted with a filled accent circle.
- **Event/schedule rows:** time on the **left**, title **right-aligned**. Time uses `--w-font-value` weight 700 (full color); title uses `--w-font-title` at weight ~400 so it reads **100+ lighter than the time**. Duration is `--w-font-detail` muted. (Today's Schedule 1×2 stacks: time top-left, title bottom-right.)
- **Habits are colour-coded per habit** from the lifestyle palette (amber `#f59e0b`, green `#10b981`, indigo `#6366f1`, pink `#ec4899`, sky `#38bdf8`). Done = filled dot in the habit colour; pending = ghost `#2a3550`.
- **Streaks:** habit 1×1/2×1/2×2 show a 🔥 + **count** (white, `--w-font-value`-ish at `0.12`). The count is the week's completion total and matches the 3×2 weekly heatmap (e.g. Run 5, Reading 6).
- **Money "remaining" is green** (`#6bd99a`) everywhere it appears (budget 3×2/4×2).
- **Budget 3×2 and 4×2 share one layout:** header (label left, green "$X left" top-right) / body (large `$spent / $total` hero + green status, then a horizontal **Recent transactions** row — merchant top-left, amount bottom-right, no minus sign) / footer (segmented bar above a 4-column category legend with rounded-square swatches).

---

## Shared sub-components

Extract repeated pieces into `components/widgets/content/_shared/` so density/scale are defined once (kills inconsistency, shrinks each widget file):

| Component | Props | Used by |
|---|---|---|
| `Header` | `label`, optional `aside` | every 2×2+ widget (top-left label) |
| `Donut` | `pct`, `centerLabel`, `centerSub?`, color, `size` | budget (sm), calorie |
| `ConcRings` | per-ring `{pct,color}`, `size` | activity-rings (thin concentric) |
| `SegmentedBar` | segments `[{weight,color}]`, remainder | budget |
| `ProgressBar` | `pct`, color | calorie, steps |
| `MetricBar` | colored `label`, `current/goal`, `pct`, color | activity 3×2, calorie 3×2 (label + cur/goal above bar) |
| `StatStrip` | `[{label,value}]` | steps, calorie 2×2, weather |
| `EventChip` | `time`, `duration?`, `title`, color, `align` | schedule, upcoming-events |
| `WeekHeatmap` | rows `[{color, days[]}]`, day-letter header | habit 3×2 |
| `StreakBadge` | `count` | habit 1×1/2×1/2×2 (🔥 + white count) |
| `TransactionRow` | `[{merchant, amount}]` | budget 3×2/4×2 (merchant top-left, amount bottom-right) |

All consume the token vars, so a `Header` label is identical everywhere.

---

## Per-widget layout direction

All multi-row variants use the header/body/footer fill grid. The **canonical visual reference is the passover mockup** (see top of doc); the notes below capture the final intent. Donut/ring is reserved for **small** budget sizes; large budget uses a number hero.

### Finance

**Budget Summary** — `1×1`, `2×2`, `3×2`, `4×2`
- **1×1:** "Jun" label; thin **donut** centered, center `$1.5k` with "left" sub inside the ring.
- **2×2:** "June · Budget" label; large thin **donut** centered, center `$1.5k` / "left of $5k".
- **3×2 and 4×2 (same layout):** header = label top-left + green **"$1,500 left"** (`0.15`) top-right; body = large **`$3,500`** (`0.30`) `/ $5,000` muted hero + green "on track for the month", then a horizontal **Recent transactions** row (merchant top-left / amount bottom-right, no minus); footer = **segmented bar** above a 4-column category legend (rounded-square swatch + name + amount). 4×2 simply has more horizontal room (5 transactions).

### Health

**Activity Rings** — `1×1`, `2×1`, `2×2`, `3×2` (concentric thin rings; Move `#ff6b6b` / Exercise `#ffd93d` / Stand `#6bcb77`)
- **1×1:** concentric rings centered.
- **2×1:** "Activity" label; rings left, 3 stat rows (Move/Exercise/Stand) right.
- **2×2:** "Today's Activity" label; rings centered; footer = all **3** stat rows.
- **3×2:** label; rings left, then a single stacked column (matching calorie 3×2): 3 `MetricBar`s (colored label + `cur/goal` above bar) on top, divider, recent-workouts list below.

**Calorie Tracker** — `1×1`, `2×1`, `2×2`, `3×2` (green ring)
- **1×1:** thin donut centered, center `1,840` + "CAL" sub inside.
- **2×1:** "Calories" label top-left; large `1,840` + `/ 2,400` (`0.13`); progress bar; P/C/F macros row beneath the bar.
- **2×2:** label; ring hero (`1,840` / "of 2,400" inside); footer = P/C/F `StatStrip`.
- **3×2:** label; ring left, then one stacked column: 3 macro `MetricBar`s (Protein/Carbs/Fat, cur/goal above bar) + divider + meal log.

**Steps** — `1×1`, `2×1`, `2×2`, `3×2` (accent `#38bdf8`)
- **1×1:** "Steps" label; hero count; bar; "82% of 10k".
- **2×1:** "Steps" label top-left; count + `/ 10,000`; bar; Distance/Active.
- **2×2:** label; hero count; bar; "82% of 10k"; Distance/Active/Floors `StatStrip`.
- **3×2:** "Steps" label left + **`8,190 / 10,000`** top-right (value scale, no %); **hourly bar chart fills the body** with an **am/pm x-axis**; `StatStrip` footer.

### Calendar

**Upcoming Events** — `1×1`, `2×1`, `2×2`, `3×2` (time left / title right-aligned; time 700, title ~400)
- **1×1:** "Next" label; time hero; title; color dot + "in 25 min".
- **2×1:** 2 `EventChip` rows distributed.
- **2×2:** label; chips distributed `1fr`.
- **3×2:** chips with duration + subtitle, distributed `1fr`.

**Mini Calendar** — `1×1`, `2×2`, `3×2`, `3×3`
- **1×1:** month (accent) + hero day number + weekday.
- **2×2 / 3×2 / 3×3:** **Sun→Sat** month grid fills the body (`repeat(7,1fr)` × `grid-auto-rows:1fr`); today = filled accent circle; enlarged day font. 3×3 adds nav arrows.

**Today's Schedule** — `1×2`, `2×2`, `2×3`
- header + `EventChip` timeline, time left / title right-aligned, color left bar, distributed `grid-auto-rows: 1fr`. **1×2** stacks each chip (time top-left, title bottom-right). Larger sizes show more events + duration.

### Lifestyle

**Habit Tracker** — `1×1`, `2×1`, `2×2`, `3×2` (per-habit colors)
- **1×1:** "Habits" label + `3/5`; enlarged dots in a **3-top / 2-bottom** layout.
- **2×1:** label + `3/5`; row of dots, each with a 🔥 **count** beneath, vertically centered.
- **2×2:** label + `3/5`; habit rows (colored dot + name + 🔥 **week count**) distributed `1fr`.
- **3×2:** label + `3/5`; left = habit list (distributed like 2×2), right = **`WeekHeatmap`** with `S M T W T F S` header, one colored row per habit, filling the column.

**Weather** — `1×1`, `2×1`, `2×2`, `3×2`
- **1×1:** icon + city top-right; temp (`0.32`) bottom-right + "Sunny".
- **2×1:** icon | hero temp + H/L | city / feels-like.
- **2×2:** label + icon; hero temp (`0.40`) + "Sunny · H/L"; footer = **3-day forecast** row.
- **3×2:** label + icon; hero temp (`0.42`) + H/L/Wind/UV stat band; footer = **5-day forecast** strip (`repeat(5,1fr)`, larger icons).

**Daily Note** — `1×1`, `2×2`, `2×3`, `3×2`
- **1×1:** date + pencil header; **checklist only** (no note text).
- **2×2:** header + note body fills.
- **2×3:** header + note; checklist footer.
- **3×2:** note left, divider, checklist right.

---

## Files

| File | Change |
|---|---|
| `app/globals.css` | (optional) bump `.board` `max-width` for true 2k/4k growth — see Open question |
| `components/widgets/content/scale.ts` | **Create** — `SCALE` ratio constants + a helper that emits the CSS-var style object |
| `components/board/Widget.tsx` | Replace the `font-size/10` wrapper with the token + `container-type: size` wrapper |
| `components/widgets/content/_shared/*` | **Create** shared sub-components (`Header`, `Donut`, `ConcRings`, `SegmentedBar`, `ProgressBar`, `MetricBar`, `StatStrip`, `EventChip`, `WeekHeatmap`, `StreakBadge`, `TransactionRow`) |
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
