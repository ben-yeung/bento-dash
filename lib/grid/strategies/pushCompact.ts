import { COLS, MAX_H, type LayoutStrategy, type Move, type WidgetLayout } from '../types';
import { clampSize } from '../sizes';
import { createGrid, fits, occupy } from '../occupancy';
import { applySwap } from '../swap';

export function compactVertical(widgets: WidgetLayout[], cols = COLS, maxH = MAX_H): WidgetLayout[] {
  const sorted = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x);
  const grid = createGrid();
  const placed: WidgetLayout[] = [];
  for (const wdg of sorted) {
    const { w, h } = clampSize(wdg.w, wdg.h, cols, maxH);
    const x = Math.max(0, Math.min(cols - w, wdg.x));
    let y = Math.max(0, wdg.y);
    while (!fits(grid, x, y, w, h, cols)) y++;
    while (y > 0 && fits(grid, x, y - 1, w, h, cols)) y--;
    occupy(grid, x, y, w, h);
    placed.push({ ...wdg, x, y, w, h });
  }
  return placed
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((wdg, i) => ({ ...wdg, order: i }));
}

export function pushCompactDrag(
  widgets: WidgetLayout[],
  id: string,
  targetCell: { x: number; y: number },
  cols = COLS,
  maxH = MAX_H,
): WidgetLayout[] {
  const moving = widgets.find((w) => w.id === id);
  if (!moving) return widgets;
  const { w, h } = clampSize(moving.w, moving.h, cols, maxH);
  const mx = Math.max(0, Math.min(cols - w, targetCell.x));
  const my = Math.max(0, targetCell.y);
  const grid = createGrid();
  occupy(grid, mx, my, w, h);
  const placed: WidgetLayout[] = [{ ...moving, x: mx, y: my, w, h }];
  const others = widgets
    .filter((o) => o.id !== id)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const o of others) {
    const oc = clampSize(o.w, o.h, cols, maxH);
    const x = Math.max(0, Math.min(cols - oc.w, o.x));
    let y = 0;
    while (!fits(grid, x, y, oc.w, oc.h, cols)) y++;
    occupy(grid, x, y, oc.w, oc.h);
    placed.push({ ...o, x, y, w: oc.w, h: oc.h });
  }
  return placed
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((wdg, i) => ({ ...wdg, order: i }));
}

export function createPushCompact(cols = COLS, maxH = MAX_H): LayoutStrategy {
  return {
    resolve(widgets) {
      return compactVertical(widgets, cols, maxH);
    },
    preview(widgets, move: Move) {
      switch (move.kind) {
        case 'drag':
          return pushCompactDrag(widgets, move.id, move.targetCell, cols, maxH);
        case 'resize':
          return compactVertical(
            widgets.map((w) => (w.id === move.id ? { ...w, ...clampSize(move.w, move.h, cols, maxH) } : w)),
            cols, maxH,
          );
        case 'add':
          return compactVertical([...widgets, move.widget], cols, maxH);
        case 'remove':
          return compactVertical(widgets.filter((w) => w.id !== move.id), cols, maxH);
        case 'swap':
          return applySwap(widgets, move.id, move.targetId);
      }
    },
  };
}

export const pushCompact: LayoutStrategy = createPushCompact();
