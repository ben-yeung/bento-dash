# Credits Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Info icon button pinned to the bottom of the LeftBar sidebar that opens a native `<dialog>` credits modal listing project libraries with links, plus a GitHub link.

**Architecture:** A new self-contained `CreditsModal` component owns the native `<dialog>` element, CSS entrance/exit animations, backdrop-click and Escape-key close. `LeftBar` gains an info icon button (pinned with `margin-top: auto`) and `creditsOpen` state, rendering `<CreditsModal>` alongside its existing content.

**Tech Stack:** React 19, Next.js 16, CSS Modules, Lucide icons, Vitest + Testing Library

## Global Constraints

- CSS custom properties only: `--surface-glass`, `--border-hairline`, `--text`, `--muted`, `--accent`
- No new npm dependencies
- `npm test` must stay green (`vitest run`)
- `npx tsc --noEmit` must stay clean
- All links: `target="_blank" rel="noopener noreferrer"`
- GitHub URL: `https://github.com/ben-yeung/bento-dash`

---

### Task 1: CreditsModal component + styles

**Files:**
- Create: `components/shell/CreditsModal.tsx`
- Create: `components/shell/CreditsModal.module.css`
- Create: `components/shell/CreditsModal.test.tsx`

**Interfaces:**
- Produces: `CreditsModal({ open: boolean; onClose: () => void }): JSX.Element` — imported by LeftBar in Task 2

---

- [ ] **Step 1: Write the failing test**

Create `components/shell/CreditsModal.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreditsModal } from './CreditsModal';

// jsdom does not implement showModal/close on HTMLDialogElement
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe('CreditsModal', () => {
  it('renders all library links when open', () => {
    render(<CreditsModal open onClose={() => {}} />);
    expect(screen.getByRole('link', { name: 'Next.js' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'React' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Zustand' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'dnd-kit' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Lucide' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Motion' })).toBeTruthy();
  });

  it('each library link opens in a new tab with rel', () => {
    render(<CreditsModal open onClose={() => {}} />);
    const link = screen.getByRole('link', { name: 'Next.js' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('calls showModal when open is true', () => {
    const showModal = vi.fn();
    HTMLDialogElement.prototype.showModal = showModal;
    render(<CreditsModal open onClose={() => {}} />);
    expect(showModal).toHaveBeenCalled();
  });

  it('includes the GitHub repository link', () => {
    render(<CreditsModal open onClose={() => {}} />);
    const link = screen.getByRole('link', { name: /github\.com\/ben-yeung\/bento-dash/i });
    expect(link.getAttribute('href')).toBe('https://github.com/ben-yeung/bento-dash');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm test -- --reporter=verbose components/shell/CreditsModal.test.tsx
```

Expected: FAIL — `Cannot find module './CreditsModal'`

- [ ] **Step 3: Create `CreditsModal.module.css`**

```css
.dialog {
  position: fixed;
  bottom: 24px;
  left: 84px;
  margin: 0;
  padding: 0;
  border: 1px solid var(--border-hairline);
  border-radius: 16px;
  background: var(--surface-glass);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  color: var(--text);
  min-width: 200px;
  animation: dialogIn 160ms ease-out forwards;
}

.dialog::backdrop {
  background: rgba(0, 0, 0, 0.25);
}

@keyframes dialogIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes dialogOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(4px); }
}

.closing {
  animation: dialogOut 120ms ease-in forwards;
}

.content {
  padding: 20px 24px;
}

.heading {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link {
  color: var(--text);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.15s ease;
}

.link:hover {
  color: var(--accent);
}

.divider {
  height: 1px;
  background: var(--border-hairline);
  margin: 16px 0;
}

.github {
  color: var(--muted);
  text-decoration: none;
  font-size: 12px;
  transition: color 0.15s ease;
}

.github:hover {
  color: var(--accent);
}
```

- [ ] **Step 4: Create `CreditsModal.tsx`**

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './CreditsModal.module.css';

const LIBS = [
  { name: 'Next.js',  url: 'https://nextjs.org' },
  { name: 'React',    url: 'https://react.dev' },
  { name: 'Zustand',  url: 'https://zustand-demo.pmnd.rs' },
  { name: 'dnd-kit',  url: 'https://dndkit.com' },
  { name: 'Lucide',   url: 'https://lucide.dev' },
  { name: 'Motion',   url: 'https://motion.dev' },
];

export function CreditsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 120);
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === ref.current) handleClose();
  }

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog}${closing ? ` ${styles.closing}` : ''}`}
      onCancel={(e) => { e.preventDefault(); handleClose(); }}
      onClick={handleBackdropClick}
      aria-label="Credits"
    >
      <div className={styles.content}>
        <p className={styles.heading}>Built with</p>
        <ul className={styles.list}>
          {LIBS.map((lib) => (
            <li key={lib.name}>
              <a
                href={lib.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {lib.name}
              </a>
            </li>
          ))}
        </ul>
        <div className={styles.divider} />
        <a
          href="https://github.com/ben-yeung/bento-dash"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.github}
        >
          github.com/ben-yeung/bento-dash
        </a>
      </div>
    </dialog>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```
npm test -- --reporter=verbose components/shell/CreditsModal.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 6: Type-check**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add components/shell/CreditsModal.tsx components/shell/CreditsModal.module.css components/shell/CreditsModal.test.tsx
git commit -m "feat: add CreditsModal component with glass dialog + entrance/exit animation"
```

---

### Task 2: LeftBar info button + wire up CreditsModal

**Files:**
- Modify: `components/shell/LeftBar.tsx`
- Modify: `components/shell/LeftBar.module.css`
- Modify: `components/shell/LeftBar.test.tsx`

**Interfaces:**
- Consumes: `CreditsModal({ open: boolean; onClose: () => void })` from Task 1

---

- [ ] **Step 1: Write the failing tests**

Add these two tests to the existing `describe('LeftBar', ...)` block in `components/shell/LeftBar.test.tsx`.

First, add at the top of the file (after the existing imports):
```tsx
import { vi, beforeAll } from 'vitest';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});
```

Then add inside the `describe` block:
```tsx
  it('renders an About info button', () => {
    render(<LeftBar />);
    expect(screen.getByRole('button', { name: 'About' })).toBeTruthy();
  });

  it('opens the credits modal when the info button is clicked', async () => {
    render(<LeftBar />);
    await userEvent.click(screen.getByRole('button', { name: 'About' }));
    expect(screen.getByRole('dialog', { name: 'Credits' })).toBeTruthy();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- --reporter=verbose components/shell/LeftBar.test.tsx
```

Expected: FAIL — `Unable to find an accessible element with the role "button" and name "About"`

- [ ] **Step 3: Update `LeftBar.module.css`**

Add after the `.manageToggle` block:

```css
.infoButton {
  composes: iconButton;
  margin-top: auto;
}
```

- [ ] **Step 4: Update `LeftBar.tsx`**

Replace the full file content:

```tsx
'use client';
import { useState } from 'react';
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
        className={styles.infoButton}
        onClick={() => setCreditsOpen(true)}
        aria-label="About"
        title="About"
      >
        <Info size={18} />
      </button>
      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </aside>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```
npm test -- --reporter=verbose components/shell/LeftBar.test.tsx
```

Expected: PASS (all 6 tests, including the 2 new ones)

- [ ] **Step 6: Run full test suite**

```
npm test
```

Expected: all tests pass

- [ ] **Step 7: Type-check**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add components/shell/LeftBar.tsx components/shell/LeftBar.module.css components/shell/LeftBar.test.tsx
git commit -m "feat: add info button to LeftBar that opens credits modal"
```
