import type { Category, WidgetLayout } from '@/lib/grid/types';

// x,y positions are designed for pushCompact (compactVertical preserves x, compacts upward).
// Resulting layout on a 6-column grid:
//   Row 0-1: [finance 4×2][calendar 2×3]
//   Row 2-3: [lifestyle 3×2][finance/health 1×1][calendar/lifestyle]
//   Row 4-5: [finance 2×2][calendar 1×2][health widgets][lifestyle 2×2]
export function seedWidgets(): WidgetLayout[] {
  const defs: Array<[Category, number, number, number, number]> = [
    ['finance',   2, 2, 0, 4],
    ['calendar',  2, 3, 4, 0],
    ['health',    1, 1, 3, 3],
    ['lifestyle', 3, 2, 0, 2],
    ['finance',   1, 1, 3, 2],
    ['health',    2, 1, 3, 5],
    ['calendar',  1, 2, 2, 4],
    ['lifestyle', 2, 2, 4, 3],
    ['finance',   4, 2, 0, 0],
    ['health',    1, 1, 3, 4],
  ];
  return defs.map(([category, w, h, x, y], i) => ({
    id: `seed-${i}`,
    x,
    y,
    w,
    h,
    category,
    order: i,
  }));
}
