import { describe, it, expect } from 'vitest';
import { applySwap } from './swap';
import type { WidgetLayout } from './types';

const w = (id: string, x: number, y: number, ww: number, h: number): WidgetLayout => ({
  id, x, y, w: ww, h, category: 'finance', order: 0,
});

describe('applySwap', () => {
  it('exchanges x,y coordinates between two widgets', () => {
    const layout = [w('a', 0, 0, 2, 1), w('b', 2, 0, 2, 1)];
    const result = applySwap(layout, 'a', 'b');
    expect(result.find(x => x.id === 'a')).toMatchObject({ x: 2, y: 0 });
    expect(result.find(x => x.id === 'b')).toMatchObject({ x: 0, y: 0 });
  });

  it('leaves all other widgets unchanged', () => {
    const layout = [w('a', 0, 0, 1, 1), w('b', 1, 0, 1, 1), w('c', 2, 0, 1, 1)];
    const result = applySwap(layout, 'a', 'b');
    expect(result.find(x => x.id === 'c')).toMatchObject({ x: 2, y: 0 });
  });

  it('preserves w, h, category, and order fields of both widgets', () => {
    const layout = [
      { id: 'a', x: 0, y: 0, w: 2, h: 2, category: 'finance' as const, order: 3 },
      { id: 'b', x: 2, y: 0, w: 2, h: 2, category: 'health' as const, order: 7 },
    ];
    const result = applySwap(layout, 'a', 'b');
    expect(result.find(x => x.id === 'a')).toMatchObject({ w: 2, h: 2, category: 'finance', order: 3 });
    expect(result.find(x => x.id === 'b')).toMatchObject({ w: 2, h: 2, category: 'health', order: 7 });
  });

  it('returns a new array (does not mutate input)', () => {
    const layout = [w('a', 0, 0, 1, 1), w('b', 1, 0, 1, 1)];
    const result = applySwap(layout, 'a', 'b');
    expect(result).not.toBe(layout);
    expect(layout[0].x).toBe(0); // original unchanged
  });
});
