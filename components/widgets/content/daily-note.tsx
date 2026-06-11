import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import React from 'react';

const ACCENT = '#6366f1';
const NOTE_TEXT = "Had a productive morning — finished the widget design spec and got sign-off. Need to follow up with the team about the sprint planning agenda and check in on the backend ticket.";
const CHECKLIST = [
  { text: 'Follow up on backend ticket', done: true  },
  { text: 'Sprint planning agenda',      done: true  },
  { text: 'Review PR #47',               done: false },
  { text: 'Team check-in at 3pm',        done: false },
];

function PencilIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CheckItem({ text, done }: { text: string; done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        background: done ? ACCENT : 'transparent',
        border: done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {done && <svg width={9} height={9} viewBox="0 0 12 12" fill="none">
          <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>}
      </div>
      <span style={{
        fontSize: 11,
        color: done ? 'var(--muted)' : 'var(--text)',
        textDecoration: done ? 'line-through' : 'none',
      }}>{text}</span>
    </div>
  );
}

export function DailyNote({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>Jun 10</div>
          <PencilIcon size={14} />
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text)',
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', lineHeight: 1.4,
        } as React.CSSProperties}>{NOTE_TEXT}</div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>June 10</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Daily Note</div>
          </div>
          <PencilIcon size={16} />
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text)', overflow: 'hidden' }}>{NOTE_TEXT}</div>
      </div>
    );
  }

  if (w === 2 && h === 3) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>June 10</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Daily Note</div>
          </div>
          <PencilIcon size={16} />
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, flex: 1, overflow: 'hidden' }}>{NOTE_TEXT}</div>
        <div style={{ height: 1, background: 'var(--border-hairline)', margin: '8px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {CHECKLIST.slice(0, 3).map((item) => <CheckItem key={item.text} {...item} />)}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={{ ...s, flexDirection: 'row', gap: 12 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>June 10</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Daily Note</div>
          </div>
          <PencilIcon size={16} />
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, overflow: 'hidden', flex: 1 }}>{NOTE_TEXT}</div>
      </div>
      <div style={{ width: 1, background: 'var(--border-hairline)' }} />
      <div style={{ width: 130, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-start' }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Checklist</div>
        {CHECKLIST.map((item) => <CheckItem key={item.text} {...item} />)}
      </div>
    </div>
  );
}
