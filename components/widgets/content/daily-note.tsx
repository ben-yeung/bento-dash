import type React from 'react';
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { Pencil, Check, Square } from 'lucide-react';
import { cell, SCALE } from './scale';
import { Header } from './_shared';

const ACCENT = '#6366f1';
const GREEN = '#10b981';

// Note prose — per-size, copied from the mockup.
const NOTE_22 = 'Shipped the scaling tokens today. Remember to verify at 4k. Pick up groceries.';
const NOTE_23 = 'Shipped the scaling tokens today. Verify at 4k tomorrow. Note area fills the body region.';
const NOTE_32 = 'Shipped the scaling tokens. Note text fills the left column; checklist sits to the right.';

const CHECKLIST = [
  { text: 'Standup notes', done: true },
  { text: 'Review PR', done: false },
  { text: 'Groceries', done: false },
];

const root: React.CSSProperties = {
  position: 'absolute', inset: 0, padding: cell(SCALE.pad),
  display: 'flex', flexDirection: 'column', color: 'var(--text)', overflow: 'hidden',
};

function PencilHead() {
  return <Pencil style={{ width: cell(0.14), height: cell(0.14), color: ACCENT, flexShrink: 0 }} />;
}

function CheckItem({ text, done }: { text: string; done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: cell(0.05), fontSize: cell(SCALE.fontDetail) }}>
      {done
        ? <Check style={{ width: cell(0.11), height: cell(0.11), color: GREEN, flexShrink: 0 }} />
        : <Square style={{ width: cell(0.11), height: cell(0.11), color: 'var(--muted)', flexShrink: 0 }} />}
      <span style={{
        color: done ? 'var(--muted)' : 'var(--text)',
        textDecoration: done ? 'line-through' : 'none',
      }}>{text}</span>
    </div>
  );
}

function Note({ text, size }: { text: string; size?: number }) {
  return (
    <div style={{ fontSize: cell(size ?? SCALE.fontTitle), lineHeight: 1.4, fontWeight: 500,
      color: 'var(--text)', overflow: 'hidden' }}>{text}</div>
  );
}

const between: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
};

export function DailyNote({ w, h }: WidgetContentProps) {
  // 1×1 — date + pencil header + checklist ONLY (no prose).
  if (w === 1 && h === 1) {
    return (
      <div style={root}>
        <div style={between}>
          <div style={{ fontSize: cell(SCALE.fontLabel), color: 'var(--muted)' }}>Jun 10</div>
          <PencilHead />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', gap: cell(0.05) }}>
          {CHECKLIST.map((item) => <CheckItem key={item.text} {...item} />)}
        </div>
      </div>
    );
  }

  // 2×2 — header + note body.
  if (w === 2 && h === 2) {
    return (
      <div style={{ ...root, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap) }}>
        <Header label="June 10 · Daily Note" aside={<PencilHead />} />
        <Note text={NOTE_22} />
        <div />
      </div>
    );
  }

  // 2×3 — header + note + checklist footer.
  if (w === 2 && h === 3) {
    return (
      <div style={{ ...root, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap) }}>
        <Header label="Daily Note" aside={<PencilHead />} />
        <Note text={NOTE_23} />
        <div style={{ display: 'grid', gap: cell(0.05),
          borderTop: '1px solid var(--border-hairline)', paddingTop: cell(0.06) }}>
          {CHECKLIST.map((item) => <CheckItem key={item.text} {...item} />)}
        </div>
      </div>
    );
  }

  // 3×2 — note left + divider + checklist right.
  return (
    <div style={{ ...root, flexDirection: 'row', gap: cell(0.08) }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header label="Daily Note" aside={<PencilHead />} />
        <div style={{ marginTop: cell(0.04) }}>
          <Note text={NOTE_32} />
        </div>
      </div>
      <div style={{ width: '1px', background: 'var(--border-hairline)', flexShrink: 0 }} />
      <div style={{ width: '40%', display: 'grid', gap: cell(0.05), alignContent: 'start' }}>
        <div style={{ fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--muted)' }}>Checklist</div>
        {CHECKLIST.map((item) => <CheckItem key={item.text} {...item} />)}
      </div>
    </div>
  );
}
