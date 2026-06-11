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
    position: 'absolute', inset: 0, padding: '1.2em',
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  const visible = h <= 2 ? TIMELINE.slice(0, h === 1 ? 3 : 5) : TIMELINE;

  function EventRow({ ev }: { ev: typeof TIMELINE[0] }) {
    return (
      <div style={{ display: 'flex', gap: '0.8em', alignItems: 'stretch', minHeight: '3.6em' }}>
        <div style={{ width: '3.6em', textAlign: 'right', fontSize: '1em', color: 'var(--muted)', paddingTop: '0.2em', flexShrink: 0 }}>{ev.time}</div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.6em' }}>
          <div style={{ width: '0.3em', borderRadius: '0.2em', background: ev.color }} />
          <div style={{ fontSize: '1.2em', paddingTop: '0.2em' }}>{ev.title}</div>
        </div>
      </div>
    );
  }

  if (w === 1) {
    return (
      <div style={s}>
        <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6em' }}>Today</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4em', overflow: 'hidden' }}>
          {visible.map((ev) => <EventRow key={ev.title} ev={ev} />)}
        </div>
      </div>
    );
  }

  const showNow = h >= 2;
  return (
    <div style={s}>
      <div style={{ marginBottom: '0.6em' }}>
        <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today&apos;s</div>
        <div style={{ fontSize: '1.3em', fontWeight: 600 }}>Schedule</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4em', overflow: 'hidden', position: 'relative' }}>
        {showNow && (
          <div style={{ display: 'flex', gap: '0.8em', alignItems: 'center', marginBottom: '0.2em' }}>
            <div style={{ width: '3.6em', textAlign: 'right', fontSize: '1em', color: '#38bdf8', flexShrink: 0 }}>{NOW_LABEL}</div>
            <div style={{ flex: 1, height: '0.1em', background: '#38bdf8' }} />
          </div>
        )}
        {visible.map((ev) => <EventRow key={ev.title} ev={ev} />)}
      </div>
    </div>
  );
}
