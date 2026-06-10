import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LayoutMode } from '@/lib/grid/engine';
import type { Category } from '@/lib/grid/types';

export type Theme = 'dark' | 'light';
export type FilterMode = 'hide' | 'dim';

export const ACCENT_PRESETS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

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
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      layoutMode: 'autoPack',
      filterMode: 'hide',
      activeTags: [],
      accent: '#6366f1',
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
    }),
    { name: 'bento-settings' },
  ),
);
