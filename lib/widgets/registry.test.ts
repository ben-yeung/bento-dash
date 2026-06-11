import { describe, it, expect } from 'vitest';
import { WIDGET_REGISTRY } from './registry';

describe('WIDGET_REGISTRY', () => {
  it('has exactly 10 entries', () => {
    expect(WIDGET_REGISTRY).toHaveLength(10);
  });

  it('each entry has a non-empty supportedSizes array', () => {
    for (const def of WIDGET_REGISTRY) {
      expect(def.supportedSizes.length).toBeGreaterThan(0);
    }
  });

  it('each entry has a valid category', () => {
    const valid = ['finance', 'health', 'calendar', 'lifestyle'];
    for (const def of WIDGET_REGISTRY) {
      expect(valid).toContain(def.category);
    }
  });

  it('each entry has a ContentComponent defined', () => {
    for (const def of WIDGET_REGISTRY) {
      expect(def.ContentComponent).toBeDefined();
      expect(typeof def.ContentComponent).toBe('function');
    }
  });

  it('budget-summary supports 1×1, 2×2, 3×2, and 4×2', () => {
    const def = WIDGET_REGISTRY.find((d) => d.type === 'budget-summary')!;
    const names = def.supportedSizes.map((s) => s.name);
    expect(names).toContain('1×1');
    expect(names).toContain('2×2');
    expect(names).toContain('3×2');
    expect(names).toContain('4×2');
  });

  it('has one entry per expected type', () => {
    const types = WIDGET_REGISTRY.map((d) => d.type);
    expect(types).toContain('budget-summary');
    expect(types).toContain('activity-rings');
    expect(types).toContain('calorie-tracker');
    expect(types).toContain('steps');
    expect(types).toContain('upcoming-events');
    expect(types).toContain('mini-calendar');
    expect(types).toContain('todays-schedule');
    expect(types).toContain('habit-tracker');
    expect(types).toContain('weather');
    expect(types).toContain('daily-note');
  });

  it('each entry has an icon component defined', () => {
    for (const def of WIDGET_REGISTRY) {
      expect(def.icon).toBeDefined();
      expect(def.icon).not.toBeNull();
    }
  });
});
