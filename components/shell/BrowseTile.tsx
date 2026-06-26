'use client';
import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import styles from './BrowseTile.module.css';
import { ScaledWidgetContent } from '@/components/widgets/ScaledWidgetContent';
import type { WidgetDefinition } from '@/lib/widgets/registry';
import { useSettings } from '@/lib/state/settingsStore';
import { getRowCount } from '@/lib/state/gridState';

interface BrowseTileProps {
  definition: WidgetDefinition;
  onSelect: () => void;
  cellSize: number;
  isMobile?: boolean;
}

export function BrowseTile({ definition, onSelect, cellSize, isMobile = false }: BrowseTileProps) {
  const orientation = useSettings((s) => s.layoutOrientation);
  const defaultSize = (() => {
    if (orientation !== 'horizontal') return definition.supportedSizes[0];
    const rows = getRowCount();
    return definition.supportedSizes.find((s) => s.h <= rows) ?? definition.supportedSizes[0];
  })();
  const dragId = `palette:${definition.category}:${definition.type}:${defaultSize.w}x${defaultSize.h}`;

  const { listeners, attributes, setNodeRef, isDragging } = useDraggable({ id: dragId, disabled: isMobile });

  return (
    <div className={styles.wrap} style={{ '--w-accent': definition.accentColor } as CSSProperties}>
      <button
        ref={setNodeRef}
        type="button"
        className={styles.tile}
        style={
          {
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            '--cell-size': `${cellSize}px`,
          } as CSSProperties
        }
        data-dragging={isDragging}
        onClick={() => { if (!isDragging) onSelect(); }}
        aria-label={definition.label}
        {...listeners}
        {...attributes}
      >
        <ScaledWidgetContent
          category={definition.category}
          w={1}
          h={1}
          ContentComponent={definition.ContentComponent}
        />
      </button>
      <div className={styles.labelRow}>
        <span className={styles.dot} />
        <span className={styles.label}>{definition.label}</span>
      </div>
    </div>
  );
}
