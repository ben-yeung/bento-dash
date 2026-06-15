import { cell, SCALE } from '../scale';

export function StatStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: cell(0.06) }}>
      {items.map((it) => (
        <div key={it.label} style={{ flex: 1 }}>
          <div style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 600 }}>{it.value}</div>
          <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}
