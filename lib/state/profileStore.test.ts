import { describe, it, expect, beforeEach } from 'vitest';
import { useProfile } from './profileStore';

describe('profileStore', () => {
  beforeEach(() => useProfile.setState({ displayName: '', avatarUrl: '' }));

  it('setDisplayName updates displayName', () => {
    useProfile.getState().setDisplayName('Alice');
    expect(useProfile.getState().displayName).toBe('Alice');
  });

  it('setAvatarUrl updates avatarUrl', () => {
    useProfile.getState().setAvatarUrl('https://example.com/avatar.png');
    expect(useProfile.getState().avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('resetProfile restores both fields to empty string', () => {
    useProfile.getState().setDisplayName('Alice');
    useProfile.getState().setAvatarUrl('https://example.com/avatar.png');
    useProfile.getState().resetProfile();
    expect(useProfile.getState().displayName).toBe('');
    expect(useProfile.getState().avatarUrl).toBe('');
  });
});
