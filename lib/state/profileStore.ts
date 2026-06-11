import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  displayName: string;
  avatarUrl: string;
  setDisplayName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
  resetProfile: () => void;
}

export const PROFILE_DEFAULTS = {
  displayName: 'Ben',
  avatarUrl: 'https://www.gravatar.com/avatar/2314de272e570cb9a241c538a104472d?s=80&d=mp',
};

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
