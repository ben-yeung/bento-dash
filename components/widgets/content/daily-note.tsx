'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type React from 'react';
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { Check, Square, Plus } from 'lucide-react';
import { cell, SCALE } from './scale';
import { Header } from './_shared';

const GREEN = '#10b981';

const INITIAL_NOTE =
  'Shipped the scaling tokens today.\nRemember to verify at 4k.\nPick up groceries.';

type Item = { id: string; text: string; done: boolean };

const INITIAL_ITEMS: Item[] = [
  { id: '1', text: 'Standup notes', done: true },
  { id: '2', text: 'Review PR', done: false },
  { id: '3', text: 'Groceries', done: false },
];

const root: React.CSSProperties = {
  position: 'absolute', inset: 0, padding: cell(SCALE.pad),
  display: 'flex', flexDirection: 'column', color: 'var(--text)', overflow: 'hidden',
};

// ── CheckItem ─────────────────────────────────────────────────────────────────

function CheckItem({ id, text, done, onToggle }: Item & { onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: cell(0.05),
        fontSize: cell(SCALE.fontDetail), cursor: 'pointer', userSelect: 'none',
      }}
    >
      {done
        ? <Check style={{ width: cell(0.11), height: cell(0.11), color: GREEN, flexShrink: 0 }} />
        : <Square style={{ width: cell(0.11), height: cell(0.11), color: 'var(--muted)', flexShrink: 0 }} />}
      <span style={{ color: done ? 'var(--muted)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>
        {text}
      </span>
    </div>
  );
}

// ── AddItemRow ────────────────────────────────────────────────────────────────

function AddItemRow({ onAdd }: { onAdd: (text: string) => void }) {
  const [value, setValue] = useState('');

  function commit() {
    const t = value.trim();
    if (t) { onAdd(t); setValue(''); }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: cell(0.05), fontSize: cell(SCALE.fontDetail) }}>
      <Plus style={{ width: cell(0.11), height: cell(0.11), color: 'var(--muted)', flexShrink: 0 }} />
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); }}
        onBlur={commit}
        placeholder="Add item…"
        style={{
          background: 'none', border: 'none', outline: 'none',
          color: 'var(--muted)', fontSize: 'inherit', fontFamily: 'inherit',
          width: '100%', padding: 0,
        }}
      />
    </div>
  );
}

// ── Note — inline editing + autoscroll on hover ───────────────────────────────

function Note({ text, onChange, fsz }: { text: string; onChange: (t: string) => void; fsz?: number }) {
  const [editing, setEditing] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fontSize = fsz ?? SCALE.fontTitle;

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  // Detect overflow whenever text or editing state changes, and on resize.
  useEffect(() => {
    if (editing) return;
    const check = () => {
      if (!containerRef.current || !innerRef.current) return;
      setHasOverflow(innerRef.current.scrollHeight > containerRef.current.clientHeight + 4);
    };
    check();
    const ro = new ResizeObserver(check);
    if (containerRef.current) ro.observe(containerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [text, editing]);

  function onMouseEnter() {
    if (editing) return;
    setHovered(true);
    if (!containerRef.current || !innerRef.current) return;
    const ov = innerRef.current.scrollHeight - containerRef.current.clientHeight;
    if (ov > 4) setScrollY(ov);
  }

  function onMouseLeave() {
    setHovered(false);
    setScrollY(0);
  }

  const textStyle: React.CSSProperties = {
    fontSize: cell(fontSize), lineHeight: 1.4, fontWeight: 500, color: 'var(--text)',
  };

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={e => { if (e.key === 'Escape') setEditing(false); }}
        style={{
          ...textStyle,
          flex: 1, width: '100%', height: '100%',
          background: 'none', border: 'none', outline: 'none',
          resize: 'none', fontFamily: 'inherit', padding: 0, overflow: 'auto',
        }}
      />
    );
  }

  const duration = Math.max(0.8, scrollY / 40);

  return (
    <div
      ref={containerRef}
      onClick={() => setEditing(true)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: 'text', minHeight: 0 }}
    >
      <div
        ref={innerRef}
        style={{
          ...textStyle,
          transform: `translateY(-${scrollY}px)`,
          transition: scrollY > 0 ? `transform ${duration}s linear` : 'transform 0.4s ease',
        }}
      >
        {text.split('\n').map((s, i) => (
          <div key={i}>{s || ' '}</div>
        ))}
      </div>
      {hasOverflow && !hovered && (
        <span style={{ ...textStyle, position: 'absolute', bottom: 0, right: 0, lineHeight: 1, pointerEvents: 'none' }}>
          …
        </span>
      )}
    </div>
  );
}

// ── DailyNote ─────────────────────────────────────────────────────────────────

export function DailyNote({ w, h }: WidgetContentProps) {
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [note, setNote] = useState(INITIAL_NOTE);
  const nextId = useRef(INITIAL_ITEMS.length);

  const toggle = useCallback((id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, done: !it.done } : it));
  }, []);

  const addItem = useCallback((text: string) => {
    nextId.current += 1;
    setItems(prev => [...prev, { id: String(nextId.current), text, done: false }]);
  }, []);

  function itemRows() {
    return (
      <>
        {items.map(it => <CheckItem key={it.id} {...it} onToggle={() => toggle(it.id)} />)}
        <AddItemRow onAdd={addItem} />
      </>
    );
  }

  // 1×1 — date header + checklist only (no prose).
  if (w === 1 && h === 1) {
    return (
      <div style={root}>
        <div style={{ fontSize: cell(SCALE.fontLabel), color: 'var(--muted)' }}>Jun 10</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: cell(0.05) }}>
          {itemRows()}
        </div>
      </div>
    );
  }

  // 2×2 — header + note body.
  if (w === 2 && h === 2) {
    return (
      <div style={{ ...root, display: 'grid', gridTemplateRows: 'auto 1fr', gap: cell(SCALE.gap) }}>
        <Header label="June 10 · Daily Note" />
        <Note text={note} onChange={setNote} />
      </div>
    );
  }

  // 2×3 — header + note + checklist footer.
  if (w === 2 && h === 3) {
    return (
      <div style={{ ...root, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap) }}>
        <Header label="Daily Note" />
        <Note text={note} onChange={setNote} />
        <div style={{ display: 'grid', gap: cell(0.05), borderTop: '1px solid var(--border-hairline)', paddingTop: cell(0.06) }}>
          {itemRows()}
        </div>
      </div>
    );
  }

  // 3×2 — note left + divider + checklist right.
  return (
    <div style={{ ...root, flexDirection: 'row', gap: cell(0.08) }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header label="Daily Note" />
        <div style={{ marginTop: cell(0.04), flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Note text={note} onChange={setNote} />
        </div>
      </div>
      <div style={{ width: '1px', background: 'var(--border-hairline)', flexShrink: 0 }} />
      <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: cell(0.05), overflow: 'hidden' }}>
        <div style={{ fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>
          Checklist
        </div>
        {itemRows()}
      </div>
    </div>
  );
}
