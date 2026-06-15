import { cell } from '../scale';

interface Ring { pct: number; color: string }
interface ConcRingsProps { size: number; rings: Ring[]; stroke?: number }

const TRACK = ['#3a2530', '#3a3520', '#23362a'];

export function ConcRings({ size, rings, stroke = 0.055 }: ConcRingsProps) {
  const R = 50;
  const sw = (stroke / size) * 100;
  return (
    <svg width={cell(size)} height={cell(size)} viewBox="0 0 100 100"
      style={{ display: 'block', flexShrink: 0, transform: 'rotate(-90deg)' }}>
      {rings.map((ring, i) => {
        const r = R - sw / 2 - i * (sw * 1.6);
        const circ = 2 * Math.PI * r;
        const dash = (Math.min(100, ring.pct) / 100) * circ;
        return (
          <g key={i}>
            <circle cx="50" cy="50" r={r} fill="none" stroke={TRACK[i % TRACK.length]} strokeWidth={sw} />
            <circle cx="50" cy="50" r={r} fill="none" stroke={ring.color} strokeWidth={sw}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}
