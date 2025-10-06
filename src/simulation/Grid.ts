import type { Creature } from "./Creature";

import type { Vec2 } from "./types";

import { SIM_CELL_PX } from "./types";



export class Grid {

  cols: number;

  rows: number;

  cellSize: number;

  cells: (null | Creature)[][];

  object3D: any;

  constructor(widthPx: number, heightPx: number, cellSize = SIM_CELL_PX) {

    this.cellSize = cellSize;

    this.cols = Math.max(1, Math.floor(widthPx / cellSize));

    this.rows = Math.max(1, Math.floor(heightPx / cellSize));

    this.cells = Array.from({ length: this.cols }, () =>

      Array(this.rows).fill(null)

    );
  }



  resize(widthPx: number, heightPx: number) {

    const newCols = Math.max(1, Math.floor(widthPx / this.cellSize));

    const newRows = Math.max(1, Math.floor(heightPx / this.cellSize));

    const newCells: (null | Creature)[][] = Array.from({ length: newCols }, () =>

      Array(newRows).fill(null)

    );



    for (let x = 0; x < Math.min(this.cols, newCols); x++) {

      for (let y = 0; y < Math.min(this.rows, newRows); y++) {

        newCells[x][y] = this.cells[x][y];

      }

    }



    this.cols = newCols;

    this.rows = newRows;

    this.cells = newCells;

  }



  isInside(cx: number, cy: number) {

    return cx >= 0 && cy >= 0 && cx < this.cols && cy < this.rows;

  }



  getCreature(cx: number, cy: number) {

    if (!this.isInside(cx, cy)) return null;

    return this.cells[cx][cy];

  }



  setCreature(cx: number, cy: number, c: Creature | null) {

    if (!this.isInside(cx, cy)) return false;

    this.cells[cx][cy] = c;

    return true;

  }



  emptyCells(): Vec2[] {

    const out: Vec2[] = [];

    for (let x = 0; x < this.cols; x++) {

      for (let y = 0; y < this.rows; y++) {

        if (!this.cells[x][y]) out.push({ x, y });

      }

    }

    return out;

  }

}

