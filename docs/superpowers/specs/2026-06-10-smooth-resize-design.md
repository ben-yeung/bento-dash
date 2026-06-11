# Smooth Resize Design

**Date:** 2026-06-10
**Status:** Approved

## Problem

The current resize implementation only updates the widget's visual size when the drag crosses a *preset boundary* (`nearestPreset` is called on every `pointermove`). Because presets are sparsely distributed (e.g. 2×2 → 4×4 skips many intermediate sizes), the widget appears stuck until the mouse reaches the midpoint between two presets, then jumps. The spring animation on `motion.div` adds further lag — the widget eases into each new size rather than tracking the mouse directly.

## Goal

Resize should feel like dragging a browser window:

- The resizing widget tracks the mouse immediately at grid-cell resolution — no spring delay.
- Neighbouring widgets spring smoothly into their new positions on every cell boundary crossing, making the board reflow feel live and animated.
- A dashed outline + corner badge on the resizing widget shows the nearest preset it will commit to on release.
- On mouseup, the resizing widget re-enables its spring and snaps into the final preset — one satisfying bounce at the end.

## Non-goals

- Pixel-level (sub-cell) resize tracking. Cell-by-cell resolution (~40 px per crossing at typical column widths) is sufficient.
- Changing the preset set or commit logic. `nearestPreset` on mouseup is unchanged.
- Animating the dashed outline itself (it updates instantly).

## Interaction model

Two distinct animation modes coexist during a drag:

| Actor | During drag | On mouseup |
|---|---|---|
| Resizing widget | Instant layout (no spring) — tracks mouse at cell boundaries | Spring re-enabled → snaps to nearest preset |
| Neighbour widgets | Existing spring — animate smoothly on each cell reflow | Spring continues to final positions |

The dashed outline and badge appear on pointer-down and disappear when the commit lands (resizingId clears).

## Component changes

### `useDragResize` (`lib/hooks/useDragResize.ts`)

**Current:** `onPointerMove` calls `nearestPreset(rawW, rawH)` and only fires `onPreview` when the preset changes.

**New:** Two separate outputs:

- `onPreview(rawW, rawH)` — fires at every **cell boundary crossing**, using `clampSize` instead of `nearestPreset`. This is the value that drives the widget's live grid span and the board reflow.
- `onIndicator(preset: SizePreset)` — fires when the **nearest preset changes** (still computed via `nearestPreset`, but only used for the badge label). Separate from the preview path so the indicator doesn't throttle the visual update.

`onCommit` is called from `onPointerUp` with `latestSnap.current.w, latestSnap.current.h` — the nearest preset at the moment of release. `latestSnap` is always kept in sync with `latestRaw` during `onPointerMove`, so no extra `nearestPreset` call is needed at release.

New hook signature:

```ts
interface UseDragResizeArgs {
  startW: number;
  startH: number;
  metrics: GridMetrics;
  onPreview: (w: number, h: number) => void;
  onIndicator: (preset: SizePreset) => void;
  onCommit: (w: number, h: number) => void;
}
```

Internal tracking:

```ts
const latestRaw   = useRef<{ w: number; h: number }>({ w: startW, h: startH });
const latestSnap  = useRef<SizePreset>(nearestPreset(startW, startH));
```

`onPointerMove` logic:

```ts
const raw = clampSize(origin.w + dw, origin.h + dh);
if (raw.w !== latestRaw.current.w || raw.h !== latestRaw.current.h) {
  latestRaw.current = raw;
  onPreview(raw.w, raw.h);
}
const snap = nearestPreset(raw.w, raw.h);
if (snap.w !== latestSnap.current.w || snap.h !== latestSnap.current.h) {
  latestSnap.current = snap;
  onIndicator(snap);
}
```

### `WidgetWithResize` (`components/board/BentoBoard.tsx`)

Adds local state `snapTarget: SizePreset | null` (initialised null, set via `onIndicator`, cleared in `onCommit`).

Passes two new props to `Widget`:

- `resizing={resizingId === w.id}` — disables spring on the resizing widget.
- `snapTarget={resizingId === w.id ? (snapTarget?.name ?? null) : null}` — extracts the preset name string for the badge (e.g. `"3×2"`). `WidgetWithResize` holds `SizePreset | null`; `Widget` accepts `string | null`.

### `Widget` (`components/board/Widget.tsx`)

Two new optional props:

```ts
resizing?: boolean       // default false
snapTarget?: string | null  // preset name e.g. "3×2", default null
```

**Spring override:**

```tsx
transition={resizing
  ? { duration: 0 }
  : { type: 'spring', stiffness: 520, damping: 42, mass: 0.7 }}
```

When `resizing` flips to false (after commit), the transition reverts to spring and fires immediately on the committed-vs-preview layout delta — this is the final snap animation.

**Dashed outline + badge** (`Widget.module.css`):

- The `motion.div` gets `data-resizing={resizing}` so CSS can target it.
- `[data-resizing=true]` applies `outline: 2px dashed var(--color-accent); outline-offset: 2px;`
- A `<span>` badge renders the `snapTarget` string in the bottom-right corner when non-null.

### `ResizeHandle` / pointer handlers (`BentoBoard.tsx`)

The `onPointerDown` wrapper in `WidgetWithResize` initialises `snapTarget` to the current widget's `nearestPreset` on drag start (so the badge is populated immediately, not blank until the first move).

## Visual spec

**Dashed outline:** `2px dashed` in `--color-accent` (the same blue used for the FAB and selection states). `outline-offset: 2px` so it sits just outside the tile's rounded corners.

**Badge:** Bottom-right corner, inside the tile. Small pill: `font-size: 0.65rem`, semi-transparent dark background, white text. Shows the preset name (e.g. `"3×2"`). If the current raw cell size matches a preset exactly, it still shows — indicating "you're on a valid snap point."

**Neighbours:** No change — the existing spring (stiffness 520, damping 42, mass 0.7) is well-tuned and will handle the increased reflow frequency without adjustment.

## State flow on commit

```
onPointerUp
  → onCommit(nearest.w, nearest.h)
      → resizeWidget(id, w, h)    // committed state updates to preset
      → setResizingId(null)       // resizing=false → spring re-enabled on Widget
      → setPreview(null)          // widgets = committed (preset size)
      → snapTarget cleared        // badge disappears
  → motion.div sees layout change (raw cell → preset) with spring → final snap
```

React 18 batches all three state updates in the same event handler, so the single re-render sees the preset-committed layout with spring enabled — no intermediate flicker.

## Files touched

- `lib/hooks/useDragResize.ts` — primary logic change
- `components/board/BentoBoard.tsx` — `WidgetWithResize` wiring
- `components/board/Widget.tsx` — `resizing` prop, `snapTarget` prop, transition override
- `components/board/Widget.module.css` — dashed outline style, badge style
