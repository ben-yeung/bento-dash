'use client';
import { AnimatePresence, motion } from 'motion/react';
import styles from './Fab.module.css';
import { WidgetCarousel } from './WidgetCarousel';
import { useDragStore } from '@/lib/state/dragStore';

const SPRING_OPEN = { type: 'spring' as const, stiffness: 320, damping: 28, mass: 0.9 };
const SPRING_CLOSE = { type: 'spring' as const, stiffness: 380, damping: 36, mass: 0.85 };

export function Fab() {
  const fabOpen = useDragStore((s) => s.fabOpen);
  const setFabOpen = useDragStore((s) => s.setFabOpen);

  return (
    <>
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            data-testid="fab-backdrop"
            key="backdrop"
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className={styles.anchor}>
      <AnimatePresence mode="popLayout">
        {!fabOpen ? (
          <motion.button
            key="fab-btn"
            layoutId="fab-morph"
            className={styles.fabBtn}
            aria-label="Open widget carousel"
            onClick={() => setFabOpen(true)}
            transition={SPRING_CLOSE}
          >
            +
          </motion.button>
        ) : (
          <motion.div
            key="fab-carousel"
            layoutId="fab-morph"
            transition={SPRING_OPEN}
            style={{ borderRadius: '22px', transformOrigin: 'bottom right' }}
          >
            <WidgetCarousel onClose={() => setFabOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}
