import { describe, it, expect } from 'vitest';
import { CATEGORY_ORDER, presentCategories, reconcileActiveTags } from './categories';
import type { WidgetLayout } from './types';

const w = (id: string, category: WidgetLayout['category']): WidgetLayout => ({
  id, x: 0, y: 0, w: 1, h: 1, category, order: 0,
});

describe('categories', () => {
  it('exposes the four canonical categories in order', () => {
    expect(CATEGORY_ORDER).toEqual(['finance', 'lifestyle', 'health', 'calendar']);
  });

  it('presentCategories returns in-use categories in canonical order', () => {
    const widgets = [w('a', 'health'), w('b', 'finance'), w('c', 'health')];
    expect(presentCategories(widgets)).toEqual(['finance', 'health']);
  });

  it('presentCategories returns [] for an empty board', () => {
    expect(presentCategories([])).toEqual([]);
  });

  it('reconcileActiveTags drops tags no longer present', () => {
    expect(reconcileActiveTags(['health', 'finance'], ['finance'])).toEqual(['finance']);
  });

  it('reconcileActiveTags keeps all present tags and handles empty inputs', () => {
    expect(reconcileActiveTags(['finance'], ['finance', 'health'])).toEqual(['finance']);
    expect(reconcileActiveTags([], ['finance'])).toEqual([]);
    expect(reconcileActiveTags(['health'], [])).toEqual([]);
  });
});
