import { create } from 'zustand';

interface UiState {
  manageMode: boolean;
  setManageMode: (on: boolean) => void;
  toggleManageMode: () => void;
}

// Transient UI state — deliberately NOT persisted (a reload should never
// land the user inside manage mode).
export const useUi = create<UiState>((set) => ({
  manageMode: false,
  setManageMode: (manageMode) => set({ manageMode }),
  toggleManageMode: () => set((s) => ({ manageMode: !s.manageMode })),
}));
