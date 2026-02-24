import { Application } from "pixi.js";
import { initDevtools } from "@pixi/devtools";
import { Grid, CellType } from "./Grid";
import { Renderer } from "./Renderer";
import { updateGrid } from "./Behavior";

(async () => {
  const app = new Application();
  (globalThis as any).__PIXI_APP__ = app;
  initDevtools({ app });
  await app.init({
    backgroundAlpha: 0,
    resizeTo: window,
    antialias: false,
    resolution: 1,
  });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

  const CELL_SIZE = 10;

  let grid = new Grid(
    Math.ceil(window.innerWidth / CELL_SIZE),
    Math.floor(window.innerHeight / CELL_SIZE),
  );
  let renderer = new Renderer(app, grid, CELL_SIZE);

  function copyGrid(oldGrid: Grid, newGrid: Grid) {
    const cols = Math.min(oldGrid.cols, newGrid.cols);
    const rows = Math.min(oldGrid.rows, newGrid.rows);
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const i = oldGrid.index(x, y);
        const type = oldGrid.types[i];
        if (type !== CellType.Empty) {
          const ni = newGrid.index(x, y);
          newGrid.types[ni] = type;
          newGrid.colors[ni] = oldGrid.colors[i];
        }
      }
    }
  }
  window.addEventListener("resize", () => {
    const newGrid = new Grid(
      Math.ceil(window.innerWidth / CELL_SIZE),
      Math.floor(window.innerHeight / CELL_SIZE),
    );
    copyGrid(grid, newGrid);
    grid = newGrid;
    renderer.destroy();
    renderer = new Renderer(app, grid, CELL_SIZE);
  });

  let isMouseDown = false;
  let mouseX = 0;
  let mouseY = 0;

  app.canvas.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    updateMouse(e);
  });
  app.canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
  });
  app.canvas.addEventListener("mousemove", (e) => {
    updateMouse(e);
  });

  function updateMouse(e: MouseEvent) {
    const rect = app.canvas.getBoundingClientRect();
    mouseX = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    mouseY = Math.floor((e.clientY - rect.top) / CELL_SIZE);
  }

  app.ticker.add(() => {
    if (isMouseDown) grid.setCell(mouseX, mouseY, CellType.Sand);
    grid.clearMovedCells();
    updateGrid(grid);
    renderer.render();
  });
  app.ticker.maxFPS = 120;
})();
