'use client';
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef } from 'react';
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
  isSwapTarget?: boolean;
  onMount?: (id: string, el: HTMLElement) => void;
  onUnmount?: (id: string) => void;
  children?: ReactNode;
}

export function Widget({
  widget,
  dragging = false,
  dimmed = false,
  interactive = true,
  isSwapTarget = false,
  onMount,
  onUnmount,
  children,
}: WidgetProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: widget.id,
    disabled: !interactive,
  });

  // Maintain a local ref alongside dnd-kit's setNodeRef so we can register
  // the DOM element for bounding-box hit detection in BentoBoard.
  const localRef = useRef<HTMLDivElement | null>(null);
  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      setNodeRef(el);
      localRef.current = el;
    },
    [setNodeRef],
  );

  useEffect(() => {
    if (localRef.current) onMount?.(widget.id, localRef.current);
    return () => { onUnmount?.(widget.id); };
  // onMount/onUnmount are stable useCallback refs from BentoBoard — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.id]);

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
      data-swap-target={isSwapTarget}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: dimmed ? 0.18 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      ref={combinedRef}
      {...(interactive ? listeners : {})}
      {...attributes}
    >
      <WidgetSkeleton category={widget.category} w={widget.w} h={widget.h} />
      {children}
    </motion.div>
  );
}
