

export class Brain {

  decide(hasAdjacentPlant: boolean): "stay" | "move" | "eat" {

    if (hasAdjacentPlant) {

      return Math.random() < 0.9 ? "eat" : "move";

    }

    const r = Math.random();

    if (r < 0.3) return "stay";

    return "move";

  }

}
