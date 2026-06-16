import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TodaysSchedule } from './todays-schedule';

const SIZES = [[1, 2], [2, 2], [2, 3], [3, 2]] as const;

describe('TodaysSchedule', () => {
  it('renders every supported size without throwing', () => {
    for (const [w, h] of SIZES) {
      const { container } = render(<TodaysSchedule category="calendar" w={w} h={h} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
  it('shows the Team standup event on the 2×2', () => {
    const { getByText } = render(<TodaysSchedule category="calendar" w={2} h={2} />);
    expect(getByText('Team standup')).toBeTruthy();
  });
});
