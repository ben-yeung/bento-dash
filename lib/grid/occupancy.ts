export type Grid = boolean[][];

export function createGrid(): Grid {
  return [];
}

export function fits(grid: Grid, x: number, y: number, w: number, h: number, cols: number): boolean {
  if (x < 0 || y < 0 || x + w > cols) return false;
  for (let r = y; r < y + h; r++) {
    const row = grid[r];
    if (!row) continue;
    for (let c = x; c < x + w; c++) {
      if (row[c]) return false;
    }
  }
  return true;
}

export function occupy(grid: Grid, x: number, y: number, w: number, h: number): void {
  for (let r = y; r < y + h; r++) {
    if (!grid[r]) grid[r] = [];
    for (let c = x; c < x + w; c++) grid[r][c] = true;
  }
}
