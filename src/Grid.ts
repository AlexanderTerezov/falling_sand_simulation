export enum CellType {
  Empty = 0,
  Sand = 1,
}

const COLORS: Record<CellType, number> = {
  [CellType.Empty]: 0xff222222,
  [CellType.Sand]: 0xff80c8f0,
};

export class Grid {
  readonly cols: number;
  readonly rows: number;

  readonly types: Uint8Array;

  readonly colors: Uint32Array;
  readonly colorBytes: Uint8Array;

  movedCells: Uint8Array;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;

    const size = cols * rows;
    this.types = new Uint8Array(size);

    const buf = new ArrayBuffer(size * 4);
    this.colors = new Uint32Array(buf);
    this.colorBytes = new Uint8Array(buf);

    this.colors.fill(COLORS[CellType.Empty]);
    this.movedCells = new Uint8Array(size);
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
    this.colors[i] = COLORS[type];
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
