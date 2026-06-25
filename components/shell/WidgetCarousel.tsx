'use client';
import { useState } from 'react';
import { LayoutGrid, TrendingUp, Heart, CalendarDays, Sparkles, type LucideIcon } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import styles from './WidgetCarousel.module.css';
import { CarouselCard } from './CarouselCard';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { useBoard } from '@/lib/state/boardStore';
import type { Category } from '@/lib/grid/types';

interface FilterEntry {
  label: string;
  value: Category | null;
  Icon: LucideIcon;
}

const CATEGORY_FILTERS: FilterEntry[] = [
  { label: 'All',       value: null,        Icon: LayoutGrid  },
  { label: 'Finance',   value: 'finance',   Icon: TrendingUp  },
  { label: 'Health',    value: 'health',    Icon: Heart       },
  { label: 'Calendar',  value: 'calendar',  Icon: CalendarDays },
  { label: 'Lifestyle', value: 'lifestyle', Icon: Sparkles    },
];

interface WidgetCarouselProps {
  cellSize: number;
  onClose: () => void;
}

export function WidgetCarousel({ cellSize, onClose }: WidgetCarouselProps) {
  const addWidget = useBoard((s) => s.addWidget);
  const [activeFilter, setActiveFilter] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const visibleDefs = activeFilter
    ? WIDGET_REGISTRY.filter((d) => d.category === activeFilter)
    : WIDGET_REGISTRY;

  function handleAdd(category: Category, widgetType: string, w: number, h: number) {
    addWidget(category, widgetType, w, h);
    onClose();
  }

  return (
    <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <span className={styles.title}>Add widget</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className={styles.filters}>
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.label}
            className={styles.filterChip}
            data-active={activeFilter === f.value}
            onClick={() => setActiveFilter(f.value)}
            aria-label={`Filter: ${f.label}`}
          >
            <f.Icon size={16} />
          </button>
        ))}
      </div>

      <div className={styles.cards}>
        <AnimatePresence>
          {visibleDefs.map((def) => (
            <CarouselCard
              key={def.type}
              definition={def}
              isOpen={selectedType === def.type}
              onToggle={() => setSelectedType(selectedType === def.type ? null : def.type)}
              onAdd={(w, h) => handleAdd(def.category, def.type, w, h)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
