'use client';
import { useRef, useCallback } from 'react';

export function useLongPress(
  onLongPress: (() => void) | undefined,
  threshold = 500,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!onLongPress) return;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPosRef.current || timerRef.current === null) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.hypot(dx, dy) > 8) cancel();
  }, [cancel]);

  const onPointerUp = useCallback((_e: React.PointerEvent) => cancel(), [cancel]);
  const onPointerCancel = useCallback((_e: React.PointerEvent) => cancel(), [cancel]);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
