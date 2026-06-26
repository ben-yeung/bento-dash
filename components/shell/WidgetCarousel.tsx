'use client';
import { useState } from 'react';
import {
  LayoutGrid, TrendingUp, Heart, CalendarDays, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GRID_GAP } from '@/lib/grid/types';
import styles from './WidgetCarousel.module.css';
import { BrowseTile } from './BrowseTile';
import { SizePickerTile } from './SizePickerTile';
import { WIDGET_REGISTRY, type WidgetDefinition } from '@/lib/widgets/registry';
import { useBoard } from '@/lib/state/boardStore';
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

// Vertical chrome outside the tile area (px) — padding + header row + tile label
// tileRow padding is 4px top + 4px bottom = 8px (was 6px); bump by 2
const CHROME_BROWSE = 54 + 32 + 24;
const CHROME_PICKER = 54 + 36 + 24;

function pickerHeight(def: WidgetDefinition, cellSize: number): number {
  const maxH = Math.max(...def.supportedSizes.map((s) => s.h));
  return maxH * cellSize + (maxH - 1) * GRID_GAP + CHROME_PICKER;
}

interface WidgetCarouselProps {
  cellSize: number;
  onClose: () => void;
  isMobile?: boolean;
}

export function WidgetCarousel({ cellSize, onClose, isMobile = false }: WidgetCarouselProps) {
  const addWidget = useBoard((s) => s.addWidget);
  const [activeFilter, setActiveFilter]     = useState<Category | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<WidgetDefinition | null>(null);

  const visibleDefs = activeFilter
    ? WIDGET_REGISTRY.filter((d) => d.category === activeFilter)
    : WIDGET_REGISTRY;

  const browseH = cellSize + CHROME_BROWSE;

  function handleAdd(category: Category, widgetType: string, w: number, h: number) {
    addWidget(category, widgetType, w, h);
    onClose();
  }

  // Vertical mouse-wheel over a horizontal-only scroll row produces deltaY but the
  // browser won't scroll it because there's no overflow-y. Redirect to scrollLeft.
  function handleRowWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (e.deltaX === 0 && e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {selectedWidget === null ? (
        <motion.div
          key="browse"
          className={styles.panel}
          style={isMobile ? undefined : { height: browseH }}
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
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>

          <div
            className={isMobile ? styles.tileGrid : styles.tileRow}
            onWheel={isMobile ? undefined : handleRowWheel}
          >
            {visibleDefs.map((def) => (
              <BrowseTile
                key={def.type}
                definition={def}
                cellSize={cellSize}
                isMobile={isMobile}
                onSelect={() => setSelectedWidget(def)}
              />
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="picker"
          className={styles.panel}
          style={{ height: pickerHeight(selectedWidget, cellSize) }}
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

          <div className={styles.sizeRow} onWheel={handleRowWheel}>
            {selectedWidget.supportedSizes.map((size) => (
              <SizePickerTile
                key={size.name}
                definition={selectedWidget}
                size={size}
                cellSize={cellSize}
                gap={GRID_GAP}
                onAdd={(w, h) => handleAdd(selectedWidget.category, selectedWidget.type, w, h)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
