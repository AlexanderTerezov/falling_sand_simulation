import { Application, Graphics } from "pixi.js";
import { initDevtools } from "@pixi/devtools";
import "@pixi/devtools";

import { Material, MaterialType } from "./materials/Material";

(async () => {
  const app = new Application();
  (globalThis as any).__PIXI_APP__ = app;
  initDevtools({ app });
  await app.init({ background: "#222222", resizeTo: window });
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  const sand = new Material(MaterialType.Sand, 0xffff00);
  console.log(sand.color);
  const cellSize = 5;
  const graphics = new Graphics()
    .rect(100, 100, cellSize, cellSize)
    .fill(sand.color);

  app.stage.addChild(graphics);
})();
