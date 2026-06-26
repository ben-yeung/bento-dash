import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from './SettingsModal';
import { useSettings } from '@/lib/state/settingsStore';
import { useProfile, PROFILE_DEFAULTS } from '@/lib/state/profileStore';
import { useBoard } from '@/lib/state/boardStore';
import { seedWidgets } from '@/lib/data/seed';

describe('SettingsModal', () => {
  beforeEach(() => {
    useSettings.setState({ theme: 'dark', layoutMode: 'autoPack', filterMode: 'hide', accent: '#6366f1', activeTags: [] });
    useProfile.setState({ displayName: 'Alice', avatarUrl: '' });
  });

  // â€” existing tests â€”
  it('switches layout mode and theme via the store', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /push & compact/i }));
    expect(useSettings.getState().layoutMode).toBe('pushCompact');
    await userEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(useSettings.getState().theme).toBe('light');
  });

  // â€” profile header â€”
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
    // fireEvent.change â€” userEvent doesn't drive <input type="color">
    fireEvent.change(picker, { target: { value: '#abcdef' } });
    expect(useSettings.getState().accent).toBe('#abcdef');
  });

  it('reset button enters confirmation state on first click', async () => {
    render(<SettingsModal onClose={() => {}} />);
    const btn = screen.getByRole('button', { name: /reset defaults/i });
    await userEvent.click(btn);
    expect(screen.getByRole('button', { name: /confirm reset/i })).toBeInTheDocument();
  });

  it('reset button executes full reset on second click and closes modal', async () => {
    const onClose = vi.fn();
    useSettings.getState().setTheme('light');
    useProfile.getState().setDisplayName('Alice');
    render(<SettingsModal onClose={onClose} />);
    const btn = screen.getByRole('button', { name: /reset defaults/i });
    await userEvent.click(btn);
    await userEvent.click(screen.getByRole('button', { name: /confirm reset/i }));
    expect(useSettings.getState().theme).toBe('dark');
    expect(useProfile.getState().displayName).toBe(PROFILE_DEFAULTS.displayName);
    expect(useBoard.getState().widgets.length).toBe(seedWidgets().length);
    expect(onClose).toHaveBeenCalled();
  });

  it('log layout button logs current widgets to console', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const widgets = useBoard.getState().widgets;
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /log layout/i }));
    expect(spy).toHaveBeenCalledWith(widgets);
    spy.mockRestore();
  });

  it('X close button calls onClose', async () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /close settings/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
