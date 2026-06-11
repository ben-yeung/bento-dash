import { WidgetSkeleton, type WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import type { Category } from '@/lib/grid/types';
import { SIZE_PRESETS, type SizePreset } from '@/lib/grid/sizes';
import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, Heart, CalendarDays, Sparkles } from 'lucide-react';

export type { WidgetContentProps };

export interface WidgetDefinition {
  type: string;
  label: string;
  category: Category;
  accentColor: string;
  icon: LucideIcon;
  supportedSizes: SizePreset[];
  // TODO(widget-content): replace WidgetSkeleton with per-type content components when real content is built.
  //   sites: components/widgets/WidgetSkeleton.tsx, components/board/Widget.tsx
  ContentComponent: React.ComponentType<WidgetContentProps>;
}

const p = (name: string): SizePreset => SIZE_PRESETS.find((s) => s.name === name)!;

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    type: 'finance',
    label: 'Finance',
    category: 'finance',
    accentColor: '#6366f1',
    icon: TrendingUp,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2'), p('4×2')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'health',
    label: 'Health',
    category: 'health',
    accentColor: '#10b981',
    icon: Heart,
    supportedSizes: [p('1×1'), p('2×2'), p('2×3')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'calendar',
    label: 'Calendar',
    category: 'calendar',
    accentColor: '#f59e0b',
    icon: CalendarDays,
    supportedSizes: [p('1×2'), p('2×3'), p('3×3')],
    ContentComponent: WidgetSkeleton,
  },
  {
    type: 'lifestyle',
    label: 'Lifestyle',
    category: 'lifestyle',
    accentColor: '#ec4899',
    icon: Sparkles,
    supportedSizes: [p('1×1'), p('2×1'), p('3×2'), p('4×4')],
    ContentComponent: WidgetSkeleton,
  },
];
