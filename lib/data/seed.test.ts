import { describe, it, expect } from 'vitest';
import { seedWidgets } from './seed';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';

describe('seedWidgets', () => {
  it('returns exactly 19 widgets', () => {
    expect(seedWidgets()).toHaveLength(19);
  });

  it('each widget has a unique id', () => {
    const ids = seedWidgets().map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('first widget is budget-summary 4x2 at (0,0)', () => {
    const w = seedWidgets()[0];
    expect(w).toMatchObject({ widgetType: 'budget-summary', w: 4, h: 2, x: 0, y: 0 });
  });

  it('all widgets have w and h within supported sizes', () => {
    const widgets = seedWidgets();
    for (const widget of widgets) {
      const def = WIDGET_REGISTRY.find((r) => r.type === widget.widgetType);
      if (!def) continue;
      const match = def.supportedSizes.some((s) => s.w === widget.w && s.h === widget.h);
      expect(match, `${widget.widgetType} at ${widget.w}x${widget.h} not in supportedSizes`).toBe(true);
    }
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