import { describe, it, expect } from 'vitest';
import { SIZE_PRESETS, clampSize, nearestPreset } from './sizes';

describe('sizes', () => {
  it('exposes core and extended presets', () => {
    const names = SIZE_PRESETS.map((p) => p.name);
    expect(names).toContain('1×1');
    expect(names).toContain('4×4');
    expect(names).toContain('6×1');
    expect(SIZE_PRESETS.filter((p) => p.group === 'core')).toHaveLength(5);
  });

  it('clamps width to [1,6] and height to [1,4]', () => {
    expect(clampSize(0, 0)).toEqual({ w: 1, h: 1 });
    expect(clampSize(9, 9)).toEqual({ w: 6, h: 4 });
    expect(clampSize(2.4, 1.6)).toEqual({ w: 2, h: 2 });
  });

  it('snaps an arbitrary size to the nearest preset', () => {
    expect(nearestPreset(1, 1).name).toBe('1×1');
    expect(nearestPreset(4, 4).name).toBe('4×4');
    expect(nearestPreset(3, 3).name).toBe('3×3');
  });
});
