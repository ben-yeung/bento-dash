'use client';
import styles from './DropPreview.module.css';
import type { WidgetLayout } from '@/lib/grid/types';

export function DropPreview({ widget }: { widget: WidgetLayout }) {
  return (
    <div
      className={styles.ghost}
      style={{
        gridColumn: `${widget.x + 1} / span ${widget.w}`,
        gridRow: `${widget.y + 1} / span ${widget.h}`,
      }}
    />
  );
}
