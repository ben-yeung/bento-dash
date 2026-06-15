import type React from 'react';
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { cell, SCALE } from './scale';
import { Header, EventChip } from './_shared';

const EVENTS = [
  { time: '9:00',  title: 'Team standup',  color: '#3b82f6', duration: '30 min', subtitle: 'Zoom · 3 people' },
  { time: '10:00', title: 'Deep work',     color: '#8b5cf6', duration: '90 min', subtitle: 'Focus block'    },
  { time: '11:30', title: 'Design review', color: '#ec4899', duration: '45 min', subtitle: 'Room 2B'        },
];

const root: React.CSSProperties = { position: 'absolute', inset: 0, padding: cell(SCALE.pad),
  display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const g3: React.CSSProperties = { display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap), height: '100%' };

function ChipBody({ count, duration }: { count: number; duration?: boolean }) {
  return (
    <div style={{ display: 'grid', gridAutoRows: '1fr', gap: cell(0.05) }}>
      {EVENTS.slice(0, count).map((ev) => (
        <EventChip key={ev.title} time={ev.time} title={ev.title} color={ev.color}
          duration={duration ? ev.duration : undefined} />
      ))}
    </div>
  );
}

export function UpcomingEvents({ w, h }: WidgetContentProps) {
  if (w === 1 && h === 1) {
    const ev = EVENTS[0];
    return (
      <div style={{ ...root, justifyContent: 'center' }}>
        <div style={{ fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>Next</div>
        <div style={{ fontSize: cell(SCALE.fontValue), fontWeight: 700, margin: `${cell(0.02)} 0 ${cell(0.04)}` }}>{ev.time}</div>
        <div style={{ fontSize: cell(SCALE.fontTitle) }}>{ev.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: cell(0.06), marginTop: cell(0.06) }}>
          <span style={{ width: cell(0.06), height: cell(0.06), borderRadius: '50%', background: ev.color }} />
          <span style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>in 25 min</span>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={{ ...root, justifyContent: 'center' }}>
        <ChipBody count={2} />
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={{ ...root, ...g3 }}>
        <Header label="Today's Events" />
        <ChipBody count={3} />
        <div />
      </div>
    );
  }

  // 3×2
  return (
    <div style={{ ...root, ...g3 }}>
      <Header label="Upcoming Events"
        aside={<div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>Wed Jun 10</div>} />
      <div style={{ display: 'grid', gridAutoRows: '1fr', gap: cell(0.05) }}>
        {EVENTS.slice(0, 2).map((ev) => (
          <div key={ev.title} style={{ display: 'flex', alignItems: 'center', gap: cell(0.07),
            borderRadius: cell(0.06), padding: `${cell(0.05)} ${cell(0.07)}`,
            background: `${ev.color}1f`, borderLeft: `${cell(0.025)} solid ${ev.color}` }}>
            <div>
              <div style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}>{ev.time}</div>
              <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{ev.duration}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
              <div style={{ fontSize: cell(SCALE.fontTitle), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
              <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{ev.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
      <div />
    </div>
  );
}
