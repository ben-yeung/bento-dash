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
    <svg width={size} height={size} style={{ display: 'block' }}>
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
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ctx}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
    </div>
  );
}

function StackedBar() {
  return (
    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', margin: '6px 0' }}>
      {CATS.map((c) => (
        <div key={c.label} style={{ flex: c.amount, background: c.color }} />
      ))}
    </div>
  );
}

export function BudgetSummary({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jun</div>
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
            <div style={{ fontSize: 20, fontWeight: 700 }}>${SPENT.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>/ ${TOTAL.toLocaleString()}</div>
          </div>
        </div>
        <StackedBar />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {CATS.map((c) => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
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
      <div style={{ ...s, flexDirection: 'row', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <DonutRing size={80} pct={PCT} label={`${PCT}%`} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>${SPENT.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>/ ${TOTAL.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header ctx="June 2026" title="Monthly Budget" />
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 'auto' }}>Remaining</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: ACCENT }}>${REMAINING.toLocaleString()}</div>
          <StackedBar />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {CATS.map((c) => (
              <div key={c.label} style={{ display: 'flex', gap: 5, fontSize: 10, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: 1, background: c.color }} />
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <Header ctx="June 2026" title="Monthly Budget" />
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>${SPENT.toLocaleString()}</span>
          <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 6 }}>/ ${TOTAL.toLocaleString()}</span>
        </div>
      </div>
      <StackedBar />
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {CATS.map((c) => (
          <div key={c.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: c.color }} />
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>${c.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
