export enum MaterialType {
  Empty,
  Sand,
  Water,
  Wood,
  Stone,
}

export class Material {
  type: MaterialType;
  color: number;

  constructor(type: MaterialType, color: number) {
    this.type = type;
    this.color = color;
  }
  update(grid: Material[][], x: number, y: number) {}
}
