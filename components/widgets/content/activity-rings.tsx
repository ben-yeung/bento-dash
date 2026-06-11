import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import React from 'react';

const MOVE_COLOR     = '#ff6b6b';
const EXERCISE_COLOR = '#ffd93d';
const STAND_COLOR    = '#6bcb77';

const RINGS = [
  { label: 'Move',     color: MOVE_COLOR,     pct: 78, value: '520', unit: 'CAL' },
  { label: 'Exercise', color: EXERCISE_COLOR, pct: 60, value: '36',  unit: 'MIN' },
  { label: 'Stand',    color: STAND_COLOR,    pct: 92, value: '11',  unit: 'HRS' },
];

function ConcRings({ size }: { size: number }) {
  const gap = 5;
  const strokeWidth = Math.max(4, size / 16);
  return (
    <svg width={`${size/10}em`} height={`${size/10}em`} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', flexShrink: 0 }}>
      {RINGS.map((ring, i) => {
        const r = size / 2 - strokeWidth / 2 - i * (strokeWidth + gap);
        const circ = 2 * Math.PI * r;
        const dash = (ring.pct / 100) * circ;
        return (
          <g key={ring.label}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
            <circle
              cx={size/2} cy={size/2} r={r} fill="none"
              stroke={ring.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              transform={`rotate(-90 ${size/2} ${size/2})`}
            />
          </g>
        );
      })}
    </svg>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: '0.4em' }}>
      <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today&apos;s</div>
      <div style={{ fontSize: '1.3em', fontWeight: 600, color: 'var(--text)' }}>Activity</div>
    </div>
  );
}

export function ActivityRings({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: '1.2em',
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={{ ...s, alignItems: 'center', justifyContent: 'center' }}>
        <ConcRings size={60} />
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4em' }}>Activity</div>
        <div style={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
          <ConcRings size={52} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3em' }}>
            {RINGS.map((ring) => (
              <div key={ring.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5em', fontSize: '1.1em', whiteSpace: 'nowrap' }}>
                <div style={{ width: '0.8em', height: '0.8em', borderRadius: '50%', background: ring.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--muted)' }}>{ring.label}</span>
                <span style={{ marginLeft: 'auto', paddingLeft: '0.8em' }}>{ring.value} <span style={{ color: 'var(--muted)', fontSize: '0.9em' }}>{ring.unit}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    const points = [0, 20, 40, 60, 80, 100].map((t, i) => {
      const x = (i / 5) * 140;
      return RINGS.map((ring) => {
        const base = ring.pct * 0.6;
        const val = Math.min(ring.pct, base + t * 0.004 * ring.pct);
        return `${x},${50 - val * 0.45}`;
      });
    });
    return (
      <div style={s}>
        <Header />
        <svg width="100%" height={'5.5em'} viewBox="0 0 140 55" preserveAspectRatio="none" style={{ marginBottom: '0.6em' }}>
          {RINGS.map((ring, ri) => (
            <polyline key={ring.label}
              points={points.map((pt) => pt[ri]).join(' ')}
              fill="none" stroke={ring.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
            />
          ))}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4em' }}>
          {RINGS.map((ring) => (
            <div key={ring.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6em', fontSize: '1.1em' }}>
              <div style={{ width: '0.8em', height: '0.8em', borderRadius: '50%', background: ring.color }} />
              <span style={{ flex: 1, color: 'var(--muted)' }}>{ring.label}</span>
              <span>{ring.value} <span style={{ color: 'var(--muted)', fontSize: '0.9em' }}>{ring.unit}</span></span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  const WEEK_DAYS = ['M','T','W','T','F','S','S'];
  const weekData = RINGS.map((ring) =>
    WEEK_DAYS.map((_, i) => Math.round(ring.pct * (0.5 + (i * 0.1))))
  );

  return (
    <div style={{ ...s, flexDirection: 'row', gap: '1em' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ConcRings size={88} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6em', justifyContent: 'center' }}>
        {RINGS.map((ring) => (
          <div key={ring.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1em', marginBottom: '0.2em' }}>
              <span style={{ color: ring.color }}>{ring.label}</span>
              <span>{ring.value} <span style={{ color: 'var(--muted)', fontSize: '0.9em' }}>{ring.unit}</span></span>
            </div>
            <div style={{ height: '0.4em', borderRadius: '0.2em', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${ring.pct}%`, background: ring.color, borderRadius: '0.2em' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ width: '5.2em' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4em' }}>
          {WEEK_DAYS.map((d, i) => (
            <div key={i} style={{ fontSize: '0.8em', color: 'var(--muted)', width: '0.6em', textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        {RINGS.map((ring, ri) => (
          <div key={ring.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3em' }}>
            {WEEK_DAYS.map((_, di) => (
              <div key={di} style={{
                width: '0.6em', height: '1em', borderRadius: '0.1em',
                background: weekData[ri][di] > 70 ? ring.color : 'rgba(255,255,255,0.08)',
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
