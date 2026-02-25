export enum CellType {
  Empty = 0,
  Sand = 1,
  Stone = 2,
  Water = 3,
  Acid = 4,
}

const BASE_COLORS: Record<CellType, [number, number, number, number]> = {
  [CellType.Empty]: [0, 0, 0, 0],
  [CellType.Sand]: [225, 188, 138, 255],
  [CellType.Stone]: [128, 128, 128, 255],
  [CellType.Water]: [64, 164, 223, 200],
  [CellType.Acid]: [0, 255, 0, 200],
};

function packColor(r: number, g: number, b: number, a: number): number {
  return (a << 24) | (b << 16) | (g << 8) | r;
}

export const WATER_SURFACE_COLOR = packColor(2, 173, 250, 70);
export const WATER_SUBSURFACE_COLOR = packColor(2, 173, 250, 40);

export const ACID_SURFACE_COLOR = packColor(0, 255, 0, 70);
export const ACID_SUBSURFACE_COLOR = packColor(0, 255, 0, 40);

const COLOR_VARIANCE: Record<CellType, number> = {
  [CellType.Empty]: 0,
  [CellType.Sand]: 0.12,
  [CellType.Stone]: 0.15,
  [CellType.Water]: 0,
  [CellType.Acid]: 0.1,
};

const SAND_BRIGHTNESS_RANGE = 18;
const SAND_RANDOM_JITTER = 2;
let sandBrightnessOffset = 0;

export const PAINT_INTERVALS: Record<CellType, number> = {
  [CellType.Empty]: 0,
  [CellType.Sand]: 50,
  [CellType.Stone]: 0,
  [CellType.Water]: 50,
  [CellType.Acid]: 50,
};

function packedColor(type: CellType): number {
  const [r, g, b, a] = BASE_COLORS[type];
  const brightness = 1 + Math.random() * COLOR_VARIANCE[type];
  const clamp = (n: number) => Math.max(0, Math.min(255, n)) | 0;

  if (type === CellType.Sand) {
    sandBrightnessOffset += Math.random() < 0.5 ? -1 : 1;
    sandBrightnessOffset = Math.max(
      -SAND_BRIGHTNESS_RANGE,
      Math.min(SAND_BRIGHTNESS_RANGE, sandBrightnessOffset),
    );
    const jitter =
      ((Math.random() * (SAND_RANDOM_JITTER * 2 + 1)) | 0) - SAND_RANDOM_JITTER;
    const offset = sandBrightnessOffset + jitter;

    return packColor(
      clamp(r + offset),
      clamp(g + offset),
      clamp(b + offset),
      a,
    );
  }

  return packColor(
    clamp(r * brightness),
    clamp(g * brightness),
    clamp(b * brightness),
    a,
  );
}

export class Grid {
  private static readonly EMPTY_COLOR = packedColor(CellType.Empty);

  readonly cols: number;
  readonly rows: number;

  readonly types: Uint8Array;

  readonly colors: Uint32Array;
  readonly colorBytes: Uint8Array;

  readonly bloom: Uint32Array;
  readonly bloomBytes: Uint8Array;

  readonly movedCells: Uint8Array;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;

    const size = cols * rows;

    this.types = new Uint8Array(size);
    this.movedCells = new Uint8Array(size);

    const baseBuf = new ArrayBuffer(size * 4);
    this.colors = new Uint32Array(baseBuf);
    this.colorBytes = new Uint8Array(baseBuf);
    this.colors.fill(Grid.EMPTY_COLOR);

    const bloomBuf = new ArrayBuffer(size * 4);
    this.bloom = new Uint32Array(bloomBuf);
    this.bloomBytes = new Uint8Array(bloomBuf);
    this.bloom.fill(0);
  }

  index(x: number, y: number): number {
    return y * this.cols + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  private static bloomColorFor(type: CellType, packed: number): number {
    return type === CellType.Acid ? packed : 0;
  }

  setCell(x: number, y: number, type: CellType): void {
    if (!this.inBounds(x, y)) return;

    const i = this.index(x, y);
    this.types[i] = type;

    const c = packedColor(type);
    const bloomColor = Grid.bloomColorFor(type, c);

    if (bloomColor) this.bloom[i] = bloomColor;
    else this.colors[i] = c;

    // Clear everything if empty (Think of a smarter way later)
    if (type == CellType.Empty) {
      this.bloom[i] = Grid.EMPTY_COLOR;
      this.colors[i] = Grid.EMPTY_COLOR;
    }
  }

  moveCell(fromX: number, fromY: number, toX: number, toY: number): void {
    const fromIndex = this.index(fromX, fromY);
    const toIndex = this.index(toX, toY);

    const t = this.types[fromIndex] as CellType;
    const c = this.colors[fromIndex];

    this.types[toIndex] = t;
    const bloomColor = Grid.bloomColorFor(t, c);
    if (bloomColor) this.bloom[toIndex] = bloomColor;
    else this.colors[toIndex] = c;

    this.types[fromIndex] = CellType.Empty;
    this.colors[fromIndex] = Grid.EMPTY_COLOR;
    this.bloom[fromIndex] = 0;
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
