'use client';
import { type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useDraggable } from '@dnd-kit/core';
import styles from './Widget.module.css';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import type { WidgetLayout } from '@/lib/grid/types';

interface WidgetProps {
  widget: WidgetLayout;
  dragging?: boolean;
  dimmed?: boolean;
  interactive?: boolean;
  children?: ReactNode; // resize handle injected later
}

export function Widget({
  widget,
  dragging = false,
  dimmed = false,
  interactive = true,
  children,
}: WidgetProps) {
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
      className={styles.tile}
      style={style}
      data-dragging={dragging}
      data-dimmed={dimmed}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: dimmed ? 0.18 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      ref={setNodeRef}
      {...(interactive ? listeners : {})}
      {...attributes}
    >
      <WidgetSkeleton category={widget.category} w={widget.w} h={widget.h} />
      {children}
    </motion.div>
  );
}
