

import { Creature } from "./Creature";

import type { Grid } from "./Grid";



export class Plant extends Creature {

  constructor(grid: Grid, cx: number, cy: number) {

    super(grid, cx, cy, 0x6b8e23, "plant");

  }

}