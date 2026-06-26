import type { Category, WidgetLayout } from '@/lib/grid/types';

export function seedWidgets(): WidgetLayout[] {
  // Derived from user's horizontal layout (inverse transpose: vx=hy, vy=hx, vw=hh, vh=hw).
  // In autoPack mode only order + size matter; in pushCompact, x is preserved.
  const defs: Array<[Category, string, number, number, number, number]> = [
    ['finance',   'budget-summary',   2, 4, 0,  0],
    ['lifestyle', 'weather',          1, 2, 2,  0],
    ['health',    'steps',            1, 2, 3,  0],
    ['calendar',  'mini-calendar',    1, 1, 2,  2],
    ['calendar',  'upcoming-events',  1, 1, 3,  2],
    ['calendar',  'todays-schedule',  2, 2, 2,  3],
    ['health',    'activity-rings',   2, 2, 0,  4],
    ['health',    'calorie-tracker',  1, 2, 2,  5],
    ['lifestyle', 'habit-tracker',    2, 3, 0,  6],
    ['lifestyle', 'daily-note',       2, 3, 2,  7],
    ['calendar',  'mini-calendar',    2, 2, 0,  9],
    ['calendar',  'upcoming-events',  2, 2, 2, 10],
    ['health',    'steps',            2, 3, 0, 11],
    ['lifestyle', 'weather',          1, 1, 3,  5],
    ['health',    'calorie-tracker',  1, 2, 2, 12],
    ['lifestyle', 'daily-note',       1, 1, 3,  6],
    ['finance',   'budget-summary',   2, 2, 0, 14],
    ['lifestyle', 'habit-tracker',    1, 1, 3, 12],
    ['health',    'activity-rings',   1, 1, 3, 13],
  ];
  return defs.map(([category, widgetType, w, h, x, y], i) => ({
    id: `seed-${i}`,
    x,
    y,
    w,
    h,
    category,
    widgetType,
    order: i,
  }));
}