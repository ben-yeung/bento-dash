import { fcell } from '../scale';

export function StreakBadge({ count }: { count: number }) {
  return (
    <span style={{ fontSize: fcell(0.12), color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>
      🔥 <span>{count}</span>
    </span>
  );
}
