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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600 }}>{MONTH} {YEAR}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 14, color: 'var(--muted)', cursor: 'default' }}>‹</span>
            <span style={{ fontSize: 14, color: 'var(--muted)', cursor: 'default' }}>›</span>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {DOW_LABELS.map((d, i) => (
          <div key={i} style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'center', paddingBottom: 2 }}>{d}</div>
        ))}
        {GRID.flat().map((day, i) => (
          <div key={i} style={{
            fontSize: 10, textAlign: 'center', padding: '2px 0',
            borderRadius: 4,
            background: day === TODAY ? ACCENT : 'transparent',
            color: day === TODAY ? '#fff' : day ? 'var(--text)' : 'transparent',
            position: 'relative',
          }}>
            {day ?? '·'}
            {day && EVENT_DAYS.has(day) && day !== TODAY && (
              <div style={{
                width: 3, height: 3, borderRadius: '50%', background: ACCENT,
                position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)',
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
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={{ ...s, alignItems: 'flex-start', justifyContent: 'center', gap: 1 }}>
        <div style={{ fontSize: 10, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{MONTH.slice(0,3)}</div>
        <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{TODAY}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>Wednesday</div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT, marginTop: 4 }} />
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={{ ...s }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{MONTH} {YEAR}</div>
        <MonthGrid />
      </div>
    );
  }

  if (w === 3 && h === 2) {
    return (
      <div style={s}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{MONTH} {YEAR}</div>
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
