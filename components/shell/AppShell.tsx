'use client';
import { useRef, useState, useEffect } from 'react';
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

export function AppShell() {
  const boardRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(boardRef);

  const committed = useBoard((s) => s.widgets);
  const moveWidget = useBoard((s) => s.moveWidget);
  const addWidget = useBoard((s) => s.addWidget);
  const swapWidgets = useBoard((s) => s.swapWidgets);
  const layoutMode = useSettings((s) => s.layoutMode);

  const { setPalettePreview, setFabOpen } = useDragStore();

  const [dragState, setDragState] = useState<DragState>({ phase: 'idle' });

  // Re-resolve board positions whenever layoutMode changes so widgets
  // compact correctly under the new strategy immediately.
  useEffect(() => {
    return useSettings.subscribe((s, prev) => {
      if (s.layoutMode !== prev.layoutMode) {
        useBoard.getState().reResolve();
      }
    });
  }, []);
  // Track palette drag separately (widget drag uses dragState)
  const [paletteActiveId, setPaletteActiveId] = useState<string | null>(null);

  // Hit-test against committed grid positions (stable, not animated) to avoid flicker
  // during spring transitions. currentTargetId uses a full-rect zone (no inset) so the
  // active swap target stays sticky even when the cursor grazes its edge.
  function findWidgetUnderCursor(
    x: number,
    y: number,
    excludeId: string,
    currentTargetId: string | null,
    boardRect: DOMRect,
  ): string | null {
    const stride = metrics.cellSize + metrics.gap;
    const inset = metrics.gap; // new targets require cursor to be gap-px inside boundary

    const widgetRect = (w: { x: number; y: number; w: number; h: number }, i: number) => ({
      left:   boardRect.left + w.x * stride + i,
      top:    boardRect.top  + w.y * stride + i,
      right:  boardRect.left + w.x * stride + w.w * metrics.cellSize + (w.w - 1) * metrics.gap - i,
      bottom: boardRect.top  + w.y * stride + w.h * metrics.cellSize + (w.h - 1) * metrics.gap - i,
    });

    // Hysteresis: keep the current swap target if cursor is still inside its full rect
    if (currentTargetId) {
      const cur = committed.find((w) => w.id === currentTargetId);
      if (cur) {
        const r = widgetRect(cur, 0);
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return currentTargetId;
      }
    }

    // Enter a new target only when cursor is inset-px inside its boundary
    for (const w of committed) {
      if (w.id === excludeId) continue;
      const r = widgetRect(w, inset);
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return w.id;
    }
    return null;
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const paletteInfo = paletteActiveId ? parsePaletteId(paletteActiveId) : null;
  const activeWidget: WidgetLayout | null = paletteInfo
    ? { id: paletteActiveId!, x: 0, y: 0, w: paletteInfo.w, h: paletteInfo.h, category: paletteInfo.cat, order: 0 }
    : dragState.phase === 'dragging'
      ? dragState.previewLayout.find((w) => w.id === dragState.activeId) ?? null
      : null;

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    if (id.startsWith('palette:')) {
      setPaletteActiveId(id);
      return;
    }
    const widget = committed.find((w) => w.id === id);
    if (!widget) return;
    const withoutActive = getStrategy(layoutMode).preview(committed, { kind: 'remove', id });
    const previewLayout = [...withoutActive, widget];
    setDragState({ phase: 'dragging', activeId: id, targetKind: 'none', previewLayout });
  }

  function handleDragMove(e: DragMoveEvent) {
    const id = String(e.active.id);

    if (id.startsWith('palette:')) {
      const board = boardRef.current;
      const rect = e.active.rect.current.translated;
      if (!board || !rect) return;
      const b = board.getBoundingClientRect();
      const cell = pointToCell(rect.left - b.left, rect.top - b.top, metrics);
      const parsed = parsePaletteId(id);
      if (!parsed) return;
      setPalettePreview({ x: cell.x, y: cell.y, w: parsed.w, h: parsed.h, category: parsed.cat });
      return;
    }

    if (dragState.phase !== 'dragging') return;
    const { activeId } = dragState;

    if (!(e.activatorEvent instanceof PointerEvent)) return;
    const activator = e.activatorEvent;
    const clientX = activator.clientX + e.delta.x;
    const clientY = activator.clientY + e.delta.y;

    const board = boardRef.current;
    if (!board) return;
    const boardRect = board.getBoundingClientRect();

    const currentTargetId =
      dragState.targetKind === 'swap' ? dragState.targetId : null;
    const hitId = findWidgetUnderCursor(clientX, clientY, activeId, currentTargetId, boardRect);
    if (hitId) {
      const hit = committed.find((w) => w.id === hitId);
      const active = committed.find((w) => w.id === activeId);
      if (!hit || !active) return;
      const isSameSize = hit.w === active.w && hit.h === active.h;
      if (isSameSize) {
        const previewLayout = getStrategy(layoutMode).preview(committed, { kind: 'swap', id: activeId, targetId: hitId });
        setDragState({ phase: 'dragging', activeId, targetKind: 'swap', targetId: hitId, previewLayout });
      } else {
        // Cursor left-half of hit widget → insert before it; right-half → insert after it.
        // Lets a wider widget slip between two narrower ones at any sub-widget position.
        const stride = metrics.cellSize + metrics.gap;
        const hitLeftPx = boardRect.left + hit.x * stride;
        const hitWidthPx = hit.w * metrics.cellSize + (hit.w - 1) * metrics.gap;
        const insertAfter = clientX - hitLeftPx > hitWidthPx / 2;
        const targetX = Math.min(insertAfter ? hit.x + hit.w : hit.x, metrics.cols - 1);
        const previewLayout = getStrategy(layoutMode).preview(committed, { kind: 'drag', id: activeId, targetCell: { x: targetX, y: hit.y } });
        setDragState({ phase: 'dragging', activeId, targetKind: 'insert', previewLayout });
      }
    } else {
      // Cursor position (not dragged widget rect) keeps gap targeting grab-offset-free
      const cell = pointToCell(clientX - boardRect.left, clientY - boardRect.top, metrics);
      const previewLayout = getStrategy(layoutMode).preview(committed, { kind: 'drag', id: activeId, targetCell: cell });
      setDragState({ phase: 'dragging', activeId, targetKind: 'none', previewLayout });
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    if (id.startsWith('palette:')) {
      const parsed = parsePaletteId(id);
      if (parsed) {
        const pp = useDragStore.getState().palettePreview;
        addWidget(parsed.cat, parsed.widgetType, parsed.w, parsed.h, pp ? { x: pp.x, y: pp.y } : undefined);
        setFabOpen(false);
      }
      setPaletteActiveId(null);
      setPalettePreview(null);
      return;
    }
    if (dragState.phase !== 'dragging') return;
    const { activeId, targetKind, previewLayout } = dragState;
    if (targetKind === 'swap') {
      swapWidgets(activeId, dragState.targetId);
    } else {
      const moved = previewLayout.find((w) => w.id === activeId);
      if (moved) moveWidget(activeId, { x: moved.x, y: moved.y });
    }
    setDragState({ phase: 'idle' });
  }

  function handleDragCancel() {
    setDragState({ phase: 'idle' });
    setPaletteActiveId(null);
    setPalettePreview(null);
  }

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
