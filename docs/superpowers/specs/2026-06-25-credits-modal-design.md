# Credits Modal — Design Spec

**Date:** 2026-06-25

## Overview

Add an info icon button pinned to the bottom of the left sidebar (`LeftBar`) that opens a native `<dialog>` modal crediting the libraries used in the project, with a link to the GitHub repository.

## Scope

- New component: `CreditsModal` (dialog + styles)
- Minor addition to `LeftBar`: info icon button + open/close state

## Components

### `CreditsModal.tsx`

A self-contained component that renders a `<dialog>` element. Accepts `open: boolean` and `onClose: () => void` props. Internally holds a `ref` to the dialog element to call `showModal()` / `close()` imperatively, which is required for native `<dialog>` behavior.

Exit animation: on close, add a CSS class `.closing` to the dialog which plays the reverse keyframe, then call `dialog.close()` after the animation duration (~120ms) via `setTimeout`.

### `CreditsModal.module.css`

Styles for the dialog and its contents. Uses existing design tokens (`--surface-glass`, `--border-hairline`, `--text`, `--muted`, `--accent`).

Entrance keyframe (`dialog[open]`):
- `opacity: 0 → 1` + `translateY(4px → 0)` over 160ms ease-out

Exit keyframe (`.closing`):
- `opacity: 1 → 0` + `translateY(0 → 4px)` over 120ms ease-in

Backdrop: `dialog::backdrop` with a subtle dark semi-transparent overlay.

Positioning: dialog is positioned to the bottom-left of the viewport, near the info icon, floating just to the right of the sidebar.

### `LeftBar.tsx` changes

- Import `Info` icon from `lucide-react`
- Add `useState<boolean>` for `creditsOpen`
- Add info icon button with `margin-top: auto` to pin it to the bottom of the flex column
- Render `<CreditsModal>` adjacent to the button

## Modal Content

```
Built with

Next.js        https://nextjs.org
React          https://react.dev
Zustand        https://zustand-demo.pmnd.rs
dnd-kit        https://dndkit.com
Lucide         https://lucide.dev
Motion         https://motion.dev

github.com/ben-yeung/bento-dash   →   https://github.com/ben-yeung/bento-dash
```

Each library name is an `<a>` with `target="_blank" rel="noopener noreferrer"`. The GitHub URL is a separate line below a divider, also a clickable link. Backdrop click and Escape key close the dialog (native behavior of `<dialog>`).

## Accessibility

- Info button has `aria-label="About / credits"` and `title="About"`
- Dialog has `aria-label="Credits"` and `role="dialog"` (implicit from `<dialog>`)
- Focus is trapped inside the open dialog automatically by the browser

## Files Changed

| File | Change |
|------|--------|
| `components/shell/LeftBar.tsx` | Add info button + `creditsOpen` state + render `<CreditsModal>` |
| `components/shell/LeftBar.module.css` | Add `.infoButton` style (composes `iconButton`) |
| `components/shell/CreditsModal.tsx` | New file |
| `components/shell/CreditsModal.module.css` | New file |

## Out of Scope

- No portal/`createPortal` needed — native `<dialog>` handles z-index stacking
- No Motion library usage — CSS keyframes only
- No close button inside the modal — backdrop click and Escape suffice
