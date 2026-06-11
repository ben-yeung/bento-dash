'use client';
import { useRef, useState, useCallback } from 'react';
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

function parsePaletteId(id: string): { cat: Category; w: number; h: number } | null {
  if (!id.startsWith('palette:')) return null;
  const [, cat, size] = id.split(':');
  const [w, h] = (size ?? '').split('x').map(Number);
  if (!cat || isNaN(w) || isNaN(h) || w < 1 || h < 1) return null;
  return { cat: cat as Category, w, h };
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
  // Track palette drag separately (widget drag uses dragState)
  const [paletteActiveId, setPaletteActiveId] = useState<string | null>(null);

  const widgetRefs = useRef<Map<string, HTMLElement>>(new Map());
  const registerRef = useCallback((id: string, el: HTMLElement) => {
    widgetRefs.current.set(id, el);
  }, []);
  const unregisterRef = useCallback((id: string) => {
    widgetRefs.current.delete(id);
  }, []);

  function findWidgetUnderCursor(x: number, y: number, excludeId: string): string | null {
    for (const [id, el] of widgetRefs.current) {
      if (id === excludeId) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return id;
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

    const activator = e.activatorEvent as PointerEvent;
    const clientX = activator.clientX + e.delta.x;
    const clientY = activator.clientY + e.delta.y;

    const hitId = findWidgetUnderCursor(clientX, clientY, activeId);
    if (hitId) {
      const hit = committed.find((w) => w.id === hitId)!;
      const active = committed.find((w) => w.id === activeId)!;
      const isSameSize = hit.w === active.w && hit.h === active.h;
      if (isSameSize) {
        const previewLayout = getStrategy(layoutMode).preview(committed, { kind: 'swap', id: activeId, targetId: hitId });
        setDragState({ phase: 'dragging', activeId, targetKind: 'swap', targetId: hitId, previewLayout });
      } else {
        const previewLayout = getStrategy(layoutMode).preview(committed, { kind: 'drag', id: activeId, targetCell: { x: hit.x, y: hit.y } });
        setDragState({ phase: 'dragging', activeId, targetKind: 'insert', previewLayout });
      }
    } else {
      const board = boardRef.current;
      const rect = e.active.rect.current.translated;
      if (!board || !rect) return;
      const b = board.getBoundingClientRect();
      const cell = pointToCell(rect.left - b.left, rect.top - b.top, metrics);
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
        addWidget(parsed.cat, parsed.w, parsed.h, pp ? { x: pp.x, y: pp.y } : undefined);
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
              onWidgetMount={registerRef}
              onWidgetUnmount={unregisterRef}
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
