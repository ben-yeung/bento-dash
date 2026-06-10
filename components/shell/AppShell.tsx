'use client';
import styles from './AppShell.module.css';
import { ThemeController } from './ThemeController';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <ThemeController />
      <aside aria-label="utility bar" style={{ borderRight: '1px solid var(--border-hairline)' }} />
      <div className={styles.main}>
        <div className={styles.scroll}>
          <div style={{ padding: '24px 0', color: 'var(--muted)' }}>board mounts here</div>
        </div>
      </div>
    </div>
  );
}
