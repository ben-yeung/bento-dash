import type React from 'react';
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { cell, fcell } from './scale';
import { Header, StreakBadge, WeekHeatmap } from './_shared';

const AMBER = '#f59e0b';
const GREEN = '#10b981';
const INDIGO = '#6366f1';
const PINK = '#ec4899';
const PENDING = '#2a3550';

/** Single source of truth for the 3×2 heatmap + adjacent streak badges.
 *  Each row's number of `true` days MUST equal its `count` (test-enforced). */
export const HEATMAP_ROWS: { color: string; days: boolean[]; count: number; label: string }[] = [
  { color: AMBER,  label: 'Morning run', count: 5, days: [true, true, true, false, true, true, false] },   // 5
  { color: GREEN,  label: 'Read 30 min', count: 6, days: [true, true, false, true, true, true, true] },     // 6
  { color: INDIGO, label: 'Meditate',    count: 5, days: [true, false, true, true, true, false, true] },    // 5
  { color: PINK,   label: 'Workout',     count: 4, days: [false, true, true, false, true, true, false] },   // 4
];

// 1×1 / 2×1 / 2×2: dot color + streak per habit (mockup: amber/green/indigo done, then pending).
const HABITS = [
  { name: 'Morning run', color: AMBER,   streak: 5 },
  { name: 'Read 30 min', color: GREEN,   streak: 6 },
  { name: 'Meditate',    color: INDIGO,  streak: 5 },
  { name: 'Workout',     color: PENDING, streak: 4 },
  { name: 'Stretch',     color: PENDING, streak: 2 },
];

const DONE = '3/5';

const root: React.CSSProperties = {
  position: 'absolute', inset: 0, padding: cell(0.09),
  display: 'flex', flexDirection: 'column', color: 'var(--text)', overflow: 'hidden',
};

function Dot({ color, size }: { color: string; size: number }) {
  return (
    <span style={{ width: cell(size), height: cell(size), borderRadius: '50%',
      background: color, flexShrink: 0, display: 'inline-block' }} />
  );
}

const asideCount = (
  <div style={{ fontSize: fcell(0.13), fontWeight: 700, color: GREEN }}>{DONE}</div>
);

export function HabitTracker({ w, h }: WidgetContentProps) {
  if (w === 1 && h === 1) {
    return (
      <div style={root}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: fcell(0.075), textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>Habits</div>
          {asideCount}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: cell(0.07) }}>
          <div style={{ display: 'flex', gap: cell(0.07) }}>
            {HABITS.slice(0, 3).map((hab) => <Dot key={hab.name} color={hab.color} size={0.2} />)}
          </div>
          <div style={{ display: 'flex', gap: cell(0.07) }}>
            {HABITS.slice(3, 5).map((hab) => <Dot key={hab.name} color={PENDING} size={0.2} />)}
          </div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={{ ...root, justifyContent: 'space-between' }}>
        <Header label="Today's Habits" aside={asideCount} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
          {HABITS.map((hab) => (
            <div key={hab.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: cell(0.04) }}>
              <Dot color={hab.color} size={0.2} />
              <StreakBadge count={hab.streak} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={{ ...root, gap: cell(0.06) }}>
        <Header label="Today's Habits" aside={asideCount} />
        <div style={{ flex: 1, display: 'grid', gridAutoRows: '1fr' }}>
          {HABITS.slice(0, 4).map((hab) => (
            <div key={hab.name} style={{ display: 'flex', alignItems: 'center', gap: cell(0.08) }}>
              <Dot color={hab.color} size={0.1} />
              <span style={{ flex: 1, fontWeight: 500, fontSize: fcell(0.13),
                color: hab.color === PENDING ? 'var(--muted)' : 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hab.name}</span>
              <StreakBadge count={hab.streak} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={{ ...root, gap: cell(0.06) }}>
      <Header label="Today's Habits" aside={asideCount} />
      <div style={{ display: 'flex', gap: cell(0.08), flex: 1, alignItems: 'stretch', minHeight: 0 }}>
        <div style={{ flex: 1, display: 'grid', gridAutoRows: '1fr' }}>
          {HEATMAP_ROWS.map((row) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: cell(0.08) }}>
              <Dot color={row.color} size={0.1} />
              <span style={{ flex: 1, fontWeight: 500, fontSize: fcell(0.13) }}>{row.label}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, justifyContent: 'center' }}>
          <WeekHeatmap rows={HEATMAP_ROWS.map((r) => ({ color: r.color, days: r.days }))} />
        </div>
      </div>
    </div>
  );
}
