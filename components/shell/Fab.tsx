'use client';
import { useState } from 'react';
import styles from './Fab.module.css';
import { useBoard } from '@/lib/state/boardStore';
import { SIZE_PRESETS } from '@/lib/grid/sizes';
import type { Category } from '@/lib/grid/types';

const CATEGORIES: Category[] = ['finance', 'lifestyle', 'health', 'calendar'];

export function Fab() {
  const addWidget = useBoard((s) => s.addWidget);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('finance');
  const [presetName, setPresetName] = useState(SIZE_PRESETS[0].name);

  function create() {
    const preset = SIZE_PRESETS.find((p) => p.name === presetName)!;
    addWidget(category, preset.w, preset.h);
    setOpen(false);
  }

  return (
    <>
      {open && (
        <div className={`${styles.popover} glass`}>
          <div className={styles.label}>Category</div>
          <div className={styles.grid}>
            {CATEGORIES.map((c) => (
              <button key={c} className={styles.opt} data-on={category === c} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className={styles.label} style={{ marginTop: 14 }}>Size</div>
          <div className={styles.grid}>
            {SIZE_PRESETS.map((p) => (
              <button key={p.name} className={styles.opt} data-on={presetName === p.name} onClick={() => setPresetName(p.name)}>
                {p.name}
              </button>
            ))}
          </div>
          <button className={styles.create} onClick={create}>Add widget</button>
        </div>
      )}
      <button className={styles.fab} onClick={() => setOpen((o) => !o)} aria-label="add widget">
        +
      </button>
    </>
  );
}
