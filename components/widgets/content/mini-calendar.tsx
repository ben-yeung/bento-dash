import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import React from 'react';

const MONTH = 'June';
const YEAR  = 2026;
const TODAY = 10;
const DAYS_IN_MONTH = 30;
const FIRST_DOW = 1; // Monday=1 for June 2026
const EVENT_DAYS = new Set([3, 7, 10, 15, 18, 22, 25]);
const ACCENT = '#3b82f6';
const DOW_LABELS = ['M','T','W','T','F','S','S'];

function buildGrid(): (number | null)[][] {
  const rows: (number | null)[][] = [];
  let row: (number | null)[] = Array(FIRST_DOW).fill(null);
  for (let d = 1; d <= DAYS_IN_MONTH; d++) {
    row.push(d);
    if (row.length === 7) { rows.push(row); row = []; }
  }
  if (row.length > 0) { while (row.length < 7) row.push(null); rows.push(row); }
  return rows;
}
const GRID = buildGrid();

function MonthGrid({ showNav }: { showNav?: boolean }) {
  return (
    <div>
      {showNav && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6em' }}>
          <div style={{ fontSize: '1.1em', fontWeight: 600 }}>{MONTH} {YEAR}</div>
          <div style={{ display: 'flex', gap: '0.6em' }}>
            <span style={{ fontSize: '1.4em', color: 'var(--muted)', cursor: 'default' }}>‹</span>
            <span style={{ fontSize: '1.4em', color: 'var(--muted)', cursor: 'default' }}>›</span>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '0.2em' }}>
        {DOW_LABELS.map((d, i) => (
          <div key={i} style={{ fontSize: '0.9em', color: 'var(--muted)', textAlign: 'center', paddingBottom: '0.2em' }}>{d}</div>
        ))}
        {GRID.flat().map((day, i) => (
          <div key={i} style={{
            fontSize: '1em', textAlign: 'center', padding: '0.2em 0',
            borderRadius: '0.4em',
            background: day === TODAY ? ACCENT : 'transparent',
            color: day === TODAY ? '#fff' : day ? 'var(--text)' : 'transparent',
            position: 'relative',
          }}>
            {day ?? '·'}
            {day && EVENT_DAYS.has(day) && day !== TODAY && (
              <div style={{
                width: '0.3em', height: '0.3em', borderRadius: '50%', background: ACCENT,
                position: 'absolute', bottom: '0.1em', left: '50%', transform: 'translateX(-50%)',
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniCalendar({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: '1.2em',
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={{ ...s, alignItems: 'flex-start', justifyContent: 'center', gap: 1 }}>
        <div style={{ fontSize: '1em', color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{MONTH.slice(0,3)}</div>
        <div style={{ fontSize: '3.2em', fontWeight: 700, lineHeight: 1 }}>{TODAY}</div>
        <div style={{ fontSize: '1em', color: 'var(--muted)' }}>Wednesday</div>
        <div style={{ width: '0.8em', height: '0.8em', borderRadius: '50%', background: ACCENT, marginTop: '0.4em' }} />
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={{ ...s }}>
        <div style={{ fontSize: '1.1em', fontWeight: 600, marginBottom: '0.6em' }}>{MONTH} {YEAR}</div>
        <MonthGrid />
      </div>
    );
  }

  if (w === 3 && h === 2) {
    return (
      <div style={s}>
        <div style={{ fontSize: '1.1em', fontWeight: 600, marginBottom: '0.6em' }}>{MONTH} {YEAR}</div>
        <MonthGrid />
      </div>
    );
  }

  // 3×3
  return (
    <div style={s}>
      <MonthGrid showNav />
    </div>
  );
}
