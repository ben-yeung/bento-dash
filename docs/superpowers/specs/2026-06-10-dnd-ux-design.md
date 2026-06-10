# Drag-and-Drop UX Improvements — Design Spec

**Date:** 2026-06-10
**Branch:** feat/bento-dashboard-skeleton
**Status:** Approved

---

## Problem Summary

The current drag-and-drop UX has four distinct pain points:

1. **Unclear source widget** — the widget being dragged is hard to identify because its original slot stays visible while other widgets reflow around it.
2. **Misaligned drop preview** — the dotted outline (`DropPreview`) doesn't always match where the widget will actually land, due to grab-offset drift in `pointToCell`.
3. **Late reposition trigger** — reflow preview only updates when the cursor nears a cell edge, not when it enters a new widget's area.
4. **No swap feedback** — same-size widgets can logically swap, but there's no visual signal for this; drag onto another widget feels unpredictable.

---

## Chosen Approach: Bounding-Box Detection + Typed DragState

Replace cursor→cell math as the primary detection mechanism with DOM bounding-box intersection. Introduce a typed `DragState` object that drives all visual feedback from a single source of truth.

---

## 1. State Model

### New type: `DragState`

Added to `lib/grid/types.ts`:

```ts
export type DragState =
  | { phase: 'idle' }
  | {
      phase: 'dragging';
      activeId: string;
      targetKind: 'none' | 'insert' | 'swap';
      targetId?: string;        // only set when targetKind === 'swap'
      previewLayout: WidgetLayout[];
    };
```

### Changes to `BentoBoard.tsx`

- Replace `activeId: string | null` + `preview: WidgetLayout[] | null` with `dragState: DragState`.
- `resizingId` stays separate — resize is a distinct gesture unaffected by this change.
- `base` layout for rendering: `dragState.phase === 'dragging' ? dragState.previewLayout : committed`.
- `previewLayout` always encodes the complete final state — no special "remove active widget" logic at render time.

---

## 2. Detection Mechanism

### Widget ref map

`BentoBoard` holds `widgetRefs = useRef<Map<string, HTMLElement>>(new Map())`.

Each `Widget` receives two new props:
- `onMount: (id: string, el: HTMLElement) => void` — called in a `useEffect` on mount
- `onUnmount: (id: string) => void` — called in the `useEffect` cleanup

### Bounding-box intersection

```ts
function findWidgetUnderCursor(x: number, y: number, excludeId: string): string | null {
  for (const [id, el] of widgetRefs.current) {
    if (id === excludeId) continue;
    const r = el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return id;
  }
  return null;
}
```

Called on every `handleDragMove` with `(clientX, clientY)` from the dnd-kit event.

### Target resolution in `handleDragMove`

| Cursor location | targetKind | previewLayout source |
|---|---|---|
| Inside same-size widget B | `'swap'` | `strategy.preview(committed, { kind: 'swap', id, targetId: B.id })` |
| Inside different-size widget B | `'insert'` | `strategy.preview(committed, { kind: 'drag', id, x: B.x, y: B.y })` |
| Gap (no widget hit) | `'none'` | `strategy.preview(committed, { kind: 'drag', id, ...pointToCell(x, y, metrics) })` |

For `'insert'` and `'none'`, the target position comes from the hit widget's committed layout coordinates (not cursor math), so detection is grab-offset-independent.

### Immediate reflow on pickup (`handleDragStart`)

On drag start, immediately compute and set a preview layout. To guarantee other widgets reflow into the gap, pack without the active widget first, then re-insert it at its original position so `DropPreview` can find it:

```ts
const widget = committed.find(w => w.id === activeId)!;
const withoutActive = strategy.preview(
  committed.filter(w => w.id !== activeId),
  { kind: 'add', widget } // or packDense directly — implementation detail
);
const previewLayout = [...withoutActive, widget]; // active widget tracked but not rendered on board
setDragState({ phase: 'dragging', activeId, targetKind: 'none', previewLayout });
```

The board renders all widgets in `previewLayout` **except** `activeId` (that widget is in `DragOverlay`). Other widgets reflow into the gap immediately. `DropPreview` reads `activeId`'s position from `previewLayout` to know where to render the dotted outline.

---

## 3. Visual Feedback

### Two visual states

**Swap signal** (`targetKind === 'swap'`):
- Target widget (`targetId`) receives `isSwapTarget={true}` prop.
- Widget renders an inset ring via a CSS class (e.g., `.swapTarget { box-shadow: inset 0 0 0 2px var(--accent); }`).
- `DropPreview` is not rendered — the swap positions are unambiguous.

