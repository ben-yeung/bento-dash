'use client';
import { useRef } from 'react';
import { LayoutGroup } from 'motion/react';
import styles from './BentoBoard.module.css';
import { Widget } from './Widget';
import { useBoard } from '@/lib/state/boardStore';
import { useGridMetrics } from '@/lib/hooks/useGridMetrics';

export function BentoBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const metrics = useGridMetrics(boardRef);
  const widgets = useBoard((s) => s.widgets);
  return (
    <div
      ref={boardRef}
      className={styles.board}
      style={{ gridAutoRows: `${metrics.cellSize}px` }}
    >
      <LayoutGroup>
        {widgets.map((w) => (
          <Widget key={w.id} widget={w} />
        ))}
      </LayoutGroup>
    </div>
  );
}
