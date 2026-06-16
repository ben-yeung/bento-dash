import type { WidgetLayout } from './types';

export function applySwap(layout: WidgetLayout[], id: string, targetId: string): WidgetLayout[] {
  const a = layout.find((w) => w.id === id)!;
  const b = layout.find((w) => w.id === targetId)!;
  // Swap both position and order so the reading sequence stays consistent
  // with visual layout. Without swapping order, the next packDense call
  // (autoPack drag/resolve) would undo the swap by re-placing by stale order.
  return layout.map((w) =>
    w.id === id       ? { ...w, x: b.x, y: b.y, order: b.order } :
    w.id === targetId ? { ...w, x: a.x, y: a.y, order: a.order } : w,
  );
}
