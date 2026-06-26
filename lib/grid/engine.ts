import type { LayoutOrientation, LayoutStrategy, Move, WidgetLayout } from './types';
import { autoPack, createAutoPack } from './strategies/autoPack';
import { pushCompact, createPushCompact } from './strategies/pushCompact';

export { createAutoPack, createPushCompact };

export type LayoutMode = 'autoPack' | 'pushCompact';

const LARGE = 9999; // effectively no upper bound on the unbounded axis

function transposeWidget(w: WidgetLayout, rows: number): WidgetLayout {
  return { ...w, x: w.y, y: w.x, w: Math.min(w.h, rows), h: w.w };
}

function untransposeWidget(w: WidgetLayout): WidgetLayout {
  return { ...w, x: w.y, y: w.x, w: w.h, h: w.w };
}

function transposeMove(move: Move, rows: number): Move {
  switch (move.kind) {
    case 'drag':
      return { ...move, targetCell: { x: move.targetCell.y, y: move.targetCell.x } };
    case 'resize':
      return { ...move, w: Math.min(move.h, rows), h: move.w };
    case 'add':
      return { ...move, widget: transposeWidget(move.widget, rows) };
    default:
      return move;
  }
}

function wrapHorizontal(mode: LayoutMode, rows: number): LayoutStrategy {
  const inner = mode === 'pushCompact' ? createPushCompact(rows, LARGE) : createAutoPack(rows, LARGE);
  return {
    resolve(widgets) {
      return inner.resolve(widgets.map((w) => transposeWidget(w, rows))).map(untransposeWidget);
    },
    preview(widgets, move) {
      return inner
        .preview(widgets.map((w) => transposeWidget(w, rows)), transposeMove(move, rows))
        .map(untransposeWidget);
    },
  };
}

export function getStrategy(
  mode: LayoutMode,
  orientation: LayoutOrientation = 'vertical',
  rowCount = 4,
): LayoutStrategy {
  if (orientation === 'horizontal') return wrapHorizontal(mode, rowCount);
  return mode === 'pushCompact' ? pushCompact : autoPack;
}

export function clampLayout(
  widgets: WidgetLayout[],
  cols: number,
  mode: LayoutMode,
): WidgetLayout[] {
  const clamped = widgets.map((w) => ({ ...w, w: Math.min(w.w, cols) }));
  const strategy =
    mode === 'pushCompact' ? createPushCompact(cols, LARGE) : createAutoPack(cols, LARGE);
  return strategy.resolve(clamped);
}
