import { COLS, type LayoutStrategy, type Move, type WidgetLayout } from '../types';
import { clampSize } from '../sizes';
import { createGrid, fits, occupy } from '../occupancy';

export function packDense(widgets: WidgetLayout[], cols = COLS): WidgetLayout[] {
  const sorted = [...widgets].sort((a, b) => a.order - b.order);
  const grid = createGrid();
  const result: WidgetLayout[] = [];
  for (const wdg of sorted) {
    const { w, h } = clampSize(wdg.w, wdg.h);
    let placed = false;
    for (let y = 0; !placed; y++) {
      for (let x = 0; x + w <= cols; x++) {
        if (fits(grid, x, y, w, h, cols)) {
          occupy(grid, x, y, w, h);
          result.push({ ...wdg, x, y, w, h });
          placed = true;
          break;
        }
      }
    }
  }
  return result.map((wdg, i) => ({ ...wdg, order: i }));
}

export function reorderByCell(
  widgets: WidgetLayout[],
  id: string,
  targetCell: { x: number; y: number },
  cols = COLS,
): WidgetLayout[] {
  const moving = widgets.find((w) => w.id === id);
  if (!moving) return widgets;
  const others = widgets.filter((w) => w.id !== id).sort((a, b) => a.order - b.order);
  const targetRank = targetCell.y * cols + targetCell.x;
  let insertIdx = others.length;
  for (let i = 0; i < others.length; i++) {
    const rank = others[i].y * cols + others[i].x;
    if (rank >= targetRank) {
      insertIdx = i;
      break;
    }
  }
  const list = [...others];
  list.splice(insertIdx, 0, moving);
  return list.map((w, i) => ({ ...w, order: i }));
}

export const autoPack: LayoutStrategy = {
  resolve(widgets) {
    return packDense(widgets);
  },
  preview(widgets, move: Move) {
    switch (move.kind) {
      case 'drag':
        return packDense(reorderByCell(widgets, move.id, move.targetCell));
      case 'resize':
        return packDense(
          widgets.map((w) => (w.id === move.id ? { ...w, ...clampSize(move.w, move.h) } : w)),
        );
      case 'add':
        // Force the new widget to sort last so it appends to the end, regardless
        // of the order the caller assigned (packDense re-canonicalizes afterward).
        return packDense([...widgets, { ...move.widget, order: widgets.length }]);
      case 'remove':
        return packDense(widgets.filter((w) => w.id !== move.id));
    }
  },
};
