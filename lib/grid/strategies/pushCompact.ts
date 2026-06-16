import { COLS, type LayoutStrategy, type Move, type WidgetLayout } from '../types';
import { clampSize } from '../sizes';
import { createGrid, fits, occupy } from '../occupancy';
import { applySwap } from '../swap';

export function compactVertical(widgets: WidgetLayout[], cols = COLS): WidgetLayout[] {
  const sorted = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x);
  const grid = createGrid();
  const placed: WidgetLayout[] = [];
  for (const wdg of sorted) {
    const { w, h } = clampSize(wdg.w, wdg.h);
    const x = Math.max(0, Math.min(cols - w, wdg.x));
    let y = Math.max(0, wdg.y);
    while (!fits(grid, x, y, w, h, cols)) y++;
    while (y > 0 && fits(grid, x, y - 1, w, h, cols)) y--;
    occupy(grid, x, y, w, h);
    placed.push({ ...wdg, x, y, w, h });
  }
  // Canonicalize order by visual reading position so autoPack can repack
  // correctly when the user switches layout modes without gaps/holes.
  return placed
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((wdg, i) => ({ ...wdg, order: i }));
}

function pushCompactDrag(
  widgets: WidgetLayout[],
  id: string,
  targetCell: { x: number; y: number },
  cols = COLS,
): WidgetLayout[] {
  const moving = widgets.find((w) => w.id === id);
  if (!moving) return widgets;
  const { w, h } = clampSize(moving.w, moving.h);
  const mx = Math.max(0, Math.min(cols - w, targetCell.x));
  const my = Math.max(0, targetCell.y);
  const grid = createGrid();
  occupy(grid, mx, my, w, h);
  const placed: WidgetLayout[] = [{ ...moving, x: mx, y: my, w, h }];
  const others = widgets
    .filter((o) => o.id !== id)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const o of others) {
    const oc = clampSize(o.w, o.h);
    const x = Math.max(0, Math.min(cols - oc.w, o.x));
    let y = 0;
    while (!fits(grid, x, y, oc.w, oc.h, cols)) y++;
    occupy(grid, x, y, oc.w, oc.h);
    placed.push({ ...o, x, y, w: oc.w, h: oc.h });
  }
  // Canonicalize order by visual reading position for consistent mode-switching.
  return placed
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((wdg, i) => ({ ...wdg, order: i }));
}

export const pushCompact: LayoutStrategy = {
  resolve(widgets) {
    return compactVertical(widgets);
  },
  preview(widgets, move: Move) {
    switch (move.kind) {
      case 'drag':
        return pushCompactDrag(widgets, move.id, move.targetCell);
      case 'resize':
        return compactVertical(
          widgets.map((w) => (w.id === move.id ? { ...w, ...clampSize(move.w, move.h) } : w)),
        );
      case 'add':
        return compactVertical([...widgets, move.widget]);
      case 'remove':
        return compactVertical(widgets.filter((w) => w.id !== move.id));
      case 'swap':
        return applySwap(widgets, move.id, move.targetId);
    }
  },
};
