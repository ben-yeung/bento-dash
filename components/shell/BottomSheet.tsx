'use client';
import { AnimatePresence, motion } from 'motion/react';
import styles from './BottomSheet.module.css';
import { WidgetCarousel } from './WidgetCarousel';

interface BottomSheetProps {
  open: boolean;
  cellSize: number;
  onClose: () => void;
}

export function BottomSheet({ open, cellSize, onClose }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sheet-backdrop"
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className={styles.sheet}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.9 }}
          >
            <div className={styles.handle} aria-hidden />
            <WidgetCarousel cellSize={cellSize} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
