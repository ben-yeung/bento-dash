# Mobile & Responsive Widget Board Design

**Date:** 2026-06-25
**Status:** Approved

## Overview

Extend the bento-dash widget board to support phone (≤480px) and tablet (≤768px) viewports. The approach is JS-aware responsive: a `useBreakpoint()` hook drives column count, shell layout, and touch sensor config from a single source of truth. The canonical widget layout stays in 6-column coordinates in the store; an ephemeral `clampLayout()` reflows it for smaller column counts at render time. The left sidebar and FAB are replaced by a unified bottom navbar on touch breakpoints.

---

## 1. Breakpoint System

A new `useBreakpoint()` hook observes `window.innerWidth` via a `resize` event listener and returns a stable descriptor:

```ts
type Breakpoint = 'phone' | 'tablet' | 'desktop'

interface BreakpointInfo {
  breakpoint: Breakpoint
  cols: 2 | 4 | 6
  isMobile: boolean  // true for phone and tablet
}

// Thresholds
// phone:   width ≤ 480px  → cols = 2
// tablet:  width ≤ 768px  → cols = 4
// desktop: width >  768px → cols = 6
```

`useGridMetrics` is updated to accept a `cols` parameter, replacing the hardcoded `COLS = 6` constant. The `ResizeObserver` already in `useGridMetrics` continues to handle cell size updates within a breakpoint tier; `useBreakpoint` handles the column-count tier change.

---

## 2. Grid & Layout Engine

### Canonical storage

The `WidgetLayout[]` in the board store remains in 6-column coordinates. No migration, no new fields, no per-breakpoint stores.

### Ephemeral reflow

A new pure function `clampLayout(widgets, cols)` in `engine.ts` prepares the mobile render:

```ts
function clampLayout(widgets: WidgetLayout[], cols: number): WidgetLayout[] {
  const clamped = widgets.map(w => ({ ...w, w: Math.min(w.w, cols) }))
  return getStrategy(layoutMode).resolve(clamped)
}
```

`BentoBoard` calls `clampLayout` when `breakpoint !== 'desktop'` before rendering. The result is never written back to the store.

### Mobile edits

- **Reorder** in edit mode only changes the `order` field on `WidgetLayout` — the 6-col `(x, y)` position is left untouched, so desktop layout is preserved through mobile sessions.
- **Resize** on mobile writes the new `w` and `h` directly to the store without scaling. A widget resized to `w=1` on a 4-col tablet stores `w=1`; on desktop it renders as a 1/6-wide tile, which is a valid size. This avoids rounding errors from proportional mapping and is appropriate for a mockup.

### CSS grid

`BentoBoard` sets `grid-template-columns: repeat(${cols}, 1fr)` dynamically. `cellSize` is computed from container width as today — no change to the formula, just a different `cols` value.

---

## 3. Shell Layout

### Desktop (unchanged)

```
grid: 72px [LeftBar] | 1fr [main content]
FAB: fixed bottom-right over board
```

### Phone & Tablet

```
grid: 1fr [main content, full width]
BottomNav: fixed bottom, full width, 56–64px tall
Board: padding-bottom = navbar height + safe-area-inset-bottom
```

The sidebar DOM node is absent on mobile — conditional render, not CSS hide. This eliminates any overflow or z-index issues.

---

## 4. Bottom Navbar (`BottomNav.tsx`)

Replaces both `LeftBar` and the FAB on `isMobile` breakpoints.

**Layout:**
```
[ Finance | Health | Calendar | Lifestyle ]  [ ✎ Edit ]  [ + Add ]
```

**Filter chips (left, fills remaining space):** Category filter buttons rendered as horizontal icon+label chips. Tapping toggles `activeTags` in `settingsStore` — same action as the left bar today.

**Edit button (center-right):** Enters edit mode, which enables drag-to-reorder. Transforms into a "Done" button while active. Long-pressing any widget (500ms) also enters edit mode as an alternative gesture.

**Add button (rightmost, ~56px):** Opens the widget palette as a bottom sheet that slides up from the navbar. Tapping a palette card adds the widget to the bottom of the board and closes the sheet. Hold-dragging a palette card collapses the sheet (animates down), reveals the board, and hands off a palette drag ID to the existing `DndContext` drag session — identical to the desktop FAB drag-to-place flow.

**Safe area:** The navbar has `padding-bottom: env(safe-area-inset-bottom)` for iPhone home indicator clearance.

---

## 5. Touch Interaction Model

### Resize (always available)

The existing `PointerSensor` handles resize on touch via the bottom-right resize handle. On mobile breakpoints the handle gets a CSS minimum touch target of 44×44px.

