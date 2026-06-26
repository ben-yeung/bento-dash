'use client';
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import styles from './BentoBoard.module.css';
import { Widget } from './Widget';
import { DropPreview } from './DropPreview';
import { ResizeHandle } from './ResizeHandle';
import { useBoard } from '@/lib/state/boardStore';
import { useSettings } from '@/lib/state/settingsStore';
import { getStrategy, clampLayout, createAutoPack, createPushCompact, type LayoutMode } from '@/lib/grid/engine';
import { nearestPreset, nearestPresetFrom, type SizePreset } from '@/lib/grid/sizes';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { useUi } from '@/lib/state/uiStore';
import { useDragResize } from '@/lib/hooks/useDragResize';
import { useLongPress } from '@/lib/hooks/useLongPress';
import type { WidgetLayout, DragState } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';
import type { RefObject } from 'react';

interface BentoBoardProps {
  boardRef: RefObject<HTMLDivElement | null>;
  metrics: GridMetrics;
  dragState: DragState;
  touchDragEnabled: boolean;
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
  isMobile: boolean;
  cols: number;
  onEnterManage: () => void;
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
  isMobile,
  cols,
  onEnterManage,
  setResizePreview,
  setResizingId,
  resizeWidget,
}: WidgetWithResizeProps) {
  const [snapTarget, setSnapTarget] = useState<SizePreset | null>(null);

  const longPress = useLongPress(
    isMobile && !manageMode && resizingId === null ? onEnterManage : undefined,
  );

  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useDragResize({
    startW: w.w,
    startH: w.h,
    metrics,
    supportedSizes,
    onPreview: (nw, nh) => {
      const strategy = layoutMode === 'pushCompact'
        ? createPushCompact(cols, 9999)
        : createAutoPack(cols, 9999);
      setResizePreview(strategy.preview(committed, { kind: 'resize', id: w.id, w: nw, h: nh }));
    },
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
      longPressHandlers={longPress}
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
  touchDragEnabled,
}: BentoBoardProps) {
  const storedWidgets = useBoard((s) => s.widgets);
  const resizeWidget = useBoard((s) => s.resizeWidget);
  const layoutMode = useSettings((s) => s.layoutMode);
  const layoutOrientation = useSettings((s) => s.layoutOrientation);
  const committed = metrics.cols < 6
    ? clampLayout(storedWidgets, metrics.cols, layoutMode)
    : storedWidgets;
  const activeTags = useSettings((s) => s.activeTags);
  const filterMode = useSettings((s) => s.filterMode);

  const manageMode = useUi((s) => s.manageMode);
  const setManageMode = useUi((s) => s.setManageMode);

  const onEnterManage = useCallback(() => {
    setManageMode(true);
    navigator.vibrate?.(10);
  }, [setManageMode]);

  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizePreview, setResizePreview] = useState<WidgetLayout[] | null>(null);

  // Safety net: if the resize gesture ends without the ResizeHandle receiving
  // pointerup/pointercancel (e.g. pointer leaves the window, OS interrupts, or
  // a React error prevents the event from being processed), this global listener
  // clears the stuck resizingId so other interactions aren't locked indefinitely.
  useEffect(() => {
    if (!resizingId) return;
    const clear = () => {
      setResizingId(null);
      setResizePreview(null);
    };
    window.addEventListener('pointerup', clear);
    window.addEventListener('pointercancel', clear);
    return () => {
      window.removeEventListener('pointerup', clear);
      window.removeEventListener('pointercancel', clear);
    };
  }, [resizingId]);

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
      data-manage-mode={manageMode}
      data-orientation={layoutOrientation}
      data-touch-drag={touchDragEnabled ? 'on' : 'off'}
      style={(layoutOrientation === 'horizontal'
        ? {
            gridTemplateRows: `repeat(${typeof metrics.rows === 'number' ? metrics.rows : 4}, ${metrics.cellSize}px)`,
            gridAutoColumns: `${metrics.cellSize}px`,
            '--cell-size': `${metrics.cellSize}px`,
          }
        : {
            gridTemplateColumns: `repeat(${metrics.cols}, 1fr)`,
            gridAutoRows: `${metrics.cellSize}px`,
            '--cell-size': `${metrics.cellSize}px`,
          }
      ) as unknown as React.CSSProperties}
    >
      <AnimatePresence>
        {widgets
          // The active widget is removed from the list while dragging — the DragOverlay
          // renders the moving copy, and dnd-kit anchors the overlay to the rect it
          // cached at drag start, so unmounting the source keeps the overlay aligned to
          // the cursor. (Keeping it mounted but absolutely-positioned makes dnd-kit
          // re-measure the displaced node and offsets the overlay.)
          // NOTE: tiles intentionally have no `exit` animation. A rapidly interrupted
          // exit left the removed node stuck mounted at opacity:0 while still holding its
          // grid cell — the "disappears but still takes space, pops back on next drag" bug.
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
                isMobile={metrics.cols < 6}
                cols={metrics.cols}
                onEnterManage={onEnterManage}
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
    </div>
  );
}
