import { CellType, Grid } from "./Grid";

let sweepLeftToRight = true;

export function updateGrid(grid: Grid): void {
  sweepLeftToRight = !sweepLeftToRight;

  const xStart = sweepLeftToRight ? 0 : grid.cols - 1;
  const xEnd = sweepLeftToRight ? grid.cols : -1;
  const xStep = sweepLeftToRight ? 1 : -1;

  for (let y = 0; y < grid.rows; y++) {
    for (let x = xStart; x !== xEnd; x += xStep) {
      const i = grid.index(x, y);
      if (grid.movedCells[i] !== 0) continue;
      const type = grid.types[i] as CellType;
      if (type === CellType.Sand) updateSand(grid, x, y);
      else if (type === CellType.Water) updateWater(grid, x, y);
    }
  }
}

function tryMove(
  grid: Grid,
  x: number,
  y: number,
  tx: number,
  ty: number,
  type: CellType,
): boolean {
  if (
    grid.inBounds(tx, ty) &&
    grid.getType(tx, ty) === CellType.Empty &&
    grid.movedCells[grid.index(tx, ty)] === 0
  ) {
    grid.setCell(x, y, CellType.Empty);
    grid.setCell(tx, ty, type);
    grid.movedCells[grid.index(tx, ty)] = 1;
    return true;
  }
  return false;
}

function updateSand(grid: Grid, x: number, y: number): void {
  const d = Math.random() < 0.5 ? -1 : 1;
  if (trySwapWithWater(grid, x, y, x, y + 1)) return;
  tryMove(grid, x, y, x, y + 1, CellType.Sand) ||
    tryMove(grid, x, y, x + d, y + 1, CellType.Sand) ||
    tryMove(grid, x, y, x - d, y + 1, CellType.Sand);
}

function trySwapWithWater(
  grid: Grid,
  x: number,
  y: number,
  tx: number,
  ty: number,
): boolean {
  if (!grid.inBounds(tx, ty)) return false;
  const ti = grid.index(tx, ty);
  if (grid.types[ti] !== CellType.Water || grid.movedCells[ti] !== 0)
    return false;

  const i = grid.index(x, y);
  if (grid.movedCells[i] !== 0) return false;

  grid.types[i] = CellType.Water;
  grid.colors[i] = grid.colors[ti];
  grid.setCell(tx, ty, CellType.Sand);
  grid.movedCells[ti] = 1;
  grid.movedCells[i] = 1;
  return true;
}

function updateWater(grid: Grid, x: number, y: number): void {
  const d = Math.random() < 0.5 ? -1 : 1;
  tryMove(grid, x, y, x, y + 1, CellType.Water) ||
    tryMove(grid, x, y, x + d, y + 1, CellType.Water) ||
    tryMove(grid, x, y, x - d, y + 1, CellType.Water) ||
    tryMove(grid, x, y, x + d, y, CellType.Water) ||
    tryMove(grid, x, y, x - d, y, CellType.Water);
}
