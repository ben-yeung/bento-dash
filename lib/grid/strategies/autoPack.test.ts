import { describe, it, expect } from 'vitest';
import { autoPack, packDense, reorderByCell, createAutoPack, packDenseH, reorderByCellH, createAutoPackH } from './autoPack';
import type { WidgetLayout } from '../types';

const wdg = (id: string, w: number, h: number, order: number): WidgetLayout => ({
  id, x: 0, y: 0, w, h, category: 'finance', order,
});

const at = (id: string, x: number, y: number, w: number, h: number, order: number): WidgetLayout => ({
  id, x, y, w, h, category: 'finance', order,
});

describe('autoPack', () => {
  it('packs widgets densely top-left in order', () => {
    const out = packDense([wdg('a', 2, 1, 0), wdg('b', 2, 1, 1), wdg('c', 2, 1, 2)]);
    const a = out.find((w) => w.id === 'a')!;
    const c = out.find((w) => w.id === 'c')!;
    expect(a).toMatchObject({ x: 0, y: 0 });
    expect(c).toMatchObject({ x: 4, y: 0 });
  });

  it('backfills an earlier gap with a later smaller widget', () => {
    const out = packDense([wdg('a', 4, 1, 0), wdg('b', 3, 1, 1), wdg('c', 2, 1, 2)]);
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 4, y: 0 });
  });

  it('reorders by inserting before the widget nearest the target cell', () => {
    const resolved = packDense([wdg('a', 2, 1, 0), wdg('b', 2, 1, 1), wdg('c', 2, 1, 2)]);
    const reordered = reorderByCell(resolved, 'c', { x: 0, y: 0 });
    expect(reordered.find((w) => w.id === 'c')!.order).toBe(0);
  });

  it('preview(remove) heals the gap by repacking', () => {
    const start = packDense([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1), wdg('c', 1, 1, 2)]);
    const out = autoPack.preview(start, { kind: 'remove', id: 'b' });
    expect(out).toHaveLength(2);
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 1, y: 0 });
  });

  it('preview(resize) repacks around the new footprint', () => {
    const start = packDense([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1)]);
    const out = autoPack.preview(start, { kind: 'resize', id: 'a', w: 2, h: 2 });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0, w: 2, h: 2 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 2, y: 0 });
  });

  it('preview(swap) exchanges positions without repacking other widgets', () => {
    const layout: WidgetLayout[] = [
      { id: 'a', x: 0, y: 0, w: 2, h: 1, category: 'finance', order: 0 },
      { id: 'b', x: 2, y: 0, w: 2, h: 1, category: 'health', order: 1 },
      { id: 'c', x: 4, y: 0, w: 2, h: 1, category: 'lifestyle', order: 2 },
    ];
    const out = autoPack.preview(layout, { kind: 'swap', id: 'a', targetId: 'b' });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 2, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 4, y: 0 }); // untouched
  });

  it('createAutoPack with cols=4 packs within 4 columns', () => {
    const strat = createAutoPack(4, 999);
    const widgets = [wdg('a', 2, 1, 0), wdg('b', 2, 1, 1), wdg('c', 2, 1, 2)];
    const out = strat.resolve(widgets);
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 2, y: 0 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 1 });
  });
});

describe('autoPack horizontal', () => {
  it('packDenseH places left-first, filling a column before advancing right', () => {
    const out = packDenseH([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1), wdg('c', 1, 1, 2)], 3);
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 0, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 2 });
  });

  it('packDenseH overflows to next column when all rows in the current column are full', () => {
    const out = packDenseH([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1), wdg('c', 1, 1, 2)], 2);
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 1, y: 0 });
  });

  it('packDenseH clamps h to rows', () => {
    const out = packDenseH([wdg('a', 1, 4, 0)], 2);
    expect(out.find((w) => w.id === 'a')!.h).toBe(2);
  });

  it('reorderByCellH uses x-primary rank so moving to (0,0) puts widget first', () => {
    const widgets = [
      at('a', 0, 0, 1, 1, 0),
      at('b', 0, 1, 1, 1, 1),
      at('c', 1, 0, 1, 1, 2),
    ];
    const reordered = reorderByCellH(widgets, 'c', { x: 0, y: 0 }, 2);
    expect(reordered.find((w) => w.id === 'c')!.order).toBe(0);
  });

  it('createAutoPackH preview(drag) packs with left priority', () => {
    const strat = createAutoPackH(3);
    const resolved = strat.resolve([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1)]);
    const out = strat.preview(resolved, { kind: 'drag', id: 'b', targetCell: { x: 0, y: 0 } });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
  });

  it('createAutoPackH preview(remove) repacks remaining widgets left', () => {
    const strat = createAutoPackH(2);
    // resolve: a=(0,0), b=(0,1), c=(1,0) in a 2-row grid
    const start = strat.resolve([wdg('a', 1, 1, 0), wdg('b', 1, 1, 1), wdg('c', 1, 1, 2)]);
    const out = strat.preview(start, { kind: 'remove', id: 'b' });
    expect(out).toHaveLength(2);
    // c was at (1,0); after b removed, c shifts to fill (0,1) based on order
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 1 });
  });

  it('createAutoPackH preview(swap) exchanges positions without repacking', () => {
    const strat = createAutoPackH(4);
    const layout = [at('a', 0, 0, 2, 1, 0), at('b', 1, 0, 2, 1, 1)];
    const out = strat.preview(layout, { kind: 'swap', id: 'a', targetId: 'b' });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 1, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
  });
});
