import { Application } from "pixi.js";
import { initDevtools } from "@pixi/devtools";
import { Grid, CellType, PAINT_INTERVALS } from "./Grid";
import { Renderer } from "./Renderer";
import { updateGrid } from "./Behavior";

const CELL_SIZE = 10;
const SIMULATION_INTERVAL = 8;
const MAX_STEPS_PER_TICK = 8;
const MATERIALS = Object.values(CellType).filter(
  (v) => typeof v === "number",
) as CellType[];

(async () => {
  const app = new Application();
  (globalThis as { __PIXI_APP__?: Application }).__PIXI_APP__ = app;
  initDevtools({ app });
  await app.init({
    backgroundAlpha: 0,
    resizeTo: window,
    antialias: false,
    resolution: 1,
  });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

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

  let currentMaterialIndex = 0;
  let brushRadius = 0;
  let isMouseDown = false;
  let mouseX = 0;
  let mouseY = 0;

  app.canvas.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
      currentMaterialIndex = (currentMaterialIndex + 1) % MATERIALS.length;
      return;
    }
    if (e.button === 0) {
      isMouseDown = true;
      updateMouse(e);
    }
  });
  app.canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
  });
  app.canvas.addEventListener("mousemove", (e) => {
    updateMouse(e);
  });
  app.canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      brushRadius = Math.max(0, brushRadius - Math.sign(e.deltaY));
    },
    { passive: false },
  );
  app.canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  function updateMouse(e: MouseEvent) {
    const rect = app.canvas.getBoundingClientRect();
    mouseX = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    mouseY = Math.floor((e.clientY - rect.top) / CELL_SIZE);
  }

  function paintBrush(cx: number, cy: number, type: CellType) {
    for (let dy = -brushRadius; dy <= brushRadius; dy++) {
      for (let dx = -brushRadius; dx <= brushRadius; dx++) {
        if (dx * dx + dy * dy <= brushRadius * brushRadius) {
          grid.setCell(cx + dx, cy + dy, type);
        }
      }
    }
  }

  let timeSinceLastPaint = 0;
  let simulationAccumulator = 0;

  app.ticker.add((ticker) => {
    if (isMouseDown) {
      timeSinceLastPaint += ticker.deltaMS;
      if (
        timeSinceLastPaint >= PAINT_INTERVALS[MATERIALS[currentMaterialIndex]]
      ) {
        paintBrush(mouseX, mouseY, MATERIALS[currentMaterialIndex]);
        timeSinceLastPaint = 0;
      }
    } else {
      timeSinceLastPaint = PAINT_INTERVALS[MATERIALS[currentMaterialIndex]];
    }

    simulationAccumulator += ticker.deltaMS;
    let steps = 0;
    while (
      simulationAccumulator >= SIMULATION_INTERVAL &&
      steps < MAX_STEPS_PER_TICK
    ) {
      grid.clearMovedCells();
      updateGrid(grid);
      simulationAccumulator -= SIMULATION_INTERVAL;
      steps++;
    }
    if (steps === MAX_STEPS_PER_TICK) simulationAccumulator = 0;

    renderer.render();
  });
  app.ticker.maxFPS = 120;
})();
