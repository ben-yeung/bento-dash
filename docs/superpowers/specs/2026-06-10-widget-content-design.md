# Widget Content Design

**Date:** 2026-06-10
**Mockups:** `.superpowers/brainstorm/949-1781142661/content/`
- `finance-widgets-v17.html`
- `health-widgets-v14.html`
- `calendar-widgets-v1.html`
- `lifestyle-widgets-v3.html`

---

## Overview

Expands the dashboard from 4 placeholder widget types to 12 fully-specified content widgets across 4 categories. Each widget type declares a fixed set of valid sizes; resize only snaps to those sizes. Every size has a distinct layout — not just a scaled version of another.

---

## Architecture Decisions

### widgetType field (Option B)

Add `widgetType: string` to `WidgetLayout` in `lib/grid/types.ts`. This allows the registry to be keyed by type string while the layout record carries the type through to the renderer.

```ts
export interface WidgetLayout {
  // ... existing fields ...
  widgetType: string; // e.g. 'budget-summary', 'activity-rings'
}
```

### Flat registry (Option A)

Expand `WIDGET_REGISTRY` in `lib/widgets/registry.ts` from 4 entries to 12, one per widget type. Each entry includes:
- `type: string` — kebab-case identifier
- `label: string` — display name
- `category: Category`
- `accentColor: string`
- `icon: LucideIcon`
- `supportedSizes: SizePreset[]` — only valid snap targets for resize
- `ContentComponent` — per-type React component receiving `{ w, h }` props

### Size snapping

Resize only snaps to sizes in the widget's `supportedSizes` array. `nearestPreset` in `lib/grid/sizes.ts` is already available; the resize logic should filter candidates to `supportedSizes` before picking nearest.

---

## Design Tokens

All widgets use these CSS custom properties (defined globally):

| Token | Value |
|---|---|
| `--bg` | `#0b1120` |
| `--surface` | `#141d2e` |
| `--text` | `#e6edf6` |
| `--muted` | `#8b98ab` |
| `--accent` | `#6366f1` |
| `--border-hairline` | `rgba(148,163,184,0.16)` |
| `--radius-tile` | `14px` |
| `--gap` | `10px` |
| `--cell` | `92px` |

### Category accent colors

| Category | Color |
|---|---|
| Finance | `#6366f1` (indigo) |
| Health | Move `#ff6b6b`, Exercise `#ffd93d`, Stand `#6bcb77` |
| Calendar | `#3b82f6`, `#8b5cf6`, `#ec4899`, `#10b981` (per-event) |
| Lifestyle | Amber `#f59e0b`, Green `#10b981`, Indigo `#6366f1`, Pink `#ec4899`, Sky `#38bdf8` |

### Header pattern

All 2×2+ widgets use a two-line top-left header:
- Line 1: muted `.label` class (10px, uppercase, letter-spacing) — date/context
- Line 2: 13px semi-bold white — widget title

---

## Widget Catalog

### Category: Finance

#### Budget Summary
**Type:** `budget-summary` | **Icon:** `trending-up` | **Accent:** `#6366f1`
**Sizes:** `1×1`, `2×2`, `3×2`, `4×2`

| Size | Layout |
|---|---|
| **1×1** | "Jun" muted label top-left. Large donut ring centered (fills most of tile) showing dollar amount remaining (e.g. "$1,500") in ring center. No percentage text. |
| **2×2** | Header: "June 2026" / "Budget". Amount block top-right: large bold spent "$3,500" + muted "/ $5,000" on second line. Horizontal stacked bar (color-coded by category). Category breakdown rows below bar. |
| **3×2** | Header: "June 2026" / "Monthly Budget" left. Donut ring center-left showing "70%" only. "$3,500" / "/ $5,000" two lines below ring. "REMAINING" muted label + "$1,500" large bold top-right. Category bars in right column. |
| **4×2** | Full-width header row: amounts + horizontal stacked bar spanning width. Four-column category breakdown with icons below bar. |

---

### Category: Health

