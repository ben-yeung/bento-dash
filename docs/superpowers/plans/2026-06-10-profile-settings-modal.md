# Profile + Settings Modal Enhancement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the profile-button dropdown with a direct-open settings modal that includes a profile header (editable display name + avatar upload), a custom accent color picker, and a full-reset button.

**Architecture:** A new `profileStore` (Zustand + persist) holds display name and avatar URL independently of the existing `settingsStore`. Both stores gain reset actions. `SettingsModal` gains a profile header section, a custom accent `<input type="color">`, and a two-stage reset button at the bottom. `ProfileButton` drops its dropdown — clicking the avatar opens the modal directly. `Banner` reads `displayName` from `profileStore` replacing the hardcoded string.

**Tech Stack:** Next.js 16, React, Zustand 5, CSS Modules, Vitest + @testing-library/react + userEvent

---

## File Map

| Action   | Path                                             | Responsibility                                   |
|----------|--------------------------------------------------|--------------------------------------------------|
| Create   | `lib/state/profileStore.ts`                      | displayName + avatarUrl store with reset action  |
| Create   | `lib/state/profileStore.test.ts`                 | Unit tests for profileStore                      |
| Modify   | `lib/state/settingsStore.ts`                     | Add `resetSettings()` action + exported defaults |
| Modify   | `lib/state/boardStore.ts`                        | Add `resetBoard()` action                        |
| Modify   | `components/shell/ProfileButton.tsx`             | Remove dropdown, direct modal open, avatar img   |
| Modify   | `components/shell/ProfileButton.module.css`      | Add avatar image + overlay styles                |
| Create   | `components/shell/ProfileButton.test.tsx`        | Tests for simplified ProfileButton               |
| Modify   | `components/shell/Banner.tsx`                    | Wire `displayName` from profileStore             |
| Modify   | `components/shell/SettingsModal.tsx`             | Profile header, accent picker, reset button      |
| Modify   | `components/shell/SettingsModal.module.css`      | Styles for all new SettingsModal sections        |
| Modify   | `components/shell/SettingsModal.test.tsx`        | Tests for profile header and reset button        |

---

## Task 1: profileStore — create store with tests

**Files:**
- Create: `lib/state/profileStore.ts`
- Create: `lib/state/profileStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/state/profileStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useProfile } from './profileStore';

describe('profileStore', () => {
  beforeEach(() => useProfile.setState({ displayName: '', avatarUrl: '' }));

  it('setDisplayName updates displayName', () => {
    useProfile.getState().setDisplayName('Alice');
    expect(useProfile.getState().displayName).toBe('Alice');
  });

  it('setAvatarUrl updates avatarUrl', () => {
    useProfile.getState().setAvatarUrl('https://example.com/avatar.png');
    expect(useProfile.getState().avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('resetProfile restores both fields to empty string', () => {
    useProfile.getState().setDisplayName('Alice');
    useProfile.getState().setAvatarUrl('https://example.com/avatar.png');
    useProfile.getState().resetProfile();
    expect(useProfile.getState().displayName).toBe('');
    expect(useProfile.getState().avatarUrl).toBe('');
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```
npx vitest run lib/state/profileStore.test.ts
```

Expected: FAIL with "Cannot find module './profileStore'"

- [ ] **Step 3: Create the store**

Create `lib/state/profileStore.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  displayName: string;
  avatarUrl: string;
  setDisplayName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
  resetProfile: () => void;
}

const PROFILE_DEFAULTS = { displayName: '', avatarUrl: '' };

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      ...PROFILE_DEFAULTS,
      setDisplayName: (displayName) => set({ displayName }),
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      resetProfile: () => set(PROFILE_DEFAULTS),
    }),
    { name: 'bento-profile' },
  ),
);
```

- [ ] **Step 4: Run test — verify it passes**

```
npx vitest run lib/state/profileStore.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/state/profileStore.ts lib/state/profileStore.test.ts
git commit -m "feat: add profileStore with displayName, avatarUrl, and resetProfile"
```

---

## Task 2: settingsStore — add resetSettings() action

**Files:**
- Modify: `lib/state/settingsStore.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/state/settingsStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettings } from './settingsStore';

