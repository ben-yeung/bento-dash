'use client';
import { useState } from 'react';
import styles from './ProfileButton.module.css';
import { SettingsModal } from './SettingsModal';

export function ProfileButton() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div className={styles.wrap}>
      <button className={styles.avatar} onClick={() => setMenuOpen((o) => !o)} aria-label="profile">
        B
      </button>
      {menuOpen && (
        <div className={`${styles.menu} glass`}>
          <button
            className={styles.item}
            onClick={() => {
              setSettingsOpen(true);
              setMenuOpen(false);
            }}
          >
            Settings
          </button>
        </div>
      )}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
