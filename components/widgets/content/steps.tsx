import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import React from 'react';

const ACCENT = '#38bdf8';
const STEPS = 8190;
const GOAL = 10000;
const PCT = Math.round((STEPS / GOAL) * 100);

const HOURLY = [
  { hour: '6am', steps: 320 },
  { hour: '7am', steps: 1100 },
  { hour: '8am', steps: 480 },
  { hour: '9am', steps: 310 },
  { hour: '10am', steps: 220 },
  { hour: '11am', steps: 190 },
  { hour: '12pm', steps: 980 },
  { hour: '1pm', steps: 640 },
  { hour: '2pm', steps: 410 },
  { hour: '3pm', steps: 280 },
  { hour: '4pm', steps: 1260 },
];
const MAX_H_STEPS = Math.max(...HOURLY.map((h) => h.steps));

export function Steps({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: '1.2em',
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  function ProgressBar() {
    return (
      <div style={{ height: '0.5em', borderRadius: '0.3em', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', margin: '0.5em 0' }}>
        <div style={{ height: '100%', width: `${PCT}%`, background: ACCENT, borderRadius: '0.3em' }} />
      </div>
    );
  }

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Steps</div>
        <div style={{ fontSize: '2.2em', fontWeight: 700, color: ACCENT, lineHeight: 1.2, marginTop: '0.2em' }}>{STEPS.toLocaleString()}</div>
        <ProgressBar />
        <div style={{ fontSize: '1em', color: 'var(--muted)' }}>{PCT}% of 10k</div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: '2.6em', fontWeight: 700, color: ACCENT }}>{STEPS.toLocaleString()}</div>
          <div style={{ fontSize: '1.1em', color: 'var(--muted)' }}>/ {GOAL.toLocaleString()}</div>
        </div>
        <ProgressBar />
        <div style={{ display: 'flex', gap: '1.2em', fontSize: '1.1em' }}>
          <div><span style={{ color: 'var(--muted)' }}>Dist </span>5.2 km</div>
          <div><span style={{ color: 'var(--muted)' }}>Active </span>44 min</div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ fontSize: '3.2em', fontWeight: 700, color: ACCENT, lineHeight: 1 }}>{STEPS.toLocaleString()}</div>
        <div style={{ fontSize: '1.1em', color: 'var(--muted)', marginBottom: '0.4em' }}>steps today</div>
        <ProgressBar />
        <div style={{ display: 'flex', gap: '1em', marginTop: '0.8em' }}>
          {[
            { label: 'Distance', val: '5.2 km' },
            { label: 'Active',   val: '44 min' },
            { label: 'Floors',   val: '8'       },
          ].map((m) => (
            <div key={m.label} style={{ flex: 1 }}>
              <div style={{ fontSize: '1.4em', fontWeight: 600 }}>{m.val}</div>
              <div style={{ fontSize: '1em', color: 'var(--muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2 — hourly bar chart
  const barW = 14;
  const chartH = 70;
  return (
    <div style={s}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4em' }}>
        <div style={{ fontSize: '2.8em', fontWeight: 700, color: ACCENT }}>{STEPS.toLocaleString()}</div>
        <div style={{ fontSize: '1.1em', color: 'var(--muted)' }}>/ {GOAL.toLocaleString()} steps</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '0.4em', marginBottom: '0.6em' }}>
        {HOURLY.map((item, i) => {
          const isLast = i === HOURLY.length - 1;
          const bh = Math.max(4, (item.steps / MAX_H_STEPS) * chartH);
          return (
            <div key={item.hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2em' }}>
              {isLast && <div style={{ fontSize: '0.8em', color: 'var(--muted)', marginBottom: '0.2em' }}>now</div>}
              <div style={{
                width: `${barW/10}em`, height: `${bh/10}em`, borderRadius: '0.3em',
                background: isLast ? ACCENT : 'rgba(56,189,248,0.35)',
              }} />
              {i % 3 === 0 && <div style={{ fontSize: '0.7em', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{item.hour}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '1.6em', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.6em' }}>
        {[{ label: 'Distance', val: '5.2 km' }, { label: 'Active', val: '44 min' }, { label: 'Floors', val: '8' }].map((m) => (
          <div key={m.label}>
            <div style={{ fontSize: '2em', fontWeight: 700 }}>{m.val}</div>
            <div style={{ fontSize: '1em', color: 'var(--muted)' }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