**Insert signal** (`targetKind === 'insert'` or `'none'`):
- `DropPreview` renders at the position of `activeId` in `previewLayout`.
- Position sourced directly from `previewLayout` (strategy output), not recomputed — this is what eliminates the alignment drift.
- `DropPreview` receives a `mode: 'insert' | 'none'` prop for future styling flexibility; both render identically for now.

### DragOverlay

No change to `DragOverlayWidget` appearance. With immediate reflow, the overlay is the only visible instance of the active widget — the "which one am I holding?" ambiguity is resolved structurally.

---

## 4. Strategy Changes

### New Move kind

Added to the `Move` union in `lib/grid/types.ts`:

```ts
| { kind: 'swap'; id: string; targetId: string }
```

### Shared `applySwap` helper in `lib/grid/engine.ts`

```ts
export function applySwap(layout: WidgetLayout[], id: string, targetId: string): WidgetLayout[] {
  const a = layout.find(w => w.id === id)!;
  const b = layout.find(w => w.id === targetId)!;
  return layout.map(w =>
    w.id === id       ? { ...w, x: b.x, y: b.y } :
    w.id === targetId ? { ...w, x: a.x, y: a.y } : w
  );
}
```

No repacking step — sizes match, so there's no collision risk.

### Both strategies delegate to `applySwap`

`autoPack.preview()` and `pushCompact.preview()` both handle `{ kind: 'swap' }` by calling `applySwap`. The implementation is identical across strategies.

### New board store action

`boardStore` gets a `swapWidgets(id: string, targetId: string)` action that commits the swap move via `strategy.preview(committed, { kind: 'swap', id, targetId })`.

### `handleDragEnd` branching

```ts
if (dragState.targetKind === 'swap') {
  boardStore.swapWidgets(dragState.activeId, dragState.targetId!);
} else {
  // final position is wherever activeId landed in the last previewLayout
  const { x, y } = dragState.previewLayout.find(w => w.id === dragState.activeId)!;
  boardStore.moveWidget(dragState.activeId, { x, y });
}
setDragState({ phase: 'idle' });
```

---

## 5. Data Flow

```
pointerDown (4px threshold)
  └─ handleDragStart
       ├─ strategy.preview(committed, drag@current position) → previewLayout
       └─ setDragState({ phase:'dragging', targetKind:'none', previewLayout })
            └─ board renders reflowed layout immediately (source slot closed)

pointerMove
  └─ handleDragMove(clientX, clientY)
       ├─ findWidgetUnderCursor → hitId | null
       ├─ if hitId + same size  → swap preview  → setDragState(targetKind:'swap',  targetId:hitId, previewLayout)
       ├─ if hitId + diff size  → insert preview → setDragState(targetKind:'insert', previewLayout)
       └─ if null               → gap preview    → setDragState(targetKind:'none',  previewLayout)

render
  ├─ widgets render from previewLayout (except activeId — omitted from board)
  ├─ if targetKind='swap'   → Widget(targetId) renders glow ring
  └─ if targetKind≠'swap'   → DropPreview renders at previewLayout[activeId] position

pointerUp
  └─ handleDragEnd
       ├─ targetKind='swap'   → boardStore.swapWidgets(activeId, targetId)
       └─ targetKind≠'swap'   → boardStore.moveWidget(activeId, position)
            └─ setDragState({ phase:'idle' })

cancel/escape
  └─ handleDragCancel → setDragState({ phase:'idle' }) → board snaps to committed
```

---

## 6. Files Affected

| File | Change |
|---|---|
| `lib/grid/types.ts` | Add `DragState` type; add `{ kind: 'swap' }` to `Move` union |
| `lib/grid/engine.ts` | Add `applySwap` helper |
| `lib/grid/strategies/autoPack.ts` | Handle `'swap'` move kind via `applySwap` |
| `lib/grid/strategies/pushCompact.ts` | Handle `'swap'` move kind via `applySwap` |
| `lib/state/boardStore.ts` | Add `swapWidgets` action |
| `components/board/BentoBoard.tsx` | Replace `activeId`+`preview` with `dragState`; add `widgetRefs`; update all handlers; update render logic |
| `components/board/Widget.tsx` | Add `onMount`/`onUnmount` ref callbacks; add `isSwapTarget` prop + CSS class |
| `components/board/DropPreview.tsx` | Add `mode` prop; source position from `previewLayout` |
| `components/board/DropPreview.module.css` | No change (or minor) |

**Not affected:** `DragOverlayWidget`, `ResizeHandle`, `useDragResize`, `useGridMetrics`, `collision.ts`, `sizes.ts`, `occupancy.ts`

---

## 7. Out of Scope

- Resize UX improvements (separate concern)
- Touch/mobile drag support
- Drag-and-drop while filter hide-mode is active (existing lock preserved)
- Multi-widget selection/drag
