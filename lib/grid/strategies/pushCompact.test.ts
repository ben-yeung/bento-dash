import { describe, it, expect } from 'vitest';
import { pushCompact, compactVertical } from './pushCompact';
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
});
