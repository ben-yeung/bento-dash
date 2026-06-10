'use client';
import styles from './Widget.module.css';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import type { WidgetLayout } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';
import { cellSpanToPixels } from '@/lib/grid/collision';

export function DragOverlayWidget({ widget, metrics }: { widget: WidgetLayout; metrics: GridMetrics }) {
  const { width, height } = cellSpanToPixels(widget.w, widget.h, metrics);
  return (
    <div
      className={`${styles.tile} glass`}
      style={{
        width,
        height,
        cursor: 'grabbing',
        transform: 'scale(1.03)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
      }}
    >
      <WidgetSkeleton category={widget.category} w={widget.w} h={widget.h} />
    </div>
  );
}
