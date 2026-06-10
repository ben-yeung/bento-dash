'use client';
import styles from './AppShell.module.css';
import { ThemeController } from './ThemeController';
import { LeftBar } from './LeftBar';
import { Banner } from './Banner';
import { BentoBoard } from '@/components/board/BentoBoard';
import { ProfileButton } from './ProfileButton';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <ThemeController />
      <LeftBar />
      <div className={styles.main}>
        <div className={styles.scroll}>
          <Banner profileSlot={<ProfileButton />} />
          <BentoBoard />
        </div>
      </div>
    </div>
  );
}
