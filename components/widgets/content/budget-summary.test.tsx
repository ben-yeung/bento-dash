import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BudgetSummary } from './budget-summary';

const SIZES = [[1, 1], [2, 2], [3, 2], [4, 2]] as const;

describe('BudgetSummary', () => {
  it('renders every supported size without throwing', () => {
    for (const [w, h] of SIZES) {
      const { container } = render(<BudgetSummary category="finance" w={w} h={h} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
  it('shows the spent hero on the 3×2', () => {
    const { getByText } = render(<BudgetSummary category="finance" w={3} h={2} />);
    expect(getByText('$3,500')).toBeTruthy();
    expect(getByText('$1,500 left')).toBeTruthy();
  });
});
