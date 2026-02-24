export enum CellType {
  Empty = 0,
  Sand = 1,
  Stone = 2,
  Water = 3,
}

const BASE_COLORS: Record<CellType, [number, number, number, number]> = {
  [CellType.Empty]: [0, 0, 0, 0],
  [CellType.Sand]: [225, 188, 138, 255],
  [CellType.Stone]: [128, 128, 128, 255],
  [CellType.Water]: [64, 164, 223, 200],
};

const COLOR_VARIANCE: Record<CellType, number> = {
  [CellType.Empty]: 0,
  [CellType.Sand]: 0.12,
  [CellType.Stone]: 0.15,
  [CellType.Water]: 0,
};

export const PAINT_INTERVALS: Record<CellType, number> = {
  [CellType.Empty]: 0,
  [CellType.Sand]: 50,
  [CellType.Stone]: 0,
  [CellType.Water]: 50,
};

function packedColor(type: CellType): number {
  const [r, g, b, a] = BASE_COLORS[type];
  const brightness = 1 + Math.random() * COLOR_VARIANCE[type];
  const clamp = (n: number) => Math.max(0, Math.min(255, n)) | 0;
  return (
    (a << 24) |
    (clamp(b * brightness) << 16) |
    (clamp(g * brightness) << 8) |
    clamp(r * brightness)
  );
}

export class Grid {
  readonly cols: number;
  readonly rows: number;
  readonly types: Uint8Array;
  readonly colors: Uint32Array;
  readonly colorBytes: Uint8Array;
  readonly movedCells: Uint8Array;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    const size = cols * rows;
    this.types = new Uint8Array(size);
    this.movedCells = new Uint8Array(size);
    const buf = new ArrayBuffer(size * 4);
    this.colors = new Uint32Array(buf);
    this.colorBytes = new Uint8Array(buf);
    this.colors.fill(packedColor(CellType.Empty));
  }

  index(x: number, y: number): number {
    return y * this.cols + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  setCell(x: number, y: number, type: CellType): void {
    if (!this.inBounds(x, y)) return;
    const i = this.index(x, y);
    this.types[i] = type;
    this.colors[i] = packedColor(type);
  }

  getType(x: number, y: number): CellType {
    if (!this.inBounds(x, y)) return CellType.Empty;
    return this.types[this.index(x, y)] as CellType;
  }

  setMoved(x: number, y: number): void {
    if (!this.inBounds(x, y)) return;
    this.movedCells[this.index(x, y)] = 1;
  }

  clearMovedCells(): void {
    this.movedCells.fill(0);
  }
}
