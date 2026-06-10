'use client';
import { useCallback, useRef } from 'react';
import type { GridMetrics } from '@/lib/grid/collision';
import { nearestPreset } from '@/lib/grid/sizes';

interface UseDragResizeArgs {
  startW: number;
  startH: number;
  metrics: GridMetrics;
  onPreview: (w: number, h: number) => void;
  onCommit: (w: number, h: number) => void;
}

export function useDragResize({ startW, startH, metrics, onPreview, onCommit }: UseDragResizeArgs) {
  const origin = useRef<{ px: number; py: number; w: number; h: number } | null>(null);
  const latest = useRef<{ w: number; h: number }>({ w: startW, h: startH });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      origin.current = { px: e.clientX, py: e.clientY, w: startW, h: startH };
    },
    [startW, startH],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!origin.current) return;
      const stride = metrics.cellSize + metrics.gap;
      const dw = Math.round((e.clientX - origin.current.px) / stride);
      const dh = Math.round((e.clientY - origin.current.py) / stride);
      const snapped = nearestPreset(origin.current.w + dw, origin.current.h + dh);
      if (snapped.w !== latest.current.w || snapped.h !== latest.current.h) {
        latest.current = { w: snapped.w, h: snapped.h };
        onPreview(snapped.w, snapped.h);
      }
    },
    [metrics, onPreview],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!origin.current) return;
      (e.target as Element).releasePointerCapture(e.pointerId);
      origin.current = null;
      onCommit(latest.current.w, latest.current.h);
    },
    [onCommit],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}
