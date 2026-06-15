import type React from 'react';

export const SCALE = {
  pad: 0.09,
  gap: 0.06,
  fontLabel: 0.075,
  fontDetail: 0.095,
  fontTitle: 0.13,
  fontValue: 0.18,
  fontHero: 0.27,
} as const;

/** A length that scales with the board cell size. */
export function cell(ratio: number): string {
  return `calc(var(--cell-size, 100px) * ${ratio})`;
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
