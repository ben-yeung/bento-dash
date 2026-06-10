import { describe, it, expect, beforeEach } from 'vitest';
import { useUi } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => useUi.setState({ manageMode: false }));

  it('defaults manageMode to false', () => {
    expect(useUi.getState().manageMode).toBe(false);
  });

  it('toggleManageMode flips the flag', () => {
    useUi.getState().toggleManageMode();
    expect(useUi.getState().manageMode).toBe(true);
    useUi.getState().toggleManageMode();
    expect(useUi.getState().manageMode).toBe(false);
  });

  it('setManageMode sets the flag explicitly', () => {
    useUi.getState().setManageMode(true);
    expect(useUi.getState().manageMode).toBe(true);
    useUi.getState().setManageMode(false);
    expect(useUi.getState().manageMode).toBe(false);
  });
});
