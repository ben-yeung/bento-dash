import type { Category, WidgetLayout } from './types';

export const CATEGORY_ORDER: Category[] = ['finance', 'lifestyle', 'health', 'calendar'];

export function presentCategories(widgets: WidgetLayout[]): Category[] {
  return CATEGORY_ORDER.filter((c) => widgets.some((w) => w.category === c));
}

export function reconcileActiveTags(activeTags: Category[], present: Category[]): Category[] {
  return activeTags.filter((t) => present.includes(t));
}
