import type React from 'react';
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { cell, SCALE } from './scale';
import { Header, Donut, SegmentedBar, TransactionRow } from './_shared';

const CATS = [
  { label: 'Housing', amount: '$1,400', weight: 14, color: '#6366f1' },
  { label: 'Food', amount: '$800', weight: 8, color: '#8b5cf6' },
  { label: 'Transport', amount: '$600', weight: 6, color: '#a78bfa' },
  { label: 'Other', amount: '$700', weight: 7, color: '#c4b5fd' },
];
const TXNS = [
  { merchant: 'Whole Foods', amount: '$84' }, { merchant: 'Uber', amount: '$23' },
  { merchant: 'Netflix', amount: '$16' }, { merchant: 'Amazon', amount: '$52' },
  { merchant: 'Shell', amount: '$45' },
];
const GREEN = '#6bd99a';

const root: React.CSSProperties = { position: 'absolute', inset: 0, padding: cell(SCALE.pad),
  display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const g3: React.CSSProperties = { display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap), height: '100%' };

function Legend({ cols }: { cols: number }) {
  return (
    <div style={{ display: 'flex', gap: cell(0.08) }}>
      {CATS.slice(0, cols).map((c) => (
        <div key={c.label} style={{ flex: 1 }}>
          <div style={{ width: cell(0.06), height: cell(0.06), borderRadius: 3, background: c.color }} />
          <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{c.label}</div>
          <div style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 600 }}>{c.amount}</div>
        </div>
      ))}
    </div>
  );
}

export function BudgetSummary({ w, h }: WidgetContentProps) {
  if (w === 1 && h === 1) {
    return (
      <div style={root}>
        <div style={{ fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>Jun</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Donut pct={70} color="#6366f1" size={0.62} label="$1.5k" sub="left" />
        </div>
      </div>
    );
  }
  if (w === 2 && h === 2) {
    return (
      <div style={{ ...root, ...g3 }}>
        <Header label="June · Budget" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Donut pct={70} color="#6366f1" size={1.32} stroke={0.075} label="$1.5k" sub="left of $5k" />
        </div>
        <div />
      </div>
    );
  }
  // 3×2 and 4×2 share the layout; 4×2 just has 5 txns + 4 legend cols (3×2 = 4 txns, 4 cols)
  const txns = w >= 4 ? TXNS : TXNS.slice(0, 4);
  return (
    <div style={{ ...root, ...g3 }}>
      <Header label="June 2026 · Monthly Budget"
        aside={<div style={{ fontSize: cell(0.15), fontWeight: 700, color: GREEN }}>$1,500 left</div>} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: cell(0.07) }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: cell(0.06) }}>
            <div style={{ fontSize: cell(0.30), fontWeight: 800 }}>$3,500</div>
            <div style={{ fontSize: cell(SCALE.fontValue), fontWeight: 500, color: 'var(--muted)' }}>/ $5,000</div>
          </div>
          <div style={{ fontSize: cell(0.095), color: GREEN, marginTop: cell(0.02) }}>on track for the month</div>
        </div>
        <div>
          <div style={{ fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: cell(0.035) }}>Recent</div>
          <TransactionRow items={txns} />
        </div>
      </div>
      <div>
        <div style={{ marginBottom: cell(0.06) }}>
          <SegmentedBar segments={CATS.map((c) => ({ weight: c.weight, color: c.color }))} remainder={15} height={w >= 4 ? 0.1 : 0.07} />
        </div>
        <Legend cols={4} />
      </div>
    </div>
  );
}
