import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { UpcomingEvents } from './upcoming-events';

const SIZES = [[1, 1], [2, 1], [2, 2], [3, 2]] as const;

describe('UpcomingEvents', () => {
  it('renders every supported size without throwing', () => {
    for (const [w, h] of SIZES) {
      const { container } = render(<UpcomingEvents category="calendar" w={w} h={h} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
  it('shows the Team standup event on the 2×2', () => {
    const { getByText } = render(<UpcomingEvents category="calendar" w={2} h={2} />);
    expect(getByText('Team standup')).toBeTruthy();
  });
});
