import type { Category, WidgetLayout } from '@/lib/grid/types';

export function seedWidgets(): WidgetLayout[] {
  const defs: Array<[Category, number, number]> = [
    ['finance', 2, 2],
    ['calendar', 2, 3],
    ['health', 1, 1],
    ['lifestyle', 3, 2],
    ['finance', 1, 1],
    ['health', 2, 1],
    ['calendar', 1, 2],
    ['lifestyle', 2, 2],
    ['finance', 4, 2],
    ['health', 1, 1],
  ];
  return defs.map(([category, w, h], i) => ({
    id: `seed-${i}`,
    x: 0,
    y: 0,
    w,
    h,
    category,
    order: i,
  }));
}
