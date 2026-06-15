import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Donut } from './Donut';
import { ConcRings } from './ConcRings';
import { ProgressBar, SegmentedBar, MetricBar } from './Bars';
import { Header } from './Header';

describe('shared primitives render', () => {
  it('Donut shows its center label', () => {
    const { getByText } = render(<Donut pct={70} color="#6366f1" size={0.6} label="$1.5k" sub="left" />);
    expect(getByText('$1.5k')).toBeTruthy();
    expect(getByText('left')).toBeTruthy();
  });
  it('ConcRings renders an svg', () => {
    const { container } = render(<ConcRings size={0.6} rings={[{ pct: 80, color: '#ff6b6b' }]} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
  it('ProgressBar/SegmentedBar/MetricBar render', () => {
    const { container: a } = render(<ProgressBar pct={50} color="#38bdf8" />);
    const { container: b } = render(<SegmentedBar segments={[{ weight: 1, color: '#6366f1' }]} remainder={2} />);
    const { getByText } = render(<MetricBar label="Move" color="#ff6b6b" current="520" goal="650" pct={78} />);
    expect(a.firstChild).toBeTruthy();
    expect(b.firstChild).toBeTruthy();
    expect(getByText('520/650')).toBeTruthy();
  });
  it('Header shows label and aside', () => {
    const { getByText } = render(<Header label="Today" aside={<span>Wed</span>} />);
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Wed')).toBeTruthy();
  });
});
