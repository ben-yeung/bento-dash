'use client';
import styles from './Widget.module.css';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import type { WidgetLayout } from '@/lib/grid/types';
import type { GridMetrics } from '@/lib/grid/collision';
import { cellSpanToPixels } from '@/lib/grid/collision';

export function DragOverlayWidget({ widget, metrics }: { widget: WidgetLayout; metrics: GridMetrics }) {
  const { width, height } = cellSpanToPixels(widget.w, widget.h, metrics);
  const def = WIDGET_REGISTRY.find((d) => d.category === widget.category);
  const ContentComponent = def?.ContentComponent;
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
      {ContentComponent && (
        <ContentComponent category={widget.category} w={widget.w} h={widget.h} />
      )}
    </div>
  );
}
