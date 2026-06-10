'use client';
import { type CSSProperties } from 'react';
import { motion } from 'motion/react';
import styles from './Widget.module.css';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import type { WidgetLayout } from '@/lib/grid/types';

interface WidgetProps {
  widget: WidgetLayout;
  dragging?: boolean;
  dimmed?: boolean;
}

export function Widget({ widget, dragging = false, dimmed = false }: WidgetProps) {
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
    >
      <WidgetSkeleton category={widget.category} />
    </motion.div>
  );
}
