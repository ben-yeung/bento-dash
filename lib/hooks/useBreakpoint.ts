'use client';
import { useState, useEffect } from 'react';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export interface BreakpointInfo {
  breakpoint: Breakpoint;
  cols: 2 | 4 | 6;
  isMobile: boolean;
}

function getBreakpoint(width: number): BreakpointInfo {
  if (width <= 480) return { breakpoint: 'phone', cols: 2, isMobile: true };
  if (width <= 768) return { breakpoint: 'tablet', cols: 4, isMobile: true };
  return { breakpoint: 'desktop', cols: 6, isMobile: false };
}

export function useBreakpoint(): BreakpointInfo {
  const [info, setInfo] = useState<BreakpointInfo>(() =>
    typeof window !== 'undefined'
      ? getBreakpoint(window.innerWidth)
      : { breakpoint: 'desktop', cols: 6, isMobile: false }
  );

  useEffect(() => {
    const update = () => setInfo(getBreakpoint(window.innerWidth));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return info;
}