describe('settingsStore', () => {
  beforeEach(() =>
    useSettings.setState({
      theme: 'dark',
      layoutMode: 'autoPack',
      filterMode: 'hide',
      activeTags: [],
      accent: '#6366f1',
    }),
  );

  it('resetSettings restores all fields to defaults', () => {
    useSettings.getState().setTheme('light');
    useSettings.getState().setLayoutMode('pushCompact');
    useSettings.getState().setAccent('#ff0000');
    useSettings.getState().resetSettings();
    const s = useSettings.getState();
    expect(s.theme).toBe('dark');
    expect(s.layoutMode).toBe('autoPack');
    expect(s.filterMode).toBe('hide');
    expect(s.activeTags).toEqual([]);
    expect(s.accent).toBe('#6366f1');
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```
npx vitest run lib/state/settingsStore.test.ts
```

Expected: FAIL with "s.resetSettings is not a function"

- [ ] **Step 3: Add resetSettings to settingsStore**

In `lib/state/settingsStore.ts`, add `resetSettings` to the interface and the `create` call. The file after edits should look like this:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LayoutMode } from '@/lib/grid/engine';
import type { Category } from '@/lib/grid/types';

export type Theme = 'dark' | 'light';
export type FilterMode = 'hide' | 'dim';

export const ACCENT_PRESETS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

const SETTINGS_DEFAULTS = {
  theme: 'dark' as Theme,
  layoutMode: 'autoPack' as LayoutMode,
  filterMode: 'hide' as FilterMode,
  activeTags: [] as Category[],
  accent: '#6366f1',
};

interface SettingsState {
  theme: Theme;
  layoutMode: LayoutMode;
  filterMode: FilterMode;
  activeTags: Category[];
  accent: string;
  setTheme: (t: Theme) => void;
  setLayoutMode: (m: LayoutMode) => void;
  setFilterMode: (f: FilterMode) => void;
  toggleTag: (c: Category) => void;
  setAccent: (a: string) => void;
  resetSettings: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...SETTINGS_DEFAULTS,
      setTheme: (theme) => set({ theme }),
      setLayoutMode: (layoutMode) => set({ layoutMode }),
      setFilterMode: (filterMode) => set({ filterMode }),
      toggleTag: (c) =>
        set((s) => ({
          activeTags: s.activeTags.includes(c)
            ? s.activeTags.filter((t) => t !== c)
            : [...s.activeTags, c],
        })),
      setAccent: (accent) => set({ accent }),
      resetSettings: () => set(SETTINGS_DEFAULTS),
    }),
    { name: 'bento-settings' },
  ),
);
```

- [ ] **Step 4: Run test — verify it passes**

```
npx vitest run lib/state/settingsStore.test.ts
```

Expected: PASS (1 test)

- [ ] **Step 5: Run full suite to check for regressions**

```
npm test
```

Expected: all existing tests still pass

- [ ] **Step 6: Commit**

```bash
git add lib/state/settingsStore.ts lib/state/settingsStore.test.ts
git commit -m "feat: add resetSettings action to settingsStore"
```

---

## Task 3: boardStore — add resetBoard() action

**Files:**
- Modify: `lib/state/boardStore.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/state/boardStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useBoard } from './boardStore';
import { seedWidgets } from '@/lib/data/seed';
import { useSettings } from './settingsStore';

