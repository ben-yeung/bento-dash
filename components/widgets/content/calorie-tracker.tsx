import type React from 'react';
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { cell, fcell, SCALE } from './scale';
import { Header, Donut, ProgressBar, StatStrip, MetricBar } from './_shared';

const GREEN = '#6bcb77';
const PCT = 77;

const MACROS = [
  { label: 'Protein', color: '#6366f1', current: '142', goal: '160g', short: '142', pct: 89 },
  { label: 'Carbs', color: '#ffd93d', current: '198', goal: '230g', short: '198', pct: 86 },
  { label: 'Fat', color: '#ff6b6b', current: '68', goal: '80g', short: '68', pct: 85 },
];
const MEALS = [
  { name: 'Breakfast', cal: '420' },
  { name: 'Lunch', cal: '680' },
  { name: 'Snack', cal: '210' },
  { name: 'Dinner', cal: '530' },
];

const root: React.CSSProperties = { position: 'absolute', inset: 0, padding: cell(SCALE.pad),
  display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const g3: React.CSSProperties = { display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap), height: '100%' };

export function CalorieTracker({ w, h }: WidgetContentProps) {
  if (w === 1 && h === 1) {
    return (
      <div style={{ ...root, alignItems: 'center', justifyContent: 'center' }}>
        <Donut pct={PCT} color={GREEN} size={0.72} stroke={0.055} label="1,840" sub="CAL" />
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={root}>
        <Header label="Calories" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: cell(0.045) }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: cell(0.06) }}>
            <div style={{ fontSize: fcell(0.22), fontWeight: 700 }}>1,840</div>
            <div style={{ fontSize: fcell(0.13), fontWeight: 500, color: 'var(--muted)' }}>/ 2,400</div>
          </div>
          <ProgressBar pct={PCT} color={GREEN} />
          <div style={{ display: 'flex', gap: cell(0.1), fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>
            {MACROS.map((m) => (
              <span key={m.label}>{m.label[0]} <b style={{ color: m.color }}>{m.short}</b></span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={{ ...root, ...g3 }}>
        <Header label="Today's Calories" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Donut pct={PCT} color={GREEN} size={1.18} stroke={0.07} label="1,840" sub="of 2,400" />
        </div>
        <StatStrip items={MACROS.map((m) => ({ label: m.label, value: `${m.current}g` }))} />
      </div>
    );
  }

  // 3×2
  return (
    <div style={{ ...root, ...g3 }}>
      <Header label="Today's Calories" />
      <div style={{ display: 'flex', gap: cell(0.1), alignItems: 'center', flex: 1 }}>
        <Donut pct={PCT} color={GREEN} size={1.15} stroke={0.065} label="1,840" sub="of 2,400" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: cell(0.05), justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: cell(0.045) }}>
            {MACROS.map((m) => (
              <MetricBar key={m.label} label={m.label} color={m.color} current={m.current} goal={m.goal} pct={m.pct} />
            ))}
          </div>
          <div style={{ height: 1, background: 'rgba(148,163,184,.16)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: cell(0.035) }}>
            {MEALS.map((meal) => (
              <div key={meal.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>
                <span>{meal.name}</span>
                <b style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 600, color: 'var(--text)' }}>{meal.cal}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div />
    </div>
  );
}
