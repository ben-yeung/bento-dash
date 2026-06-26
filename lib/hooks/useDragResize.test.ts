import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragResize } from './useDragResize';
import type { GridMetrics } from '@/lib/grid/collision';

const metrics: GridMetrics = { cellSize: 100, gap: 12, cols: 6, rows: 'auto' }; // stride = 112 px

function makePointer(x: number, y: number, pointerId = 1): React.PointerEvent {
  return {
    clientX: x,
    clientY: y,
    pointerId,
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
    target: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
  } as unknown as React.PointerEvent;
}

describe('useDragResize', () => {
  let onPreview: ReturnType<typeof vi.fn>;
  let onIndicator: ReturnType<typeof vi.fn>;
  let onCommit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onPreview = vi.fn();
    onIndicator = vi.fn();
    onCommit = vi.fn();
  });

  it('calls onPreview at each cell boundary, not just preset boundaries', () => {
    const { result } = renderHook(() =>
      useDragResize({ startW: 2, startH: 2, metrics, onPreview, onIndicator, onCommit }),
    );
    act(() => result.current.onPointerDown(makePointer(0, 0)));
    // drag one cell right: raw = 3×2 (a preset — but preview fires at every cell, not just presets)
    act(() => result.current.onPointerMove(makePointer(112, 0)));
    expect(onPreview).toHaveBeenCalledWith(3, 2);
    // drag another cell right: raw = 4×2 (a preset: 4×2 exists)
    act(() => result.current.onPointerMove(makePointer(224, 0)));
    expect(onPreview).toHaveBeenCalledWith(4, 2);
    expect(onPreview).toHaveBeenCalledTimes(2);
  });

  it('does not call onPreview when raw cell position is unchanged', () => {
    const { result } = renderHook(() =>
      useDragResize({ startW: 2, startH: 2, metrics, onPreview, onIndicator, onCommit }),
    );
    act(() => result.current.onPointerDown(makePointer(0, 0)));
    act(() => result.current.onPointerMove(makePointer(50, 0)));  // < 56 px threshold, still col 2
    act(() => result.current.onPointerMove(makePointer(55, 0)));  // still col 2
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('calls onIndicator only when nearest preset changes', () => {
    const { result } = renderHook(() =>
      useDragResize({ startW: 2, startH: 2, metrics, onPreview, onIndicator, onCommit }),
    );
    act(() => result.current.onPointerDown(makePointer(0, 0)));
    // raw 3×2: nearestPreset(3,2) = '3×2'
    act(() => result.current.onPointerMove(makePointer(112, 0)));
    expect(onIndicator).toHaveBeenCalledTimes(1);
    expect(onIndicator).toHaveBeenCalledWith(expect.objectContaining({ w: 3, h: 2 }));
    // raw 3×2 again (no change): indicator should not fire again
    act(() => result.current.onPointerMove(makePointer(120, 0)));
    expect(onIndicator).toHaveBeenCalledTimes(1);
  });

  it('commits the nearest preset on pointer up', () => {
    const { result } = renderHook(() =>
      useDragResize({ startW: 2, startH: 2, metrics, onPreview, onIndicator, onCommit }),
    );
    act(() => result.current.onPointerDown(makePointer(0, 0)));
    // drag to raw 3×2 — nearestPreset(3,2) = { w:3, h:2, name:'3×2' }
    act(() => result.current.onPointerMove(makePointer(112, 0)));
    act(() => result.current.onPointerUp(makePointer(112, 0)));
    expect(onCommit).toHaveBeenCalledWith(3, 2);
  });

  it('commits startW/startH preset if pointer never moved', () => {
    const { result } = renderHook(() =>
      useDragResize({ startW: 2, startH: 2, metrics, onPreview, onIndicator, onCommit }),
    );
    act(() => result.current.onPointerDown(makePointer(0, 0)));
    act(() => result.current.onPointerUp(makePointer(0, 0)));
    // nearestPreset(2,2) = { w:2, h:2 }
    expect(onCommit).toHaveBeenCalledWith(2, 2);
  });
});
