import type React from 'react';
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { cell, SCALE } from './scale';
import { Header, EventChip } from './_shared';

const EVENTS = [
  { time: '9:00',  title: 'Team standup',  short: 'Standup',       color: '#3b82f6', duration: '30m', subtitle: 'Zoom · 4 people'  },
  { time: '10:00', title: 'Deep work',     short: 'Deep work',     color: '#8b5cf6', duration: '90m', subtitle: 'Focus block'       },
  { time: '11:30', title: 'Design review', short: 'Design review', color: '#ec4899', duration: '45m', subtitle: 'Room 2B'           },
  { time: '12:30', title: 'Lunch',         short: 'Lunch',         color: '#10b981', duration: '60m', subtitle: 'Kitchen'           },
];

const root: React.CSSProperties = { position: 'absolute', inset: 0, padding: cell(SCALE.pad),
  display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const g3: React.CSSProperties = { display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap), height: '100%' };

function Timeline({ count, variant, duration, subtitle, useShort }:
  { count: number; variant?: 'row' | 'stack'; duration?: boolean; subtitle?: boolean; useShort?: boolean }) {
  return (
    <div style={{ display: 'grid', gridAutoRows: '1fr', gap: cell(0.05) }}>
      {EVENTS.slice(0, count).map((ev) => (
        <EventChip key={ev.time} variant={variant} time={ev.time}
          title={useShort ? ev.short : ev.title} color={ev.color}
          duration={duration ? ev.duration : undefined}
          subtitle={subtitle ? ev.subtitle : undefined} />
      ))}
    </div>
  );
}

export function TodaysSchedule({ w, h }: WidgetContentProps) {
  // 2×1 — two chips side by side with duration
  if (w === 2 && h === 1) {
    return (
      <div style={{ ...root, justifyContent: 'center' }}>
        <Timeline count={2} variant="row" duration />
      </div>
    );
  }

  if (w === 1 && h === 2) {
    return (
      <div style={{ ...root, ...g3 }}>
        <Header label="Today" />
        <Timeline count={2} variant="stack" useShort />
        <div />
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={{ ...root, ...g3 }}>
        <Header label="Today · Schedule" />
        <Timeline count={3} variant="row" duration subtitle />
        <div />
      </div>
    );
  }

  // 2×3 and 3×2 (default for the larger sizes): full timeline with durations
  return (
    <div style={{ ...root, ...g3 }}>
      <Header label="Schedule"
        aside={<div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>Wed Jun 10</div>} />
      <Timeline count={4} variant="row" duration />
      <div />
    </div>
  );
}
