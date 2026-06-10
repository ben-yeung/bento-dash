'use client';
import { type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useDraggable } from '@dnd-kit/core';
import styles from './Widget.module.css';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import { useBoard } from '@/lib/state/boardStore';
import type { WidgetLayout } from '@/lib/grid/types';

interface WidgetProps {
  widget: WidgetLayout;
  dragging?: boolean;
  dimmed?: boolean;
  interactive?: boolean;
  manageMode?: boolean;
  children?: ReactNode; // resize handle injected by BentoBoard
}

export function Widget({
  widget,
  dragging = false,
  dimmed = false,
  interactive = true,
  manageMode = false,
  children,
}: WidgetProps) {
  const removeWidget = useBoard((s) => s.removeWidget);
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: widget.id,
    disabled: !interactive,
  });
  const style: CSSProperties = {
    gridColumn: `${widget.x + 1} / span ${widget.w}`,
    gridRow: `${widget.y + 1} / span ${widget.h}`,
  };
  return (
    <motion.div
      layout
      layoutId={widget.id}
      transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.7 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: dimmed ? 0.18 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={styles.tile}
      style={style}
      data-dragging={dragging}
      data-dimmed={dimmed}
      ref={setNodeRef}
      {...(interactive ? listeners : {})}
      {...attributes}
    >
      <WidgetSkeleton category={widget.category} />
      {manageMode && (
        <motion.button
          type="button"
          className={styles.close}
          aria-label="Delete widget"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          // Stop the pointer-down from reaching the tile's drag listeners,
          // so clicking × never starts a drag.
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => removeWidget(widget.id)}
        >
          ×
        </motion.button>
      )}
      {children}
    </motion.div>
  );
}
