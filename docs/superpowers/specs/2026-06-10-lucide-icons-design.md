# Lucide Icons Integration — Design Spec

**Date:** 2026-06-10
**Status:** Approved

## Overview

Integrate `lucide-react` to replace ad-hoc text abbreviations and unicode characters with proper icons across two shell surfaces: the LeftBar and the WidgetCarousel filter row.

## Scope

| Surface | Change |
|---|---|
| LeftBar category chips | Icon-only (was text abbreviations: Fin / Life / Health / Cal) |
| LeftBar manage mode toggle | `PencilLine` icon (was `✎` character) |
| WidgetCarousel filter chips | Icon-only (was text labels) |
| CarouselCard preview | No change — colored dot + label stays, will be revisited later |

## Section 1: Data layer

### Install

Add `lucide-react` as a production dependency.

### WidgetDefinition

Add `icon: LucideIcon` to the `WidgetDefinition` interface in `lib/widgets/registry.ts`. `LucideIcon` is imported as a type only (`import type { LucideIcon } from 'lucide-react'`) to keep the data layer from pulling in rendering concerns.

### Icon assignments

| Category | Icon | Reasoning |
|---|---|---|
| `finance` | `TrendingUp` | growth/numbers feel |
| `health` | `Heart` | universal health symbol |
| `calendar` | `CalendarDays` | more detail than plain `Calendar` |
| `lifestyle` | `Sparkles` | light/personal feel |

Each entry in `WIDGET_REGISTRY` is populated with its corresponding icon component.

## Section 2: LeftBar

### Category chips

- Remove the `SHORT` text abbreviation map.
- Render `<Icon size={18} />` where `Icon` is looked up via `WIDGET_REGISTRY.find(d => d.category === c)!.icon`.
- Existing `aria-label` on each chip preserves the accessible name; icon-only is accessible as-is.
- Add a `TODO(leftbar-expand)` stub at the chip render site for the future expand-to-icon+label feature.

### Manage mode toggle

- Replace the `✎` character with `<PencilLine size={18} />`.
- `PencilLine` matches the semantic intent of the current edit-mode affordance.

## Section 3: WidgetCarousel filter chips

- The `ALL_FILTERS` array gains an `icon` field on each entry (type `LucideIcon`).
- `All` entry uses `LayoutGrid` (represents "show everything").
- Category entries derive their icon from `WIDGET_REGISTRY` (looked up when building `ALL_FILTERS`).
- Each chip renders `<Icon size={16} />` instead of label text.
- Existing `aria-label={`Filter: ${f.label}`}` stays unchanged — accessible name is preserved.

## Out of scope

- CarouselCard colored dot replacement (deferred)
- LeftBar icon+label expanded mode — `TODO(leftbar-expand)` stub left inline
- Any other shell surfaces (Banner, ProfileButton, etc.)

## Testing

No new unit tests required — the icon field is data and the rendering is straightforward. Existing component tests (`LeftBar.test.tsx`, `WidgetCarousel.test.tsx`) should continue to pass; they test behavior not icon identity.
