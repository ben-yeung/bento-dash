import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import React from 'react';

const TIMELINE = [
  { time: '9:00',  title: 'Team standup',    color: '#3b82f6', duration: 30  },
  { time: '10:00', title: 'Deep work',        color: '#8b5cf6', duration: 90  },
  { time: '11:30', title: 'Design review',    color: '#ec4899', duration: 60  },
  { time: '12:30', title: 'Lunch',            color: '#10b981', duration: 60  },
  { time: '2:00',  title: 'Sprint planning',  color: '#f59e0b', duration: 60  },
  { time: '3:00',  title: 'Client call',      color: '#3b82f6', duration: 45  },
  { time: '4:00',  title: 'Code review',      color: '#8b5cf6', duration: 30  },
];
const NOW_LABEL = '2:35';

export function TodaysSchedule({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  const visible = h <= 2 ? TIMELINE.slice(0, h === 1 ? 3 : 5) : TIMELINE;

  function EventRow({ ev }: { ev: typeof TIMELINE[0] }) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', minHeight: 36 }}>
        <div style={{ width: 36, textAlign: 'right', fontSize: 10, color: 'var(--muted)', paddingTop: 2, flexShrink: 0 }}>{ev.time}</div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
          <div style={{ width: 3, borderRadius: 2, background: ev.color }} />
          <div style={{ fontSize: 12, paddingTop: 2 }}>{ev.title}</div>
        </div>
      </div>
    );
  }

  if (w === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Today</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
          {visible.map((ev) => <EventRow key={ev.title} ev={ev} />)}
        </div>
      </div>
    );
  }

  const showNow = h >= 2;
  return (
    <div style={s}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today&apos;s</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Schedule</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden', position: 'relative' }}>
        {showNow && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
            <div style={{ width: 36, textAlign: 'right', fontSize: 10, color: '#38bdf8', flexShrink: 0 }}>{NOW_LABEL}</div>
            <div style={{ flex: 1, height: 1, background: '#38bdf8' }} />
          </div>
        )}
        {visible.map((ev) => <EventRow key={ev.title} ev={ev} />)}
      </div>
    </div>
  );
}
