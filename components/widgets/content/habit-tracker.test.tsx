import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HabitTracker, HEATMAP_ROWS } from './habit-tracker';

const SIZES = [[1, 1], [2, 1], [2, 2], [3, 2]] as const;

describe('HabitTracker', () => {
  it('renders every supported size without throwing', () => {
    for (const [w, h] of SIZES) {
      const { container } = render(<HabitTracker category="lifestyle" w={w} h={h} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
  it('shows the Morning run habit on the 2×2', () => {
    const { getByText } = render(<HabitTracker category="lifestyle" w={2} h={2} />);
    expect(getByText('Morning run')).toBeTruthy();
  });
  it('shows the heatmap day-letter header on the 3×2', () => {
    const { getAllByText } = render(<HabitTracker category="lifestyle" w={3} h={2} />);
    expect(getAllByText('S').length).toBeGreaterThan(0);
  });
  it('each heatmap row true-count equals its streak count', () => {
    const expected = [5, 6, 5, 4]; // Run, Read, Meditate, Workout
    HEATMAP_ROWS.forEach((row, i) => {
      const trues = row.days.filter(Boolean).length;
      expect(trues).toBe(expected[i]);
      expect(row.count).toBe(expected[i]);
    });
  });
});
