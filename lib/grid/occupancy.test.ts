import { describe, it, expect } from 'vitest';
import { createGrid, fits, occupy, fitsH } from './occupancy';

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

describe('fitsH', () => {
  it('reports a footprint as fitting in an empty grid within row bound', () => {
    const g = createGrid();
    expect(fitsH(g, 0, 0, 2, 2, 4)).toBe(true);
  });

  it('rejects footprints that overflow rows', () => {
    const g = createGrid();
    expect(fitsH(g, 0, 3, 1, 2, 4)).toBe(false); // y=3 + h=2 = 5 > rows=4
  });

  it('does not bound x (unbounded axis)', () => {
    const g = createGrid();
    expect(fitsH(g, 100, 0, 1, 1, 4)).toBe(true);
  });

  it('rejects footprints overlapping an occupied region', () => {
    const g = createGrid();
    occupy(g, 0, 0, 2, 2);
    expect(fitsH(g, 1, 1, 1, 1, 4)).toBe(false);
    expect(fitsH(g, 2, 0, 1, 1, 4)).toBe(true);
  });
});
