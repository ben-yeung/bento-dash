'use client';
import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useDraggable } from '@dnd-kit/core';
import styles from './CarouselCard.module.css';
import { ScaledWidgetContent } from '@/components/widgets/ScaledWidgetContent';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import type { WidgetDefinition } from '@/lib/widgets/registry';
import type { SizePreset } from '@/lib/grid/sizes';

// Menu preview cell px, smaller than a board cell so the widget reads as a shrunk tile.
const MENU_PREVIEW_CELL = 34;

interface SizeChipProps {
  preset: SizePreset;
  onAdd: (w: number, h: number) => void;
}

function SizeChip({ preset, onAdd }: SizeChipProps) {
  return (
    <button type="button" className={styles.sizeChip} onClick={() => onAdd(preset.w, preset.h)}>
      {preset.name}
    </button>
  );
}

export interface CarouselCardProps {
  definition: WidgetDefinition;
  isOpen: boolean;
  onToggle: () => void;
  onAdd: (w: number, h: number) => void;
}

export function CarouselCard({ definition, isOpen, onToggle, onAdd }: CarouselCardProps) {
  const defaultSize = definition.supportedSizes[0];
  const dragId = `palette:${definition.category}:${definition.type}:${defaultSize.w}x${defaultSize.h}`;
  const { listeners, attributes, setNodeRef, isDragging } = useDraggable({ id: dragId });
  const ContentComponent = definition.ContentComponent ?? WidgetSkeleton;

  return (
    <div className={styles.card}>
      <button
        ref={setNodeRef}
        type="button"
        className={styles.preview}
        style={{ '--cell-size': `${MENU_PREVIEW_CELL}px` } as CSSProperties}
        data-dragging={isDragging}
        onClick={() => {
          if (!isDragging) onToggle();
        }}
        aria-expanded={isOpen}
        aria-label={definition.label}
        {...listeners}
        {...attributes}
      >
        <ScaledWidgetContent
          category={definition.category}
          w={defaultSize.w}
          h={defaultSize.h}
          ContentComponent={ContentComponent}
        />
        <span className={styles.label}>{definition.label}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.picker}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          >
            <span className={styles.pickerLabel}>{definition.label}</span>
            <div className={styles.chips}>
              {definition.supportedSizes.map((preset) => (
                <SizeChip key={preset.name} preset={preset} onAdd={onAdd} />
              ))}
            </div>
            <span className={styles.hint}>click to add · drag card to place</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
