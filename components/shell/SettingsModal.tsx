'use client';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Camera } from 'lucide-react';
import styles from './SettingsModal.module.css';
import { useSettings, ACCENT_PRESETS } from '@/lib/state/settingsStore';
import { useProfile } from '@/lib/state/profileStore';
import { useBoard } from '@/lib/state/boardStore';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  const p = useProfile();

  const [confirmingReset, setConfirmingReset] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const isCustom = !ACCENT_PRESETS.includes(s.accent);
  // Escape sets this flag so the subsequent onBlur doesn't save before the input unmounts.
  const cancelledRef = useRef(false);

  function openNameEdit() {
    setNameInput(p.displayName);
    setAvatarEditorOpen(false);
    setEditingName(true);
  }

  function saveName() {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setEditingName(false);
      return;
    }
    p.setDisplayName(nameInput.trim());
    setEditingName(false);
  }

  function openAvatarEditor() {
    setUrlInput(p.avatarUrl.startsWith('data:') ? '' : p.avatarUrl);
    setEditingName(false);
    setAvatarEditorOpen((o) => !o);
  }

  function applyUrl() {
    p.setAvatarUrl(urlInput.trim());
    setAvatarEditorOpen(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        p.setAvatarUrl(result);
        setAvatarEditorOpen(false);
      }
    };
    reader.readAsDataURL(file);
  }

  const initial = p.displayName ? p.displayName[0].toUpperCase() : '?';

  const modal = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} glass`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="settings"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeX} onClick={onClose} type="button" aria-label="close settings">&#x2715;</button>
        </div>

        {/* Profile header */}
        <div className={styles.profileHeader}>
          <button
            className={styles.profileAvatar}
            onClick={openAvatarEditor}
            aria-label="change avatar"
            type="button"
          >
            <span>{initial}</span>
            {p.avatarUrl && (
              <img
                src={p.avatarUrl}
                alt=""
                className={styles.profileAvatarImg}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className={styles.avatarOverlay}><Camera size={20} /></div>
          </button>
          <div className={styles.profileInfo}>
            {editingName ? (
              <input
                className={styles.nameInput}
                value={nameInput}
                autoFocus
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') {
                    cancelledRef.current = true;
                    setEditingName(false);
                  }
                }}
                aria-label="display name"
              />
            ) : (
              <button
                className={styles.nameDisplay}
                onClick={openNameEdit}
                type="button"
                aria-label="edit display name"
              >
                {p.displayName || 'Set display name'}
                <span className={styles.pencil}>âœŽ</span>
              </button>
            )}
          </div>
        </div>

        {/* TODO(avatar-editor-blur): spec says collapse on click-outside via onBlur; omitted because blur fires when tabbing between URL input and Apply button, collapsing the row mid-interaction. Revisit with a focus-trap or click-outside hook. */}
        {avatarEditorOpen && (
          <div className={styles.avatarEditor}>
            <input
              className={styles.urlInput}
              placeholder="Paste image URLâ€¦"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyUrl();
              }}
              aria-label="avatar URL"
            />
            <button className={styles.applyBtn} onClick={applyUrl} type="button">
              Apply
            </button>
            <button
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              aria-label="upload avatar"
            />
          </div>
        )}

        <div className={styles.divider} />

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
          <div className={styles.label}>Scroll direction</div>
          <div className={styles.seg}>
            <button className={styles.segBtn} data-on={s.layoutOrientation === 'horizontal'} onClick={() => s.setLayoutOrientation('horizontal')}>Horizontal</button>
            <button className={styles.segBtn} data-on={s.layoutOrientation === 'vertical'} onClick={() => s.setLayoutOrientation('vertical')}>Vertical</button>
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
            <div
              className={styles.colorPickerWrap}
              onClick={() => colorInputRef.current?.click()}
              title="Custom color"
            >
              {isCustom ? (
                <span className={styles.customSwatch} style={{ background: s.accent }} />
              ) : (
                <span className={styles.colorPickerIcon}><Palette size={14} /></span>
              )}
              <input
                ref={colorInputRef}
                type="color"
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
                value={s.accent}
                onChange={(e) => s.setAccent(e.target.value)}
                aria-label="custom accent color"
              />
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.footer}>
          <button
            className={styles.reset}
            type="button"
            onClick={() => console.log(useBoard.getState().widgets)}
          >
            Log Layout
          </button>
          <button
            className={confirmingReset ? styles.resetConfirm : styles.reset}
            type="button"
            onBlur={() => setConfirmingReset(false)}
            onClick={() => {
              if (!confirmingReset) {
                setConfirmingReset(true);
              } else {
                s.resetSettings();
                useBoard.getState().resetBoard();
                p.resetProfile();
                onClose();
              }
            }}
          >
            {confirmingReset ? 'Confirm Reset' : 'Reset Defaults'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
