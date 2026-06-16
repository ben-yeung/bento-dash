import { cell, SCALE } from '../scale';

export function ProgressBar({ pct, color, height = 0.05 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height: cell(height), borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
    </div>
  );
}

export function SegmentedBar({ segments, remainder = 0, height = 0.07 }:
  { segments: { weight: number; color: string }[]; remainder?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', height: cell(height), borderRadius: 999, overflow: 'hidden' }}>
      {segments.map((s, i) => <div key={i} style={{ flex: s.weight, background: s.color }} />)}
      {remainder > 0 && <div style={{ flex: remainder, background: 'rgba(255,255,255,0.06)' }} />}
    </div>
  );
}

export function MetricBar({ label, color, current, goal, pct }:
  { label: string; color: string; current: string; goal: string; pct: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: cell(SCALE.fontDetail) }}>
        <span style={{ color }}>{label}</span>
        <b style={{ color: 'var(--text)' }}>{current}/{goal}</b>
      </div>
      <ProgressBar pct={pct} color={color} />
    </div>
  );
}
