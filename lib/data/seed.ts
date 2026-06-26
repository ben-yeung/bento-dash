import type { Category, WidgetLayout } from '@/lib/grid/types';

export function seedWidgets(): WidgetLayout[] {
  const defs: Array<[Category, string, number, number, number, number]> = [
    // — Section 1: original sizes (rows 0–5) —
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

    // — Section 2: alternative sizes (rows 6–10) —
    // Row 6-7: three 2×2 (2+2+2 = 6)
    ['finance',   'budget-summary',   2, 2, 0, 6],
    ['health',    'steps',            2, 2, 2, 6],
    ['calendar',  'mini-calendar',    2, 2, 4, 6],
    // Row 8-9: three 2×2 (2+2+2 = 6)
    ['calendar',  'upcoming-events',  2, 2, 0, 8],
    ['health',    'calorie-tracker',  2, 2, 2, 8],
    ['lifestyle', 'daily-note',       2, 2, 4, 8],
    // Row 10: two 2×1 + two 1×1 (2+2+1+1 = 6)
    ['calendar',  'todays-schedule',  2, 1, 0, 10],
    ['lifestyle', 'habit-tracker',    2, 1, 2, 10],
    ['lifestyle', 'weather',          1, 1, 4, 10],
    ['health',    'activity-rings',   1, 1, 5, 10],
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
