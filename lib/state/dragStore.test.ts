import { describe, it, expect, beforeEach } from 'vitest';
import { useDragStore } from './dragStore';

describe('dragStore', () => {
  beforeEach(() => {
    useDragStore.setState({ activeId: null, preview: null, palettePreview: null, fabOpen: false });
  });

  it('initialises with null / false values', () => {
    const s = useDragStore.getState();
    expect(s.activeId).toBeNull();
    expect(s.preview).toBeNull();
    expect(s.palettePreview).toBeNull();
    expect(s.fabOpen).toBe(false);
  });

  it('setActiveId updates activeId', () => {
    useDragStore.getState().setActiveId('seed-0');
    expect(useDragStore.getState().activeId).toBe('seed-0');
  });

  it('setPreview updates preview', () => {
    const widgets = [{ id: 'a', x: 0, y: 0, w: 1, h: 1, category: 'finance' as const, order: 0 }];
    useDragStore.getState().setPreview(widgets);
    expect(useDragStore.getState().preview).toEqual(widgets);
  });

  it('setPalettePreview updates palettePreview', () => {
    const pp = { x: 2, y: 1, w: 2, h: 2, category: 'health' as const };
    useDragStore.getState().setPalettePreview(pp);
    expect(useDragStore.getState().palettePreview).toEqual(pp);
  });

  it('setFabOpen toggles fabOpen', () => {
    useDragStore.getState().setFabOpen(true);
    expect(useDragStore.getState().fabOpen).toBe(true);
    useDragStore.getState().setFabOpen(false);
    expect(useDragStore.getState().fabOpen).toBe(false);
  });
});
