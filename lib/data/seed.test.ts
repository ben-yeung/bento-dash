import { describe, it, expect } from 'vitest';
import { seedWidgets } from './seed';

describe('seedWidgets', () => {
  it('returns exactly 20 widgets', () => {
    expect(seedWidgets()).toHaveLength(20);
  });

  it('section 1 (indices 0-9) is unchanged', () => {
    const widgets = seedWidgets();
    // Row 0-1: budget-summary 4×2 at (0,0)
    expect(widgets[0]).toMatchObject({ widgetType: 'budget-summary', w: 4, h: 2, x: 0, y: 0 });
    // weather 2×1 at (4,0)
    expect(widgets[1]).toMatchObject({ widgetType: 'weather', w: 2, h: 1, x: 4, y: 0 });
    // steps 2×1 at (4,1)
    expect(widgets[2]).toMatchObject({ widgetType: 'steps', w: 2, h: 1, x: 4, y: 1 });
    // habit-tracker 3×2 at (0,4)
    expect(widgets[8]).toMatchObject({ widgetType: 'habit-tracker', w: 3, h: 2, x: 0, y: 4 });
    // daily-note 3×2 at (3,4)
    expect(widgets[9]).toMatchObject({ widgetType: 'daily-note', w: 3, h: 2, x: 3, y: 4 });
  });

  it('section 2 (indices 10-19) has correct positions and sizes', () => {
    const widgets = seedWidgets();
    // Row 6-7: budget-summary 2×2 at (0,6)
    expect(widgets[10]).toMatchObject({ widgetType: 'budget-summary', w: 2, h: 2, x: 0, y: 6 });
    // steps 2×2 at (2,6)
    expect(widgets[11]).toMatchObject({ widgetType: 'steps', w: 2, h: 2, x: 2, y: 6 });
    // mini-calendar 2×2 at (4,6)
    expect(widgets[12]).toMatchObject({ widgetType: 'mini-calendar', w: 2, h: 2, x: 4, y: 6 });
    // Row 8-9: upcoming-events 2×2 at (0,8)
    expect(widgets[13]).toMatchObject({ widgetType: 'upcoming-events', w: 2, h: 2, x: 0, y: 8 });
    // calorie-tracker 2×2 at (2,8)
    expect(widgets[14]).toMatchObject({ widgetType: 'calorie-tracker', w: 2, h: 2, x: 2, y: 8 });
    // daily-note 2×2 at (4,8)
    expect(widgets[15]).toMatchObject({ widgetType: 'daily-note', w: 2, h: 2, x: 4, y: 8 });
    // Row 10: todays-schedule 2×1 at (0,10)
    expect(widgets[16]).toMatchObject({ widgetType: 'todays-schedule', w: 2, h: 1, x: 0, y: 10 });
    // habit-tracker 2×1 at (2,10)
    expect(widgets[17]).toMatchObject({ widgetType: 'habit-tracker', w: 2, h: 1, x: 2, y: 10 });
    // weather 1×1 at (4,10)
    expect(widgets[18]).toMatchObject({ widgetType: 'weather', w: 1, h: 1, x: 4, y: 10 });
    // activity-rings 1×1 at (5,10)
    expect(widgets[19]).toMatchObject({ widgetType: 'activity-rings', w: 1, h: 1, x: 5, y: 10 });
  });

  it('each widget has a unique id', () => {
    const ids = seedWidgets().map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('section 2 rows are flush (each row sums to 6 columns)', () => {
    const widgets = seedWidgets().slice(10);
    // Starting row y=6 (widgets span rows 6–7): w=2+2+2=6
    const row6 = widgets.filter((w) => w.y === 6);
    expect(row6.reduce((s, w) => s + w.w, 0)).toBe(6);
    // Starting row y=8 (widgets span rows 8–9): w=2+2+2=6
    const row8 = widgets.filter((w) => w.y === 8);
    expect(row8.reduce((s, w) => s + w.w, 0)).toBe(6);
    // Row 10: w=2+2+1+1=6
    const row10 = widgets.filter((w) => w.y === 10);
    expect(row10.reduce((s, w) => s + w.w, 0)).toBe(6);
  });
});
