'use client';
import styles from './DropPreview.module.css';
import type { WidgetLayout } from '@/lib/grid/types';

interface DropPreviewProps {
  widget: WidgetLayout;
  mode?: 'insert' | 'none';
}

export function DropPreview({ widget, mode = 'insert' }: DropPreviewProps) {
  return (
    <div
      className={styles.ghost}
      data-mode={mode}
      style={{
        gridColumn: `${widget.x + 1} / span ${widget.w}`,
        gridRow: `${widget.y + 1} / span ${widget.h}`,
      }}
    />
  );
}
