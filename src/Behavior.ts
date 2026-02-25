import {
  CellType,
  Grid,
  WATER_SUBSURFACE_COLOR,
  WATER_SURFACE_COLOR,
} from "./Grid";

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

  applyWaterShading(grid);
}

function applyWaterShading(grid: Grid): void {
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const i = grid.index(x, y);
      if (grid.types[i] !== CellType.Water) continue;

      const hasWaterAbove =
        y > 0 && grid.types[grid.index(x, y - 1)] === CellType.Water;
      grid.colors[i] = hasWaterAbove
        ? WATER_SUBSURFACE_COLOR
        : WATER_SURFACE_COLOR;
    }
  }
}

function tryMove(
  grid: Grid,
  x: number,
  y: number,
  tx: number,
  ty: number,
): boolean {
  if (!grid.inBounds(tx, ty)) return false;
  const targetIndex = grid.index(tx, ty);
  if (
    grid.types[targetIndex] !== CellType.Empty ||
    grid.movedCells[targetIndex] !== 0
  )
    return false;

  grid.moveCell(x, y, tx, ty);
  grid.movedCells[targetIndex] = 1;
  return true;
}

function updateSand(grid: Grid, x: number, y: number): void {
  const d = Math.random() < 0.5 ? -1 : 1;
  if (trySwapWithWater(grid, x, y, x, y + 1)) return;
  if (tryMove(grid, x, y, x, y + 1)) return;
  if (tryMove(grid, x, y, x + d, y + 1)) return;
  tryMove(grid, x, y, x - d, y + 1);
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

  const sourceType = grid.types[i];
  const sourceColor = grid.colors[i];
  grid.types[i] = grid.types[ti];
  grid.colors[i] = grid.colors[ti];
  grid.types[ti] = sourceType;
  grid.colors[ti] = sourceColor;
  grid.movedCells[ti] = 1;
  grid.movedCells[i] = 1;
  return true;
}

function updateWater(grid: Grid, x: number, y: number): void {
  const d = Math.random() < 0.5 ? -1 : 1;
  if (tryMove(grid, x, y, x, y + 1)) return;
  //   if (tryMove(grid, x, y, x + d, y + 1)) return;
  //   if (tryMove(grid, x, y, x - d, y + 1)) return;
  if (tryMove(grid, x, y, x + d, y)) return;
  tryMove(grid, x, y, x - d, y);
}
