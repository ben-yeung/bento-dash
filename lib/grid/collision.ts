export interface GridMetrics {
  cellSize: number;
  gap: number;
  cols: number;
  rows: number | 'auto'; // 'auto' in vertical (unbounded); rowCount in horizontal
}

export function pointToCell(px: number, py: number, m: GridMetrics): { x: number; y: number } {
  const stride = m.cellSize + m.gap;
  const xRaw = Math.floor(px / stride);
  const yRaw = Math.floor(py / stride);
  if (m.rows !== 'auto') {
    // horizontal: x unbounded, y bounded by rowCount
    return {
      x: Math.max(0, xRaw),
      y: Math.max(0, Math.min(m.rows - 1, yRaw)),
    };
  }
  // vertical: x bounded by cols, y unbounded
  return {
    x: Math.max(0, Math.min(m.cols - 1, xRaw)),
    y: Math.max(0, yRaw),
  };
}

export function cellSpanToPixels(w: number, h: number, m: GridMetrics): { width: number; height: number } {
  return {
    width: w * m.cellSize + (w - 1) * m.gap,
    height: h * m.cellSize + (h - 1) * m.gap,
  };
}
