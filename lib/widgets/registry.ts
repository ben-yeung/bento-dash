import { WidgetSkeleton, type WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { BudgetSummary } from '@/components/widgets/content/budget-summary';
import { ActivityRings } from '@/components/widgets/content/activity-rings';
import { CalorieTracker } from '@/components/widgets/content/calorie-tracker';
import { Steps } from '@/components/widgets/content/steps';
import { UpcomingEvents } from '@/components/widgets/content/upcoming-events';
import { MiniCalendar } from '@/components/widgets/content/mini-calendar';
import { TodaysSchedule } from '@/components/widgets/content/todays-schedule';
import { HabitTracker } from '@/components/widgets/content/habit-tracker';
import { Weather } from '@/components/widgets/content/weather';
import { DailyNote } from '@/components/widgets/content/daily-note';
import type { Category } from '@/lib/grid/types';
import { SIZE_PRESETS, type SizePreset } from '@/lib/grid/sizes';
import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  TrendingUp, Activity, Flame, Footprints,
  CalendarDays, Calendar, Clock,
  CheckCircle, CloudSun, Pencil,
} from 'lucide-react';

export type { WidgetContentProps };

export interface WidgetDefinition {
  type: string;
  label: string;
  category: Category;
  accentColor: string;
  icon: LucideIcon;
  supportedSizes: SizePreset[];
  // TODO(widget-content): ContentComponent is WidgetSkeleton until each type's component is built in Tasks 7-16.
  ContentComponent: React.ComponentType<WidgetContentProps>;
}

const p = (name: string): SizePreset => SIZE_PRESETS.find((s) => s.name === name)!;

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  // Finance
  {
    type: 'budget-summary',
    label: 'Budget Summary',
    category: 'finance',
    accentColor: '#6366f1',
    icon: TrendingUp,
    supportedSizes: [p('1×1'), p('2×2'), p('3×2'), p('4×2')],
    ContentComponent: BudgetSummary,
  },
  // Health
  {
    type: 'activity-rings',
    label: 'Activity Rings',
    category: 'health',
    accentColor: '#ff6b6b',
    icon: Activity,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: ActivityRings,
  },
  {
    type: 'calorie-tracker',
    label: 'Calories',
    category: 'health',
    accentColor: '#ff6b6b',
    icon: Flame,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: CalorieTracker,
  },
  {
    type: 'steps',
    label: 'Steps',
    category: 'health',
    accentColor: '#38bdf8',
    icon: Footprints,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: Steps,
  },
  // Calendar
  {
    type: 'upcoming-events',
    label: 'Upcoming Events',
    category: 'calendar',
    accentColor: '#3b82f6',
    icon: CalendarDays,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: UpcomingEvents,
  },
  {
    type: 'mini-calendar',
    label: 'Mini Calendar',
    category: 'calendar',
    accentColor: '#3b82f6',
    icon: Calendar,
    supportedSizes: [p('1×1'), p('2×2'), p('3×2'), p('3×3')],
    ContentComponent: MiniCalendar,
  },
  {
    type: 'todays-schedule',
    label: "Today's Schedule",
    category: 'calendar',
    accentColor: '#3b82f6',
    icon: Clock,
    supportedSizes: [p('1×2'), p('2×2'), p('2×3')],
    ContentComponent: TodaysSchedule,
  },
  // Lifestyle
  {
    type: 'habit-tracker',
    label: 'Habit Tracker',
    category: 'lifestyle',
    accentColor: '#10b981',
    icon: CheckCircle,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: HabitTracker,
  },
  {
    type: 'weather',
    label: 'Weather',
    category: 'lifestyle',
    accentColor: '#38bdf8',
    icon: CloudSun,
    supportedSizes: [p('1×1'), p('2×1'), p('2×2'), p('3×2')],
    ContentComponent: Weather,
  },
  {
    type: 'daily-note',
    label: 'Daily Note',
    category: 'lifestyle',
    accentColor: '#6366f1',
    icon: Pencil,
    supportedSizes: [p('1×1'), p('2×2'), p('2×3'), p('3×2')],
    ContentComponent: DailyNote,
  },
];
