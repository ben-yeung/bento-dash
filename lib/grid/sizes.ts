import { COLS, MAX_H } from './types';

export const TARGET_CELL_SIZE = 180; // px — target cell size for horizontal rowCount calc
export const MIN_ROWS = 2;           // minimum rows in horizontal mode

export interface SizePreset {
  name: string;
  w: number;
  h: number;
  group: 'core' | 'extended';
}

export const SIZE_PRESETS: SizePreset[] = [
  { name: '1×1', w: 1, h: 1, group: 'core' },
  { name: '2×1', w: 2, h: 1, group: 'core' },
  { name: '2×2', w: 2, h: 2, group: 'core' },
  { name: '3×3', w: 3, h: 3, group: 'core' },
  { name: '4×4', w: 4, h: 4, group: 'core' },
  { name: '1×2', w: 1, h: 2, group: 'extended' },
  { name: '2×3', w: 2, h: 3, group: 'extended' },
  { name: '3×2', w: 3, h: 2, group: 'extended' },
  { name: '4×2', w: 4, h: 2, group: 'extended' },
  { name: '6×1', w: 6, h: 1, group: 'extended' },
];

export function clampSize(w: number, h: number, maxW = COLS, maxH = MAX_H): { w: number; h: number } {
  return {
    w: Math.max(1, Math.min(maxW, Math.round(w))),
    h: Math.max(1, Math.min(maxH, Math.round(h))),
  };
}

export function nearestPreset(w: number, h: number): SizePreset {
  const c = clampSize(w, h);
  let best = SIZE_PRESETS[0];
  let bestDist = Infinity;
  for (const p of SIZE_PRESETS) {
    const d = Math.abs(p.w - c.w) + Math.abs(p.h - c.h);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

export function nearestPresetFrom(w: number, h: number, from: SizePreset[]): SizePreset {
  const pool = from.length > 0 ? from : SIZE_PRESETS;
  const c = clampSize(w, h);
  let best = pool[0];
  let bestDist = Infinity;
  for (const p of pool) {
    const d = Math.abs(p.w - c.w) + Math.abs(p.h - c.h);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}
