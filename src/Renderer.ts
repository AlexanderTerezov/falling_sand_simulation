import { Application, BufferImageSource, Sprite, Texture } from "pixi.js";
import { BloomFilter } from "pixi-filters";
import { Grid } from "./Grid";

export class Renderer {
  private readonly app: Application;

  private readonly baseSource: BufferImageSource;
  private readonly baseTexture: Texture;
  private readonly baseSprite: Sprite;

  private readonly bloomSource: BufferImageSource;
  private readonly bloomTexture: Texture;
  private readonly bloomSprite: Sprite;

  constructor(app: Application, grid: Grid, cellSize: number) {
    this.app = app;

    this.baseSource = new BufferImageSource({
      resource: grid.colorBytes,
      width: grid.cols,
      height: grid.rows,
      format: "rgba8unorm",
    });
    this.baseSource.style.scaleMode = "nearest";
    this.baseTexture = new Texture({ source: this.baseSource });
    this.baseSprite = new Sprite(this.baseTexture);
    this.baseSprite.scale.set(cellSize);

    this.bloomSource = new BufferImageSource({
      resource: grid.bloomBytes,
      width: grid.cols,
      height: grid.rows,
      format: "rgba8unorm",
    });
    this.bloomSource.style.scaleMode = "nearest";
    this.bloomTexture = new Texture({ source: this.bloomSource });
    this.bloomSprite = new Sprite(this.bloomTexture);
    this.bloomSprite.scale.set(cellSize);

    this.bloomSprite.filters = [new BloomFilter({ strength: 10 })];

    app.stage.addChild(this.baseSprite);
    app.stage.addChild(this.bloomSprite);
  }

  render(): void {
    this.baseSource.update();
    this.bloomSource.update();
  }

  destroy(): void {
    this.app.stage.removeChild(this.baseSprite);
    this.app.stage.removeChild(this.bloomSprite);

    this.baseSprite.destroy();
    this.baseTexture.destroy(true);
    this.baseSource.destroy();

    this.bloomSprite.destroy();
    this.bloomTexture.destroy(true);
    this.bloomSource.destroy();
  }
}
