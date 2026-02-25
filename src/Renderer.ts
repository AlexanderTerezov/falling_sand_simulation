import { Application, BufferImageSource, Sprite, Texture } from "pixi.js";
import { Grid } from "./Grid";

export class Renderer {
  private readonly app: Application;
  private readonly source: BufferImageSource;
  private readonly texture: Texture;
  private readonly sprite: Sprite;

  constructor(app: Application, grid: Grid, cellSize: number) {
    this.app = app;
    this.source = new BufferImageSource({
      resource: grid.colorBytes,
      width: grid.cols,
      height: grid.rows,
      format: "rgba8unorm",
    });

    this.source.style.scaleMode = "nearest";

    this.texture = new Texture({ source: this.source });
    this.sprite = new Sprite(this.texture);
    this.sprite.scale.set(cellSize);

    app.stage.addChild(this.sprite);
  }

  render(): void {
    this.source.update();
  }

  destroy(): void {
    this.app.stage.removeChild(this.sprite);
    this.sprite.destroy();
    this.texture.destroy(true);
    this.source.destroy();
  }
}
