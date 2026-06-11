# Profile + Settings Modal Enhancement

**Date:** 2026-06-10  
**Status:** Approved

## Overview

Upgrade the profile button → settings flow. The intermediate dropdown is removed; clicking the profile avatar opens the settings modal directly. The modal gains a profile header (avatar + editable display name + avatar upload) and a full-reset button. The custom accent color picker (existing TODO) is completed as part of this work.

## Scope

**In scope:**
- Remove `ProfileButton` dropdown; direct-open `SettingsModal` on avatar click
- New `profileStore` (Zustand + persist) for display name and avatar URL
- Profile header section at the top of the modal (avatar, display name, avatar editor)
- Wire `profileStore.displayName` into `Banner` greeting (replaces hardcoded `"Ben"`)
- Complete the custom accent color picker (`TODO(accent-custom-picker)` in `SettingsModal.tsx:49`)
- Reset button at the bottom of the modal — full factory reset of all three stores

**Out of scope:**
- Auth / account sync across devices
- Clock/date format, widget corner radius, or other new appearance settings (deferred)
- Tabs or multi-section navigation within the modal

## Data Model

### `lib/state/profileStore.ts` (new)

```ts
interface ProfileState {
  displayName: string;   // '' after reset → Banner shows "there"
  avatarUrl: string;     // '' | 'https://...' | 'data:image/...' (base64)
  setDisplayName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
  resetProfile: () => void;
}
```

Persisted to localStorage as `bento-profile`. Defaults: `{ displayName: '', avatarUrl: '' }`.

### `lib/state/settingsStore.ts` (existing — additive change only)

Add a `resetSettings()` action that restores all fields to their initial defaults:
```ts
{ theme: 'dark', layoutMode: 'autoPack', filterMode: 'hide', activeTags: [], accent: '#6366f1' }
```

### `lib/state/boardStore.ts` (existing — additive change only)

Add a `resetBoard()` action that calls `strategy().resolve(seedWidgets())` and overwrites `widgets`.

## Components

### `ProfileButton.tsx`

- Remove `menuOpen` state and dropdown entirely
- Single `onClick` on the avatar button → `setSettingsOpen(true)`
- Avatar renders: `<img>` if `avatarUrl` is set, otherwise first character of `displayName` (uppercased), otherwise `"?"` if both are empty
- Avatar still 36×36 px circle, same CSS

### `SettingsModal.tsx`

Single scrolling modal. Layout top to bottom:

```
┌──────────────────────────────────────┐
│  Settings                       [✕]  │
│  ─────────────────────────────────── │
│  [avatar 56px]  Ben Yeung       [✎]  │
│                 [URL or upload  ▾  ] │
│  ─────────────────────────────────── │
│  Theme          [Dark]  [Light]      │
│  Board layout   [Auto-pack]  [Push]  │
│  Filter         [Hide]  [Dim]        │
│  Accent         ● ● ● ● ● ●  [🎨]   │
│  ─────────────────────────────────── │
│  [Reset to defaults]        [Done]   │
└──────────────────────────────────────┘
```

**Profile header (new section):**
- Avatar: 56 px circle; shows photo, initial, or `?`; camera-icon overlay on hover
- Clicking the camera overlay (or the avatar) reveals an inline sub-row below the header with:
  - A text input: `placeholder="Paste image URL…"` wired to `profileStore.setAvatarUrl`
  - An `Upload` button (`<input type="file" accept="image/*">`) that reads the file via `FileReader`, converts to base64 data URL, and calls `profileStore.setAvatarUrl`
  - Sub-row toggles open/closed; clicking outside (detected via `onBlur` on the container) collapses it
  - Opening the avatar sub-row closes the name edit input if it is open, and vice versa — only one editing surface is active at a time
- Display name: rendered as plain text next to avatar; pencil icon (✎) on hover
  - Clicking the name or pencil swaps it for an `<input>` pre-filled with current value
  - `onBlur` / `Enter` → calls `profileStore.setDisplayName`, reverts to text display
  - `Escape` → cancels without saving

**Existing settings rows:** unchanged (theme, layout, filter, accent swatches)

**Accent custom picker (completing `TODO(accent-custom-picker)`):**
- Add `<input type="color">` immediately after the preset swatches
- `onChange` → `s.setAccent(e.target.value)`
- Pre-seeded with current `s.accent` value so it tracks the active selection

**Reset button (new, bottom section):**
- Default state: ghost/muted button labeled "Reset to defaults"
- First click: button turns red, label changes to "Confirm reset — tap again"
- A second click calls `resetSettings()`, `resetBoard()`, `resetProfile()` in sequence, then closes the modal
- Clicking anywhere else while in the confirmation state reverts the button to its default state (via `onBlur` or an overlay click handler)
- No nested dialog — the two-stage button is the full confirmation UX

### `Banner.tsx`

Replace hardcoded `"Ben"` with `profileStore.displayName`:
```tsx
const { displayName } = useProfile();
// ...
<div className={styles.greet}>{greeting}, {displayName || 'there'}</div>
```

## Error Handling

- File upload: if `FileReader` fails or the file is not an image, silently ignore (no state change); the avatar remains as-is
- URL input: no validation on entry — whatever the user types is stored. The `<img>` tag's `onError` handler in the avatar display should fall back to the initials render if the URL 404s or fails to load
- Display name: no max-length enforcement at the store level; CSS truncation (`text-overflow: ellipsis`) handles overflow in the avatar button and banner

## Testing

- `ProfileButton`: clicking avatar opens modal directly (no dropdown); avatar renders initials when `avatarUrl` is empty
- `SettingsModal` profile header: display name edits save on blur/enter, cancel on escape; URL input updates avatar; file upload converts to data URL and updates avatar
- `SettingsModal` reset: two-stage confirmation pattern; after confirm, all three stores return to defaults and modal closes
- `Banner`: greeting uses `displayName` from store; falls back to `"there"` when name is empty
- `profileStore`: persists across page reloads; `resetProfile()` restores defaults
