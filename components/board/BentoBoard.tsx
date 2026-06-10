'use client';
import { useState } from 'react';
import { LayoutGroup, AnimatePresence } from 'motion/react';
import styles from './BentoBoard.module.css';
import { Widget } from './Widget';
import { DropPreview } from './DropPreview';
import { ResizeHandle } from './ResizeHandle';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';
import { useDragStore } from '@/lib/state/dragStore';
import { useUi } from '@/lib/state/uiStore';
import { getStrategy, type LayoutMode } from '@/lib/grid/engine';
import { useDragResize } from '@/lib/hooks/useDragResize';
import type { WidgetLayout } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';
import type { RefObject } from 'react';

interface BentoBoardProps {
  boardRef: RefObject<HTMLDivElement>;
  metrics: GridMetrics;
}

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

export function BentoBoard({ boardRef, metrics }: BentoBoardProps) {
  const committed = useBoard((s) => s.widgets);
  const resizeWidget = useBoard((s) => s.resizeWidget);
  const layoutMode = useSettings((s) => s.layoutMode);
  const manageMode = useUi((s) => s.manageMode);
  const activeTags = useSettings((s) => s.activeTags);
  const filterMode = useSettings((s) => s.filterMode);

  const activeId = useDragStore((s) => s.activeId);
  const preview = useDragStore((s) => s.preview);
  const palettePreview = useDragStore((s) => s.palettePreview);
  const setPreview = useDragStore((s) => s.setPreview);

  const [resizingId, setResizingId] = useState<string | null>(null);

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

  const activeWidget =
    activeId && !activeId.startsWith('palette:')
      ? widgets.find((w) => w.id === activeId) ?? null
      : null;

  return (
    <div
      ref={boardRef}
      className={styles.board}
      style={{ gridAutoRows: `${metrics.cellSize}px` }}
    >
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
        {palettePreview && (
          <DropPreview
            widget={{
              id: '__pal__',
              x: palettePreview.x,
              y: palettePreview.y,
              w: palettePreview.w,
              h: palettePreview.h,
              category: palettePreview.category,
              order: 0,
            }}
          />
        )}
      </LayoutGroup>
    </div>
  );
}
