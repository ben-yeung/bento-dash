import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CalorieTracker } from './calorie-tracker';

const SIZES = [[1, 1], [2, 1], [2, 2], [3, 2]] as const;

describe('CalorieTracker', () => {
  it('renders every supported size without throwing', () => {
    for (const [w, h] of SIZES) {
      const { container } = render(<CalorieTracker category="health" w={w} h={h} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
  it('shows the CAL unit on the 1×1', () => {
    const { getByText } = render(<CalorieTracker category="health" w={1} h={1} />);
    expect(getByText('CAL')).toBeTruthy();
  });
});
