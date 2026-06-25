import { describe, it, expect, beforeEach } from 'vitest';
import { useDragStore } from './dragStore';

describe('dragStore', () => {
  beforeEach(() => {
    useDragStore.setState({ fabOpen: false });
  });

  it('initialises with fabOpen false', () => {
    expect(useDragStore.getState().fabOpen).toBe(false);
  });

  it('setFabOpen toggles fabOpen', () => {
    useDragStore.getState().setFabOpen(true);
    expect(useDragStore.getState().fabOpen).toBe(true);
    useDragStore.getState().setFabOpen(false);
    expect(useDragStore.getState().fabOpen).toBe(false);
  });
});
