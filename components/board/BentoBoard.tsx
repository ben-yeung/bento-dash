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
import { getStrategy, type LayoutMode } from '@/lib/grid/engine';
import { nearestPreset, nearestPresetFrom, type SizePreset } from '@/lib/grid/sizes';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { useUi } from '@/lib/state/uiStore';
import { useDragResize } from '@/lib/hooks/useDragResize';
import type { WidgetLayout, DragState } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';
import type { RefObject } from 'react';

interface BentoBoardProps {
  boardRef: RefObject<HTMLDivElement>;
  metrics: GridMetrics;
  dragState: DragState;
}

interface WidgetWithResizeProps {
  w: WidgetLayout;
  dimmed?: boolean;
  metrics: GridMetrics;
  committed: WidgetLayout[];
  layoutMode: LayoutMode;
  isSwapTarget: boolean;
  resizingId: string | null;
  interactionsLocked: boolean;
  manageMode: boolean;
  supportedSizes?: SizePreset[];
  setResizePreview: (widgets: WidgetLayout[] | null) => void;
  setResizingId: (id: string | null) => void;
  resizeWidget: (id: string, w: number, h: number) => void;
}

// Defined at module scope (NOT inside BentoBoard) so its type identity is stable
// across renders. If it were declared in the render body, every setPreview/setResizingId
// update would remount the whole widget subtree â€” which drops the resize handle's
// pointer capture mid-gesture (lostpointercapture) and breaks live resize. Stable
// identity lets React reconcile instead, so the captured DOM node survives.
function WidgetWithResize({
  w,
  dimmed = false,
  metrics,
  committed,
  layoutMode,
  isSwapTarget,
  resizingId,
  interactionsLocked,
  manageMode,
  supportedSizes,
  setResizePreview,
  setResizingId,
  resizeWidget,
}: WidgetWithResizeProps) {
  const [snapTarget, setSnapTarget] = useState<SizePreset | null>(null);

  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useDragResize({
    startW: w.w,
    startH: w.h,
    metrics,
    supportedSizes,
    onPreview: (nw, nh) =>
      setResizePreview(getStrategy(layoutMode).preview(committed, { kind: 'resize', id: w.id, w: nw, h: nh })),
    onIndicator: setSnapTarget,
    onCommit: (nw, nh) => {
      resizeWidget(w.id, nw, nh);
      setResizingId(null);
      setResizePreview(null);
      setSnapTarget(null);
    },
  });

  const isResizing = resizingId === w.id;

  return (
    <Widget
      widget={w}
      dimmed={dimmed}
      interactive={resizingId === null && !interactionsLocked}
      isSwapTarget={isSwapTarget}
      manageMode={manageMode}
      resizing={isResizing}
      snapTarget={isResizing ? (snapTarget?.name ?? null) : null}
    >
      {!interactionsLocked && (
        <ResizeHandle
          onPointerDown={(e) => {
            setResizingId(w.id);
            setResizePreview(committed);
            setSnapTarget(
              supportedSizes?.length
                ? nearestPresetFrom(w.w, w.h, supportedSizes)
                : nearestPreset(w.w, w.h)
            );
            onPointerDown(e);
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={(e) => {
            onPointerCancel(e);
            setResizingId(null);
            setResizePreview(null);
            setSnapTarget(null);
          }}
        />
      )}
    </Widget>
  );
}

export function BentoBoard({
  boardRef,
  metrics,
  dragState,
}: BentoBoardProps) {
  const committed = useBoard((s) => s.widgets);
  const resizeWidget = useBoard((s) => s.resizeWidget);
  const layoutMode = useSettings((s) => s.layoutMode);
  const activeTags = useSettings((s) => s.activeTags);
  const filterMode = useSettings((s) => s.filterMode);

  const manageMode = useUi((s) => s.manageMode);

  const palettePreview = useDragStore((s) => s.palettePreview);

  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizePreview, setResizePreview] = useState<WidgetLayout[] | null>(null);

  const base =
    dragState.phase === 'dragging'
      ? dragState.previewLayout
      : (resizePreview ?? committed);
  const filtering = activeTags.length > 0;
  const matches = (cat: WidgetLayout['category']) => activeTags.includes(cat);

  // hide mode: show only matches, re-resolved to pack tight. dim mode: show all.
  // TODO(layout-reresolve): switching layoutMode (autoPack<->pushCompact) only affects
  // subsequent mutations; the current board isn't recompacted until the next drag/resize.
  // boardStore.reResolve() exists for this â€” wire a useSettings.subscribe effect to call it
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
    dragState.phase === 'dragging'
      ? dragState.previewLayout.find((w) => w.id === dragState.activeId) ?? null
      : null;

  return (
    <div
      ref={boardRef}
      className={styles.board}
      style={{
        gridAutoRows: `${metrics.cellSize}px`,
        '--cell-size': `${metrics.cellSize}px`,
      } as React.CSSProperties}
    >
      <LayoutGroup>
        <AnimatePresence>
          {widgets
            .filter((w) => !(dragState.phase === 'dragging' && w.id === dragState.activeId))
            .map((w) => {
              const def = WIDGET_REGISTRY.find((d) => d.type === w.widgetType);
              return (
                <WidgetWithResize
                  key={w.id}
                  w={w}
                  dimmed={filtering && filterMode === 'dim' && !matches(w.category)}
                  metrics={metrics}
                  committed={committed}
                  layoutMode={layoutMode}
                  isSwapTarget={
                    dragState.phase === 'dragging' &&
                    dragState.targetKind === 'swap' &&
                    w.id === dragState.targetId
                  }
                  resizingId={resizingId}
                  interactionsLocked={interactionsLocked}
                  manageMode={manageMode}
                  supportedSizes={def?.supportedSizes}
                  setResizePreview={setResizePreview}
                  setResizingId={setResizingId}
                  resizeWidget={resizeWidget}
                />
              );
            })}
        </AnimatePresence>
        {activeWidget &&
          !interactionsLocked &&
          dragState.phase === 'dragging' &&
          dragState.targetKind !== 'swap' && (
            <DropPreview
              widget={activeWidget}
              mode={dragState.targetKind === 'insert' ? 'insert' : 'none'}
            />
          )}
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
