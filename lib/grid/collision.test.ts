import { describe, it, expect } from 'vitest';
import { pointToCell, cellSpanToPixels, type GridMetrics } from './collision';

const m: GridMetrics = { cellSize: 100, gap: 12, cols: 6, rows: 'auto' };

describe('collision', () => {
  it('maps a pixel point to a cell coordinate', () => {
    expect(pointToCell(0, 0, m)).toEqual({ x: 0, y: 0 });
    expect(pointToCell(112, 0, m)).toEqual({ x: 1, y: 0 }); // 100 + 12 gap
    expect(pointToCell(0, 224, m)).toEqual({ x: 0, y: 2 });
  });

  it('clamps x within columns and floors y at 0', () => {
    expect(pointToCell(99999, 0, m)).toEqual({ x: 5, y: 0 });
    expect(pointToCell(-50, -50, m)).toEqual({ x: 0, y: 0 });
  });

  it('converts a cell span to pixel dimensions including gaps', () => {
    expect(cellSpanToPixels(2, 1, m)).toEqual({ width: 212, height: 100 });
    expect(cellSpanToPixels(3, 2, m)).toEqual({ width: 324, height: 212 });
  });
});

describe('horizontal mode pointToCell', () => {
  const mH: GridMetrics = { cellSize: 100, gap: 12, cols: 6, rows: 4 };

  it('clamps y to rows-1 and leaves x unbounded', () => {
    // stride = 100+12 = 112; 112*10 = 1120
    expect(pointToCell(1120, 0, mH)).toEqual({ x: 10, y: 0 }); // x=10, not clamped to cols-1=5
    expect(pointToCell(0, 1120, mH)).toEqual({ x: 0, y: 3 }); // y clamped to rows-1=3
  });

  it('handles negative inputs', () => {
    expect(pointToCell(-50, -50, mH)).toEqual({ x: 0, y: 0 });
  });
});
