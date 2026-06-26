import { describe, it, expect } from 'vitest';
import { getStrategy, clampLayout, type LayoutMode } from './engine';
import { autoPack } from './strategies/autoPack';
import { pushCompact } from './strategies/pushCompact';
import type { WidgetLayout, Category } from './types';

const wdg = (id: string, x: number, y: number, w: number, h: number, order: number): WidgetLayout => ({
  id, x, y, w, h, category: 'finance', order,
});

describe('engine', () => {
  it('returns autoPack by default and for the autoPack mode', () => {
    expect(getStrategy('autoPack')).toBe(autoPack);
  });
  it('returns pushCompact for the pushCompact mode', () => {
    expect(getStrategy('pushCompact')).toBe(pushCompact);
  });
  it('is typed to the two known modes', () => {
    const modes: LayoutMode[] = ['autoPack', 'pushCompact'];
    expect(modes).toHaveLength(2);
  });

  describe('horizontal autoPack', () => {
    it('packs column-major within rows=3', () => {
      // 3 rows, place three 1×1 widgets in order
      const strat = getStrategy('autoPack', 'horizontal', 3);
      const widgets = [
        wdg('a', 0, 0, 1, 1, 0),
        wdg('b', 0, 0, 1, 1, 1),
        wdg('c', 0, 0, 1, 1, 2),
      ];
      const out = strat.resolve(widgets);
      // Column-major: a=(0,0), b=(0,1), c=(0,2) — fills column 0 top-to-bottom
      expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
      expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
      expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 2 });
    });

    it('advances to next column when rows are full', () => {
      const strat = getStrategy('autoPack', 'horizontal', 2);
      const widgets = [
        wdg('a', 0, 0, 1, 1, 0),
        wdg('b', 0, 0, 1, 1, 1),
        wdg('c', 0, 0, 1, 1, 2),
      ];
      const out = strat.resolve(widgets);
      // rows=2: a=(0,0), b=(0,1), c overflows to column 1 => (1,0)
      expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 1, y: 0 });
    });

    it('clamps widget h to rows at resolve time (does not mutate store)', () => {
      const strat = getStrategy('autoPack', 'horizontal', 2);
      const widgets = [wdg('a', 0, 0, 2, 4, 0)]; // h=4 exceeds rows=2
      const out = strat.resolve(widgets);
      expect(out.find((w) => w.id === 'a')!.h).toBe(2);
    });
  });

  describe('horizontal pushCompact', () => {
    it('compacts leftward within rows', () => {
      const strat = getStrategy('pushCompact', 'horizontal', 3);
      const widgets = [
        wdg('a', 5, 0, 1, 1, 0),
        wdg('b', 5, 1, 1, 1, 1),
      ];
      const out = strat.resolve(widgets);
      // Both should compact to column 0 (left-gravity)
      expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
      expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
    });
  });
});

describe('clampLayout', () => {
  const make = (id: string, w: number, order: number): WidgetLayout => ({
    id, x: 0, y: 0, w, h: 1, category: 'health' as Category, order,
  });

  it('clamps all widget widths to col count', () => {
    const widgets = [make('a', 6, 0), make('b', 4, 1), make('c', 1, 2)];
    const result = clampLayout(widgets, 2, 'autoPack');
    expect(result.every((w) => w.w <= 2)).toBe(true);
  });

  it('repacks so no widget exceeds col bounds', () => {
    const widgets = [make('a', 3, 0), make('b', 3, 1)];
    const result = clampLayout(widgets, 2, 'autoPack');
    for (const w of result) {
      expect(w.x + w.w).toBeLessThanOrEqual(2);
    }
  });

  it('returns layout unchanged when cols >= all widget widths', () => {
    const widgets = [make('a', 2, 0)];
    const result = clampLayout(widgets, 6, 'autoPack');
    expect(result[0].w).toBe(2);
  });

  it('preserves widget height when clamping width', () => {
    const widgets: WidgetLayout[] = [
      { id: 'a', x: 0, y: 0, w: 2, h: 3, category: 'health' as Category, order: 0 },
    ];
    const result = clampLayout(widgets, 2, 'autoPack');
    expect(result[0].h).toBe(3);
  });
});
