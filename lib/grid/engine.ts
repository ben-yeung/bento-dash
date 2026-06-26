import type { LayoutOrientation, LayoutStrategy } from './types';
import { autoPack, createAutoPackH } from './strategies/autoPack';
import { pushCompact, createPushCompactH } from './strategies/pushCompact';
import { getRowCount } from '../state/gridState';

export type LayoutMode = 'autoPack' | 'pushCompact';

const LARGE = 9999;

export function getStrategy(
  mode: LayoutMode,
  orientation: LayoutOrientation = 'vertical',
): LayoutStrategy {
  if (orientation === 'horizontal') {
    const rowCount = getRowCount();
    return mode === 'pushCompact'
      ? createPushCompactH(rowCount, LARGE)
      : createAutoPackH(rowCount, LARGE);
  }
  return mode === 'pushCompact' ? pushCompact : autoPack;
}
