// components/widgets/content/budget-summary.tsx
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import React from 'react';

const ACCENT = '#6366f1';
const SPENT = 3500;
const TOTAL = 5000;
const REMAINING = TOTAL - SPENT;
const PCT = Math.round((SPENT / TOTAL) * 100);

const CATS = [
  { label: 'Housing',  amount: 1400, color: '#6366f1' },
  { label: 'Food',     amount:  800, color: '#8b5cf6' },
  { label: 'Transport',amount:  600, color: '#a78bfa' },
  { label: 'Other',    amount:  700, color: '#c4b5fd' },
];

function DonutRing({ size, pct, label }: { size: number; pct: number; label: string }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={`${size/10}em`} height={`${size/10}em`} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={ACCENT} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill="var(--text)" fontSize={size > 60 ? 13 : 10} fontWeight={600}>
        {label}
      </text>
    </svg>
  );
}

function Header({ ctx, title }: { ctx: string; title: string }) {
  return (
    <div style={{ marginBottom: '0.6em' }}>
      <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ctx}</div>
      <div style={{ fontSize: '1.3em', fontWeight: 600, color: 'var(--text)' }}>{title}</div>
    </div>
  );
}

function StackedBar() {
  return (
    <div style={{ display: 'flex', height: '0.6em', borderRadius: '0.3em', overflow: 'hidden', margin: '0.6em 0' }}>
      {CATS.map((c) => (
        <div key={c.label} style={{ flex: c.amount, background: c.color }} />
      ))}
    </div>
  );
}

export function BudgetSummary({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: '1.2em',
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jun</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DonutRing size={64} pct={PCT} label={`$${(REMAINING/1000).toFixed(1)}k`} />
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Header ctx="June 2026" title="Budget" />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2em', fontWeight: 700 }}>${SPENT.toLocaleString()}</div>
            <div style={{ fontSize: '1.1em', color: 'var(--muted)' }}>/ ${TOTAL.toLocaleString()}</div>
          </div>
        </div>
        <StackedBar />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4em', marginTop: '0.4em' }}>
          {CATS.map((c) => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6em', fontSize: '1.1em' }}>
              <div style={{ width: '0.8em', height: '0.8em', borderRadius: '0.2em', background: c.color, flexShrink: 0 }} />
              <span style={{ flex: 1, color: 'var(--muted)' }}>{c.label}</span>
              <span>${c.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (w === 3 && h === 2) {
    return (
      <div style={{ ...s, flexDirection: 'row', gap: '1.2em' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4em' }}>
          <DonutRing size={80} pct={PCT} label={`${PCT}%`} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6em', fontWeight: 700 }}>${SPENT.toLocaleString()}</div>
            <div style={{ fontSize: '1em', color: 'var(--muted)' }}>/ ${TOTAL.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header ctx="June 2026" title="Monthly Budget" />
          <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 'auto' }}>Remaining</div>
          <div style={{ fontSize: '2.2em', fontWeight: 700, color: ACCENT }}>${REMAINING.toLocaleString()}</div>
          <StackedBar />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3em' }}>
            {CATS.map((c) => (
              <div key={c.label} style={{ display: 'flex', gap: '0.5em', fontSize: '1em', alignItems: 'center' }}>
                <div style={{ width: '0.6em', height: '0.6em', borderRadius: '0.1em', background: c.color }} />
                <span style={{ flex: 1, color: 'var(--muted)' }}>{c.label}</span>
                <span>${c.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4×2
  return (
    <div style={s}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.6em', marginBottom: '0.8em' }}>
        <Header ctx="June 2026" title="Monthly Budget" />
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <span style={{ fontSize: '2em', fontWeight: 700 }}>${SPENT.toLocaleString()}</span>
          <span style={{ fontSize: '1.3em', color: 'var(--muted)', marginLeft: '0.6em' }}>/ ${TOTAL.toLocaleString()}</span>
        </div>
      </div>
      <StackedBar />
      <div style={{ display: 'flex', gap: '1.2em', marginTop: '0.8em' }}>
        {CATS.map((c) => (
          <div key={c.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2em' }}>
            <div style={{ width: '2em', height: '2em', borderRadius: '0.6em', background: c.color }} />
            <div style={{ fontSize: '1.1em', color: 'var(--muted)' }}>{c.label}</div>
            <div style={{ fontSize: '1.3em', fontWeight: 600 }}>${c.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
