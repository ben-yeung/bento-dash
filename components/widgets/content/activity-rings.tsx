import type React from 'react';
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { cell, SCALE } from './scale';
import { Header, ConcRings, MetricBar } from './_shared';

const MOVE = '#ff6b6b';
const EXERCISE = '#ffd93d';
const STAND = '#6bcb77';

const RINGS = [
  { pct: 78, color: MOVE },
  { pct: 60, color: EXERCISE },
  { pct: 92, color: STAND },
];

const STATS = [
  { label: 'Move', color: MOVE, short: '520', value: '520 cal', current: '520', goal: '650', pct: 78 },
  { label: 'Exercise', color: EXERCISE, short: '36m', value: '36 min', current: '36', goal: '60', pct: 60 },
  { label: 'Stand', color: STAND, short: '11h', value: '11 hr', current: '11', goal: '12', pct: 92 },
];

const WORKOUTS = [
  { label: 'Morning Run', value: '320' },
  { label: 'Cycle', value: '180' },
  { label: 'Walk', value: '90' },
  { label: 'Yoga', value: '60' },
];

const root: React.CSSProperties = { position: 'absolute', inset: 0, padding: cell(SCALE.pad),
  display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const g3: React.CSSProperties = { display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap), height: '100%' };
const center: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

function Dot({ color }: { color: string }) {
  return <span style={{ width: cell(0.05), height: cell(0.05), borderRadius: '50%', background: color, flexShrink: 0 }} />;
}

function StatRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: cell(0.04) }}>
      <Dot color={color} />
      <span style={{ flex: 1, fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{label}</span>
      <b style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--text)' }}>{value}</b>
    </div>
  );
}

export function ActivityRings({ w, h }: WidgetContentProps) {
  if (w === 1 && h === 1) {
    return (
      <div style={{ ...root, ...center }}>
        <ConcRings size={0.66} rings={RINGS} stroke={0.05} />
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={root}>
        <div style={{ fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>Activity</div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: cell(0.08), alignItems: 'center', flex: 1 }}>
          <ConcRings size={0.5} rings={RINGS} stroke={0.045} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: cell(0.03) }}>
            {STATS.map((s) => <StatRow key={s.label} color={s.color} label={s.label} value={s.short} />)}
          </div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={{ ...root, ...g3 }}>
        <Header label="Today's Activity" />
        <div style={center}>
          <ConcRings size={0.8} rings={RINGS} stroke={0.055} />
        </div>
        <div style={{ display: 'grid', gridAutoRows: 'auto', gap: cell(0.03) }}>
          {STATS.map((s) => <StatRow key={s.label} color={s.color} label={s.label} value={s.value} />)}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={{ ...root, ...g3 }}>
      <Header label="Today's Activity" />
      <div style={{ display: 'flex', gap: cell(0.1), alignItems: 'center', flex: 1 }}>
        <ConcRings size={1.15} rings={RINGS} stroke={0.065} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: cell(0.05), justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: cell(0.045) }}>
            {STATS.map((s) => (
              <MetricBar key={s.label} label={s.label} color={s.color} current={s.current} goal={s.goal} pct={s.pct} />
            ))}
          </div>
          <div style={{ height: 1, background: 'rgba(148,163,184,0.16)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: cell(0.035) }}>
            {WORKOUTS.map((wk) => (
              <div key={wk.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>
                <span>{wk.label}</span>
                <b style={{ fontSize: cell(SCALE.fontTitle), color: 'var(--text)' }}>{wk.value}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div />
    </div>
  );
}
