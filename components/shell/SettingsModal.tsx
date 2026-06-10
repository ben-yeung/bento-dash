'use client';
import styles from './SettingsModal.module.css';
import { useSettings, ACCENT_PRESETS } from '@/lib/state/settingsStore';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} glass`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="settings">
        <h2 className={styles.title}>Settings</h2>

        <div className={styles.row}>
          <div className={styles.label}>Theme</div>
          <div className={styles.seg}>
            <button className={styles.segBtn} data-on={s.theme === 'dark'} onClick={() => s.setTheme('dark')}>Dark</button>
            <button className={styles.segBtn} data-on={s.theme === 'light'} onClick={() => s.setTheme('light')}>Light</button>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Board layout</div>
          <div className={styles.seg}>
            <button className={styles.segBtn} data-on={s.layoutMode === 'autoPack'} onClick={() => s.setLayoutMode('autoPack')}>Auto-pack</button>
            <button className={styles.segBtn} data-on={s.layoutMode === 'pushCompact'} onClick={() => s.setLayoutMode('pushCompact')}>Push &amp; compact</button>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Filter behavior</div>
          <div className={styles.seg}>
            <button className={styles.segBtn} data-on={s.filterMode === 'hide'} onClick={() => s.setFilterMode('hide')}>Hide &amp; reflow</button>
            <button className={styles.segBtn} data-on={s.filterMode === 'dim'} onClick={() => s.setFilterMode('dim')}>Dim in place</button>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.label}>Accent</div>
          <div className={styles.swatches}>
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                className={styles.swatch}
                style={{ background: c }}
                data-on={s.accent === c}
                onClick={() => s.setAccent(c)}
                aria-label={`accent ${c}`}
              />
            ))}
            {/* TODO(accent-custom-picker): add an <input type="color"> custom picker beside the preset swatches; wire to s.setAccent. */}
          </div>
        </div>

        <button className={styles.close} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
