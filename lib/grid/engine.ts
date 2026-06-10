import type { LayoutStrategy } from './types';
import { autoPack } from './strategies/autoPack';
import { pushCompact } from './strategies/pushCompact';

export type LayoutMode = 'autoPack' | 'pushCompact';

export function getStrategy(mode: LayoutMode): LayoutStrategy {
  return mode === 'pushCompact' ? pushCompact : autoPack;
}
