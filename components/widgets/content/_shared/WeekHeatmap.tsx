import { cell } from '../scale';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function WeekHeatmap({ rows }: { rows: { color: string; days: boolean[] }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: cell(0.02),
        marginBottom: cell(0.025), placeItems: 'center' }}>
        {DAYS.map((d, i) => <span key={i} style={{ fontSize: cell(0.07), color: 'var(--muted)' }}>{d}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: '1fr',
        gap: cell(0.02), flex: 1, minHeight: cell(0.7) }}>
        {rows.flatMap((row, ri) =>
          row.days.map((on, di) => (
            <i key={`${ri}-${di}`} style={{ borderRadius: 2, background: on ? row.color : 'rgba(255,255,255,0.08)' }} />
          )),
        )}
      </div>
    </div>
  );
}
