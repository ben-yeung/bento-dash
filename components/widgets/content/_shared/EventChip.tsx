import type React from 'react';
import { cell, SCALE } from '../scale';

interface EventChipProps {
  time: string; title: string; color: string; duration?: string; subtitle?: string;
  variant?: 'row' | 'stack';   // stack = time top-left, title bottom-right (1×2 schedule)
}

function tint(hex: string) { return `${hex}1f`; } // ~12% alpha

function ampm(time: string) { return parseInt(time) >= 12 ? 'pm' : 'am'; }

export function EventChip({ time, title, color, duration, subtitle, variant = 'row' }: EventChipProps) {
  const base: React.CSSProperties = {
    display: 'flex', borderRadius: cell(0.06), padding: `${cell(0.05)} ${cell(0.07)}`,
    background: tint(color), borderLeft: `${cell(0.025)} solid ${color}`, gap: cell(0.07),
  };
  const timeEl = (
    <span style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 700, color: 'var(--text)', lineHeight: 1, whiteSpace: 'nowrap' }}>
      {time}<span style={{ fontSize: cell(SCALE.fontDetail), fontWeight: 400, color: 'var(--muted)', marginLeft: cell(0.02) }}>{ampm(time)}</span>
    </span>
  );
  const durEl = duration && <span style={{ fontSize: cell(SCALE.fontDetail), fontWeight: 500, color: 'var(--muted)' }}>{duration}</span>;

  if (variant === 'stack') {
    return (
      <div style={{ ...base, flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch', gap: cell(0.02) }}>
        {timeEl}
        <span style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 400, textAlign: 'right' }}>{title}</span>
      </div>
    );
  }
  return (
    <div style={{ ...base, alignItems: 'center' }}>
      <div>{timeEl}{durEl && <div>{durEl}</div>}</div>
      <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
        <div style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{subtitle}</div>}
      </div>
    </div>
  );
}
