import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import React from 'react';

const ACCENT = '#ff6b6b';
const CONSUMED = 1840;
const GOAL = 2400;
const PCT = Math.round((CONSUMED / GOAL) * 100);
const MACROS = [
  { label: 'Protein', g: 142, color: '#6366f1' },
  { label: 'Carbs',   g: 198, color: '#ffd93d' },
  { label: 'Fat',     g: 68,  color: '#ff6b6b'  },
];
const MEALS = [
  { name: 'Breakfast', cal: 420 },
  { name: 'Lunch',     cal: 680 },
  { name: 'Snack',     cal: 210 },
  { name: 'Dinner',    cal: 530 },
];

function DonutRing({ size }: { size: number }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dash = (PCT / 100) * circ;
  return (
    <svg width={`${size/10}em`} height={`${size/10}em`} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={ACCENT} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill="var(--text)" fontSize={size > 60 ? 13 : 10} fontWeight={600}>
        {CONSUMED.toLocaleString()}
      </text>
    </svg>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: '0.4em' }}>
      <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today&apos;s</div>
      <div style={{ fontSize: '1.3em', fontWeight: 600, color: 'var(--text)' }}>Calories</div>
    </div>
  );
}

function ProgressBar() {
  return (
    <div style={{ height: '0.6em', borderRadius: '0.3em', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', margin: '0.6em 0' }}>
      <div style={{ height: '100%', width: `${PCT}%`, background: '#6bcb77', borderRadius: '0.3em' }} />
    </div>
  );
}

export function CalorieTracker({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: '1.2em',
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={{ ...s, alignItems: 'center', justifyContent: 'center' }}>
        <DonutRing size={72} />
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2em' }}>Calories</div>
        <div style={{ fontSize: '2.6em', fontWeight: 700, lineHeight: 1 }}>{CONSUMED.toLocaleString()}</div>
        <div style={{ fontSize: '1.1em', color: 'var(--muted)' }}>/ {GOAL.toLocaleString()}</div>
        <ProgressBar />
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Header />
          <div style={{ textAlign: 'right', fontSize: '1.1em' }}>
            <span>{CONSUMED.toLocaleString()}</span>
            <span style={{ color: 'var(--muted)' }}> / {GOAL.toLocaleString()} kcal</span>
          </div>
        </div>
        <ProgressBar />
        <div style={{ display: 'flex', gap: '0.8em', marginTop: '0.6em' }}>
          {MACROS.map((m) => (
            <div key={m.label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.3em', fontWeight: 600, color: m.color }}>{m.g}g</div>
              <div style={{ fontSize: '1em', color: 'var(--muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={{ ...s, flexDirection: 'row', gap: '1em' }}>
      <div style={{ flex: 1 }}>
        <Header />
        <div style={{ fontSize: '1.1em', marginBottom: '0.4em' }}>
          <span>{CONSUMED.toLocaleString()}</span>
          <span style={{ color: 'var(--muted)' }}> / {GOAL.toLocaleString()} kcal</span>
        </div>
        <ProgressBar />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em', marginTop: '0.6em' }}>
          {MACROS.map((m) => (
            <div key={m.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1em', marginBottom: '0.2em' }}>
                <span style={{ color: 'var(--muted)' }}>{m.label}</span>
                <span>{m.g}g</span>
              </div>
              <div style={{ height: '0.4em', borderRadius: '0.2em', background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ height: '100%', width: `${Math.min(100, m.g / 2)}%`, background: m.color, borderRadius: '0.2em' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: '1px', background: 'var(--border-hairline)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
          {MEALS.map((meal) => (
            <div key={meal.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1em' }}>
              <span style={{ color: 'var(--muted)' }}>{meal.name}</span>
              <span>{meal.cal} kcal</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
