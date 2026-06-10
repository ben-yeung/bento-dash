'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useDraggable } from '@dnd-kit/core';
import styles from './CarouselCard.module.css';
import type { WidgetDefinition } from '@/lib/widgets/registry';
import type { SizePreset } from '@/lib/grid/sizes';
import type { GridMetrics } from '@/lib/grid/collision';
import type { Category } from '@/lib/grid/types';

interface SizeChipProps {
  preset: SizePreset;
  category: Category;
  onAdd: (w: number, h: number) => void;
}

function SizeChip({ preset, category, onAdd }: SizeChipProps) {
  const { listeners, attributes, setNodeRef, isDragging } = useDraggable({
    id: `palette:${category}:${preset.w}x${preset.h}`,
  });

  const handleClick = () => {
    if (!isDragging) {
      onAdd(preset.w, preset.h);
    }
  };

  return (
    <button
      ref={setNodeRef}
      className={styles.sizeChip}
      {...listeners}
      {...attributes}
      data-dragging={isDragging}
      onClick={handleClick}
    >
      {preset.name}
    </button>
  );
}

export interface CarouselCardProps {
  definition: WidgetDefinition;
  metrics: GridMetrics;
  isOpen: boolean;
  onToggle: () => void;
  onAdd: (w: number, h: number) => void;
}

export function CarouselCard({ definition, metrics: _metrics, isOpen, onToggle, onAdd }: CarouselCardProps) {
  return (
    <div className={styles.card}>
      <button
        className={styles.preview}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={definition.label}
      >
        <span className={styles.dot} style={{ background: definition.accentColor }} />
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
                <SizeChip
                  key={preset.name}
                  preset={preset}
                  category={definition.category}
                  onAdd={onAdd}
                />
              ))}
            </div>
            <span className={styles.hint}>click to add · drag to place</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
