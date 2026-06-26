import { describe, it, expect } from 'vitest';
import { seedWidgets } from './seed';

describe('seedWidgets', () => {
  it('returns exactly 19 widgets', () => {
    expect(seedWidgets()).toHaveLength(19);
  });

  it('each widget has a unique id', () => {
    const ids = seedWidgets().map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('first widget is budget-summary 2x4 at (0,0)', () => {
    const w = seedWidgets()[0];
    expect(w).toMatchObject({ widgetType: 'budget-summary', w: 2, h: 4, x: 0, y: 0 });
  });

  it('all widget ids are seed-N format', () => {
    const widgets = seedWidgets();
    widgets.forEach((w, i) => {
      expect(w.id).toBe(`seed-${i}`);
    });
  });

  it('all widgets have required fields', () => {
    const widgets = seedWidgets();
    widgets.forEach((w) => {
      expect(w.id).toBeTruthy();
      expect(w.widgetType).toBeTruthy();
      expect(w.category).toBeTruthy();
      expect(typeof w.x).toBe('number');
      expect(typeof w.y).toBe('number');
      expect(w.w).toBeGreaterThan(0);
      expect(w.h).toBeGreaterThan(0);
    });
  });
});