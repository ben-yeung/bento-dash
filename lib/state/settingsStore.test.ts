import { describe, it, expect, beforeEach } from 'vitest';
import { useSettings } from './settingsStore';

describe('settingsStore', () => {
  beforeEach(() =>
    useSettings.setState({
      theme: 'dark',
      layoutMode: 'autoPack',
      filterMode: 'hide',
      activeTags: [],
      accent: '#6366f1',
    }),
  );

  it('resetSettings restores all fields to defaults', () => {
    useSettings.getState().setTheme('light');
    useSettings.getState().setLayoutMode('pushCompact');
    useSettings.getState().setAccent('#ff0000');
    useSettings.getState().resetSettings();
    const s = useSettings.getState();
    expect(s.theme).toBe('dark');
    expect(s.layoutMode).toBe('autoPack');
    expect(s.filterMode).toBe('hide');
    expect(s.activeTags).toEqual([]);
    expect(s.accent).toBe('#6366f1');
  });
});
