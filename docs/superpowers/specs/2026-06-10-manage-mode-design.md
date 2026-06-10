# Bento Dashboard — Manage Mode Design

**Date:** 2026-06-10
**Status:** Approved design — ready for implementation planning
**Scope:** A transient, additive "manage mode" layered on the bento board skeleton: a left-rail toggle that surfaces a per-tile delete control, plus an always-on "smart" filter whose chips derive from the tags currently in use.
**Builds on:** `docs/superpowers/specs/2026-06-10-bento-dashboard-skeleton-design.md` (resolves its `TODO(manage-mode)` stubs; amends the planned `LeftBar`).

---

## 1. Goal

Extend the skeleton dashboard with a button-toggled **manage mode** that lets a user prune the board, while keeping the board's "always-on direct manipulation" feel. Manage mode is purely **additive** — it does not gate dragging or resizing. It adds exactly one capability: deleting widgets.

Tag management is handled emergently rather than through an editor:
- Tags are a **fixed, developer-controlled palette** assigned once at widget creation (the existing FAB create picker). They are never edited per-widget and never user-created.
- The left-rail filter is **"smart"**: a category chip is shown only while at least one widget carries that tag. Creating a widget of a category (FAB) makes its chip appear; deleting the last widget of a category makes its chip disappear. This is the "smartly add and remove category tags" behavior — emergent from add + delete, not a dedicated UI.

## 2. Scope

**In scope:**
- A left-rail **manage-mode toggle** (transient; resets to off on reload).
- A floating **× delete control** on each tile, visible only in manage mode → **instant delete + animate-out**, neighbors reflow.
- **Smart filter chips** derived from the set of tags currently on the board (an always-on behavior, independent of manage mode).
- Reconciling `activeTags` when a filtered tag's last widget is deleted, so the filter never sticks on an absent category.

**Out of scope (explicitly):**
- Per-widget tag editing / reassignment.
- Creating or deleting tag *types*.
- Multi-tag widgets (`category` stays a single value).
- Gating drag/resize behind manage mode (they remain always-on).
- Delete confirmation or undo (manage mode is the safety gate; deletes are instant).

## 3. Data model

**No change to `WidgetLayout`.** `category` remains a single fixed `Category` enum value. Manage mode introduces no new persisted board fields.

## 4. State — `lib/state/uiStore.ts` (new)

Manage mode is **transient UI state**, not board or settings data, so it lives in its own lightweight store and is deliberately **not persisted** (a reload should never land the user inside manage mode).

```ts
import { create } from 'zustand';

interface UiState {
  manageMode: boolean;
  setManageMode: (on: boolean) => void;
  toggleManageMode: () => void;
}

export const useUi = create<UiState>((set) => ({
  manageMode: false,
  setManageMode: (manageMode) => set({ manageMode }),
  toggleManageMode: () => set((s) => ({ manageMode: !s.manageMode })),
}));
```

Consumers: `LeftBar` (toggle, read active state) and `BentoBoard` → `Widget` (× visibility). Plain `create` with no `persist` middleware — distinct from `boardStore`/`settingsStore`, which are persisted.

## 5. Smart filter — derive + reconcile

### 5.1 Derive the chip set
A canonical category order drives a stable chip ordering; the visible set is the subset actually present on the board. These are pure, framework-free helpers and live together in a new module **`lib/grid/categories.ts`** (alongside the `Category` type in `lib/grid/types.ts`); the skeleton's hardcoded `CATEGORIES` arrays in `LeftBar.tsx` and `Fab.tsx` should both be replaced by importing `CATEGORY_ORDER` from this module (DRY):

```ts
export const CATEGORY_ORDER: Category[] = ['finance', 'lifestyle', 'health', 'calendar'];

export function presentCategories(widgets: WidgetLayout[]): Category[] {
  return CATEGORY_ORDER.filter((c) => widgets.some((w) => w.category === c));
}
```

`LeftBar` renders its chips from `presentCategories(widgets)` instead of a hardcoded list. **This amends the skeleton's planned Task 13 `LeftBar`,** which hardcodes all four categories.

### 5.2 Reconcile `activeTags`
When the user has filtered to a tag and then deletes the last widget carrying it, that tag must be dropped from `settingsStore.activeTags` — otherwise the filter is stuck showing an empty board with no chip to toggle off. (Also a pure helper in `lib/grid/categories.ts`.)

```ts
export function reconcileActiveTags(activeTags: Category[], present: Category[]): Category[] {
  return activeTags.filter((t) => present.includes(t));
}
```

`removeWidget` is the **only** mutation that can orphan a tag:
- FAB **add** only grows the present set.
- **drag/resize** never change a widget's `category`.

