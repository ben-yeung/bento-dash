import { describe, it, expect } from 'vitest';
import { WIDGET_REGISTRY } from './registry';

describe('WIDGET_REGISTRY', () => {
  it('has exactly 4 entries', () => {
    expect(WIDGET_REGISTRY).toHaveLength(4);
  });

  it('each entry has a non-empty supportedSizes array', () => {
    for (const def of WIDGET_REGISTRY) {
      expect(def.supportedSizes.length).toBeGreaterThan(0);
    }
  });

  it('each entry has a valid category matching its type', () => {
    const valid = ['finance', 'health', 'calendar', 'lifestyle'];
    for (const def of WIDGET_REGISTRY) {
      expect(valid).toContain(def.category);
      expect(def.type).toBe(def.category);
    }
  });

  it('each entry has a ContentComponent defined', () => {
    for (const def of WIDGET_REGISTRY) {
      expect(def.ContentComponent).toBeDefined();
      expect(typeof def.ContentComponent).toBe('function');
    }
  });

  it('finance entry supports 1x1, 2x2, and 4x2 sizes', () => {
    const finance = WIDGET_REGISTRY.find((d) => d.type === 'finance')!;
    const names = finance.supportedSizes.map((s) => s.name);
    expect(names).toContain('1×1');
    expect(names).toContain('2×2');
    expect(names).toContain('4×2');
  });
});
