'use client';
import styles from './AppShell.module.css';
import { ThemeController } from './ThemeController';
import { BentoBoard } from '@/components/board/BentoBoard';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <ThemeController />
      <aside aria-label="utility bar" style={{ borderRight: '1px solid var(--border-hairline)' }} />
      <div className={styles.main}>
        <div className={styles.scroll}>
          <BentoBoard />
        </div>
      </div>
    </div>
  );
}
