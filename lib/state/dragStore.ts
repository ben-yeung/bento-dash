import { create } from 'zustand';
import type { WidgetLayout, Category } from '@/lib/grid/types';

export interface PalettePreview {
  x: number;
  y: number;
  w: number;
  h: number;
  category: Category;
}

interface DragState {
  activeId: string | null;
  preview: WidgetLayout[] | null;
  palettePreview: PalettePreview | null;
  fabOpen: boolean;
  setActiveId: (id: string | null) => void;
  setPreview: (p: WidgetLayout[] | null) => void;
  setPalettePreview: (p: PalettePreview | null) => void;
  setFabOpen: (v: boolean) => void;
}

export const useDragStore = create<DragState>()((set) => ({
  activeId: null,
  preview: null,
  palettePreview: null,
  fabOpen: false,
  setActiveId: (activeId) => set({ activeId }),
  setPreview: (preview) => set({ preview }),
  setPalettePreview: (palettePreview) => set({ palettePreview }),
  setFabOpen: (fabOpen) => set({ fabOpen }),
}));
