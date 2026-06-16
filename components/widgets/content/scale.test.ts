import { describe, it, expect } from 'vitest';
import { SCALE, cell, tokenStyle } from './scale';

describe('SCALE tokens', () => {
  it('font ratios are strictly increasing label < detail < title < value < hero', () => {
    const { fontLabel, fontDetail, fontTitle, fontValue, fontHero } = SCALE;
    expect(fontLabel).toBeLessThan(fontDetail);
    expect(fontDetail).toBeLessThan(fontTitle);
    expect(fontTitle).toBeLessThan(fontValue);
    expect(fontValue).toBeLessThan(fontHero);
  });

  it('cell() emits a calc expression against --cell-size', () => {
    expect(cell(0.5)).toBe('calc(var(--cell-size, 100px) * 0.5)');
  });

  it('tokenStyle exposes the cell-scaled CSS custom properties', () => {
    const style = tokenStyle() as Record<string, string>;
    expect(style['--w-font-hero']).toBe(cell(SCALE.fontHero));
    expect(style['--w-pad']).toBe(cell(SCALE.pad));
  });
});
