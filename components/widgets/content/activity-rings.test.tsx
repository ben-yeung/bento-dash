import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ActivityRings } from './activity-rings';

const SIZES = [[1, 1], [2, 1], [2, 2], [3, 2]] as const;

describe('ActivityRings', () => {
  it('renders every supported size without throwing', () => {
    for (const [w, h] of SIZES) {
      const { container } = render(<ActivityRings category="health" w={w} h={h} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
  it('shows the Move metric label on the 2×1', () => {
    const { getByText } = render(<ActivityRings category="health" w={2} h={1} />);
    expect(getByText('Move')).toBeTruthy();
  });
});
