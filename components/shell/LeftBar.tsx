'use client';
import { useRef, useState } from 'react';
import { PencilLine, Info } from 'lucide-react';
import styles from './LeftBar.module.css';
import { useSettings } from '@/lib/state/settingsStore';
import { useUi } from '@/lib/state/uiStore';
import { useBoard } from '@/lib/state/boardStore';
import { presentCategories } from '@/lib/grid/categories';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { CreditsModal } from './CreditsModal';

export function LeftBar() {
  const activeTags = useSettings((s) => s.activeTags);
  const toggleTag = useSettings((s) => s.toggleTag);
  const manageMode = useUi((s) => s.manageMode);
  const toggleManageMode = useUi((s) => s.toggleManageMode);
  const widgets = useBoard((s) => s.widgets);
  const availableTags = presentCategories(widgets);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);

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
        <PencilLine size={18} />
      </button>
      <div className={styles.divider} />
      {availableTags.map((c) => {
        const def = WIDGET_REGISTRY.find((d) => d.category === c)!;
        const Icon = def.icon;
        return (
          // TODO(leftbar-expand): render Icon + def.label side-by-side when sidebar is in expanded mode
          <button
            key={c}
            className={styles.chip}
            data-active={activeTags.includes(c)}
            onClick={() => toggleTag(c)}
            aria-pressed={activeTags.includes(c)}
            aria-label={def.label}
          >
            <Icon size={18} />
          </button>
        );
      })}
      <button
        ref={infoButtonRef}
        type="button"
        className={styles.infoButton}
        onClick={() => setCreditsOpen(true)}
        aria-label="About"
        title="About"
      >
        <Info size={18} />
      </button>
      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} anchorRef={infoButtonRef} />
    </aside>
  );
}
