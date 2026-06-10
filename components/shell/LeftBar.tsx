'use client';
import styles from './LeftBar.module.css';
import { useSettings } from '@/lib/state/settingsStore';
import type { Category } from '@/lib/grid/types';

const CATEGORIES: Category[] = ['finance', 'lifestyle', 'health', 'calendar'];
const SHORT: Record<Category, string> = { finance: 'Fin', lifestyle: 'Life', health: 'Health', calendar: 'Cal' };

export function LeftBar() {
  const activeTags = useSettings((s) => s.activeTags);
  const toggleTag = useSettings((s) => s.toggleTag);
  return (
    <aside className={styles.bar} aria-label="utility bar">
      <div className={styles.logo} />
      <div className={styles.divider} />
      {CATEGORIES.map((c) => (
        <button
          key={c}
          className={styles.chip}
          data-active={activeTags.includes(c)}
          onClick={() => toggleTag(c)}
          aria-pressed={activeTags.includes(c)}
        >
          {SHORT[c]}
        </button>
      ))}
    </aside>
  );
}
