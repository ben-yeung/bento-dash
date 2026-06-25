// Runtime rowCount derived from viewport height — updated by useGridMetrics,
// read by boardStore.strategy() so horizontal packing uses the live row count.
let _rowCount = 4;

export function getRowCount(): number {
  return _rowCount;
}

export function setRowCount(n: number): void {
  _rowCount = n;
}
