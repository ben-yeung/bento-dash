import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MiniCalendar } from './mini-calendar';

const SIZES = [[1, 1], [2, 2], [3, 2], [3, 3]] as const;

describe('MiniCalendar', () => {
  it('renders every supported size without throwing', () => {
    for (const [w, h] of SIZES) {
      const { container } = render(<MiniCalendar category="calendar" w={w} h={h} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
  it('shows the highlighted day 10 on the 2×2', () => {
    const { getByText } = render(<MiniCalendar category="calendar" w={2} h={2} />);
    expect(getByText('10')).toBeTruthy();
  });
});
