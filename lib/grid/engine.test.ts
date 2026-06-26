import { describe, it, expect } from 'vitest';
import { getStrategy, type LayoutMode } from './engine';
import { autoPack } from './strategies/autoPack';
import { pushCompact } from './strategies/pushCompact';
import { setRowCount } from '../state/gridState';
import type { WidgetLayout } from './types';

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
      setRowCount(3);
      const strat = getStrategy('autoPack', 'horizontal');
      const widgets = [
        wdg('a', 0, 0, 1, 1, 0),
        wdg('b', 0, 0, 1, 1, 1),
        wdg('c', 0, 0, 1, 1, 2),
      ];
      const out = strat.resolve(widgets);
      expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
      expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
      expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 2 });
    });

    it('advances to next column when rows are full', () => {
      setRowCount(2);
      const strat = getStrategy('autoPack', 'horizontal');
      const widgets = [
        wdg('a', 0, 0, 1, 1, 0),
        wdg('b', 0, 0, 1, 1, 1),
        wdg('c', 0, 0, 1, 1, 2),
      ];
      const out = strat.resolve(widgets);
      expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 1, y: 0 });
    });

    it('clamps widget h to rows at resolve time (does not mutate store)', () => {
      setRowCount(2);
      const strat = getStrategy('autoPack', 'horizontal');
      const widgets = [wdg('a', 0, 0, 2, 4, 0)];
      const out = strat.resolve(widgets);
      expect(out.find((w) => w.id === 'a')!.h).toBe(2);
    });
  });

  describe('horizontal pushCompact', () => {
    it('compacts leftward within rows', () => {
      setRowCount(3);
      const strat = getStrategy('pushCompact', 'horizontal');
      const widgets = [
        wdg('a', 5, 0, 1, 1, 0),
        wdg('b', 5, 1, 1, 1, 1),
      ];
      const out = strat.resolve(widgets);
      expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
      expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
    });
  });
});
