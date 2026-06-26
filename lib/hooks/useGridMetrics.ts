'use client';
import { useEffect, useState, type RefObject } from 'react';
import { COLS, GRID_GAP, type LayoutOrientation } from '@/lib/grid/types';
import { TARGET_CELL_SIZE, MIN_ROWS } from '@/lib/grid/sizes';
import type { GridMetrics } from '@/lib/grid/collision';

export function useGridMetrics(
  boardRef: RefObject<HTMLElement | null>,
  scrollRef: RefObject<HTMLElement | null>,
  orientation: LayoutOrientation,
  hydrated = true,
  cols = COLS,
): GridMetrics {
  const [metrics, setMetrics] = useState<GridMetrics>({
    cellSize: 100,
    gap: GRID_GAP,
    cols,
    rows: 'auto',
  });

  useEffect(() => {
    if (!hydrated) return;
    if (orientation === 'horizontal') {
      const el = scrollRef.current;
      if (!el) return;
      const update = () => {
        const availableHeight = el.clientHeight - 16;
        const rowCount = Math.max(MIN_ROWS, Math.floor(availableHeight / (TARGET_CELL_SIZE + GRID_GAP)));
        const cellSize = (availableHeight - (rowCount - 1) * GRID_GAP) / rowCount;
        setMetrics({ cellSize, gap: GRID_GAP, cols: COLS, rows: rowCount });
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    } else {
      const el = boardRef.current;
      if (!el) return;
      const update = () => {
        const width = el.clientWidth;
        const cellSize = (width - (cols - 1) * GRID_GAP) / cols;
        setMetrics({ cellSize, gap: GRID_GAP, cols, rows: 'auto' });
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [boardRef, scrollRef, orientation, hydrated, cols]);

  return metrics;
}
