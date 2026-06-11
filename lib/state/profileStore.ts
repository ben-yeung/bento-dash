import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  displayName: string;
  avatarUrl: string;
  setDisplayName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
  resetProfile: () => void;
}

export const PROFILE_DEFAULTS = { displayName: '', avatarUrl: '' };

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      ...PROFILE_DEFAULTS,
      setDisplayName: (displayName) => set({ displayName }),
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      resetProfile: () => set(PROFILE_DEFAULTS),
    }),
    { name: 'bento-profile' },
  ),
);
