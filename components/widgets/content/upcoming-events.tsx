import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import React from 'react';

const EVENTS = [
  { title: 'Team standup',     time: '9:00 AM',  color: '#3b82f6', subtitle: 'Video call' },
  { title: 'Design review',    time: '11:30 AM', color: '#8b5cf6', subtitle: 'Room 2B'    },
  { title: 'Lunch with Alex',  time: '12:30 PM', color: '#ec4899', subtitle: ''            },
  { title: 'Sprint planning',  time: '2:00 PM',  color: '#10b981', subtitle: 'All-hands'  },
  { title: 'Client call',      time: '4:00 PM',  color: '#f59e0b', subtitle: 'Zoom'       },
];

function Header() {
  return (
    <div style={{ marginBottom: '0.6em' }}>
      <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today&apos;s</div>
      <div style={{ fontSize: '1.3em', fontWeight: 600, color: 'var(--text)' }}>Events</div>
    </div>
  );
}

export function UpcomingEvents({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: '1.2em',
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    const ev = EVENTS[0];
    return (
      <div style={{ ...s, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6em' }}>
          <div style={{ width: '0.8em', height: '0.8em', borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
          <span style={{ fontSize: '1.1em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
        </div>
        <div style={{ fontSize: '1em', color: 'var(--muted)', marginTop: '0.2em', paddingLeft: '1.4em' }}>{ev.time}</div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
          {EVENTS.slice(0, 3).map((ev) => (
            <div key={ev.title} style={{ display: 'flex', alignItems: 'center', gap: '0.6em', fontSize: '1.1em' }}>
              <div style={{ width: '0.8em', height: '0.8em', borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
              <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: '1em' }}>{ev.time}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <Header />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em', overflow: 'hidden' }}>
          {EVENTS.slice(0, 4).map((ev) => (
            <div key={ev.title} style={{ display: 'flex', alignItems: 'center', gap: '0.8em' }}>
              <div style={{ width: '0.8em', height: '0.8em', borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '1.2em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                <div style={{ fontSize: '1em', color: 'var(--muted)' }}>{ev.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={s}>
      <Header />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8em', overflow: 'hidden' }}>
        {EVENTS.map((ev) => (
          <div key={ev.title} style={{ display: 'flex', gap: 0 }}>
            <div style={{ width: '0.3em', borderRadius: '0.2em', background: ev.color, marginRight: '1em', flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '1.2em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
              <div style={{ fontSize: '1em', color: 'var(--muted)' }}>
                {ev.time}{ev.subtitle ? ` · ${ev.subtitle}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
