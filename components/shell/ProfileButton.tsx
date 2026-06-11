'use client';
import { useState } from 'react';
import styles from './ProfileButton.module.css';
import { SettingsModal } from './SettingsModal';
import { useProfile } from '@/lib/state/profileStore';

export function ProfileButton() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { displayName, avatarUrl } = useProfile();
  const initial = displayName ? displayName[0].toUpperCase() : '?';

  return (
    <div className={styles.wrap}>
      <button
        className={styles.avatar}
        onClick={() => setSettingsOpen(true)}
        aria-label="profile"
      >
        {initial}
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            className={styles.avatarImg}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </button>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
