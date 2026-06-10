import { describe, it, expect } from 'vitest';
import { getStrategy, type LayoutMode } from './engine';
import { autoPack } from './strategies/autoPack';
import { pushCompact } from './strategies/pushCompact';

describe('engine', () => {
  it('returns autoPack by default and for the autoPack mode', () => {
    expect(getStrategy('autoPack')).toBe(autoPack);
  });
  it('returns pushCompact for the pushCompact mode', () => {
    expect(getStrategy('pushCompact')).toBe(pushCompact);
  });
  it('is typed to the two known modes', () => {
    const modes: LayoutMode[] = ['autoPack', 'pushCompact'];
    expect(modes).toHaveLength(2);
  });
});
