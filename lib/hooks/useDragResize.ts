'use client';
import { useCallback, useRef } from 'react';
import type { GridMetrics } from '@/lib/grid/collision';
import { clampSize, nearestPreset, type SizePreset } from '@/lib/grid/sizes';

interface UseDragResizeArgs {
  startW: number;
  startH: number;
  metrics: GridMetrics;
  onPreview: (w: number, h: number) => void;
  onIndicator: (preset: SizePreset) => void;
  onCommit: (w: number, h: number) => void;
}

export function useDragResize({ startW, startH, metrics, onPreview, onIndicator, onCommit }: UseDragResizeArgs) {
  const origin = useRef<{ px: number; py: number; w: number; h: number } | null>(null);
  const latestRaw  = useRef<{ w: number; h: number }>({ w: startW, h: startH });
  const latestSnap = useRef<SizePreset>(nearestPreset(startW, startH));

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
      const raw = clampSize(origin.current.w + dw, origin.current.h + dh);
      if (raw.w !== latestRaw.current.w || raw.h !== latestRaw.current.h) {
        latestRaw.current = raw;
        onPreview(raw.w, raw.h);
      }
      const snap = nearestPreset(raw.w, raw.h);
      if (snap.w !== latestSnap.current.w || snap.h !== latestSnap.current.h) {
        latestSnap.current = snap;
        onIndicator(snap);
      }
    },
    [metrics, onPreview, onIndicator],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!origin.current) return;
      (e.target as Element).releasePointerCapture(e.pointerId);
      origin.current = null;
      onCommit(latestSnap.current.w, latestSnap.current.h);
    },
    [onCommit],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}
