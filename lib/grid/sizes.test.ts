import { describe, it, expect } from 'vitest';
import { SIZE_PRESETS, clampSize, nearestPreset, nearestPresetFrom } from './sizes';

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

  it('nearestPresetFrom snaps to nearest within a restricted set', () => {
    const allowed = [SIZE_PRESETS.find((p) => p.name === '1×1')!, SIZE_PRESETS.find((p) => p.name === '2×2')!];
    // 3×2 is closest to 2×2 within the allowed set: dist(1×1)=|3-1|+|2-1|=3, dist(2×2)=|3-2|+|2-2|=1
    expect(nearestPresetFrom(3, 2, allowed).name).toBe('2×2');
    // 1×1 exact match
    expect(nearestPresetFrom(1, 1, allowed).name).toBe('1×1');
  });

  it('nearestPresetFrom falls back to full SIZE_PRESETS when given empty array', () => {
    expect(nearestPresetFrom(1, 1, []).name).toBe('1×1');
  });

  it('clampSize respects custom maxW and maxH', () => {
    expect(clampSize(10, 10, 4, 999)).toEqual({ w: 4, h: 10 });
    expect(clampSize(1, 6, 6, 4)).toEqual({ w: 1, h: 4 });
    expect(clampSize(3, 2, 3, 999)).toEqual({ w: 3, h: 2 });
  });
});
