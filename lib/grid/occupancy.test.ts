import { describe, it, expect } from 'vitest';
import { createGrid, fits, occupy } from './occupancy';

describe('occupancy', () => {
  it('reports a footprint as fitting in an empty grid', () => {
    const g = createGrid();
    expect(fits(g, 0, 0, 2, 2, 6)).toBe(true);
  });

  it('rejects footprints that overflow columns', () => {
    const g = createGrid();
    expect(fits(g, 5, 0, 2, 1, 6)).toBe(false);
  });

  it('rejects footprints overlapping an occupied region', () => {
    const g = createGrid();
    occupy(g, 0, 0, 2, 2);
    expect(fits(g, 1, 1, 1, 1, 6)).toBe(false);
    expect(fits(g, 2, 0, 1, 1, 6)).toBe(true);
  });
});
