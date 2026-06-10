'use client';
import styles from './LeftBar.module.css';
import { useSettings } from '@/lib/state/settingsStore';
import { useUi } from '@/lib/state/uiStore';
import { useBoard } from '@/lib/state/boardStore';
import { presentCategories } from '@/lib/grid/categories';
import type { Category } from '@/lib/grid/types';

const SHORT: Record<Category, string> = { finance: 'Fin', lifestyle: 'Life', health: 'Health', calendar: 'Cal' };

export function LeftBar() {
  const activeTags = useSettings((s) => s.activeTags);
  const toggleTag = useSettings((s) => s.toggleTag);
  const manageMode = useUi((s) => s.manageMode);
  const toggleManageMode = useUi((s) => s.toggleManageMode);
  const widgets = useBoard((s) => s.widgets);
  const availableTags = presentCategories(widgets);

  return (
    <aside className={styles.bar} aria-label="utility bar">
      <div className={styles.logo} />
      <button
        className={styles.manageToggle}
        data-active={manageMode}
        onClick={toggleManageMode}
        aria-pressed={manageMode}
        aria-label="Toggle manage mode"
        title="Manage widgets"
      >
        ✎
      </button>
      <div className={styles.divider} />
      {availableTags.map((c) => (
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