### Reorder (edit mode only)

On desktop, `PointerSensor` activates on any widget surface with a 4px movement threshold. On `isMobile`, `AppShell` swaps the sensor config to a `DelayedPointerSensor` (250ms hold) that only activates when `isEditMode === true`. Outside edit mode, touch events pass through to widget content normally.

### Edit mode entry

- Long-press (500ms) on any widget surface while not in edit mode
- Tap the Edit button in `BottomNav`
- `navigator.vibrate(10)` fires on entry if the Vibration API is available

### FAB hold-drag (bottom sheet → board)

The bottom sheet listens for `pointerdown` + `pointermove` past a small threshold on a palette card. On trigger:
1. Sheet animates down (collapses)
2. Board becomes visible
3. Palette drag ID is handed to the existing `DndContext` session

The board drag-to-place code path is shared with desktop — no divergence.

---

## 6. Widget Content CSS Scaling

`BentoBoard` sets `--cell-size` as an inline CSS custom property on the `.board` element, updated whenever `cellSize` changes from `useGridMetrics`. Widget interiors use it to scale fonts and element sizes:

```css
/* Example multipliers — tuned per widget */
.value { font-size: calc(var(--cell-size) * 0.14); }
.label { font-size: calc(var(--cell-size) * 0.07); }
.icon  { width:     calc(var(--cell-size) * 0.25); }
```

The approximate cell sizes across breakpoints (no sidebar on mobile, 28px padding each side):

| Breakpoint | Viewport | Cols | Approx. cell size |
|-----------|----------|------|-------------------|
| Desktop   | 1280px   | 6    | ~196px            |
| Tablet    | 768px    | 4    | ~169px            |
| Phone     | 375px    | 2    | ~153px            |

Cell sizes are close enough across breakpoints that smooth CSS scaling (no variant switching) produces correct visual density at all sizes. Widgets with hardcoded `px` font sizes are updated to use `calc(var(--cell-size) * k)`. Widgets already using `em`/`rem` or percentages need no changes.

The existing `contentRescale` hook continues to select layout variants by widget pixel dimensions; the CSS variable layer handles visual density within those variants.

---

## 7. Key Files

| File | Change |
|------|--------|
| `lib/hooks/useBreakpoint.ts` | **New** — `resize` listener, returns `{ breakpoint, cols, isMobile }` |
| `lib/hooks/useGridMetrics.ts` | Accept `cols` param; remove hardcoded `COLS = 6` |
| `lib/grid/engine.ts` | Add `clampLayout(widgets, cols)` |
| `lib/state/boardStore.ts` | No change |
| `components/shell/AppShell.tsx` | Conditional shell render; sensor swap on `isMobile`; edit mode state |
| `components/shell/LeftBar.tsx` | Wrapped in `breakpoint === 'desktop'` guard |
| `components/shell/BottomNav.tsx` | **New** — filter chips, edit toggle, add button, bottom sheet palette |
| `components/shell/AppShell.module.css` | Mobile: `1fr` layout, `padding-bottom` for navbar clearance |
| `components/board/BentoBoard.tsx` | Call `clampLayout`; set `--cell-size` CSS var; dynamic column template |
| `components/board/BentoBoard.module.css` | Column template via CSS var; resize handle touch target |
| `components/board/Widget.module.css` | Resize handle `min-width/height: 44px` on mobile |
| Widget content files (10×) | Hardcoded `px` font sizes → `calc(var(--cell-size) * k)` |

## Files NOT Changed

- `lib/grid/strategies/autoPack.ts`
- `lib/grid/strategies/pushCompact.ts`
- `lib/grid/occupancy.ts`
- `lib/state/settingsStore.ts`
- `components/board/DropPreview.tsx`
- `components/board/Widget.tsx` (resize handle size is CSS-only)

---

## Data Flow

```
window resize
  → useBreakpoint()  →  { breakpoint, cols, isMobile }
       ↓                         ↓
  AppShell                 useGridMetrics(cols)
  (shell render,                 ↓
   sensor config,           { cellSize, cols, gap }
   edit mode gate)               ↓
                           clampLayout(store.widgets, cols)
                                 ↓
                           BentoBoard (CSS grid + --cell-size var)
                                 ↓
                           Widget content (CSS scaling)
```

## Interaction with Horizontal Scroll Board

The horizontal scroll board (approved spec, not yet implemented) is desktop-only. `layoutOrientation` only applies when `breakpoint === 'desktop'`. On `phone` and `tablet`, orientation is always `'vertical'` regardless of the stored `layoutOrientation` value. No changes to the horizontal scroll spec are needed.
