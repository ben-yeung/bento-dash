import { describe, it, expect } from 'vitest';
import { pointToCell, cellSpanToPixels, type GridMetrics } from './collision';

const m: GridMetrics = { cellSize: 100, gap: 12, cols: 6 };

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
