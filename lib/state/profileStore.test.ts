import { describe, it, expect, beforeEach } from 'vitest';
import { useProfile, PROFILE_DEFAULTS } from './profileStore';

describe('profileStore', () => {
  beforeEach(() => useProfile.setState(PROFILE_DEFAULTS));

  it('starts with empty defaults', () => {
    expect(useProfile.getState()).toMatchObject(PROFILE_DEFAULTS);
  });

  it('setDisplayName updates displayName', () => {
    useProfile.getState().setDisplayName('Alice');
    expect(useProfile.getState().displayName).toBe('Alice');
  });

  it('setAvatarUrl updates avatarUrl', () => {
    useProfile.getState().setAvatarUrl('https://example.com/avatar.png');
    expect(useProfile.getState().avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('resetProfile restores both fields to defaults', () => {
    useProfile.getState().setDisplayName('Alice');
    useProfile.getState().setAvatarUrl('https://example.com/avatar.png');
    useProfile.getState().resetProfile();
    expect(useProfile.getState().displayName).toBe(PROFILE_DEFAULTS.displayName);
    expect(useProfile.getState().avatarUrl).toBe(PROFILE_DEFAULTS.avatarUrl);
  });
});
