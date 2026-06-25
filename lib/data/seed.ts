import type { Category, WidgetLayout } from '@/lib/grid/types';

export function seedWidgets(): WidgetLayout[] {
  const defs: Array<[Category, string, number, number, number, number]> = [
    // Row 0-1: hero + stacked accent column (4+2 = 6)
    ['finance',   'budget-summary',   4, 2, 0, 0],
    ['lifestyle', 'weather',          2, 1, 4, 0],
    ['health',    'steps',            2, 1, 4, 1],
    // Row 2-3: small pair + schedule + activity (1+1+2+2 = 6)
    ['calendar',  'mini-calendar',    1, 1, 0, 2],
    ['calendar',  'upcoming-events',  1, 1, 1, 2],
    ['calendar',  'todays-schedule',  2, 2, 2, 2],
    ['health',    'activity-rings',   2, 2, 4, 2],
    // Row 3: calorie bar fills under small pair
    ['health',    'calorie-tracker',  2, 1, 0, 3],
    // Row 4-5: wide pair (3+3 = 6)
    ['lifestyle', 'habit-tracker',    3, 2, 0, 4],
    ['lifestyle', 'daily-note',       3, 2, 3, 4],
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
