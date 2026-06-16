import { cell, SCALE } from '../scale';

export function TransactionRow({ items }: { items: { merchant: string; amount: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: cell(0.05) }}>
      {items.map((t) => (
        <div key={t.merchant} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: cell(0.05),
          padding: `${cell(0.05)} ${cell(0.06)}`, display: 'flex', flexDirection: 'column', gap: cell(0.02) }}>
          <div style={{ fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' }}>{t.merchant}</div>
          <div style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 600, textAlign: 'right' }}>{t.amount}</div>
        </div>
      ))}
    </div>
  );
}
