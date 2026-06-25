import { create } from 'zustand';

interface DragStore {
  fabOpen: boolean;
  setFabOpen: (v: boolean) => void;
}

export const useDragStore = create<DragStore>()((set) => ({
  fabOpen: false,
  setFabOpen: (fabOpen) => set({ fabOpen }),
}));
