'use client';
import { PencilLine, Plus, Check } from 'lucide-react';
import styles from './BottomNav.module.css';
import { useSettings } from '@/lib/state/settingsStore';
import { useUi } from '@/lib/state/uiStore';
import { useBoard } from '@/lib/state/boardStore';
import { presentCategories } from '@/lib/grid/categories';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';

interface BottomNavProps {
  sheetOpen: boolean;
  onSheetOpen: () => void;
  onSheetClose: () => void;
}

export function BottomNav({ sheetOpen, onSheetOpen, onSheetClose }: BottomNavProps) {
  const activeTags = useSettings((s) => s.activeTags);
  const toggleTag = useSettings((s) => s.toggleTag);
  const manageMode = useUi((s) => s.manageMode);
  const toggleManageMode = useUi((s) => s.toggleManageMode);
  const widgets = useBoard((s) => s.widgets);
  const availableTags = presentCategories(widgets);

  return (
    <nav className={styles.nav} aria-label="navigation">
      <div className={styles.chips}>
        {availableTags.map((c) => {
          const def = WIDGET_REGISTRY.find((d) => d.category === c)!;
          const Icon = def.icon;
          return (
            <button
              key={c}
              className={styles.chip}
              data-active={activeTags.includes(c)}
              onClick={() => toggleTag(c)}
              aria-pressed={activeTags.includes(c)}
              aria-label={def.label}
            >
              <Icon size={15} />
              <span className={styles.chipLabel}>{def.label}</span>
            </button>
          );
        })}
      </div>
      <button
        className={styles.editBtn}
        data-active={manageMode}
        onClick={toggleManageMode}
        aria-pressed={manageMode}
        aria-label={manageMode ? 'Done editing' : 'Edit widgets'}
      >
        {manageMode ? <Check size={18} /> : <PencilLine size={18} />}
      </button>
      <button
        className={styles.addBtn}
        onClick={sheetOpen ? onSheetClose : onSheetOpen}
        aria-label="Add widget"
        aria-expanded={sheetOpen}
      >
        <Plus size={20} />
      </button>
    </nav>
  );
}
