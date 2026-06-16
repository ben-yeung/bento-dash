'use client';
import { useCallback, useRef } from 'react';
import type { GridMetrics } from '@/lib/grid/collision';
import { clampSize, nearestPreset, nearestPresetFrom, type SizePreset } from '@/lib/grid/sizes';

interface UseDragResizeArgs {
  startW: number;
  startH: number;
  metrics: GridMetrics;
  supportedSizes?: SizePreset[];
  onPreview: (w: number, h: number) => void;
  onIndicator: (preset: SizePreset) => void;
  onCommit: (w: number, h: number) => void;
}

export function useDragResize({ startW, startH, metrics, supportedSizes, onPreview, onIndicator, onCommit }: UseDragResizeArgs) {
  const origin = useRef<{ px: number; py: number; w: number; h: number } | null>(null);
  const latestRaw  = useRef<{ w: number; h: number }>({ w: startW, h: startH });
  const latestSnap = useRef<SizePreset>(
    supportedSizes?.length ? nearestPresetFrom(startW, startH, supportedSizes) : nearestPreset(startW, startH)
  );

  // Always-current refs so pointer handlers call the latest callback version
  // without being in useCallback dep arrays. This keeps all four returned
  // handlers stable across renders (no re-creation when onPreview/onCommit
  // change), which prevents the widget tree from churning during resize.
  const onPreviewRef = useRef(onPreview);
  onPreviewRef.current = onPreview;
  const onIndicatorRef = useRef(onIndicator);
  onIndicatorRef.current = onIndicator;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // Snapshot the committed size at gesture start via ref so onPointerDown
  // is stable even when startW/startH change (e.g. during resize preview).
  const startSizeRef = useRef({ w: startW, h: startH });
  startSizeRef.current = { w: startW, h: startH };

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      origin.current = { px: e.clientX, py: e.clientY, ...startSizeRef.current };
    },
    [],
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
        onPreviewRef.current(raw.w, raw.h);
      }
      const snap = supportedSizes?.length
        ? nearestPresetFrom(raw.w, raw.h, supportedSizes)
        : nearestPreset(raw.w, raw.h);
      if (snap.w !== latestSnap.current.w || snap.h !== latestSnap.current.h) {
        latestSnap.current = snap;
        onIndicatorRef.current(snap);
      }
    },
    // Use individual metric fields rather than the object to avoid re-creating
    // this handler when useGridMetrics produces a new object with the same values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrics.cellSize, metrics.gap, supportedSizes],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!origin.current) return;
      (e.target as Element).releasePointerCapture(e.pointerId);
      origin.current = null;
      onCommitRef.current(latestSnap.current.w, latestSnap.current.h);
    },
    [],
  );

  // pointercancel fires when the browser forcibly ends the gesture (scroll
  // takeover, too many fingers, focus loss). Clears origin so the next
  // pointerdown starts clean. BentoBoard's global safety-net effect handles
  // clearing resizingId in cases where this event is never delivered.
  const onPointerCancel = useCallback(
    (_e: React.PointerEvent) => {
      origin.current = null;
    },
    [],
  );

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
