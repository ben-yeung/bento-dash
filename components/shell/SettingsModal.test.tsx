import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from './SettingsModal';
import { useSettings } from '@/lib/state/settingsStore';
import { useProfile } from '@/lib/state/profileStore';

describe('SettingsModal', () => {
  beforeEach(() => {
    useSettings.setState({ theme: 'dark', layoutMode: 'autoPack', filterMode: 'hide', accent: '#6366f1', activeTags: [] });
    useProfile.setState({ displayName: 'Alice', avatarUrl: '' });
  });

  // — existing tests —
  it('switches layout mode and theme via the store', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /push & compact/i }));
    expect(useSettings.getState().layoutMode).toBe('pushCompact');
    await userEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(useSettings.getState().theme).toBe('light');
  });

  // — profile header —
  it('displays current displayName', () => {
    render(<SettingsModal onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /edit display name/i })).toHaveTextContent('Alice');
  });

  it('opens name input on clicking edit display name button', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    expect(screen.getByRole('textbox', { name: /display name/i })).toBeInTheDocument();
  });

  it('saves name on Enter', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'Bob{Enter}');
    expect(useProfile.getState().displayName).toBe('Bob');
    expect(screen.queryByRole('textbox', { name: /display name/i })).toBeNull();
  });

  it('cancels name edit on Escape', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    const input = screen.getByRole('textbox', { name: /display name/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'Bob{Escape}');
    expect(useProfile.getState().displayName).toBe('Alice');
    expect(screen.queryByRole('textbox', { name: /display name/i })).toBeNull();
  });

  it('opens avatar editor on clicking change avatar button', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /change avatar/i }));
    expect(screen.getByRole('textbox', { name: /avatar url/i })).toBeInTheDocument();
  });

  it('saves avatarUrl from URL input on Apply', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /change avatar/i }));
    await userEvent.type(screen.getByRole('textbox', { name: /avatar url/i }), 'https://example.com/pic.png');
    await userEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(useProfile.getState().avatarUrl).toBe('https://example.com/pic.png');
    expect(screen.queryByRole('textbox', { name: /avatar url/i })).toBeNull();
  });

  it('opening avatar editor closes name edit input', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /edit display name/i }));
    expect(screen.getByRole('textbox', { name: /display name/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /change avatar/i }));
    expect(screen.queryByRole('textbox', { name: /display name/i })).toBeNull();
    expect(screen.getByRole('textbox', { name: /avatar url/i })).toBeInTheDocument();
  });

  it('custom color picker updates accent in store', () => {
    render(<SettingsModal onClose={() => {}} />);
    const picker = screen.getByLabelText(/custom accent color/i) as HTMLInputElement;
    // fireEvent.change — userEvent doesn't drive <input type="color">
    fireEvent.change(picker, { target: { value: '#abcdef' } });
    expect(useSettings.getState().accent).toBe('#abcdef');
  });
});
