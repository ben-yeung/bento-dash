'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import styles from './AppShell.module.css';
import { ThemeController } from './ThemeController';
import { LeftBar } from './LeftBar';
import { Banner } from './Banner';
import { ProfileButton } from './ProfileButton';
import { Fab } from './Fab';
import { BentoBoard } from '@/components/board/BentoBoard';
import { DragOverlayWidget } from '@/components/board/DragOverlayWidget';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';
import { useDragStore } from '@/lib/state/dragStore';
import { getStrategy } from '@/lib/grid/engine';
import { pointToCell } from '@/lib/grid/collision';
import { useGridMetrics } from '@/lib/hooks/useGridMetrics';
import type { Category, WidgetLayout, DragState } from '@/lib/grid/types';

function parsePaletteId(id: string): { cat: Category; widgetType: string; w: number; h: number } | null {
  if (!id.startsWith('palette:')) return null;
  const parts = id.split(':');
  // parts: ['palette', cat, widgetType, 'WxH']
  if (parts.length !== 4) return null;
  const [, cat, widgetType, size] = parts;
  const [w, h] = (size ?? '').split('x').map(Number);
  if (!cat || !widgetType || Number.isNaN(w) || Number.isNaN(h) || w < 1 || h < 1) return null;
  return { cat: cat as Category, widgetType, w, h };
}

// Module-level constant so useSensor's useMemo([sensor, options]) sees a stable reference
// every render. Without this, useSensors returns a new array each render → activators are
// new → internalContext is new → every useDraggable consumer re-renders after each setDrag
// call → framer-motion layout effects cascade → nestedUpdateCount hits 50 after ~25 moves.
const POINTER_SENSOR_OPTIONS = { activationConstraint: { distance: 4 } } as const;

