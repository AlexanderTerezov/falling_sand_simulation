import { CellType, Grid } from "./Grid";

export function updateGrid(grid: Grid): void {
  for (let y = grid.rows - 1; y >= 0; y--) {
    for (let x = 0; x < grid.cols; x++) {
      const type = grid.getType(x, y);

      if (type === CellType.Sand) {
        const direction = Math.random() < 0.5 ? -1 : 1;

        if (
          grid.inBounds(x, y + 1) &&
          grid.getType(x, y + 1) === CellType.Empty &&
          grid.movedCells[grid.index(x, y + 1)] === 0
        ) {
          grid.setCell(x, y, CellType.Empty);
          grid.setCell(x, y + 1, CellType.Sand);
          grid.movedCells[grid.index(x, y + 1)] = 1;
        } else if (
          grid.inBounds(x - direction, y + 1) &&
          grid.getType(x - direction, y + 1) === CellType.Empty &&
          grid.movedCells[grid.index(x - direction, y + 1)] === 0
        ) {
          grid.setCell(x, y, CellType.Empty);
          grid.setCell(x - direction, y + 1, CellType.Sand);
          grid.movedCells[grid.index(x - direction, y + 1)] = 1;
        } else if (
          grid.inBounds(x + direction, y + 1) &&
          grid.getType(x + direction, y + 1) === CellType.Empty &&
          grid.movedCells[grid.index(x + direction, y + 1)] === 0
        ) {
          grid.setCell(x, y, CellType.Empty);
          grid.setCell(x + direction, y + 1, CellType.Sand);
          grid.movedCells[grid.index(x + direction, y + 1)] = 1;
        }
      }
    }
  }
}
