import type { ComponentType, CSSProperties } from 'react';
import type { WidgetContentProps } from './WidgetSkeleton';
import type { Category } from '@/lib/grid/types';
import { tokenStyle } from '@/components/widgets/content/scale';

interface ScaledWidgetContentProps {
  category: Category;
  w: number;
  h: number;
  ContentComponent: ComponentType<WidgetContentProps>;
}

// Single content-scaling seam: content authored in cell-relative tokens scales
// with the ancestor's `--cell-size`. Used by the board tile and the drag overlay
// (and, once the carousel work lands, the carousel preview card). When real
// widget content replaces the skeleton, this is the only place the scaling
// wiring lives.
export function ScaledWidgetContent({ category, w, h, ContentComponent }: ScaledWidgetContentProps) {
  const style: CSSProperties = {
    position: 'absolute',
    inset: 0,
    containerType: 'size',
    color: 'var(--text)',
    ...tokenStyle(),
  };
  return (
    <div style={style}>
      <ContentComponent category={category} w={w} h={h} />
    </div>
  );
}
