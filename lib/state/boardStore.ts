import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, WidgetLayout } from '@/lib/grid/types';
import { getStrategy } from '@/lib/grid/engine';
import { presentCategories, reconcileActiveTags } from '@/lib/grid/categories';
import { useSettings } from './settingsStore';
import { getRowCount } from './gridState';
import { seedWidgets } from '@/lib/data/seed';

function strategy() {
  const { layoutMode, layoutOrientation } = useSettings.getState();
  return getStrategy(layoutMode, layoutOrientation, getRowCount());
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `w-${Math.random().toString(36).slice(2)}`;
}

// Maps legacy category names to a default widgetType for boards persisted before widgetType was added.
const WIDGET_TYPE_MIGRATION: Record<string, string> = {
  finance:   'budget-summary',
  health:    'activity-rings',
  calendar:  'upcoming-events',
  lifestyle: 'habit-tracker',
};

interface BoardState {
  widgets: WidgetLayout[];
  setWidgets: (w: WidgetLayout[]) => void;
  reResolve: () => void;
  moveWidget: (id: string, targetCell: { x: number; y: number }) => void;
  resizeWidget: (id: string, w: number, h: number) => void;
  addWidget: (category: Category, widgetType: string, w: number, h: number, targetCell?: { x: number; y: number }) => void;
  placeWidgetFromPreview: (previewLayout: WidgetLayout[], draftId: string) => void;
  removeWidget: (id: string) => void;
  swapWidgets: (id: string, targetId: string) => void;
  resetBoard: () => void;
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
      addWidget: (category, widgetType, w, h, targetCell) => {
        const order = get().widgets.reduce((max, x) => Math.max(max, x.order), -1) + 1;
        const widget: WidgetLayout = {
          id: newId(),
          x: targetCell?.x ?? 0,
          y: targetCell?.y ?? 0,
          w,
          h,
          category,
          widgetType,
          order,
        };
        set({ widgets: strategy().preview(get().widgets, { kind: 'add', widget }) });
      },
      // Commit a drag-to-place drop exactly as previewed: the dragged-in widget arrives
      // in `previewLayout` under its draft palette id; promote it to a real id and store
      // the layout verbatim so the widget lands on the same cell the drop ghost showed.
      placeWidgetFromPreview: (previewLayout, draftId) =>
        set({ widgets: previewLayout.map((w) => (w.id === draftId ? { ...w, id: newId() } : w)) }),
      swapWidgets: (id, targetId) =>
        set({ widgets: strategy().preview(get().widgets, { kind: 'swap', id, targetId }) }),
      resetBoard: () => set({ widgets: strategy().resolve(seedWidgets()) }),
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
    {
      name: 'bento-board',
      onRehydrateStorage: () => (state: BoardState | undefined) => {
        if (state) {
          state.widgets = state.widgets.map((w) =>
            w.widgetType ? w : { ...w, widgetType: WIDGET_TYPE_MIGRATION[w.category] ?? w.category }
          );
          state.reResolve();
        }
      },
    },
  ),
);
