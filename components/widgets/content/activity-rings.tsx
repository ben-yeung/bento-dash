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
    <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
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
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today&apos;s</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Activity</div>
    </div>
  );
}

export function ActivityRings({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
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
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Activity</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ConcRings size={52} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {RINGS.map((ring) => (
              <div key={ring.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, whiteSpace: 'nowrap' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ring.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--muted)' }}>{ring.label}</span>
                <span style={{ marginLeft: 'auto', paddingLeft: 8 }}>{ring.value} <span style={{ color: 'var(--muted)', fontSize: 9 }}>{ring.unit}</span></span>
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
        <svg width="100%" height={55} viewBox="0 0 140 55" preserveAspectRatio="none" style={{ marginBottom: 6 }}>
          {RINGS.map((ring, ri) => (
            <polyline key={ring.label}
              points={points.map((pt) => pt[ri]).join(' ')}
              fill="none" stroke={ring.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
            />
          ))}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {RINGS.map((ring) => (
            <div key={ring.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ring.color }} />
              <span style={{ flex: 1, color: 'var(--muted)' }}>{ring.label}</span>
              <span>{ring.value} <span style={{ color: 'var(--muted)', fontSize: 9 }}>{ring.unit}</span></span>
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
    <div style={{ ...s, flexDirection: 'row', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ConcRings size={88} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
        {RINGS.map((ring) => (
          <div key={ring.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
              <span style={{ color: ring.color }}>{ring.label}</span>
              <span>{ring.value} <span style={{ color: 'var(--muted)', fontSize: 9 }}>{ring.unit}</span></span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${ring.pct}%`, background: ring.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ width: 52 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          {WEEK_DAYS.map((d, i) => (
            <div key={i} style={{ fontSize: 8, color: 'var(--muted)', width: 6, textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        {RINGS.map((ring, ri) => (
          <div key={ring.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            {WEEK_DAYS.map((_, di) => (
              <div key={di} style={{
                width: 6, height: 10, borderRadius: 1,
                background: weekData[ri][di] > 70 ? ring.color : 'rgba(255,255,255,0.08)',
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