export function AppShell() {
  const boardRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(boardRef);

  const committed = useBoard((s) => s.widgets);
  const moveWidget = useBoard((s) => s.moveWidget);
  const placeWidgetFromPreview = useBoard((s) => s.placeWidgetFromPreview);
  const swapWidgets = useBoard((s) => s.swapWidgets);
  const layoutMode = useSettings((s) => s.layoutMode);

  const setFabOpen = useDragStore((s) => s.setFabOpen);

  const [dragState, setDragState] = useState<DragState>({ phase: 'idle' });
  // Mirror dragState in a ref updated synchronously inside the handlers. dnd-kit can fire
  // onDragStart and onDragEnd in the same task before React commits the "dragging" render
  // (rapid drags), so reading dragState from the render closure left handleDragEnd running
  // with a stale `idle` value — it hit the early return and never reset, leaving phase stuck
  // at 'dragging' (widget filtered out + drop-preview outline lingering until the next drag).
  const dragStateRef = useRef<DragState>(dragState);
  // Stable wrapper: keeps dragStateRef in sync so rapid-fire handlers always read the latest
  // phase without a stale closure, and useState setter is stable so useCallback deps stay tight.
  const setDrag = useCallback((s: DragState) => {
    dragStateRef.current = s;
    setDragState(s);
  }, []);

  // Re-resolve board positions whenever layoutMode changes so widgets
  // compact correctly under the new strategy immediately.
  useEffect(() => {
    return useSettings.subscribe((s, prev) => {
      if (s.layoutMode !== prev.layoutMode) {
        useBoard.getState().reResolve();
      }
    });
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, POINTER_SENSOR_OPTIONS));

  const dragActiveId = dragState.phase === 'dragging' ? dragState.activeId : null;
  const paletteInfo =
    dragActiveId && dragActiveId.startsWith('palette:')
      ? parsePaletteId(dragActiveId)
      : null;
  const activeWidget: WidgetLayout | null = paletteInfo && dragActiveId
    ? { id: dragActiveId, x: 0, y: 0, w: paletteInfo.w, h: paletteInfo.h, category: paletteInfo.cat, widgetType: paletteInfo.widgetType, order: 0 }
    : dragState.phase === 'dragging'
      ? dragState.previewLayout.find((w) => w.id === dragState.activeId) ?? null
      : null;

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const id = String(e.active.id);
    if (id.startsWith('palette:')) {
      const parsed = parsePaletteId(id);
      if (!parsed) return;
      // Seed previewLayout as committed; the first move computes the add-preview
      // (temp widget) so existing widgets reflow around the landing spot.
      setDrag({ phase: 'dragging', activeId: id, targetKind: 'none', previewLayout: committed });
      return;
    }
    const widget = committed.find((w) => w.id === id);
    if (!widget) return;
    const withoutActive = getStrategy(layoutMode).preview(committed, { kind: 'remove', id });
    const previewLayout = [...withoutActive, widget];
    setDrag({ phase: 'dragging', activeId: id, targetKind: 'none', previewLayout });
  }, [committed, layoutMode, setDrag]);

  const handleDragMove = useCallback((e: DragMoveEvent) => {
    const id = String(e.active.id);

    if (id.startsWith('palette:')) {
      const parsed = parsePaletteId(id);
      const board = boardRef.current;
      if (!parsed || !board || !(e.activatorEvent instanceof PointerEvent)) return;
      const boardRect = board.getBoundingClientRect();
      // Anchor the landing cell on the pointer (like board-tile drags), not the dragged
      // card's rect top-left, so the drop tracks the cursor.
      const clientX = e.activatorEvent.clientX + e.delta.x;
      const clientY = e.activatorEvent.clientY + e.delta.y;
      const cell = pointToCell(clientX - boardRect.left, clientY - boardRect.top, metrics);
      // Skip if cursor hasn't crossed into a new grid cell — avoids a setDrag call (and thus
      // a second React commit) on every pointermove within the same cell, which was the
      // primary driver of nestedUpdateCount accumulation hitting React's limit of 50.
      const ds = dragStateRef.current;
      if (ds.phase === 'dragging' && ds.activeId === id && ds.targetKind === 'insert') {
        const placed = ds.previewLayout.find((w) => w.id === id);
        if (placed && placed.x === cell.x && placed.y === cell.y) return;
      }
      const order = committed.reduce((max, x) => Math.max(max, x.order), -1) + 1;
      const temp: WidgetLayout = {
        id,
        x: cell.x,
        y: cell.y,
        w: parsed.w,
        h: parsed.h,
        category: parsed.cat,
        widgetType: parsed.widgetType,
        order,
      };
      // Inject the new widget then position it through the SAME insert pipeline board
      // tiles use, so existing widgets reflow around it and it lands at the cursor cell —
      // instead of `kind:'add'`, which appends to the end of the board.
      const previewLayout = getStrategy(layoutMode).preview([...committed, temp], { kind: 'drag', id, targetCell: cell });
      setDrag({ phase: 'dragging', activeId: id, targetKind: 'insert', previewLayout });
      return;
    }

    const ds = dragStateRef.current;
    if (ds.phase !== 'dragging') return;
    const { activeId } = ds;

    if (!(e.activatorEvent instanceof PointerEvent)) return;
    const activator = e.activatorEvent;
    const clientX = activator.clientX + e.delta.x;
    const clientY = activator.clientY + e.delta.y;

    const board = boardRef.current;
    if (!board) return;
    const boardRect = board.getBoundingClientRect();

    // Hit-test against committed grid positions (stable, not animated) to avoid flicker
    // during spring transitions. currentTargetId uses a full-rect zone (no inset) so the
    // active swap target stays sticky even when the cursor grazes its edge.
    const stride = metrics.cellSize + metrics.gap;
    const inset = metrics.gap; // new targets require cursor to be gap-px inside boundary

    const widgetRect = (w: { x: number; y: number; w: number; h: number }, i: number) => ({
      left:   boardRect.left + w.x * stride + i,
      top:    boardRect.top  + w.y * stride + i,
      right:  boardRect.left + w.x * stride + w.w * metrics.cellSize + (w.w - 1) * metrics.gap - i,
      bottom: boardRect.top  + w.y * stride + w.h * metrics.cellSize + (w.h - 1) * metrics.gap - i,
    });

    const currentTargetId = ds.targetKind === 'swap' ? ds.targetId : null;

    // Hysteresis: keep the current swap target if cursor is still inside its full rect
    let hitId: string | null = null;
    if (currentTargetId) {
      const cur = committed.find((w) => w.id === currentTargetId);
      if (cur) {
        const r = widgetRect(cur, 0);
        if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
          hitId = currentTargetId;
        }
      }
    }
    if (!hitId) {
      // Enter a new target only when cursor is inset-px inside its boundary
      for (const w of committed) {
        if (w.id === activeId) continue;
        const r = widgetRect(w, inset);
        if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
          hitId = w.id;
          break;
        }
      }
    }

    if (hitId) {
      const hit = committed.find((w) => w.id === hitId);
      const active = committed.find((w) => w.id === activeId);
      if (!hit || !active) return;
      const isSameSize = hit.w === active.w && hit.h === active.h;
      if (isSameSize) {
        // Skip if already showing this swap
        if (ds.targetKind === 'swap' && ds.targetId === hitId) return;
        const previewLayout = getStrategy(layoutMode).preview(committed, { kind: 'swap', id: activeId, targetId: hitId });
        setDrag({ phase: 'dragging', activeId, targetKind: 'swap', targetId: hitId, previewLayout });
      } else {
        // Cursor left-half of hit widget → insert before it; right-half → insert after it.
        // Lets a wider widget slip between two narrower ones at any sub-widget position.
        const hitLeftPx = boardRect.left + hit.x * stride;
        const hitWidthPx = hit.w * metrics.cellSize + (hit.w - 1) * metrics.gap;
        const insertAfter = clientX - hitLeftPx > hitWidthPx / 2;
        const targetX = Math.min(insertAfter ? hit.x + hit.w : hit.x, metrics.cols - 1);
        const previewLayout = getStrategy(layoutMode).preview(committed, { kind: 'drag', id: activeId, targetCell: { x: targetX, y: hit.y } });
        setDrag({ phase: 'dragging', activeId, targetKind: 'insert', previewLayout });
      }
    } else {
      // Cursor position (not dragged widget rect) keeps gap targeting grab-offset-free
      const cell = pointToCell(clientX - boardRect.left, clientY - boardRect.top, metrics);
      // Skip if cursor is still in the same grid cell
      if (ds.targetKind === 'none') {
        const placed = ds.previewLayout.find((w) => w.id === activeId);
        if (placed && placed.x === cell.x && placed.y === cell.y) return;
      }
      const previewLayout = getStrategy(layoutMode).preview(committed, { kind: 'drag', id: activeId, targetCell: cell });
      setDrag({ phase: 'dragging', activeId, targetKind: 'none', previewLayout });
    }
  }, [boardRef, metrics, committed, layoutMode, setDrag]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const id = String(e.active.id);
    if (id.startsWith('palette:')) {
      const parsed = parsePaletteId(id);
      const board = boardRef.current;
      const rect = e.active.rect.current.translated;
      // Only commit if the dragged card's center is inside the board.
      let inside = false;
      if (board && rect) {
        const b = board.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        inside = cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom;
      }
      // Read from the ref (not the render closure) so a rapid palette drop that
      // runs before the "dragging" render commits still sees the add-preview.
      const ds = dragStateRef.current;
      const placed =
        ds.phase === 'dragging'
          ? ds.previewLayout.find((w) => w.id === id)
          : null;
      if (parsed && inside && placed && ds.phase === 'dragging') {
        // Commit exactly what the drop ghost showed: the reflowed layout with the
        // dragged-in widget promoted from its draft palette id to a real id. The
        // widget lands on the same cell as the preview, in either layout mode.
        placeWidgetFromPreview(ds.previewLayout, id);
        setFabOpen(false);
      }
      setDrag({ phase: 'idle' });
      return;
    }
    // Read the live drag state from the ref (not the render closure) and ALWAYS reset to
    // idle, even if phase reads non-'dragging'. A rapid drop can run this handler before the
    // "dragging" render commits; bailing early there previously left phase stuck.
    const ds = dragStateRef.current;
    if (ds.phase === 'dragging') {
      const { activeId, targetKind, previewLayout } = ds;
      if (targetKind === 'swap') {
        swapWidgets(activeId, ds.targetId);
      } else {
        const moved = previewLayout.find((w) => w.id === activeId);
        if (moved) moveWidget(activeId, { x: moved.x, y: moved.y });
      }
    }
    setDrag({ phase: 'idle' });
  }, [boardRef, placeWidgetFromPreview, setFabOpen, moveWidget, swapWidgets, setDrag]);

  const handleDragCancel = useCallback(() => {
    setDrag({ phase: 'idle' });
  }, [setDrag]);

  return (
    <DndContext
      id="bento-dnd"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={styles.shell}>
        <ThemeController />
        <LeftBar />
        <div className={styles.main}>
          <div className={styles.scroll}>
            <Banner profileSlot={<ProfileButton />} />
            <BentoBoard
              boardRef={boardRef}
              metrics={metrics}
              dragState={dragState}
            />
          </div>
          <Fab />
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeWidget ? <DragOverlayWidget widget={activeWidget} metrics={metrics} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
