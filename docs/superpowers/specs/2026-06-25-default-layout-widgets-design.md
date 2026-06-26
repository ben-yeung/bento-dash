# Default Layout Extension + Settings Log Button

**Date:** 2026-06-25

## Overview

Two changes:

1. Extend `seedWidgets()` in `lib/data/seed.ts` from 10 to 20 widgets — one of each widget type at its current size, plus a second instance at a contrasting supported size.
2. Add a "Log Layout" button to the settings modal that writes the current board widget array to the browser console.

---

## Feature 1: Extended Default Layout

### Goal

Show every widget type at two distinct sizes in the default seed, giving users a visual reference for what each size alternative looks like before they start customising.

### Layout

Two sections, 11 rows total, 6 columns. Vertical mode is perfectly flush (every row sums to exactly 6 columns of width).

**Section 1 — original sizes (rows 0–5, unchanged)**

```
Row 0-1:  [budget-summary 4×2    ][weather 2×1][steps 2×1  ]
Row 2-3:  [mini-cal 1×1][up 1×1 ][todays-sched 2×2][activity 2×2]
Row 3:    [calorie 2×1           ](todays-sched and activity continue)
Row 4-5:  [habit-tracker 3×2    ][daily-note 3×2            ]
```

**Section 2 — alternative sizes (rows 6–10)**

```
Row 6-7:  [budget-summary 2×2][steps 2×2     ][mini-cal 2×2  ]
Row 8-9:  [upcoming 2×2     ][calorie 2×2   ][daily-note 2×2 ]
Row 10:   [todays-sched 2×1][habit 2×1][weather 1×1][activity 1×1]
```

Row sums: 2+2+2=6, 2+2+2=6, 2+2+1+1=6. Perfectly flush.

### Contrast pairs

| Widget | Section 1 (existing) | Section 2 (alternative) | Change |
|---|---|---|---|
| budget-summary | 4×2 | 2×2 | half the width |
| weather | 2×1 | 1×1 | half the width |
| steps | 2×1 | 2×2 | double the height |
| mini-calendar | 1×1 | 2×2 | 4× larger |
| upcoming-events | 1×1 | 2×2 | 4× larger |
| todays-schedule | 2×2 | 2×1 | half the height |
| activity-rings | 2×2 | 1×1 | quarter the size |
| calorie-tracker | 2×1 | 2×2 | double the height |
| habit-tracker | 3×2 | 2×1 | much smaller |
| daily-note | 3×2 | 2×2 | narrower |

All sizes are present in each widget's `supportedSizes` in the registry.

### Horizontal mode

Horizontal row count is dynamic (calculated from viewport height: `Math.floor((h - 16) / 192)`). The transpose engine maps vertical x→horizontal y and handles repacking automatically. Section 2 uses only widths 1 and 2 (no w=3 or w=4), which gives the packing algorithm the most flexibility to fill horizontal rows cleanly at any viewport height.

### File changed

- `lib/data/seed.ts` — extend `defs` array from 10 to 20 entries, adding section 2 with explicit `[x, y]` coordinates.

---

## Feature 2: Settings Log Button

### Goal

Developer convenience: one click logs the full current widget layout (id, type, category, x, y, w, h) to the browser console for quick inspection.

### Behaviour

- Button label: **"Log Layout"**
- Placement: settings modal, below existing controls (or in a dev/debug section)
- On click: `console.log(useBoardStore.getState().widgets)` — logs the raw array, pretty-printed by the browser devtools
- No side effects, no toast, no clipboard write
- Always visible (not gated behind a dev mode flag)

### Files changed

- `components/shell/SettingsModal.tsx` — add button with click handler that reads board store state and logs it

---

## Out of scope

- Changes to any widget content components
- Changes to grid engine or packing logic
- New widget types
- Clipboard copy or JSON export
