import type { ReactNode } from 'react';
import { cell, SCALE } from '../scale';

export function Header({ label, aside }: { label: string; aside?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase',
        letterSpacing: '0.07em', color: 'var(--muted)' }}>{label}</div>
      {aside}
    </div>
  );
}
