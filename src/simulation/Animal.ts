// src/simulation/Animal.ts
import { Creature } from "./Creature";
import type { Grid } from "./Grid";
import type { Vec2 } from "./types";
import { Brain } from "./Brain";
import { HEALTH_UNIT } from "./constants";

/**
 * Helper type for available moves (position + direction vector)
 */
type AdjMove = { pos: Vec2; dir: Vec2 };

/**
 * Animal class — now delegates decisions to Brain.
 * Maintains lastMoveDir so Brain can prefer repeating it (wanderLust).
 */
export class Animal extends Creature {
  cyclesSinceLastEat = 0;
  id: number;
  static nextId = 1;
  health = HEALTH_UNIT;

  brain: Brain;
  laziness: number;
  wanderLust: number;
  lastMoveDir: Vec2 | null = null; // last move direction (dx,dy) e.g. {x:1,y:0}
  energy: number; // energy pool (moving/staying will cost energy)

  constructor(grid: Grid, cx: number, cy: number) {
    super(grid, cx, cy, 0xd2b48c, "animal");
    this.id = Animal.nextId++;
    // set per-animal behaviour params
    this.laziness = Math.random(); // [0,1]
    this.wanderLust = Math.random(); // [0,1]
    this.brain = new Brain(this.laziness, this.wanderLust);
    // starting energy (tunable). kept local — we only deduct cost after decisions.
    this.energy = HEALTH_UNIT;
  }

  // unchanged sensing of adjacent plants (4-neighbour)
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

  /**
   * Return a list of available adjacent free moves with direction vectors.
   * This is used by the Brain to choose biased directions.
   */
  adjacentFreeMoves(): AdjMove[] {
    const deltas = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
    const out: AdjMove[] = [];
    for (const d of deltas) {
      const nx = this.cx + d.x;
      const ny = this.cy + d.y;
      if (!this.grid.isInside(nx, ny)) continue;
      if (!this.grid.getCreature(nx, ny)) out.push({ pos: { x: nx, y: ny }, dir: { x: d.x, y: d.y } });
    }
    return out;
  }

  /**
   * Random free adjacent cell (kept for compatibility with Simulation fallbacks).
   */
  randomAdjacentFree(): Vec2 | null {
    const moves = this.adjacentFreeMoves();
    if (moves.length === 0) return null;
    const pick = moves[Math.floor(Math.random() * moves.length)];
    return pick.pos;
  }

  /**
   * Decide the next action using the Brain.
   * Returns { action, target? } where target is cell coordinates (cx,cy) for move/eat.
   */
  decideAction(): { action: "eat" | "move" | "stay"; target?: Vec2 } {
    const sense = this.senseAdjacentPlant();
    const freeMoves = this.adjacentFreeMoves();
    const last = this.lastMoveDir ?? undefined;
    return this.brain.decide(sense, last, freeMoves);
  }
}
