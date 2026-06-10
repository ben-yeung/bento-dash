export interface GridMetrics {
  cellSize: number; // square cell edge in px
  gap: number; // px
  cols: number;
}

export function pointToCell(px: number, py: number, m: GridMetrics): { x: number; y: number } {
  const stride = m.cellSize + m.gap;
  const x = Math.floor(px / stride);
  const y = Math.floor(py / stride);
  return {
    x: Math.max(0, Math.min(m.cols - 1, x)),
    y: Math.max(0, y),
  };
}

export function cellSpanToPixels(w: number, h: number, m: GridMetrics): { width: number; height: number } {
  return {
    width: w * m.cellSize + (w - 1) * m.gap,
    height: h * m.cellSize + (h - 1) * m.gap,
  };
}
