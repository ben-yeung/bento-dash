'use client';
import { useRef, useState } from 'react';
import { LayoutGroup } from 'motion/react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
} from '@dnd-kit/core';
import styles from './BentoBoard.module.css';
import { Widget } from './Widget';
import { DragOverlayWidget } from './DragOverlayWidget';
import { DropPreview } from './DropPreview';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';
import { useGridMetrics } from '@/lib/hooks/useGridMetrics';
import { getStrategy } from '@/lib/grid/engine';
import { pointToCell } from '@/lib/grid/collision';
import type { WidgetLayout } from '@/lib/grid/types';

export function BentoBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(boardRef);
  const committed = useBoard((s) => s.widgets);
  const moveWidget = useBoard((s) => s.moveWidget);
  const layoutMode = useSettings((s) => s.layoutMode);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState<WidgetLayout[] | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const widgets = preview ?? committed;
  const activeWidget = widgets.find((w) => w.id === activeId) ?? null;

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
    setPreview(getStrategy(layoutMode).preview(committed, { kind: 'drag', id: String(e.active.id), targetCell: cell }));
  }

  function handleDragEnd() {
    if (activeId && preview) {
      const moved = preview.find((w) => w.id === activeId);
      if (moved) moveWidget(activeId, { x: moved.x, y: moved.y });
    }
    setActiveId(null);
    setPreview(null);
  }

  function handleDragCancel() {
    setActiveId(null);
    setPreview(null);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div ref={boardRef} className={styles.board} style={{ gridAutoRows: `${metrics.cellSize}px` }}>
        <LayoutGroup>
          {widgets.map((w) => (
            <Widget key={w.id} widget={w} dragging={w.id === activeId} />
          ))}
          {activeWidget && <DropPreview widget={activeWidget} />}
        </LayoutGroup>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeWidget ? <DragOverlayWidget widget={activeWidget} metrics={metrics} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
