import type { WidgetLayout } from './types';

export function applySwap(layout: WidgetLayout[], id: string, targetId: string): WidgetLayout[] {
  const a = layout.find((w) => w.id === id)!;
  const b = layout.find((w) => w.id === targetId)!;
  return layout.map((w) =>
    w.id === id       ? { ...w, x: b.x, y: b.y } :
    w.id === targetId ? { ...w, x: a.x, y: a.y } : w,
  );
}
