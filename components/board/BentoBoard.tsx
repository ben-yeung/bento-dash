'use client';
import { useRef, useState } from 'react';
import { LayoutGroup, AnimatePresence } from 'motion/react';
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
import { ResizeHandle } from './ResizeHandle';
import { useDragResize } from '@/lib/hooks/useDragResize';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';
import { useUi } from '@/lib/state/uiStore';
import { useGridMetrics } from '@/lib/hooks/useGridMetrics';
import { getStrategy, type LayoutMode } from '@/lib/grid/engine';
import { pointToCell, type GridMetrics } from '@/lib/grid/collision';
import type { WidgetLayout } from '@/lib/grid/types';

interface WidgetWithResizeProps {
  w: WidgetLayout;
  dimmed?: boolean;
  metrics: GridMetrics;
  committed: WidgetLayout[];
  layoutMode: LayoutMode;
  activeId: string | null;
  resizingId: string | null;
  interactionsLocked: boolean;
  manageMode: boolean;
  setPreview: (widgets: WidgetLayout[] | null) => void;
  setResizingId: (id: string | null) => void;
  resizeWidget: (id: string, w: number, h: number) => void;
}

// Defined at module scope (NOT inside BentoBoard) so its type identity is stable
// across renders. If it were declared in the render body, every setPreview/setResizingId
// update would remount the whole widget subtree — which drops the resize handle's
// pointer capture mid-gesture (lostpointercapture) and breaks live resize. Stable
// identity lets React reconcile instead, so the captured DOM node survives.
function WidgetWithResize({
  w,
  dimmed = false,
  metrics,
  committed,
  layoutMode,
  activeId,
  resizingId,
  interactionsLocked,
  manageMode,
  setPreview,
  setResizingId,
  resizeWidget,
}: WidgetWithResizeProps) {
  const { onPointerDown, onPointerMove, onPointerUp } = useDragResize({
    startW: w.w,
    startH: w.h,
    metrics,
    onPreview: (nw, nh) =>
      setPreview(getStrategy(layoutMode).preview(committed, { kind: 'resize', id: w.id, w: nw, h: nh })),
    onCommit: (nw, nh) => {
      resizeWidget(w.id, nw, nh);
      setResizingId(null);
      setPreview(null);
    },
  });
  return (
    <Widget
      widget={w}
      dragging={w.id === activeId}
      dimmed={dimmed}
      interactive={resizingId === null && !interactionsLocked}
      manageMode={manageMode}
    >
      {!interactionsLocked && (
        <ResizeHandle
          onPointerDown={(e) => {
            setResizingId(w.id);
            setPreview(committed);
            onPointerDown(e);
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      )}
    </Widget>
  );
}

export function BentoBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(boardRef);
  const committed = useBoard((s) => s.widgets);
  const moveWidget = useBoard((s) => s.moveWidget);
  const resizeWidget = useBoard((s) => s.resizeWidget);
  const layoutMode = useSettings((s) => s.layoutMode);
  const manageMode = useUi((s) => s.manageMode);
  const activeTags = useSettings((s) => s.activeTags);
  const filterMode = useSettings((s) => s.filterMode);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState<WidgetLayout[] | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const base = preview ?? committed;
  const filtering = activeTags.length > 0;
  const matches = (cat: WidgetLayout['category']) => activeTags.includes(cat);

  // hide mode: show only matches, re-resolved to pack tight. dim mode: show all.
  // TODO(layout-reresolve): switching layoutMode (autoPack<->pushCompact) only affects
  // subsequent mutations; the current board isn't recompacted until the next drag/resize.
  // boardStore.reResolve() exists for this — wire a useSettings.subscribe effect to call it
  // on layoutMode change. anchor: lib/state/boardStore.ts (reResolve)
  const widgets =
    filtering && filterMode === 'hide'
      ? getStrategy(layoutMode).resolve(base.filter((w) => matches(w.category)))
      : base;

  // TODO(filter-drag): while a `hide` filter is active, drag/resize are locked (interactionsLocked)
  // to avoid ambiguous order-mapping against hidden widgets. Allow rearranging within a filtered
  // subset in a later pass. anchor: components/board/BentoBoard.tsx
  const interactionsLocked = filtering && filterMode === 'hide';

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
          <AnimatePresence>
            {widgets.map((w) => (
              <WidgetWithResize
                key={w.id}
                w={w}
                dimmed={filtering && filterMode === 'dim' && !matches(w.category)}
                metrics={metrics}
                committed={committed}
                layoutMode={layoutMode}
                activeId={activeId}
                resizingId={resizingId}
                interactionsLocked={interactionsLocked}
                manageMode={manageMode}
                setPreview={setPreview}
                setResizingId={setResizingId}
                resizeWidget={resizeWidget}
              />
            ))}
          </AnimatePresence>
          {activeWidget && !interactionsLocked && <DropPreview widget={activeWidget} />}
        </LayoutGroup>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeWidget ? <DragOverlayWidget widget={activeWidget} metrics={metrics} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
