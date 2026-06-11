import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileButton } from './ProfileButton';
import { useProfile } from '@/lib/state/profileStore';

describe('ProfileButton', () => {
  beforeEach(() => useProfile.setState({ displayName: '', avatarUrl: '' }));

  it('shows ? when profile is empty', () => {
    render(<ProfileButton />);
    expect(screen.getByRole('button', { name: /profile/i }).textContent).toContain('?');
  });

  it('shows first initial of displayName', () => {
    useProfile.setState({ displayName: 'Alice', avatarUrl: '' });
    render(<ProfileButton />);
    expect(screen.getByRole('button', { name: /profile/i }).textContent).toContain('A');
  });

  it('opens settings modal directly on click (no dropdown)', async () => {
    render(<ProfileButton />);
    await userEvent.click(screen.getByRole('button', { name: /profile/i }));
    expect(screen.getByRole('dialog', { name: /settings/i })).not.toBeNull();
  });

  it('does not show a dropdown after click', async () => {
    render(<ProfileButton />);
    await userEvent.click(screen.getByRole('button', { name: /profile/i }));
    // The old dropdown had a plain "Settings" button — it should no longer exist
    const allButtons = screen.getAllByRole('button');
    const dropdownItem = allButtons.find((b) => b.textContent?.trim() === 'Settings');
    expect(dropdownItem).toBeUndefined();
  });
});
