import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Weather } from './weather';

const SIZES = [[1, 1], [2, 1], [2, 2], [3, 2]] as const;

describe('Weather', () => {
  it('renders every supported size without throwing', () => {
    for (const [w, h] of SIZES) {
      const { container } = render(<Weather category="lifestyle" w={w} h={h} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
  it('shows the 72° temperature on the 2×2', () => {
    const { getByText } = render(<Weather category="lifestyle" w={2} h={2} />);
    expect(getByText('72°')).toBeTruthy();
  });
});
