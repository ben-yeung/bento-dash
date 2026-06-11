import type { Category, WidgetLayout } from '@/lib/grid/types';

export function seedWidgets(): WidgetLayout[] {
  const defs: Array<[Category, string, number, number, number, number]> = [
    ['finance',   'budget-summary',   2, 2, 0, 4],
    ['calendar',  'todays-schedule',  2, 3, 4, 0],
    ['health',    'activity-rings',   1, 1, 3, 3],
    ['lifestyle', 'habit-tracker',    3, 2, 0, 2],
    ['finance',   'budget-summary',   1, 1, 3, 2],
    ['health',    'activity-rings',   2, 1, 3, 5],
    ['calendar',  'todays-schedule',  1, 2, 2, 4],
    ['lifestyle', 'habit-tracker',    2, 2, 4, 3],
    ['finance',   'budget-summary',   4, 2, 0, 0],
    ['health',    'steps',            1, 1, 3, 4],
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
