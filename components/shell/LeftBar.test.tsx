import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeftBar } from './LeftBar';
import { useSettings } from '@/lib/state/settingsStore';
import { useUi } from '@/lib/state/uiStore';
import { useBoard } from '@/lib/state/boardStore';
import type { WidgetLayout } from '@/lib/grid/types';

const w = (id: string, category: WidgetLayout['category']): WidgetLayout => ({
  id, x: 0, y: 0, w: 1, h: 1, category, order: 0,
});

describe('LeftBar', () => {
  beforeEach(() => {
    useSettings.setState({ activeTags: [] });
    useUi.setState({ manageMode: false });
    useBoard.setState({ widgets: [w('a', 'finance'), w('b', 'health')] });
  });

  it('renders a chip only for each in-use category', () => {
    expect(screen.queryByRole('button', { name: 'Fin' })).toBeNull();
    render(<LeftBar />);
    expect(screen.getByRole('button', { name: 'Fin' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Health' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Life' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cal' })).toBeNull();
  });

  it('drops a chip after its last widget is removed from the board', () => {
    const { rerender } = render(<LeftBar />);
    expect(screen.getByRole('button', { name: 'Health' })).toBeTruthy();
    useBoard.setState({ widgets: [w('a', 'finance')] });
    rerender(<LeftBar />);
    expect(screen.queryByRole('button', { name: 'Health' })).toBeNull();
  });

  it('toggles a category tag in the settings store on click', async () => {
    render(<LeftBar />);
    await userEvent.click(screen.getByRole('button', { name: 'Fin' }));
    expect(useSettings.getState().activeTags).toEqual(['finance']);
    await userEvent.click(screen.getByRole('button', { name: 'Fin' }));
    expect(useSettings.getState().activeTags).toEqual([]);
  });

  it('manage toggle flips the ui store and reflects aria-pressed', async () => {
    render(<LeftBar />);
    const toggle = screen.getByRole('button', { name: 'Toggle manage mode' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(toggle);
    expect(useUi.getState().manageMode).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });
});
