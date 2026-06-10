'use client';
import { useEffect, useState, type RefObject } from 'react';
import { COLS, GRID_GAP } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';

export function useGridMetrics(ref: RefObject<HTMLElement | null>): GridMetrics {
  const [metrics, setMetrics] = useState<GridMetrics>({ cellSize: 100, gap: GRID_GAP, cols: COLS });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      const cellSize = (width - (COLS - 1) * GRID_GAP) / COLS;
      setMetrics({ cellSize, gap: GRID_GAP, cols: COLS });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return metrics;
}
