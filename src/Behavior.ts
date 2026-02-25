import {
  CellType,
  Grid,
  WATER_SUBSURFACE_COLOR,
  WATER_SURFACE_COLOR,
  ACID_SUBSURFACE_COLOR,
  ACID_SURFACE_COLOR,
} from "./Grid";

// ==================== Types ====================

type CellBehavior = (grid: Grid, x: number, y: number) => void;

// ==================== Behavior Registry ====================

const behaviors: Partial<Record<CellType, CellBehavior>> = {
  [CellType.Sand]: updateSand,
  [CellType.Water]: updateWater,
  [CellType.Acid]: updateAcid,
};

// ==================== Core Update Loop ====================

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
      const behavior = behaviors[type];
      if (behavior) {
        behavior(grid, x, y);
      }
    }
  }

  applyFluidShading(
    grid,
    CellType.Water,
    WATER_SURFACE_COLOR,
    WATER_SUBSURFACE_COLOR,
    false,
  );
  applyFluidShading(
    grid,
    CellType.Acid,
    ACID_SURFACE_COLOR,
    ACID_SUBSURFACE_COLOR,
    true,
  );
}

// ==================== Generic Fluid Shading ====================

function applyFluidShading(
  grid: Grid,
  type: CellType,
  surfaceColor: number,
  subsurfaceColor: number,
  bloom: boolean,
): void {
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const i = grid.index(x, y);
      if (grid.types[i] !== type) continue;

      const hasAbove = y > 0 && grid.types[grid.index(x, y - 1)] === type;
      if (!bloom) grid.colors[i] = hasAbove ? subsurfaceColor : surfaceColor;
      else grid.bloom[i] = hasAbove ? subsurfaceColor : surfaceColor;
    }
  }
}

// ==================== Movement Helpers ====================

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

// ==================== Behaviors ====================

function updateSand(grid: Grid, x: number, y: number): void {
  const d = Math.random() < 0.5 ? -1 : 1;
  if (trySwapWithWater(grid, x, y, x, y + 1)) return;
  if (tryMove(grid, x, y, x, y + 1)) return;
  if (tryMove(grid, x, y, x + d, y + 1)) return;
  tryMove(grid, x, y, x - d, y + 1);
}

function updateWater(grid: Grid, x: number, y: number): void {
  const d = Math.random() < 0.5 ? -1 : 1;
  if (tryMove(grid, x, y, x, y + 1)) return;
  if (tryMove(grid, x, y, x + d, y)) return;
  tryMove(grid, x, y, x - d, y);
}

const ACID_DISSOLVE_RULES: Partial<
  Record<
    CellType,
    {
      directions: [number, number][];
      chance: number;
    }
  >
> = {
  [CellType.Stone]: {
    directions: [
      [0, 1],
      [-1, 0],
      [1, 0],
    ],
    chance: 0.01,
  },
  [CellType.Sand]: {
    directions: [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ],
    chance: 0.03,
  },
  [CellType.Water]: {
    directions: [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ],
    chance: 0.4,
  },
};

function updateAcid(grid: Grid, x: number, y: number): void {
  const i = grid.index(x, y);

  for (const [targetType, rule] of Object.entries(ACID_DISSOLVE_RULES) as any) {
    const type = Number(targetType) as CellType;
    for (const [dx, dy] of rule.directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (!grid.inBounds(nx, ny)) continue;

      const ni = grid.index(nx, ny);
      if (grid.types[ni] !== type || grid.movedCells[ni] !== 0) continue;

      if (Math.random() < rule.chance) {
        grid.types[i] = CellType.Empty;
        grid.colors[i] = 0;
        grid.bloom[i] = 0;
        grid.types[ni] = CellType.Empty;
        grid.colors[ni] = 0;
        grid.bloom[ni] = 0;
        grid.movedCells[i] = 1;
        grid.movedCells[ni] = 1;
        return;
      }
    }
  }

  const d = Math.random() < 0.5 ? -1 : 1;
  if (tryMove(grid, x, y, x, y + 1)) return;
  if (tryMove(grid, x, y, x + d, y)) return;
  tryMove(grid, x, y, x - d, y);
}
