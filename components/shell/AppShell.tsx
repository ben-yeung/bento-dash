'use client';
import { useRef } from 'react';
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
import type { Category, WidgetLayout } from '@/lib/grid/types';

export function AppShell() {
  const boardRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(boardRef);

  const committed = useBoard((s) => s.widgets);
  const moveWidget = useBoard((s) => s.moveWidget);
  const addWidget = useBoard((s) => s.addWidget);
  const layoutMode = useSettings((s) => s.layoutMode);

  const { activeId, preview, setActiveId, setPreview, setPalettePreview, setFabOpen } =
    useDragStore();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const isPaletteDrag = activeId?.startsWith('palette:') ?? false;

  const activeWidget: WidgetLayout | null = isPaletteDrag
    ? (() => {
        const parts = (activeId ?? '').split(':');
        const [w, h] = (parts[2] ?? '1x1').split('x').map(Number);
        return {
          id: activeId!,
          x: 0,
          y: 0,
          w,
          h,
          category: (parts[1] ?? 'finance') as Category,
          order: 0,
        };
      })()
    : (preview ?? committed).find((w) => w.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setPreview(committed);
  }

  function handleDragMove(e: DragMoveEvent) {
    const board = boardRef.current;
    const rect = e.active.rect.current.translated;
    if (!board || !rect) return;
    const b = board.getBoundingClientRect();
    const cell = pointToCell(rect.left - b.left, rect.top - b.top, metrics);
    const id = String(e.active.id);

    if (id.startsWith('palette:')) {
      const parts = id.split(':');
      const [w, h] = (parts[2] ?? '1x1').split('x').map(Number);
      setPalettePreview({ x: cell.x, y: cell.y, w, h, category: (parts[1] ?? 'finance') as Category });
    } else {
      setPreview(getStrategy(layoutMode).preview(committed, { kind: 'drag', id, targetCell: cell }));
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);

    if (id.startsWith('palette:')) {
      const parts = id.split(':');
      const cat = (parts[1] ?? 'finance') as Category;
      const [w, h] = (parts[2] ?? '1x1').split('x').map(Number);
      const pp = useDragStore.getState().palettePreview;
      addWidget(cat, w, h, pp ? { x: pp.x, y: pp.y } : undefined);
      setFabOpen(false);
    } else if (preview) {
      const moved = preview.find((w) => w.id === id);
      if (moved) moveWidget(id, { x: moved.x, y: moved.y });
    }

    setActiveId(null);
    setPreview(null);
    setPalettePreview(null);
  }

  function handleDragCancel() {
    setActiveId(null);
    setPreview(null);
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
            <BentoBoard boardRef={boardRef} metrics={metrics} />
          </div>
          <Fab />
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeWidget ? <DragOverlayWidget widget={activeWidget} metrics={metrics} /> : null}
      </DragOverlay>
      {/* Fab mounts here in Task 8 */}
    </DndContext>
  );
}