#### Activity Rings
**Type:** `activity-rings` | **Icon:** `activity` | **Accent:** Move `#ff6b6b`, Exercise `#ffd93d`, Stand `#6bcb77`
**Sizes:** `1×1`, `2×1`, `2×2`, `3×2`

| Size | Layout |
|---|---|
| **1×1** | Full-width concentric rings (Move / Exercise / Stand). No label. Color-only completion state. |
| **2×1** | "Activity" muted label top-left. 52px concentric rings left. Stat rows right: Move / Exercise / Stand with abbreviated units, `white-space: nowrap`. Color indicates completion, no checkmarks. Content padded down from label (`padding-top: 18px`). |
| **2×2** | Header: "Today's" / "Activity" (white). SVG line chart with 3 colored polylines showing progress over the day (Move / Exercise / Stand). Stat rows below chart. |
| **3×2** | Large concentric rings left. Per-metric horizontal progress bars center. Weekly mini bar charts right column. |

#### Calorie Tracker
**Type:** `calorie-tracker` | **Icon:** `flame` | **Accent:** `#ff6b6b`
**Sizes:** `1×1`, `2×1`, `2×2`, `3×2`

| Size | Layout |
|---|---|
| **1×1** | 72px donut ring centered, showing calories consumed (e.g. "1,840"). Matches Activity Rings ring size. |
| **2×1** | "Calories" muted label top-left. Bold large "1,840" + muted "/ 2,400" two lines (no "kcal" on total). |
| **2×2** | Header: "Today's" / "Calories" left. "1,840 / 2,400 kcal" top-right. Green horizontal progress bar. Macros row (Protein / Carbs / Fat) below. |
| **3×2** | Same header + bar pattern. Macros breakdown left column. Meal log right column (no "Meals" section label). |

#### Steps
**Type:** `steps` | **Icon:** `footprints` | **Accent:** `#38bdf8`
**Sizes:** `1×1`, `2×1`, `2×2`, `3×2`

| Size | Layout |
|---|---|
| **1×1** | "Steps" muted label. Large step count in accent color. Thin progress bar + "82% of 10k" muted. |
| **2×1** | Step count + bar + distance metric. |
| **2×2** | Large step count + horizontal progress bar. Distance / Active time / Floors metrics strip below. No "to go" line. |
| **3×2** | Hourly bar chart (6am–4pm, ~11 bars; current bar at full brightness with "now" label, two peaks at 7am/12pm). Metrics strip at bottom: Distance / Active / Floors at 20px font. |

---

### Category: Calendar

#### Upcoming Events
**Type:** `upcoming-events` | **Icon:** `calendar-days` | **Accent:** per-event color
**Sizes:** `1×1`, `2×1`, `2×2`, `3×2`

| Size | Layout |
|---|---|
| **1×1** | Single event: color dot + truncated name + time. |
| **2×1** | 2–3 events as color-dotted compact rows (dot + name + time). |
| **2×2** | "Today's" / "Events" header. Overflow-hidden list of events: color dot, title, time. |
| **3×2** | Events with left colored bar (full-height bar left edge). Title + time + optional subtitle. |

#### Mini Calendar
**Type:** `mini-calendar` | **Icon:** `calendar` | **Accent:** `#3b82f6`
**Sizes:** `1×1`, `2×2`, `3×2`, `3×3`

| Size | Layout |
|---|---|
| **1×1** | Month abbreviation (blue, uppercase) + large bold day number + weekday abbreviation + single event dot. |
| **2×2** | Compact month grid (days of week header + date cells). Today highlighted blue. Small event dots below date cells. |
| **3×2** | Wider month grid with today highlighted. Event dots. Month/year label. |
| **3×3** | Full month grid with more vertical room. Today highlighted. Event dots. Navigation arrows. |

#### Today's Schedule
**Type:** `todays-schedule` | **Icon:** `clock` | **Accent:** per-event color
**Sizes:** `1×2`, `2×2`, `2×3`

