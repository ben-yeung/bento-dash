import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EventChip } from './EventChip';
import { StatStrip } from './StatStrip';
import { WeekHeatmap } from './WeekHeatmap';
import { StreakBadge } from './StreakBadge';
import { TransactionRow } from './TransactionRow';

describe('shared primitives 2', () => {
  it('EventChip shows time and title', () => {
    const { getByText } = render(<EventChip time="9:00" title="Standup" color="#3b82f6" duration="30m" />);
    expect(getByText('9:00')).toBeTruthy();
    expect(getByText('Standup')).toBeTruthy();
  });
  it('StatStrip shows each value', () => {
    const { getByText } = render(<StatStrip items={[{ label: 'Dist', value: '5.2km' }]} />);
    expect(getByText('5.2km')).toBeTruthy();
  });
  it('WeekHeatmap renders day headers', () => {
    const { getAllByText } = render(<WeekHeatmap rows={[{ color: '#10b981', days: [true, false, true, true, false, true, false] }]} />);
    expect(getAllByText('S').length).toBeGreaterThan(0);
  });
  it('StreakBadge shows the count', () => {
    const { getByText } = render(<StreakBadge count={5} />);
    expect(getByText('5')).toBeTruthy();
  });
  it('TransactionRow shows merchant and amount', () => {
    const { getByText } = render(<TransactionRow items={[{ merchant: 'Uber', amount: '$23' }]} />);
    expect(getByText('Uber')).toBeTruthy();
    expect(getByText('$23')).toBeTruthy();
  });
});
