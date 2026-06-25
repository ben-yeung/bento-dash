'use client';
import { useState } from 'react';
import {
  LayoutGrid, TrendingUp, Heart, CalendarDays, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import styles from './WidgetCarousel.module.css';
import { BrowseTile } from './BrowseTile';
import { WIDGET_REGISTRY, type WidgetDefinition } from '@/lib/widgets/registry';
import type { Category } from '@/lib/grid/types';

interface FilterEntry {
  label: string;
  value: Category | null;
  Icon: LucideIcon;
}

const CATEGORY_FILTERS: FilterEntry[] = [
  { label: 'All',       value: null,        Icon: LayoutGrid   },
  { label: 'Finance',   value: 'finance',   Icon: TrendingUp   },
  { label: 'Health',    value: 'health',    Icon: Heart        },
  { label: 'Calendar',  value: 'calendar',  Icon: CalendarDays },
  { label: 'Lifestyle', value: 'lifestyle', Icon: Sparkles     },
];

// Vertical space taken up by header + label row + top/bottom padding (px)
const CHROME_BROWSE      = 52 + 32 + 24; // padding + filter row + tile label
const CHROME_PICKER      = 52 + 36 + 24; // padding + picker header + tile label

interface WidgetCarouselProps {
  cellSize: number;
  onClose: () => void;
}

export function WidgetCarousel({ cellSize, onClose }: WidgetCarouselProps) {
  const [activeFilter, setActiveFilter]     = useState<Category | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<WidgetDefinition | null>(null);

  const visibleDefs = activeFilter
    ? WIDGET_REGISTRY.filter((d) => d.category === activeFilter)
    : WIDGET_REGISTRY;

  const browseHeight = cellSize + CHROME_BROWSE;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {selectedWidget === null ? (
        <motion.div
          key="browse"
          className={styles.panel}
          style={{ height: browseHeight }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div className={styles.filters}>
              {CATEGORY_FILTERS.map((f) => (
                <button
                  key={f.label}
                  className={styles.filterChip}
                  data-active={activeFilter === f.value}
                  onClick={() => setActiveFilter(f.value)}
                  aria-label={`Filter: ${f.label}`}
                >
                  <f.Icon size={14} />
                  <span style={{ marginLeft: 4 }}>{f.label}</span>
                </button>
              ))}
            </div>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className={styles.tileRow}>
            {visibleDefs.map((def) => (
              <BrowseTile
                key={def.type}
                definition={def}
                cellSize={cellSize}
                onSelect={() => setSelectedWidget(def)}
              />
            ))}
          </div>
        </motion.div>
      ) : (
        /* Size-picker state — wired in Task 5 */
        <motion.div
          key="picker"
          className={styles.panel}
          style={{ height: browseHeight }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.pickerHeader}>
            <button
              className={styles.backBtn}
              onClick={() => setSelectedWidget(null)}
              aria-label="Back to Widgets"
            >
              ← Widgets
            </button>
            <span className={styles.pickerTitle}>{selectedWidget.label}</span>
          </div>
          {/* TODO(fab-size-picker): size tile row — wired in Task 5 */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
