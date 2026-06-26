import { describe, it, expect, beforeEach } from 'vitest';
import { useSettings, SETTINGS_DEFAULTS } from './settingsStore';

describe('settingsStore', () => {
  beforeEach(() => useSettings.setState(SETTINGS_DEFAULTS));

  it('resetSettings restores all fields to defaults', () => {
    useSettings.getState().setTheme('light');
    useSettings.getState().setLayoutMode('pushCompact');
    useSettings.getState().setAccent('#ff0000');
    useSettings.getState().setFilterMode('dim');
    useSettings.getState().toggleTag('finance' as any);
    useSettings.getState().resetSettings();
    const s = useSettings.getState();
    expect(s.theme).toBe('dark');
    expect(s.layoutMode).toBe(SETTINGS_DEFAULTS.layoutMode);
    expect(s.filterMode).toBe('hide');
    expect(s.activeTags).toEqual([]);
    expect(s.accent).toBe('#6366f1');
  });

  it('defaults layoutOrientation to vertical', () => {
    const s = useSettings.getState();
    expect(s.layoutOrientation).toBe('vertical');
  });

  it('setLayoutOrientation changes orientation', () => {
    useSettings.getState().setLayoutOrientation('horizontal');
    expect(useSettings.getState().layoutOrientation).toBe('horizontal');
    useSettings.getState().setLayoutOrientation('vertical');
  });
});
