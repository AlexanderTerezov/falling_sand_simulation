import { Application, Assets, BitmapFont, BitmapText, Sprite } from "pixi.js";
import { initDevtools } from "@pixi/devtools";
import { Grid, CellType, PAINT_INTERVALS } from "./Grid";
import { Renderer } from "./Renderer";
import { updateGrid } from "./Behavior";

const CELL_SIZE = 10;
const SIMULATION_INTERVAL = 8;
const MAX_STEPS_PER_TICK = 8;
const LABEL_TEXTS = ["Paint", "Brush Size", "Material"] as const;
const LABEL_SPACING = 300;

const MATERIALS: CellType[] = [
  CellType.Sand,
  CellType.Stone,
  CellType.Water,
  CellType.Empty,
];

function createGridFromWindow(): Grid {
  return new Grid(
    Math.ceil(window.innerWidth / CELL_SIZE),
    Math.floor(window.innerHeight / CELL_SIZE),
  );
}

function copyGrid(oldGrid: Grid, newGrid: Grid): void {
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

function createCenterLabel(text: string): BitmapText {
  return new BitmapText({
    text,
    style: {
      fontFamily: "Custom",
      fontSize: CELL_SIZE * 3,
      align: "center",
    },
    anchor: 0.5,
  });
}

function layoutLabelsAndSprites(
  labels: BitmapText[],
  controls: Sprite[],
): void {
  const screenWidth = window.innerWidth;
  const baseX =
    screenWidth / 2 - ((LABEL_TEXTS.length - 1) * LABEL_SPACING) / 2;
  const baseY = 150;

  labels.forEach((label, index) => {
    let targetX = baseX + index * LABEL_SPACING;
    let targetY = baseY;
    targetX = Math.round(targetX / CELL_SIZE) * CELL_SIZE;
    targetY = Math.round(targetY / CELL_SIZE) * CELL_SIZE;
    label.position.set(targetX, targetY);

    const sprite = controls[index];
    const spriteOffsetY = CELL_SIZE * 6;
    const spriteX = targetX;
    const spriteY = targetY - spriteOffsetY;
    sprite.position.set(Math.round(spriteX), Math.round(spriteY));
  });

  controls.forEach((sprite) => {
    sprite.scale.set((CELL_SIZE * 5) / sprite.texture.width);
  });
}

(async () => {
  const app = new Application();
  (globalThis as { __PIXI_APP__?: Application }).__PIXI_APP__ = app;
  initDevtools({ app });

  await app.init({
    backgroundAlpha: 0,
    resizeTo: window,
    antialias: false,
    resolution: 1,
    roundPixels: true,
  });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

  await Assets.load("/assets/Tiny5-Regular.ttf");

  await Assets.load([
    "/assets/controls1.png",
    "/assets/controls2.png",
    "/assets/controls3.png",
  ]);

  BitmapFont.install({
    name: "Custom",
    style: {
      fontFamily: "Tiny5 Regular",
      fontSize: CELL_SIZE * 3,
      fill: "#ffd4ab",
    },
    chars: [
      ["a", "z"],
      ["A", "Z"],
      ["0", "9"],
      [" ", " "],
    ],
    resolution: window.devicePixelRatio,
    padding: 1,
    textureStyle: {
      scaleMode: "nearest",
    },
  });

  const controlTextures = [
    Assets.get("/assets/controls2.png"),
    Assets.get("/assets/controls3.png"),
    Assets.get("/assets/controls1.png"),
  ];

  const controls: Sprite[] = controlTextures.map((tex) => {
    const sprite = new Sprite(tex);
    tex.source.scaleMode = "nearest";
    sprite.anchor.set(0.5);
    app.stage.addChild(sprite);
    sprite.tint = 0xffd4ab;
    return sprite;
  });

  const labels = LABEL_TEXTS.map((label) => createCenterLabel(label));
  labels.forEach((label) => app.stage.addChild(label));

  let grid = createGridFromWindow();
  let renderer = new Renderer(app, grid, CELL_SIZE);

  const resizeGridAndRenderer = () => {
    const newGrid = createGridFromWindow();
    copyGrid(grid, newGrid);
    grid = newGrid;

    renderer.destroy();
    renderer = new Renderer(app, grid, CELL_SIZE);
  };

  let resizeTimeout: number;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeGridAndRenderer();

      requestAnimationFrame(() => {
        layoutLabelsAndSprites(labels, controls);
      });
    }, 100);
  });

  layoutLabelsAndSprites(labels, controls);

  window.addEventListener("resize", () => {
    resizeGridAndRenderer();
    layoutLabelsAndSprites(labels, controls);
  });

  let currentMaterialIndex = 0;
  let brushRadius = 0;
  let isMouseDown = false;
  let mouseX = 0;
  let mouseY = 0;

  const updateMouse = (e: MouseEvent) => {
    const rect = app.canvas.getBoundingClientRect();
    mouseX = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    mouseY = Math.floor((e.clientY - rect.top) / CELL_SIZE);
  };

  const paintBrush = (cx: number, cy: number, type: CellType) => {
    for (let dy = -brushRadius; dy <= brushRadius; dy++) {
      for (let dx = -brushRadius; dx <= brushRadius; dx++) {
        if (dx * dx + dy * dy <= brushRadius * brushRadius) {
          grid.setCell(cx + dx, cy + dy, type);
        }
      }
    }
  };

  app.canvas.addEventListener("mousedown", (e: MouseEvent) => {
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

  app.canvas.addEventListener("mousemove", (e: MouseEvent) => {
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

    if (steps === MAX_STEPS_PER_TICK) {
      simulationAccumulator = 0;
    }

    renderer.render();
  });

  app.ticker.maxFPS = 120;
})();
