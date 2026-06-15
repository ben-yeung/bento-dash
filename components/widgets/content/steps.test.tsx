import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Steps } from './steps';

const SIZES = [[1, 1], [2, 1], [2, 2], [3, 2]] as const;

describe('Steps', () => {
  it('renders every supported size without throwing', () => {
    for (const [w, h] of SIZES) {
      const { container } = render(<Steps category="health" w={w} h={h} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
  it('shows the Steps label on the 2×1', () => {
    const { getByText } = render(<Steps category="health" w={2} h={1} />);
    expect(getByText('Steps')).toBeTruthy();
  });
});
