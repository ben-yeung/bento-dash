import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DailyNote } from './daily-note';

const SIZES = [[1, 1], [2, 2], [2, 3], [3, 2]] as const;

describe('DailyNote', () => {
  it('renders every supported size without throwing', () => {
    for (const [w, h] of SIZES) {
      const { container } = render(<DailyNote category="lifestyle" w={w} h={h} />);
      expect(container.firstChild).toBeTruthy();
    }
  });
  it('1×1 shows a checklist item, not the prose note', () => {
    const { getByText, queryByText } = render(<DailyNote category="lifestyle" w={1} h={1} />);
    expect(getByText('Review PR')).toBeTruthy();
    expect(queryByText(/Shipped the scaling tokens/i)).toBeNull();
  });
});
