import { describe, it, expect } from 'vitest';
import { pushCompact, compactVertical, createPushCompact, compactHorizontal, pushCompactDragH, createPushCompactH } from './pushCompact';
import type { WidgetLayout } from '../types';

const at = (id: string, x: number, y: number, w: number, h: number, order: number): WidgetLayout => ({
  id, x, y, w, h, category: 'finance', order,
});

describe('pushCompact', () => {
  it('pulls floating widgets upward, preserving their column', () => {
    const out = compactVertical([at('a', 0, 0, 1, 1, 0), at('b', 2, 5, 1, 1, 1)]);
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 2, y: 0 });
  });

  it('drag places the moving widget at the target and pushes a colliding neighbor below', () => {
    const start = [at('a', 0, 0, 2, 1, 0), at('b', 0, 1, 2, 1, 1)];
    const out = pushCompact.preview(start, { kind: 'drag', id: 'b', targetCell: { x: 0, y: 0 } });
    const a = out.find((w) => w.id === 'a')!;
    const b = out.find((w) => w.id === 'b')!;
    expect(b).toMatchObject({ x: 0, y: 0 });
    expect(a.y).toBeGreaterThanOrEqual(1);
  });

  it('remove heals by compacting upward', () => {
    const start = [at('a', 0, 0, 1, 1, 0), at('b', 0, 1, 1, 1, 1), at('c', 0, 2, 1, 1, 2)];
    const out = pushCompact.preview(start, { kind: 'remove', id: 'b' });
    expect(out).toHaveLength(2);
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 0, y: 1 });
  });

  it('resize grows the footprint and compacts the rest', () => {
    const start = [at('a', 0, 0, 1, 1, 0), at('b', 0, 1, 1, 1, 1)];
    const out = pushCompact.preview(start, { kind: 'resize', id: 'a', w: 1, h: 2 });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ h: 2 });
    expect(out.find((w) => w.id === 'b')!.y).toBeGreaterThanOrEqual(2);
  });

  it('preview(swap) exchanges positions without compacting other widgets', () => {
    const layout = [at('a', 0, 0, 2, 1, 0), at('b', 2, 0, 2, 1, 1), at('c', 4, 0, 2, 1, 2)];
    const out = pushCompact.preview(layout, { kind: 'swap', id: 'a', targetId: 'b' });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 2, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 4, y: 0 });
  });

  it('createPushCompact with cols=3 compacts within 3 columns', () => {
    const strat = createPushCompact(3, 999);
    const widgets: WidgetLayout[] = [
      { id: 'a', x: 0, y: 0, w: 2, h: 1, category: 'finance', order: 0 },
      { id: 'b', x: 2, y: 0, w: 2, h: 1, category: 'health', order: 1 },
    ];
    const out = strat.resolve(widgets);
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 1 });
  });
});

describe('pushCompact horizontal', () => {
  it('compactHorizontal pulls floating widgets leftward, preserving their row', () => {
    const out = compactHorizontal([at('a', 0, 0, 1, 1, 0), at('b', 5, 1, 1, 1, 1)], 3);
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 1 });
  });

  it('compactHorizontal compacts to fill a left gap when the occupant is removed', () => {
    // b at x=2 should slide left to x=0 once the grid is empty before it
    const out = compactHorizontal([at('b', 2, 0, 1, 1, 0)], 2);
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0 });
  });

  it('compactHorizontal clamps h to rows bound', () => {
    const out = compactHorizontal([at('a', 0, 0, 1, 5, 0)], 3);
    expect(out.find((w) => w.id === 'a')!.h).toBe(3);
  });

  it('pushCompactDragH places moving widget at target and pushes colliding neighbor right', () => {
    const widgets = [at('a', 0, 0, 2, 1, 0), at('b', 0, 1, 2, 1, 1)];
    const out = pushCompactDragH(widgets, 'b', { x: 0, y: 0 }, 2);
    const b = out.find((w) => w.id === 'b')!;
    const a = out.find((w) => w.id === 'a')!;
    expect(b).toMatchObject({ x: 0, y: 0 });
    expect(a.x).toBeGreaterThanOrEqual(2); // pushed right past b's 2-wide footprint
  });

  it('createPushCompactH preview(drag) places widget at target cell', () => {
    const strat = createPushCompactH(3);
    const widgets = [at('a', 0, 0, 1, 1, 0), at('b', 1, 0, 1, 1, 1)];
    const out = strat.preview(widgets, { kind: 'drag', id: 'b', targetCell: { x: 0, y: 0 } });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
  });

  it('createPushCompactH preview(remove) compacts remaining widgets leftward', () => {
    const strat = createPushCompactH(3);
    const start = [at('a', 0, 0, 1, 1, 0), at('b', 1, 0, 1, 1, 1), at('c', 2, 0, 1, 1, 2)];
    const out = strat.preview(start, { kind: 'remove', id: 'a' });
    expect(out).toHaveLength(2);
    // b and c should compact left after a is removed
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0 });
    expect(out.find((w) => w.id === 'c')).toMatchObject({ x: 1 });
  });

  it('createPushCompactH preview(swap) exchanges positions without repacking', () => {
    const strat = createPushCompactH(4);
    const layout = [at('a', 0, 0, 2, 1, 0), at('b', 1, 0, 2, 1, 1)];
    const out = strat.preview(layout, { kind: 'swap', id: 'a', targetId: 'b' });
    expect(out.find((w) => w.id === 'a')).toMatchObject({ x: 1, y: 0 });
    expect(out.find((w) => w.id === 'b')).toMatchObject({ x: 0, y: 0 });
  });
});
