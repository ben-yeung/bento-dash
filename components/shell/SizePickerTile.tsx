'use client';
import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import styles from './SizePickerTile.module.css';
import { ScaledWidgetContent } from '@/components/widgets/ScaledWidgetContent';
import type { WidgetDefinition } from '@/lib/widgets/registry';
import type { SizePreset } from '@/lib/grid/sizes';

interface SizePickerTileProps {
  definition: WidgetDefinition;
  size: SizePreset;
  onAdd: (w: number, h: number) => void;
  cellSize: number;
  gap: number;
  isMobile?: boolean;
}

export function SizePickerTile({ definition, size, onAdd, cellSize, gap, isMobile = false }: SizePickerTileProps) {
  const dragId = `palette:${definition.category}:${definition.type}:${size.w}x${size.h}`;
  const { listeners, attributes, setNodeRef, isDragging } = useDraggable({ id: dragId, disabled: isMobile });

  const tileW = size.w * cellSize + (size.w - 1) * gap;
  const tileH = size.h * cellSize + (size.h - 1) * gap;

  return (
    <div className={styles.wrap} style={{ '--w-accent': definition.accentColor } as CSSProperties}>
      <button
        ref={setNodeRef}
        type="button"
        className={styles.tile}
        style={
          {
            width: `${tileW}px`,
            height: `${tileH}px`,
            '--cell-size': `${cellSize}px`,
          } as CSSProperties
        }
        data-dragging={isDragging}
        onClick={() => { if (!isDragging) onAdd(size.w, size.h); }}
        aria-label={`${size.w} × ${size.h}`}
        {...listeners}
        {...attributes}
      >
        <ScaledWidgetContent
          category={definition.category}
          w={size.w}
          h={size.h}
          ContentComponent={definition.ContentComponent}
        />
      </button>
      <div className={styles.labelRow}>
        <span className={styles.dot} />
        <span className={styles.dimLabel}>{size.w} × {size.h}</span>
      </div>
    </div>
  );
}
