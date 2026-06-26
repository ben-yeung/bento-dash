import { COLS, MAX_H, type LayoutStrategy, type Move, type WidgetLayout } from '../types';
import { clampSize } from '../sizes';
import { createGrid, fits, occupy, fitsH } from '../occupancy';
import { applySwap } from '../swap';

export function packDense(widgets: WidgetLayout[], cols = COLS, maxH = MAX_H): WidgetLayout[] {
  const sorted = [...widgets].sort((a, b) => a.order - b.order);
  const grid = createGrid();
  const result: WidgetLayout[] = [];
  for (const wdg of sorted) {
    const { w, h } = clampSize(wdg.w, wdg.h, cols, maxH);
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

export function createAutoPack(cols = COLS, maxH = MAX_H): LayoutStrategy {
  return {
    resolve(widgets) {
      return packDense(widgets, cols, maxH);
    },
    preview(widgets, move: Move) {
      switch (move.kind) {
        case 'drag':
          return packDense(reorderByCell(widgets, move.id, move.targetCell, cols), cols, maxH);
        case 'resize':
          return packDense(
            widgets.map((w) => (w.id === move.id ? { ...w, ...clampSize(move.w, move.h, cols, maxH) } : w)),
            cols, maxH,
          );
        case 'add':
          return packDense([...widgets, { ...move.widget, order: widgets.length }], cols, maxH);
        case 'remove':
          return packDense(widgets.filter((w) => w.id !== move.id), cols, maxH);
        case 'swap':
          return applySwap(widgets, move.id, move.targetId);
      }
    },
  };
}

export const autoPack: LayoutStrategy = createAutoPack();

export function packDenseH(widgets: WidgetLayout[], rows: number, maxW = LARGE): WidgetLayout[] {
  const sorted = [...widgets].sort((a, b) => a.order - b.order);
  const grid = createGrid();
  const result: WidgetLayout[] = [];
  for (const wdg of sorted) {
    const { w, h } = clampSize(wdg.w, wdg.h, maxW, rows);
    let placed = false;
    for (let x = 0; !placed; x++) {
      for (let y = 0; y + h <= rows; y++) {
        if (fitsH(grid, x, y, w, h, rows)) {
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

export function reorderByCellH(
  widgets: WidgetLayout[],
  id: string,
  targetCell: { x: number; y: number },
  rows: number,
): WidgetLayout[] {
  const moving = widgets.find((w) => w.id === id);
  if (!moving) return widgets;
  const others = widgets.filter((w) => w.id !== id).sort((a, b) => a.order - b.order);
  const targetRank = targetCell.x * rows + targetCell.y;
  let insertIdx = others.length;
  for (let i = 0; i < others.length; i++) {
    const rank = others[i].x * rows + others[i].y;
    if (rank >= targetRank) {
      insertIdx = i;
      break;
    }
  }
  const list = [...others];
  list.splice(insertIdx, 0, moving);
  return list.map((w, i) => ({ ...w, order: i }));
}

const LARGE = 9999;

export function createAutoPackH(rows: number, maxW = LARGE): LayoutStrategy {
  return {
    resolve(widgets) {
      return packDenseH(widgets, rows, maxW);
    },
    preview(widgets, move: Move) {
      switch (move.kind) {
        case 'drag':
          return packDenseH(reorderByCellH(widgets, move.id, move.targetCell, rows), rows, maxW);
        case 'resize':
          return packDenseH(
            widgets.map((w) => (w.id === move.id ? { ...w, ...clampSize(move.w, move.h, maxW, rows) } : w)),
            rows, maxW,
          );
        case 'add':
          return packDenseH([...widgets, { ...move.widget, order: widgets.length }], rows, maxW);
        case 'remove':
          return packDenseH(widgets.filter((w) => w.id !== move.id), rows, maxW);
        case 'swap':
          return applySwap(widgets, move.id, move.targetId);
      }
    },
  };
}
