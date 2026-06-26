import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLongPress } from './useLongPress';

function makePointerEvent(x = 0, y = 0): React.PointerEvent {
  return { clientX: x, clientY: y } as React.PointerEvent;
}

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires callback after default 500ms threshold', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    act(() => {
      result.current.onPointerDown(makePointerEvent(0, 0));
    });

    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onLongPress).toHaveBeenCalledOnce();
  });

  it('does not fire if pointer moves more than 8px before threshold', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    act(() => {
      result.current.onPointerDown(makePointerEvent(0, 0));
      result.current.onPointerMove(makePointerEvent(0, 9)); // 9px > 8px threshold
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('does not cancel if pointer moves 8px or less', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    act(() => {
      result.current.onPointerDown(makePointerEvent(0, 0));
      result.current.onPointerMove(makePointerEvent(4, 4)); // ~5.6px ≤ 8px — stays active
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledOnce();
  });

  it('does not fire if onLongPress is undefined', () => {
    const { result } = renderHook(() => useLongPress(undefined));

    // Should not throw
    act(() => {
      result.current.onPointerDown(makePointerEvent(0, 0));
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // no error, nothing to assert beyond not throwing
  });

  it('cancels on onPointerUp before threshold', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    act(() => {
      result.current.onPointerDown(makePointerEvent(0, 0));
      result.current.onPointerUp(makePointerEvent(0, 0));
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('cancels on onPointerCancel', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress));

    act(() => {
      result.current.onPointerDown(makePointerEvent(0, 0));
      result.current.onPointerCancel(makePointerEvent(0, 0));
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('respects a custom threshold', () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress, 800));

    act(() => {
      result.current.onPointerDown(makePointerEvent(0, 0));
    });

    act(() => {
      vi.advanceTimersByTime(799);
    });
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onLongPress).toHaveBeenCalledOnce();
  });
});
