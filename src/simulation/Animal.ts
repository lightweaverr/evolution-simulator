
import { Creature } from "./Creature";

import type { Grid } from "./Grid";

import type { Vec2 } from "./types";



export class Animal extends Creature {

  cyclesSinceLastEat = 0;

  id: number;

  static nextId = 1;



  constructor(grid: Grid, cx: number, cy: number) {

    super(grid, cx, cy, 0xd2b48c, "animal");

    this.id = Animal.nextId++;

  }



  senseAdjacentPlant(): { found: boolean; pos?: Vec2 } {

    const dirs = [

      { x: 1, y: 0 },

      { x: -1, y: 0 },

      { x: 0, y: 1 },

      { x: 0, y: -1 },

    ];

    for (const d of dirs) {

      const nx = this.cx + d.x;

      const ny = this.cy + d.y;

      if (!this.grid.isInside(nx, ny)) continue;

      const c = this.grid.getCreature(nx, ny);

      if (c && c.type === "plant") return { found: true, pos: { x: nx, y: ny } };

    }

    return { found: false };

  }



  decideAction(rand = Math.random()): { action: "eat" | "move" | "stay"; target?: Vec2 } {

    const sense = this.senseAdjacentPlant();

    if (sense.found) {

      const r = rand;

      if (r < 0.6) return { action: "eat", target: sense.pos };

      if (r < 0.9) {

        const dx = sense.pos!.x - this.cx;

        const dy = sense.pos!.y - this.cy;

        const tx = this.cx + Math.sign(dx);

        const ty = this.cy + Math.sign(dy);

        if (this.grid.isInside(tx, ty) && !this.grid.getCreature(tx, ty)) {

          return { action: "move", target: { x: tx, y: ty } };

        }

        const randMove = this.randomAdjacentFree();

        if (randMove) return { action: "move", target: randMove };

        return { action: "stay" };

      }

      return { action: "stay" };

    } else {

      if (rand < 0.6) {

        const randMove = this.randomAdjacentFree();

        if (randMove) return { action: "move", target: randMove };

        return { action: "stay" };

      }

      return { action: "stay" };

    }

  }



  randomAdjacentFree(): Vec2 | null {

    const deltas = [

      { x: 1, y: 0 },

      { x: -1, y: 0 },

      { x: 0, y: 1 },

      { x: 0, y: -1 },

    ];

    const shuffled = deltas.sort(() => Math.random() - 0.5);

    for (const d of shuffled) {

      const nx = this.cx + d.x;

      const ny = this.cy + d.y;

      if (!this.grid.isInside(nx, ny)) continue;

      if (!this.grid.getCreature(nx, ny)) return { x: nx, y: ny };

    }

    return null;

  }

}
