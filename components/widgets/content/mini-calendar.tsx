import type React from 'react';
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { cell, SCALE } from './scale';

const MONTH = 'June';
const YEAR = 2026;
const TODAY = 10;
const ACCENT = '#3b82f6';
const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sun→Sat
// June 1 2026 is a Monday → exactly one leading blank cell before day 1.
const LEADING_BLANKS = new Date(2026, 5, 1).getDay(); // = 1

const root: React.CSSProperties = {
  position: 'absolute', inset: 0, padding: cell(SCALE.pad),
  display: 'flex', flexDirection: 'column', color: 'var(--text)', overflow: 'hidden',
};
const g3: React.CSSProperties = {
  display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap), height: '100%',
};
const label: React.CSSProperties = { fontSize: cell(SCALE.fontTitle), fontWeight: 600 };

/** Build the visible day cells: one leading blank, then 1..lastDay. */
function buildCells(lastDay: number): (number | null)[] {
  const cells: (number | null)[] = [];
  for (let i = 0; i < LEADING_BLANKS; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);
  return cells;
}

function MonthGrid({ lastDay, fontRatio, gap }: { lastDay: number; fontRatio: number; gap: number }) {
  const cells = buildCells(lastDay);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: '1fr',
      placeItems: 'center', gap: cell(gap), fontSize: cell(fontRatio), color: 'var(--text)',
    }}>
      {DOW_LABELS.map((d, i) => (
        <span key={`dow-${i}`} style={{ color: 'var(--muted)' }}>{d}</span>
      ))}
      {cells.map((day, i) => (
        <span
          key={day == null ? `blank-${i}` : `day-${day}`}
          style={day === TODAY
            ? { background: ACCENT, color: '#fff', width: '1.5em', height: '1.5em', borderRadius: '50%', display: 'grid', placeItems: 'center' }
            : undefined}
        >
          {day ?? ''}
        </span>
      ))}
    </div>
  );
}

function Nav() {
  return <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>‹ ›</div>;
}

export function MiniCalendar({ w, h }: WidgetContentProps) {
  if (w === 1 && h === 1) {
    return (
      <div style={{ ...root, justifyContent: 'center' }}>
        <div style={{ fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase', letterSpacing: '0.07em', color: ACCENT }}>Jun</div>
        <div style={{ fontSize: cell(0.34), fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1 }}>{TODAY}</div>
        <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>Wednesday</div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    // 2×2: label + 3 weeks (through day 20), no nav.
    return (
      <div style={{ ...root, ...g3 }}>
        <div style={label}>{MONTH} {YEAR}</div>
        <MonthGrid lastDay={20} fontRatio={0.13} gap={0.02} />
        <div />
      </div>
    );
  }

  if (w === 3 && h === 2) {
    // 3×2: label + nav + 2 weeks (through day 13).
    return (
      <div style={{ ...root, ...g3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={label}>{MONTH} {YEAR}</div>
          <Nav />
        </div>
        <MonthGrid lastDay={13} fontRatio={0.12} gap={0.03} />
        <div />
      </div>
    );
  }

  // 3×3: label + nav + full month (through day 30).
  return (
    <div style={{ ...root, ...g3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={label}>{MONTH} {YEAR}</div>
        <Nav />
      </div>
      <MonthGrid lastDay={30} fontRatio={0.11} gap={0.04} />
      <div />
    </div>
  );
}
