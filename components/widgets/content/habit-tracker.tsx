import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import React from 'react';

const ACCENT = '#10b981';
const HABITS = [
  { name: 'Morning run',        done: true  },
  { name: 'Read 30 min',        done: true  },
  { name: 'Meditate',           done: true  },
  { name: 'Limited Screentime', done: false },
  { name: 'Workout',            done: false },
];
const DONE_COUNT = HABITS.filter((h) => h.done).length;
const WEEK_DAYS = ['M','T','W','T','F','S','S'];
const WEEK_DONE: boolean[][] = HABITS.map((hab, hi) =>
  WEEK_DAYS.map((_, di) => (hi + di) % 3 !== 0)
);

function HabitDot({ size, done }: { size: number; done: boolean }) {
  return (
    <div style={{
      width: `${size/10}em`, height: `${size/10}em`, borderRadius: '50%', flexShrink: 0,
      background: done ? ACCENT : 'transparent',
      border: done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {done && (
        <svg width={`${(size * 0.55)/10}em`} height={`${(size * 0.55)/10}em`} viewBox="0 0 12 12" fill="none">
          <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export function HabitTracker({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: '1.2em',
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Habits</div>
          <div style={{ fontSize: '1.3em', fontWeight: 700, color: ACCENT }}>{DONE_COUNT}/{HABITS.length}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5em' }}>
          <div style={{ display: 'flex', gap: '0.4em' }}>
            {HABITS.slice(0, 3).map((h) => <HabitDot key={h.name} size={20} done={h.done} />)}
          </div>
          <div style={{ display: 'flex', gap: '0.4em' }}>
            {HABITS.slice(3).map((h) => <HabitDot key={h.name} size={20} done={h.done} />)}
          </div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={{ ...s, flexDirection: 'row', alignItems: 'center', gap: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: 'auto' }}>
          <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today&apos;s</div>
          <div style={{ fontSize: '1.3em', fontWeight: 600 }}>Habits</div>
        </div>
        <div style={{ display: 'flex', gap: '0.6em', alignItems: 'center' }}>
          <div style={{ fontSize: '1.5em', fontWeight: 700, color: ACCENT, marginRight: '0.8em' }}>{DONE_COUNT}/{HABITS.length}</div>
          {HABITS.map((h) => <HabitDot key={h.name} size={28} done={h.done} />)}
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8em' }}>
          <div>
            <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today&apos;s</div>
            <div style={{ fontSize: '1.3em', fontWeight: 600 }}>Habits</div>
          </div>
          <div>
            <div style={{ fontSize: '0.9em', color: 'var(--muted)', textTransform: 'uppercase' }}>Done</div>
            <div style={{ fontSize: '1.5em', fontWeight: 700, color: ACCENT }}>{DONE_COUNT}/{HABITS.length}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
          {HABITS.map((hab) => (
            <div key={hab.name} style={{ display: 'flex', alignItems: 'center', gap: '0.8em' }}>
              <HabitDot size={18} done={hab.done} />
              <span style={{ flex: 1, fontSize: '1.2em' }}>{hab.name}</span>
              <div style={{
                width: '1.6em', height: '1.6em', borderRadius: '50%',
                background: hab.done ? ACCENT : 'transparent',
                border: hab.done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
              }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={{ ...s, flexDirection: 'row', gap: '1.2em' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '0.8em' }}>
          <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today&apos;s</div>
          <div style={{ fontSize: '1.3em', fontWeight: 600 }}>Habits</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
          {HABITS.map((hab) => (
            <div key={hab.name} style={{ display: 'flex', alignItems: 'center', gap: '0.8em' }}>
              <div style={{
                width: '1.6em', height: '1.6em', borderRadius: '50%',
                background: hab.done ? ACCENT : 'transparent',
                border: hab.done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
              }} />
              <span style={{ flex: 1, fontSize: '1.1em' }}>{hab.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: '1px', background: 'var(--border-hairline)' }} />
      <div style={{ width: '8em' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4em' }}>
          {WEEK_DAYS.map((d, i) => (
            <div key={i} style={{ fontSize: '0.8em', color: 'var(--muted)', width: '1em', textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        {HABITS.map((hab, hi) => (
          <div key={hab.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3em' }}>
            {WEEK_DAYS.map((_, di) => (
              <div key={di} style={{
                width: '1em', height: '1em', borderRadius: '0.2em',
                background: WEEK_DONE[hi][di] ? ACCENT : 'rgba(255,255,255,0.08)',
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
