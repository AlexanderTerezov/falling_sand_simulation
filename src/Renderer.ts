import { Application, BufferImageSource, Sprite, Texture } from "pixi.js";
import { Grid } from "./Grid";

export class Renderer {
  private readonly source: BufferImageSource;

  constructor(app: Application, grid: Grid, cellSize: number) {
    this.source = new BufferImageSource({
      resource: grid.colorBytes, // the GPU reads directly from this buffer
      width: grid.cols,
      height: grid.rows,
      format: "rgba8unorm",
    });

    this.source.style.scaleMode = "nearest";

    const texture = new Texture({ source: this.source });
    const sprite = new Sprite(texture);
    sprite.scale.set(cellSize);

    app.stage.addChild(sprite);
  }

  render(): void {
    this.source.update();
  }
}
