import type React from 'react';

/**
 * Global font down-tune. The mockup calibrated every font ratio against `--cell: 150px`,
 * but the production board caps `--cell-size` at ~200px (board max-width 1260px / 6 cols),
 * so unscaled fonts render ~1.33× larger than designed. This single knob pulls all font
 * sizes back toward their calibrated appearance. Lower it for smaller text, raise toward 1
 * for the raw mockup proportions. Only fonts are affected — spacing (pad/gap) is untouched.
 */
export const FONT_SCALE = 0.8;

const f = (base: number): number => Math.round(base * FONT_SCALE * 1000) / 1000;

export const SCALE = {
  pad: 0.09,
  gap: 0.06,
  fontLabel: f(0.075),
  fontDetail: f(0.095),
  fontTitle: f(0.13),
  fontValue: f(0.18),
  fontHero: f(0.27),
} as const;

/** A length that scales with the board cell size. */
export function cell(ratio: number): string {
  return `calc(var(--cell-size, 100px) * ${ratio})`;
}

/** A font length: a cell-scaled size with the global {@link FONT_SCALE} down-tune applied.
 *  Use for raw per-size font ratios copied from the mockup so they track the FONT_SCALE knob
 *  the same way the {@link SCALE} ramp does. */
export function fcell(ratio: number): string {
  return cell(ratio * FONT_SCALE);
}

/** CSS custom properties for the tile wrapper (optional convenience). */
export function tokenStyle(): React.CSSProperties {
  return {
    ['--w-pad' as string]: cell(SCALE.pad),
    ['--w-gap' as string]: cell(SCALE.gap),
    ['--w-font-label' as string]: cell(SCALE.fontLabel),
    ['--w-font-detail' as string]: cell(SCALE.fontDetail),
    ['--w-font-title' as string]: cell(SCALE.fontTitle),
    ['--w-font-value' as string]: cell(SCALE.fontValue),
    ['--w-font-hero' as string]: cell(SCALE.fontHero),
  } as React.CSSProperties;
}
