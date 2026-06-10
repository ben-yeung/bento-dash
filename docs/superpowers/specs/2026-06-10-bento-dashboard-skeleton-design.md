# Bento Dashboard — Skeleton & Grid-Interaction Design

**Date:** 2026-06-10
**Status:** Approved design — ready for implementation planning
**Scope:** Base skeleton + shell + the draggable/resizable/reflowing bento board engine. Blank template widgets only — no real widget content this pass.

---

## 1. Goal

A modern, minimal single-page dashboard that is a playground for bento-style UI/UX. The board holds draggable, resizable, category-tagged widgets. This pass delivers the **shell** (left utility/filter bar, greeting banner, profile/settings, create FAB) and, primarily, the **grid-interaction engine**: fluid pickup-in-cursor dragging, live drop preview, neighbor reflow / auto-fill, and resize across all sizes.

Three primary engine goals:
1. Smooth dragging — widget lifts into the cursor on mouse-down.
2. Resizable widgets that snap across all valid sizes.
3. Clear, animated logic for how neighbors move/update after a drag, resize, add, remove, or filter.

## 2. Stack

- **Next.js (App Router) + TypeScript + React** — single route assembling the shell.
- **`@dnd-kit/core`** — pointer/touch/keyboard sensors and `DragOverlay`. Not `@dnd-kit/sortable` (a 1D sortable list does not map to a 2D mixed-size grid; placement is the engine's job).
- **`motion`** (`motion/react`) — FLIP layout animations on reflow, `AnimatePresence` for enter/exit.
- **Zustand** (+ `persist` middleware) — board and settings state; selective subscriptions keep per-frame drag updates cheap; localStorage persistence.
- **Styling: CSS Modules + CSS custom-property design tokens**, `[data-theme]` on `<html>`. No utility-class sprawl, no decorative gradients.

## 3. Project structure

```
app/
  layout.tsx            // <html data-theme>, font, mounts AppShell
  page.tsx              // single route
  globals.css           // tokens (light/dark), reset, base
components/
  shell/
    AppShell.tsx         // grid: LeftBar | (Banner + Board), Fab overlay
    LeftBar.tsx          // utility icons + category filter chips
    Banner.tsx           // greeting, date, mocked weather
    ProfileButton.tsx    // avatar -> dropdown -> opens SettingsModal
    SettingsModal.tsx    // theme, layout mode, filter mode, accent
    Fab.tsx              // create-widget picker
  board/
    BentoBoard.tsx       // DndContext, grid surface, renders Widgets
    Widget.tsx           // draggable tile + ResizeHandle
    DragOverlayWidget.tsx// lifted copy under cursor
    DropPreview.tsx      // ghost footprint of landing position
    ResizeHandle.tsx     // corner pointer handler
  widgets/
    WidgetSkeleton.tsx   // blank template body, varies by size
lib/
  grid/
    types.ts             // WidgetLayout, GridState, LayoutStrategy
    sizes.ts             // preset catalog (core + extended), clamps
    collision.ts         // pixel <-> cell mapping, hit testing
    engine.ts            // orchestrates a strategy + preview/commit
    strategies/
      autoPack.ts        // dense backfill (Mode B, default)
      pushCompact.ts     // push & gravity-compact (Mode A)
  state/
    boardStore.ts        // widgets + add/move/resize/remove
    settingsStore.ts     // theme, layoutMode, filterMode, activeTags, accent
    persistence.ts       // localStorage hydrate/save wiring
  data/
    seed.ts              // demo widgets across categories & sizes
  hooks/
    useDragResize.ts
    useGreeting.ts
    useWeather.ts        // mocked
```

## 4. Grid engine — the core

Pure, framework-free, fully unit-tested.

### 4.1 Model
```ts
type Category = 'finance' | 'lifestyle' | 'health' | 'calendar';
interface WidgetLayout {
  id: string;
  x: number;        // 0-based column
  y: number;        // 0-based row
  w: number;        // column span (1..6)
  h: number;        // row span   (1..4)
  category: Category;
  order: number;    // canonical sequence; primary key for autoPack
}
```
- `COLS = 6`, rows unbounded (board scrolls vertically).
- `clampSize(w, h)`: `w ∈ [1,6]`, `h ∈ [1,4]`.

### 4.2 Size presets (`sizes.ts`)
- **Core:** 1×1, 2×1, 2×2, 3×3, 4×4.
- **Extended:** 1×2, 2×3, 3×2, 4×2, 6×1.
- Presets are the snap targets for the resize handle and the create picker; the engine itself accepts any clamped `w×h`.

### 4.3 Strategy interface
```ts
interface LayoutStrategy {
  // Returns a fully resolved (non-overlapping) layout.
  resolve(widgets: WidgetLayout[]): WidgetLayout[];
  // Given a drag/resize in progress, produce the previewed layout.
  preview(widgets: WidgetLayout[], moving: Move): WidgetLayout[];
}
type Move =
  | { kind: 'drag';   id: string; targetCell: { x: number; y: number } }
  | { kind: 'resize'; id: string; w: number; h: number }
  | { kind: 'add';    widget: WidgetLayout }
  | { kind: 'remove'; id: string };
```
Selected at runtime by `settingsStore.layoutMode`. The rest of the app depends only on this interface.

### 4.4 `autoPack` (Mode B — default)
- Widgets are an **ordered list** by `order`.
- **First-fit dense bin-packing**: scan grid top→bottom, left→right; place each widget in the first position where its footprint fits, allowing a later small widget to **backfill** an earlier gap.
- **Drag**: `targetCell` → derive a new `order` index (insert-before the widget nearest the cell) → repack all. `x,y` are outputs, never authored.
- **Resize / add / remove**: change footprint or list membership, repack.

### 4.5 `pushCompact` (Mode A)
- Widgets keep authored `x,y`.
- **Drag**: place moving widget at `targetCell`; any overlapped widget is pushed **down** until clear; then **gravity-compact upward** so nothing floats above empty space. Deliberate horizontal gaps allowed.
- **Resize**: grow/shrink footprint at anchored `x,y`, resolve collisions by push-down, then compact.
- **Remove / filter-out**: vacate cells, compact upward to heal.

### 4.6 Preview vs commit
- During an in-progress drag/resize the engine runs `preview()` every pointer move; the result drives `motion` so neighbors animate live ("auto-fill on move"). On drop, the previewed layout is committed to `boardStore`. No commit on cancel (Escape / drop outside).

## 5. Interaction layer

- `DndContext` + `PointerSensor` with ~4px activation distance (a click never starts a drag).
- **Whole tile is the drag surface**, excluding the resize-handle hit area. Always-on direct manipulation — no edit mode. `TODO(manage-mode)` leaves a single gate point to add an arrange/edit mode later (see §9).
- `DragOverlay` renders a lifted copy following the cursor: subtle scale-up + glass shadow. The source tile shows a muted placeholder.
- `onDragMove`: pointer → `collision.ts` → `targetCell` → `engine.preview()` → `motion` layout-animates other tiles; `DropPreview` shows the landing footprint.
- `onDragEnd`: commit preview. `onDragCancel`: discard.
- **Resize** (`ResizeHandle` + `useDragResize`): pointer-down on bottom-right corner; cell-delta → candidate `w,h` → snap to nearest valid preset → `engine.preview()`; commit on pointer-up.
- **Animation**: `layout` prop on each `Widget` (FLIP reflow); `AnimatePresence` for create / remove / filter-out exits and create enters. Spring tuned for a quick, settled feel — not bouncy.

## 6. Shell components

- **LeftBar** — utility icons (top); **multi-select category filter chips** below. Toggling updates `settingsStore.activeTags`; empty selection = show all. Union semantics (finance ∪ health).
- **Filtering** — default **hide-&-reflow**: non-matching widgets exit via `AnimatePresence`, matches repack through the active strategy. Toggle to **dim-in-place** (layout frozen, non-matches fade). Controlled by `settingsStore.filterMode`.
- **Banner** — time-of-day greeting (`useGreeting`), formatted date, **mocked** weather (`useWeather`). `TODO(real-weather)`.
- **ProfileButton** — avatar opens a dropdown that opens **SettingsModal**.
- **SettingsModal** (glass surface) — controls:
  - Theme toggle: dark (default) ↔ light.
  - Layout mode: auto-pack (default) ↔ push-compact.
  - Filter mode: hide-&-reflow (default) ↔ dim-in-place.
  - **Accent**: preset swatches that rebind `--accent` live. `TODO(accent-custom-picker): add a custom color picker beside the presets in SettingsModal — see §9. anchor: components/shell/SettingsModal.tsx`.
- **Fab** (glass, bottom-right) — opens a create picker (choose category + size preset); `addWidget` inserts via `engine` first-fit placement, animated in.
- **Widgets** are blank `WidgetSkeleton` tiles. **No × remove, no visible category tag** this pass — those belong to a future manage mode (`TODO(manage-mode)`).

## 7. State & persistence

- `boardStore`: `widgets: WidgetLayout[]`, plus `addWidget`, `moveWidget`, `resizeWidget`, `removeWidget` — each runs the active strategy and stores the resolved layout.
- `settingsStore`: `theme`, `layoutMode`, `filterMode`, `activeTags`, `accent`.
- Both persisted to **localStorage** via Zustand `persist`. `seed.ts` populates demo widgets (mixed categories & sizes spanning core + extended) on first load.

## 8. Theming & aesthetic rules

- Tokens (CSS custom properties, swapped by `[data-theme]`): `--bg`, `--surface`, `--surface-glass`, `--border-hairline`, `--text`, `--muted`, `--accent`.
- **Single accent** (indigo default, user-editable). No multi-color gradients; no decorative gradient fills.
- **Glass only on floating surfaces** — FAB, SettingsModal, profile dropdown, DragOverlay — via `backdrop-filter: blur()` + translucent surface token. Base tiles stay **solid with hairline borders**.
- Minimal, modern: generous spacing, restrained type scale, hairline 1px borders, subtle shadows. Explicitly avoid generic "AI slop" gradient-heavy styling.

## 9. Out of scope this pass

Deferred work, marked with inline `TODO` stubs at the site of absence:

- `TODO(manage-mode)` — arrange/edit mode that surfaces per-widget remove (×), category tag editing, and gates drag/resize. Sites: `components/board/Widget.tsx`, `components/board/BentoBoard.tsx`.
- `TODO(accent-custom-picker)` — custom color picker in SettingsModal beside preset swatches. Anchor: `components/shell/SettingsModal.tsx`.
- `TODO(responsive-grid)` — column-count breakpoints for tablet/mobile (skeleton is fixed 6-col desktop). Anchor: `lib/grid/sizes.ts`, site: `components/board/BentoBoard.tsx`.
- `TODO(real-weather)` — replace mocked weather with a real API. Anchor: `lib/hooks/useWeather.ts`.
- `TODO(widget-content)` — real per-category widget bodies (finance/lifestyle/health/calendar). Anchor: `components/widgets/WidgetSkeleton.tsx`.
- Real auth/profile, full keyboard-a11y polish (dnd-kit baseline only).

## 10. Testing

- **TDD on `lib/grid`** (Vitest), both strategies: placement, collision resolution, push-compact gravity, dense backfill, resize snap + collision, remove/filter heal, add first-fit. The engine is pure → deterministic and fast to test.
- Interaction and animation validated by hand in the running mock (this is a UX exploration, not a regression suite for visuals).
