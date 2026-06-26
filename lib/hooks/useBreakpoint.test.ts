import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreakpoint } from './useBreakpoint';

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

describe('useBreakpoint', () => {
  afterEach(() => setWidth(1280));

  it('returns desktop for 1280px', () => {
    setWidth(1280);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toEqual({ breakpoint: 'desktop', cols: 6, isMobile: false });
  });

  it('returns tablet for 768px', () => {
    setWidth(768);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toEqual({ breakpoint: 'tablet', cols: 4, isMobile: true });
  });

  it('returns phone for 375px', () => {
    setWidth(375);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toEqual({ breakpoint: 'phone', cols: 2, isMobile: true });
  });

  it('updates on window resize', () => {
    setWidth(1280);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.breakpoint).toBe('desktop');
    act(() => setWidth(375));
    expect(result.current.breakpoint).toBe('phone');
  });
});
