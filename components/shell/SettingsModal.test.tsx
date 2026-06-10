import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from './SettingsModal';
import { useSettings } from '@/lib/state/settingsStore';

describe('SettingsModal', () => {
  beforeEach(() => useSettings.setState({ theme: 'dark', layoutMode: 'autoPack', filterMode: 'hide', accent: '#6366f1' }));

  it('switches layout mode and theme via the store', async () => {
    render(<SettingsModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /push & compact/i }));
    expect(useSettings.getState().layoutMode).toBe('pushCompact');
    await userEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(useSettings.getState().theme).toBe('light');
  });
});
