import type React from 'react';
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { cell, SCALE } from './scale';
import { Header, ProgressBar, StatStrip } from './_shared';

const ACCENT = '#38bdf8';
const PCT = 82;

// 3×2 hourly bar chart — heights are percentages of the chart body, verbatim from the mockup.
const HOURLY = [25, 85, 38, 24, 18, 15, 76, 50, 32, 22, 100];
const AXIS = ['6am', '8am', '10am', '12pm', '2pm', '4pm'];

const STATS = [
  { label: 'Distance', value: '5.2km' },
  { label: 'Active', value: '44m' },
  { label: 'Floors', value: '8' },
];

const root: React.CSSProperties = { position: 'absolute', inset: 0, padding: cell(SCALE.pad),
  display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const g3: React.CSSProperties = { display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap), height: '100%' };

const label: React.CSSProperties = { fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase',
  letterSpacing: '0.07em', color: 'var(--muted)' };
const detail: React.CSSProperties = { fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' };

export function Steps({ w, h }: WidgetContentProps) {
  if (w === 1 && h === 1) {
    return (
      <div style={{ ...root, justifyContent: 'center' }}>
        <div style={label}>Steps</div>
        <div style={{ fontSize: cell(0.2), fontWeight: 800, color: ACCENT }}>8,190</div>
        <div style={{ margin: `${cell(0.04)} 0` }}>
          <ProgressBar pct={PCT} color={ACCENT} />
        </div>
        <div style={detail}>82% of 10k</div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={root}>
        <Header label="Steps" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: cell(0.04) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: cell(SCALE.fontValue), fontWeight: 700, color: ACCENT }}>8,190</div>
            <div style={detail}>/ 10,000</div>
          </div>
          <ProgressBar pct={PCT} color={ACCENT} />
          <div style={{ ...detail, display: 'flex', gap: cell(0.16) }}>
            <span>Dist <b style={{ color: 'var(--text)' }}>5.2km</b></span>
            <span>Active <b style={{ color: 'var(--text)' }}>44m</b></span>
          </div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={{ ...root, ...g3 }}>
        <div style={label}>Today · Steps</div>
        <div style={{ alignSelf: 'center' }}>
          <div style={{ fontSize: cell(SCALE.fontHero), fontWeight: 800, color: ACCENT }}>8,190</div>
          <div style={detail}>steps</div>
          <div style={{ margin: `${cell(0.04)} 0` }}>
            <ProgressBar pct={PCT} color={ACCENT} />
          </div>
          <div style={detail}>82% of 10k</div>
        </div>
        <StatStrip items={STATS} />
      </div>
    );
  }

  // 3×2 — hourly bar chart
  return (
    <div style={{ ...root, ...g3 }}>
      <Header
        label="Steps"
        aside={
          <div style={{ fontSize: cell(SCALE.fontValue), fontWeight: 700, color: ACCENT }}>
            8,190 <span style={{ ...detail, fontWeight: 500, fontSize: cell(SCALE.fontTitle) }}>/ 10,000</span>
          </div>
        }
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: cell(0.03), minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: cell(0.025), minHeight: 0 }}>
          {HOURLY.map((pct, i) => (
            <i key={i} style={{ flex: 1, height: `${pct}%`, borderRadius: 3,
              background: pct === 100 ? ACCENT : 'rgba(56,189,248,.35)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: cell(0.025) }}>
          {AXIS.flatMap((a, i) => {
            const slots = [
              <span key={a} style={{ ...detail, flex: 1, textAlign: 'center', fontSize: cell(SCALE.fontLabel) }}>{a}</span>,
            ];
            if (i < AXIS.length - 1) slots.push(<span key={`${a}-gap`} style={{ flex: 1 }} />);
            return slots;
          })}
        </div>
      </div>
      <div style={{ ...detail, display: 'flex', gap: cell(0.16),
        borderTop: '1px solid var(--border-hairline)', paddingTop: cell(0.06) }}>
        <span>Dist <b style={{ color: 'var(--text)' }}>5.2km</b></span>
        <span>Active <b style={{ color: 'var(--text)' }}>44m</b></span>
        <span>Floors <b style={{ color: 'var(--text)' }}>8</b></span>
      </div>
    </div>
  );
}