| Size | Layout |
|---|---|
| **1×2** | Vertical timeline. Time labels left, colored left-border event blocks right. 2–3 events. |
| **2×2** | Timeline with event titles + colored left bars. Current time indicator. |
| **2×3** | Full timeline. More events visible. Current time indicator. |

---

### Category: Lifestyle

#### Habit Tracker
**Type:** `habit-tracker` | **Icon:** `check-circle` | **Accent:** `#10b981`
**Sizes:** `1×1`, `2×1`, `2×2`, `3×2`

| Size | Layout |
|---|---|
| **1×1** | "Habits" muted label top-left. "3/5" bold fraction top-right. Two rows of 20px dots: row 1 = 3 done (colored, checkmark inside), row 2 = 2 pending (ghost). |
| **2×1** | "Today's" muted / "Habits" white header left. "3/5" bold right. Single row of 5 dots (28px) — 3 colored with checkmarks, 2 ghost. `justify-content: space-between` between header and dots. |
| **2×2** | Header: "Today's" / "Habits" left; "Done" label + "3/5" accent right. Five habit rows: colored dot + name + circle indicator (filled = done, ghost = pending). |
| **3×2** | Same header. Left column: habit list with circle indicators. Right column: 5×7 weekly heatmap grid (habit × day), with day headers (M–S). |

#### Weather
**Type:** `weather` | **Icon:** `cloud-sun` | **Accent:** `#38bdf8`
**Sizes:** `1×1`, `2×1`, `2×2`, `3×2`

| Size | Layout |
|---|---|
| **1×1** | Sun icon + "72°" bold + "Sunny" muted. "SF" top-right in muted. |
| **2×1** | Three columns: (1) 36px sun icon + "Sunny" label; (2) flex:1 — "72°" large bold + "H:78° L:62°" below; (3) city name (2-line ok) + "Feels like 70°". |
| **2×2** | "San Francisco" / "Weather" header + sun icon top-right. Large "72°" + "Sunny" / "Feels like 70°" aligned bottom. Divider. H / L / Wind / UV stat columns. |
| **3×2** | Compact header + temp + current stats row (H / L / Wind / Humidity / UV). Divider. 5-day forecast strip with icon + H/L per day. |

#### Daily Note
**Type:** `daily-note` | **Icon:** `pencil` | **Accent:** `#6366f1`
**Sizes:** `1×1`, `2×2`, `2×3`, `3×2`

| Size | Layout |
|---|---|
| **1×1** | "Jun 10" muted label top-left. Pencil icon top-right. Truncated note text fills remaining tile (4-line clamp). |
| **2×2** | "June 10" / "Daily Note" header + pencil icon. Free-form note text fills body. |
| **2×3** | Header + longer note text. Divider. Quick checklist (3 items) at bottom — checkbox squares, done items struck through. |
| **3×2** | Header + pencil icon. Left column: note text. Vertical divider. Right column (130px): "Checklist" label + 4 items (checkbox squares, `justify-content: flex-start`). |

---

## Implementation Notes

### TODO stubs to resolve

- `TODO(widget-content)` in `lib/widgets/registry.ts` — replace `WidgetSkeleton` with per-type `ContentComponent` for all 12 types.
- `lib/grid/types.ts` — add `widgetType: string` to `WidgetLayout`.
- Resize logic — filter `nearestPreset` candidates to `widget.supportedSizes` before snapping.

### New SIZE_PRESETS needed

All required sizes are already in `lib/grid/sizes.ts`. No new presets needed.

### Registry type migration

The current registry uses single-word types (`'finance'`, `'health'`, `'calendar'`, `'lifestyle'`). The new types use kebab-case (`'budget-summary'`, `'activity-rings'`, etc.). Any persisted `WidgetLayout` records with old type values will need a one-time migration mapping old type → new default type for that category (e.g. `'finance'` → `'budget-summary'`).

### Widget component structure

Each widget type gets a component at `components/widgets/content/<type>.tsx` that switches on `{ w, h }` to render the correct size layout. The `ContentComponent` field in `WidgetDefinition` points to it.
