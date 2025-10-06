
import type { Vec2 } from "./types";
/**
 * Brain: contains the decision policy for an Animal.
 * - laziness: [0,1] higher => more likely to stay
 * - wanderLust: [0,1] higher => more likely to repeat last move direction
 */


type AdjMove = { pos: Vec2; dir: Vec2 };

export class Brain {
  laziness: number;
  wanderLust: number;

  constructor(laziness = Math.random(), wanderLust = Math.random()) {
    this.laziness = laziness;
    this.wanderLust = wanderLust;
  }

  /**
   * Decide the next action.
   *
   * @param sense - result of sensing (if plant adjacent, pos given)
   * @param lastDir - last move direction of the animal (or undefined)
   * @param freeMoves - list of available adjacent free cells along with their direction vectors
   */
  decide(
    sense: { found: boolean; pos?: Vec2 },
    lastDir?: Vec2,
    freeMoves?: AdjMove[]
  ): { action: "eat" | "move" | "stay"; target?: Vec2 } {
    // 1) If food detected: eat 99% of the time, otherwise fallback to move/stay
    if (sense.found) {
      if (Math.random() < 0.99) {
        return { action: "eat", target: sense.pos };
      } else {
        // 1% of the time: either move (if possible) or stay (prefer stay)
        if (freeMoves && freeMoves.length && Math.random() < 0.5) {
          const pick = freeMoves[Math.floor(Math.random() * freeMoves.length)];
          return { action: "move", target: pick.pos };
        }
        return { action: "stay" };
      }
    }

    // 2) No food nearby: use laziness to decide whether to move
    const moveProb = 1 - this.laziness; // higher laziness => lower moveProb
    if (!freeMoves || freeMoves.length === 0) {
      return { action: "stay" };
    }

    if (Math.random() < moveProb) {
      // Choose direction. If lastDir exists and wanderLust > 0, bias toward lastDir.
      if (lastDir && this.wanderLust > 0) {
        const same = freeMoves.find((f) => f.dir.x === lastDir.x && f.dir.y === lastDir.y);
        if (same) {
          // preference probability scales with wanderLust (0.5..1.0)
          const prefP = 0.5 + 0.5 * this.wanderLust;
          if (Math.random() < prefP) {
            return { action: "move", target: same.pos };
          }
        }
      }
      // otherwise pick uniformly among free moves
      const pick = freeMoves[Math.floor(Math.random() * freeMoves.length)];
      return { action: "move", target: pick.pos };
    }

    // default: stay
    return { action: "stay" };
  }
}