So reconciliation runs inside `boardStore.removeWidget`, after the active strategy resolves the new layout: compute `present`, derive the reconciled `activeTags`, and if it changed, write it back via `useSettings.setState`. This reuses the existing boardStore→settingsStore coupling direction (boardStore already reads `settings.layoutMode`).

> TODO(manage-mode-reconcile-setwidgets): `setWidgets` / a future bulk board replacement could also orphan an active tag. If such a path is added, route it through the same `reconcileActiveTags` step. anchor: this spec §5.2; site: lib/state/boardStore.ts

## 6. Components

### 6.1 `LeftBar` (amends skeleton Task 13)
- Add a **manage-mode toggle button** in the top utility-icon cluster, above the filter chips. `aria-pressed={manageMode}`; active state uses the accent highlight (mirrors the chip active style). Reads `manageMode` and calls `toggleManageMode()` from `useUi`.
- Replace the hardcoded `CATEGORIES` chip list with `presentCategories(widgets)` (subscribed from `boardStore`). Chip toggle behavior (`settingsStore.toggleTag`, union semantics) is unchanged.

### 6.2 `Widget` (resolves `TODO(manage-mode)`)
- Accepts a `manageMode` prop. When true, render a floating **× button** absolutely positioned at the top-right, overflowing the tile corner. `aria-label="Delete widget"`.
- The × button **calls `stopPropagation` on pointer-down** so activating it never starts a drag (the whole tile is the drag surface in the skeleton). On click it calls `boardStore.removeWidget(widget.id)`.
- The × fades/scales in (motion) when manage mode turns on. The tile's existing `AnimatePresence` exit animation (added in skeleton Task 13) handles the removal; neighbors reflow via the existing `layout` FLIP animation.

### 6.3 `BentoBoard` (resolves `TODO(manage-mode)`)
- Read `manageMode` once from `useUi` and pass it to each rendered `Widget` (including the `WidgetWithResize` wrapper).

### 6.4 Manage-on signal
Kept intentionally light: the highlighted left-rail toggle plus the × controls appearing on every tile is the active-state signal. No board-wide dimming or dashed outlines this pass.

> TODO(manage-mode-stronger-signal): if the light signal proves unclear in use, add a board-level affordance (e.g. faint dashed tile outlines or a "Managing" banner) gated on `manageMode`. anchor: this spec §6.4; sites: components/board/BentoBoard.tsx, components/board/Widget.module.css

## 7. Interaction notes

- **× vs drag:** the skeleton spreads dnd-kit drag listeners across the whole tile. The × handler's `stopPropagation` on pointer-down is the single guard that keeps a delete click from being interpreted as a drag start. This is the one real interaction gotcha and must be covered by a test.
- **Delete + heal:** `removeWidget` already runs `strategy.preview({ kind: 'remove', id })` → resolves a healed layout. Manage mode adds no new layout logic — it only exposes the trigger.
- **Filter + delete interplay:** deleting the last widget of an active filter tag prunes that tag (§5.2); the board then shows the remaining active tags' widgets (or all widgets if `activeTags` becomes empty).

## 8. Testing (TDD, per skeleton conventions)

Pure helpers and stores are unit-tested; component behavior gets render/interaction tests.

- **`uiStore`** — `toggleManageMode` flips the flag; `setManageMode` sets it.
- **`presentCategories`** — returns in-use categories in `CATEGORY_ORDER`; empty board → `[]`.
- **`reconcileActiveTags`** — drops an orphaned active tag, keeps present ones, handles empty inputs.
- **`boardStore.removeWidget`** — removing the last widget of a tag that is in `activeTags` prunes it from `activeTags`; removing a widget whose tag still has siblings leaves `activeTags` untouched.
- **`LeftBar`** — renders only chips for in-use categories; a chip disappears after its last widget is removed; the manage toggle flips `useUi.manageMode` and reflects `aria-pressed`.
- **`Widget`** — × is rendered only when `manageMode` is true; clicking × calls `removeWidget` with the widget id; a pointer-down on × does not initiate a drag (assert `stopPropagation` / that the drag is not started).

Animation and visual polish are validated by hand in the running mock.

## 9. Relationship to the skeleton & deferred work

This design is implemented **on top of** the bento dashboard skeleton and depends on it existing first (`boardStore`, `settingsStore`, `LeftBar`, `Widget`, `BentoBoard`, `AnimatePresence` wiring). It:
- Resolves `TODO(manage-mode)` at `components/board/Widget.tsx` and `components/board/BentoBoard.tsx`.
- Amends the planned `LeftBar` (skeleton Task 13) to derive chips from the board.

Deferred work is marked with inline `TODO` stubs at the site of absence (see §5.2 and §6.4):
- `TODO(manage-mode-reconcile-setwidgets)` — extend reconciliation to bulk board replacement paths.
- `TODO(manage-mode-stronger-signal)` — optional stronger manage-on visual treatment.
