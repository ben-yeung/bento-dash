import { cell, fcell, SCALE } from '../scale';

interface DonutProps {
  pct: number;            // 0–100 arc fill
  color: string;
  size: number;           // ring diameter as ratio of cell
  stroke?: number;        // band thickness as ratio of cell
  label?: string;
  sub?: string;
}

export function Donut({ pct, color, size, stroke = 0.05, label, sub }: DonutProps) {
  const R = 50;
  const sw = (stroke / size) * 100;      // stroke in viewBox units
  const r = R - sw / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div style={{ position: 'relative', width: cell(size), height: cell(size), flexShrink: 0 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      {(label || sub) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {label && <div style={{ fontSize: fcell(size * 0.28), fontWeight: 800, lineHeight: 1 }}>{label}</div>}
          {sub && <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}
