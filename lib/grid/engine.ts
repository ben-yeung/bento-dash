import type { LayoutOrientation, LayoutStrategy } from './types';
import { autoPack, createAutoPackH } from './strategies/autoPack';
import { pushCompact, createPushCompactH } from './strategies/pushCompact';
import { getRowCount } from '../state/gridState';

export type LayoutMode = 'autoPack' | 'pushCompact';

const LARGE = 9999;

export function getStrategy(
  mode: LayoutMode,
  orientation: LayoutOrientation = 'vertical',
  rowCount?: number,
): LayoutStrategy {
  if (orientation === 'horizontal') {
    // Callers that have metrics.rows directly (drag handlers) pass it explicitly to avoid
    // reading the stale getRowCount() value that lags one render behind the CSS grid.
    const rows = rowCount ?? getRowCount();
    return mode === 'pushCompact'
      ? createPushCompactH(rows, LARGE)
      : createAutoPackH(rows, LARGE);
  }
  return mode === 'pushCompact' ? pushCompact : autoPack;
}
