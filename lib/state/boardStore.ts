import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, WidgetLayout } from '@/lib/grid/types';
import { getStrategy } from '@/lib/grid/engine';
import { presentCategories, reconcileActiveTags } from '@/lib/grid/categories';
import { useSettings } from './settingsStore';
import { seedWidgets } from '@/lib/data/seed';

function strategy() {
  return getStrategy(useSettings.getState().layoutMode);
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `w-${Math.random().toString(36).slice(2)}`;
}

interface BoardState {
  widgets: WidgetLayout[];
  setWidgets: (w: WidgetLayout[]) => void;
  reResolve: () => void;
  moveWidget: (id: string, targetCell: { x: number; y: number }) => void;
  resizeWidget: (id: string, w: number, h: number) => void;
  addWidget: (category: Category, w: number, h: number) => void;
  removeWidget: (id: string) => void;
}

export const useBoard = create<BoardState>()(
  persist(
    (set, get) => ({
      widgets: strategy().resolve(seedWidgets()),
      setWidgets: (widgets) => set({ widgets }),
      reResolve: () => set({ widgets: strategy().resolve(get().widgets) }),
      moveWidget: (id, targetCell) =>
        set({ widgets: strategy().preview(get().widgets, { kind: 'drag', id, targetCell }) }),
      resizeWidget: (id, w, h) =>
        set({ widgets: strategy().preview(get().widgets, { kind: 'resize', id, w, h }) }),
      addWidget: (category, w, h) => {
        const order = get().widgets.reduce((max, x) => Math.max(max, x.order), -1) + 1;
        const widget: WidgetLayout = { id: newId(), x: 0, y: 0, w, h, category, order };
        set({ widgets: strategy().preview(get().widgets, { kind: 'add', widget }) });
      },
      removeWidget: (id) => {
        const widgets = strategy().preview(get().widgets, { kind: 'remove', id });
        set({ widgets });
        // Smart filter: if that was the last widget of a tag the user is
        // filtering on, drop the now-empty tag so the filter can't stick.
        const { activeTags } = useSettings.getState();
        const reconciled = reconcileActiveTags(activeTags, presentCategories(widgets));
        if (reconciled.length !== activeTags.length) {
          useSettings.setState({ activeTags: reconciled });
        }
      },
    }),
    // TODO(persist-hydration): both stores persist without skipHydration, while BentoBoard
    // is prerendered with seed state on the server. When persisted localStorage differs from
    // the seed, the first client paint can momentarily differ from server HTML (theme/accent
    // are covered by the layout.tsx bootstrap script; board widgets and Banner's new Date()
    // are not), risking a hydration warning / brief flash. Consider skipHydration + a rehydrate
    // effect, or rendering the board only after mount. anchor: lib/state/boardStore.ts
    { name: 'bento-board' },
  ),
);
