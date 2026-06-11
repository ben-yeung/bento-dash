export const COLS = 6;
export const MAX_H = 4;
export const GRID_GAP = 12; // px, must match --gap

export type Category = 'finance' | 'lifestyle' | 'health' | 'calendar';

export interface WidgetLayout {
  id: string;
  x: number; // 0-based column
  y: number; // 0-based row
  w: number; // column span 1..COLS
  h: number; // row span 1..MAX_H
  category: Category;
  widgetType?: string; // e.g. 'budget-summary', 'activity-rings'
  order: number; // canonical sequence (primary key for autoPack)
}

export type Move =
  | { kind: 'drag'; id: string; targetCell: { x: number; y: number } }
  | { kind: 'resize'; id: string; w: number; h: number }
  | { kind: 'add'; widget: WidgetLayout }
  | { kind: 'remove'; id: string }
  | { kind: 'swap'; id: string; targetId: string };

export interface LayoutStrategy {
  resolve(widgets: WidgetLayout[]): WidgetLayout[];
  preview(widgets: WidgetLayout[], move: Move): WidgetLayout[];
}

export type DragState =
  | { phase: 'idle' }
  | { phase: 'dragging'; activeId: string; targetKind: 'none' | 'insert'; previewLayout: WidgetLayout[] }
  | { phase: 'dragging'; activeId: string; targetKind: 'swap'; targetId: string; previewLayout: WidgetLayout[] };