describe('boardStore', () => {
  beforeEach(() => useSettings.setState({ layoutMode: 'autoPack' } as any));

  it('resetBoard restores widgets to the seed set', () => {
    useBoard.getState().removeWidget('seed-0');
    expect(useBoard.getState().widgets.length).toBeLessThan(seedWidgets().length);
    useBoard.getState().resetBoard();
    expect(useBoard.getState().widgets.length).toBe(seedWidgets().length);
  });

  it('resetBoard restores seed widget categories in order', () => {
    useBoard.getState().resetBoard();
    const cats = useBoard.getState().widgets.map((w) => w.category);
    const seedCats = seedWidgets().map((w) => w.category);
    expect(cats).toEqual(seedCats);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```
npx vitest run lib/state/boardStore.test.ts
```

Expected: FAIL with "useBoard.getState().resetBoard is not a function"

- [ ] **Step 3: Add resetBoard to boardStore**

In `lib/state/boardStore.ts`, add `resetBoard` to `BoardState` and the `create` call:

```ts
interface BoardState {
  widgets: WidgetLayout[];
  setWidgets: (w: WidgetLayout[]) => void;
  reResolve: () => void;
  moveWidget: (id: string, targetCell: { x: number; y: number }) => void;
  resizeWidget: (id: string, w: number, h: number) => void;
  addWidget: (category: Category, w: number, h: number, targetCell?: { x: number; y: number }) => void;
  removeWidget: (id: string) => void;
  swapWidgets: (id: string, targetId: string) => void;
  resetBoard: () => void;
}
```

Inside the `create` call, add after `swapWidgets`:

```ts
resetBoard: () => set({ widgets: strategy().resolve(seedWidgets()) }),
```

- [ ] **Step 4: Run test — verify it passes**

```
npx vitest run lib/state/boardStore.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Run full suite**

```
npm test
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add lib/state/boardStore.ts lib/state/boardStore.test.ts
git commit -m "feat: add resetBoard action to boardStore"
```

---

## Task 4: ProfileButton — simplify to direct modal open

**Files:**
- Modify: `components/shell/ProfileButton.tsx`
- Modify: `components/shell/ProfileButton.module.css`
- Create: `components/shell/ProfileButton.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `components/shell/ProfileButton.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileButton } from './ProfileButton';
import { useProfile } from '@/lib/state/profileStore';

describe('ProfileButton', () => {
  beforeEach(() => useProfile.setState({ displayName: '', avatarUrl: '' }));

  it('shows ? when profile is empty', () => {
    render(<ProfileButton />);
    expect(screen.getByRole('button', { name: /profile/i }).textContent).toContain('?');
  });

  it('shows first initial of displayName', () => {
    useProfile.setState({ displayName: 'Alice', avatarUrl: '' });
    render(<ProfileButton />);
    expect(screen.getByRole('button', { name: /profile/i }).textContent).toContain('A');
  });

  it('opens settings modal directly on click (no dropdown)', async () => {
    render(<ProfileButton />);
    await userEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument();
  });

  it('does not show a dropdown after click', async () => {
    render(<ProfileButton />);
    await userEvent.click(screen.getByRole('button', { name: /profile/i }));
    // The old dropdown had a plain "Settings" button — it should no longer exist
    // (the settings dialog is open, but the dropdown item is gone)
    const allButtons = screen.getAllByRole('button');
    const dropdownItem = allButtons.find((b) => b.textContent?.trim() === 'Settings');
    expect(dropdownItem).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```
npx vitest run components/shell/ProfileButton.test.tsx
```

Expected: FAIL — "shows ? when profile is empty" fails because the component hardcodes "B", and the modal test fails because clicking the avatar currently opens a dropdown, not the modal.

- [ ] **Step 3: Update ProfileButton.tsx**

Replace the entire file:

```tsx
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
```

- [ ] **Step 4: Update ProfileButton.module.css**

Add these rules (keep all existing rules, add below them):

```css
.avatar {
  position: relative;
  overflow: hidden;
}

.avatarImg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Note: `.avatar` already exists in the file — add only `position: relative; overflow: hidden;` to the existing rule rather than duplicating it. The `.avatarImg` rule is new.

- [ ] **Step 5: Run test — verify it passes**

```
npx vitest run components/shell/ProfileButton.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 6: Run full suite**

```
npm test
```

Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add components/shell/ProfileButton.tsx components/shell/ProfileButton.module.css components/shell/ProfileButton.test.tsx
git commit -m "feat: simplify ProfileButton — direct modal open, avatar from profileStore"
```

---

## Task 5: Banner — wire displayName from profileStore

**Files:**
- Modify: `components/shell/Banner.tsx`

- [ ] **Step 1: Update Banner.tsx**

Replace the file:

```tsx
'use client';
import { type ReactNode } from 'react';
import styles from './Banner.module.css';
import { useGreeting } from '@/lib/hooks/useGreeting';
import { useWeather } from '@/lib/hooks/useWeather';
import { useProfile } from '@/lib/state/profileStore';

export function Banner({ profileSlot }: { profileSlot?: ReactNode }) {
  const greeting = useGreeting();
  const weather = useWeather();
  const { displayName } = useProfile();
  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return (
    <header className={styles.banner}>
      <div>
        <div className={styles.greet}>{greeting}, {displayName || 'there'}</div>
        <div className={styles.sub}>
          {date} · {weather.temp}° {weather.condition}
        </div>
      </div>
      <div className={styles.right}>{profileSlot}</div>
    </header>
  );
}
```

- [ ] **Step 2: Run full suite**

```
npm test
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add components/shell/Banner.tsx
git commit -m "feat: wire Banner greeting to profileStore displayName"
```

---

## Task 6: SettingsModal — profile header (name edit + avatar upload)

**Files:**
- Modify: `components/shell/SettingsModal.tsx`
- Modify: `components/shell/SettingsModal.module.css`
- Modify: `components/shell/SettingsModal.test.tsx`

- [ ] **Step 1: Write failing tests**

Replace `components/shell/SettingsModal.test.tsx` entirely:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from './SettingsModal';
import { useSettings } from '@/lib/state/settingsStore';
import { useProfile } from '@/lib/state/profileStore';

describe('SettingsModal', () => {
  beforeEach(() => {
    useSettings.setState({ theme: 'dark', layoutMode: 'autoPack', filterMode: 'hide', accent: '#6366f1', activeTags: [] });
    useProfile.setState({ displayName: 'Alice', avatarUrl: '' });
  });

  // — existing tests —
  it('switches layout mode and theme via the store', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /push & compact/i }));
    expect(useSettings.getState().layoutMode).toBe('pushCompact');
    await userEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(useSettings.getState().theme).toBe('light');
  });

  // — profile header —
  it('displays current displayName', () => {
    render(<SettingsModal onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /edit display name/i })).toHaveTextContent('Alice');
  });

  it('opens name input on clicking edit display name button', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    expect(screen.getByRole('textbox', { name: /display name/i })).toBeInTheDocument();
  });

  it('saves name on Enter', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'Bob{Enter}');
    expect(useProfile.getState().displayName).toBe('Bob');
    expect(screen.queryByRole('textbox', { name: /display name/i })).not.toBeInTheDocument();
  });

  it('cancels name edit on Escape', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'Bob{Escape}');
    expect(useProfile.getState().displayName).toBe('Alice');
    expect(screen.queryByRole('textbox', { name: /display name/i })).not.toBeInTheDocument();
  });

  it('opens avatar editor on clicking change avatar button', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /change avatar/i }));
    expect(screen.getByRole('textbox', { name: /avatar url/i })).toBeInTheDocument();
  });

  it('saves avatarUrl from URL input on Apply', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /change avatar/i }));
    await userEvent.type(screen.getByRole('textbox', { name: /avatar url/i }), 'https://example.com/pic.png');
    await userEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(useProfile.getState().avatarUrl).toBe('https://example.com/pic.png');
    expect(screen.queryByRole('textbox', { name: /avatar url/i })).not.toBeInTheDocument();
  });

  it('opening avatar editor closes name edit input', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    expect(screen.getByRole('textbox', { name: /display name/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /change avatar/i }));
    expect(screen.queryByRole('textbox', { name: /display name/i })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /avatar url/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — verify the new tests fail**

```
npx vitest run components/shell/SettingsModal.test.tsx
```

Expected: "switches layout mode" still passes; all profile header tests FAIL.

- [ ] **Step 3: Add profile header to SettingsModal.tsx**

Replace the entire file:

```tsx
'use client';
import { useState, useRef } from 'react';
import styles from './SettingsModal.module.css';
import { useSettings, ACCENT_PRESETS } from '@/lib/state/settingsStore';
import { useProfile } from '@/lib/state/profileStore';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  const p = useProfile();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openNameEdit() {
    setNameInput(p.displayName);
    setAvatarEditorOpen(false);
    setEditingName(true);
  }

  function saveName() {
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} glass`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="settings"
      >
        <h2 className={styles.title}>Settings</h2>

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
            <div className={styles.avatarOverlay}>📷</div>
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
                  if (e.key === 'Escape') setEditingName(false);
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
                <span className={styles.pencil}>✎</span>
              </button>
            )}
          </div>
        </div>

        {avatarEditorOpen && (
          <div className={styles.avatarEditor}>
            <input
              className={styles.urlInput}
              placeholder="Paste image URL…"
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
```

- [ ] **Step 4: Add new CSS rules to SettingsModal.module.css**

Append to the end of `components/shell/SettingsModal.module.css`:

```css
.profileHeader {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.profileAvatar {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid var(--border-hairline);
  background: var(--surface-2);
  color: var(--text);
  font-weight: 650;
  font-size: 20px;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
}

.profileAvatarImg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatarOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  font-size: 18px;
  opacity: 0;
  transition: opacity 0.15s;
}

.profileAvatar:hover .avatarOverlay {
  opacity: 1;
}

.profileInfo {
  flex: 1;
  min-width: 0;
}

.nameDisplay {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pencil {
  opacity: 0;
  color: var(--muted);
  font-size: 13px;
  flex-shrink: 0;
}

.nameDisplay:hover .pencil {
  opacity: 1;
}

.nameInput {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border-hairline);
  border-radius: 8px;
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  padding: 6px 10px;
}

.avatarEditor {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 18px;
}

.urlInput {
  flex: 1;
  background: var(--surface-2);
  border: 1px solid var(--border-hairline);
  border-radius: 8px;
  color: var(--text);
  font-size: 13px;
  padding: 7px 10px;
  min-width: 0;
}

.applyBtn,
.uploadBtn {
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.divider {
  height: 1px;
  background: var(--border-hairline);
  margin: 4px 0 18px;
}
```

- [ ] **Step 5: Run test — verify all tests pass**

```
npx vitest run components/shell/SettingsModal.test.tsx
```

Expected: PASS (all tests including new profile header tests)

- [ ] **Step 6: Run full suite**

```
npm test
```

Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add components/shell/SettingsModal.tsx components/shell/SettingsModal.module.css components/shell/SettingsModal.test.tsx
git commit -m "feat: add profile header to SettingsModal (name edit, avatar URL/upload)"
```

---

## Task 7: SettingsModal — complete custom accent color picker

**Files:**
- Modify: `components/shell/SettingsModal.tsx`
- Modify: `components/shell/SettingsModal.module.css`
- Modify: `components/shell/SettingsModal.test.tsx`

- [ ] **Step 1: Add failing test**

Add this test to the `describe` block in `components/shell/SettingsModal.test.tsx`:

```tsx
it('custom color picker updates accent in store', async () => {
  render(<SettingsModal onClose={() => {}} />);
  const picker = screen.getByRole('textbox', { hidden: true, name: /custom accent color/i }) as HTMLInputElement
    ?? screen.getByLabelText(/custom accent color/i) as HTMLInputElement;
  // fire a change event directly since userEvent doesn't drive <input type="color">
  picker.value = '#abcdef';
  picker.dispatchEvent(new Event('change', { bubbles: true }));
  expect(useSettings.getState().accent).toBe('#abcdef');
});
```

- [ ] **Step 2: Run test — verify it fails**

```
npx vitest run components/shell/SettingsModal.test.tsx
```

Expected: new test FAILS with "Unable to find element" (the picker doesn't exist yet)

- [ ] **Step 3: Replace the accent TODO comment with the actual picker**

In `components/shell/SettingsModal.tsx`, replace:

```tsx
            {/* TODO(accent-custom-picker): add an <input type="color"> custom picker beside the preset swatches; wire to s.setAccent. */}
```

with:

```tsx
            <input
              type="color"
              className={styles.colorPicker}
              value={s.accent}
              onChange={(e) => s.setAccent(e.target.value)}
              aria-label="custom accent color"
            />
```

- [ ] **Step 4: Add .colorPicker CSS**

Append to `components/shell/SettingsModal.module.css`:

```css
.colorPicker {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 2px solid var(--border-hairline);
  padding: 0;
  cursor: pointer;
  background: none;
}
```

- [ ] **Step 5: Run test — verify it passes**

```
npx vitest run components/shell/SettingsModal.test.tsx
```

Expected: PASS (all tests)

- [ ] **Step 6: Run full suite**

```
npm test
```

Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add components/shell/SettingsModal.tsx components/shell/SettingsModal.module.css components/shell/SettingsModal.test.tsx
git commit -m "feat: complete custom accent color picker (resolves accent-custom-picker TODO)"
```

---

## Task 8: SettingsModal — two-stage reset button

**Files:**
- Modify: `components/shell/SettingsModal.tsx`
- Modify: `components/shell/SettingsModal.module.css`
- Modify: `components/shell/SettingsModal.test.tsx`

- [ ] **Step 1: Add failing tests**

Add these tests to the `describe` block in `components/shell/SettingsModal.test.tsx`:

```tsx
it('reset button enters confirmation state on first click', async () => {
  render(<SettingsModal onClose={() => {}} />);
  const btn = screen.getByRole('button', { name: /reset to defaults/i });
  await userEvent.click(btn);
  expect(screen.getByRole('button', { name: /confirm reset/i })).toBeInTheDocument();
});

it('reset button executes full reset on second click and closes modal', async () => {
  const onClose = vi.fn();
  useSettings.getState().setTheme('light');
  useProfile.getState().setDisplayName('Alice');
  render(<SettingsModal onClose={onClose} />);
  const btn = screen.getByRole('button', { name: /reset to defaults/i });
  await userEvent.click(btn);
  await userEvent.click(screen.getByRole('button', { name: /confirm reset/i }));
  expect(useSettings.getState().theme).toBe('dark');
  expect(useProfile.getState().displayName).toBe('');
  expect(useBoard.getState().widgets.length).toBe(seedWidgets().length);
  expect(onClose).toHaveBeenCalled();
});
```

Add these imports to the top of `SettingsModal.test.tsx`:

```tsx
import { useBoard } from '@/lib/state/boardStore';
import { seedWidgets } from '@/lib/data/seed';
```

- [ ] **Step 2: Run test — verify it fails**

```
npx vitest run components/shell/SettingsModal.test.tsx
```

Expected: new tests FAIL — no reset button exists yet.

- [ ] **Step 3: Add reset state and footer to SettingsModal.tsx**

In `SettingsModal.tsx`, add `confirmingReset` state and the two imports at the top:

```tsx
import { useBoard } from '@/lib/state/boardStore';
```

Add the state near the other `useState` declarations:

```tsx
const [confirmingReset, setConfirmingReset] = useState(false);
```

Replace the existing `<button className={styles.close} onClick={onClose}>Done</button>` with:

```tsx
        <div className={styles.divider} />

        <div className={styles.footer}>
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
            {confirmingReset ? 'Confirm reset — tap again' : 'Reset to defaults'}
          </button>
          <button className={styles.close} onClick={onClose} type="button">Done</button>
        </div>
```

- [ ] **Step 4: Add footer CSS to SettingsModal.module.css**

Append to `components/shell/SettingsModal.module.css`:

```css
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.reset {
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
}

.resetConfirm {
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid #ef4444;
  background: color-mix(in srgb, #ef4444 12%, transparent);
  color: #ef4444;
  cursor: pointer;
  font-size: 13px;
}
```

- [ ] **Step 5: Run test — verify all tests pass**

```
npx vitest run components/shell/SettingsModal.test.tsx
```

Expected: PASS (all tests)

- [ ] **Step 6: Run full suite**

```
npm test
```

Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add components/shell/SettingsModal.tsx components/shell/SettingsModal.module.css components/shell/SettingsModal.test.tsx
git commit -m "feat: add two-stage reset button to SettingsModal (resets settings, board, and profile)"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] ProfileButton: no dropdown, direct modal open (Task 4)
- [x] profileStore: displayName, avatarUrl, resetProfile (Task 1)
- [x] settingsStore: resetSettings (Task 2)
- [x] boardStore: resetBoard (Task 3)
- [x] Banner: wired to displayName with fallback (Task 5)
- [x] Profile header: avatar (56px), name edit inline, avatar editor sub-row (Task 6)
- [x] Avatar: URL input + file upload → base64 (Task 6)
- [x] Only one editing surface open at a time (Task 6 — `openNameEdit` closes avatar editor, `openAvatarEditor` closes name edit)
- [x] img onError fallback to initials (Tasks 4 + 6)
- [x] Custom accent color picker (Task 7)
- [x] Two-stage reset button — all three stores + close (Task 8)
- [x] Reset covers profile (Task 8 calls `p.resetProfile()`)

**No placeholder violations found.**

**Type consistency:** `resetSettings`, `resetBoard`, `resetProfile` are defined in Tasks 2–3–1 respectively and called by name in Tasks 8 and 4.
