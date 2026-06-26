'use client';
import { type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useDraggable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import styles from './Widget.module.css';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { ScaledWidgetContent } from '@/components/widgets/ScaledWidgetContent';
import { WidgetSkeleton } from '@/components/widgets/WidgetSkeleton';
import { useBoard } from '@/lib/state/boardStore';
import type { WidgetLayout } from '@/lib/grid/types';

interface WidgetProps {
  widget: WidgetLayout;
  dragging?: boolean;
  dimmed?: boolean;
  interactive?: boolean;
  isSwapTarget?: boolean;
  manageMode?: boolean;
  resizing?: boolean;
  snapTarget?: string | null;
  children?: ReactNode;
  longPressHandlers?: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
}

export function Widget({
  widget,
  dragging = false,
  dimmed = false,
  interactive = true,
  isSwapTarget = false,
  manageMode = false,
  resizing = false,
  snapTarget = null,
  children,
  longPressHandlers,
}: WidgetProps) {
  const removeWidget = useBoard((s) => s.removeWidget);
  const def = WIDGET_REGISTRY.find((d) => d.type === widget.widgetType);
  const ContentComponent = def?.ContentComponent ?? WidgetSkeleton;
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
      transition={
        resizing
          ? { duration: 0 }
          : { type: 'spring', stiffness: 520, damping: 42, mass: 0.7 }
      }
      className={styles.tile}
      style={style}
      data-dragging={dragging}
      data-dimmed={dimmed}
      data-swap-target={isSwapTarget}
      data-resizing={resizing}
      data-manage-mode={manageMode}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: dimmed ? 0.18 : 1, scale: 1 }}
      ref={setNodeRef}
      {...attributes}
      onPointerDown={(e) => {
        listeners?.onPointerDown?.(e);
        longPressHandlers?.onPointerDown(e);
      }}
      onPointerMove={(e) => {
        listeners?.onPointerMove?.(e);
        longPressHandlers?.onPointerMove(e);
      }}
      onPointerUp={(e) => {
        listeners?.onPointerUp?.(e);
        longPressHandlers?.onPointerUp(e);
      }}
      onPointerCancel={(e) => {
        listeners?.onPointerCancel?.(e);
        longPressHandlers?.onPointerCancel(e);
      }}
    >
      <ScaledWidgetContent
        category={widget.category}
        w={widget.w}
        h={widget.h}
        ContentComponent={ContentComponent}
      />
      {snapTarget && (
        <span className={styles.snapBadge}>{snapTarget}</span>
      )}
      {manageMode && (
        <svg className={styles.manageBorder} aria-hidden>
          <rect x="0" y="0" width="100%" height="100%" rx="14" ry="14" />
        </svg>
      )}
      {/* TODO(manage-mode-x-exit-anim): the X mounts/unmounts via the manageMode conditional with only enter animation (initial/animate); it pops out abruptly when manage mode toggles off. Wrap in AnimatePresence with an exit prop if the pop-out animation is wanted. */}
      {manageMode && (
        <motion.button
          type="button"
          className={styles.close}
          aria-label="Delete widget"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => removeWidget(widget.id)}
        >
          <Trash2 size={12} strokeWidth={2.5} />
        </motion.button>
      )}
      {children}
    </motion.div>
  );
}
