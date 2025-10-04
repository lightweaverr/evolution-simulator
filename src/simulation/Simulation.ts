import * as THREE from "three";

import { Grid } from "./Grid";

import { Plant } from "./Plant";

import { Animal } from "./Animal";

 

export class Simulation {

  grid: Grid;

  plants: Plant[] = [];

  animals: Animal[] = [];

  tick = 0;

  cellSize: number;

  entityLayer: THREE.Group;

 

  PLANT_SPAWN_RATE = 0.001;

 

  constructor(widthPx: number, heightPx: number, cellSize: number, entityLayer: THREE.Group) {

    this.cellSize = cellSize;

    this.grid = new Grid(widthPx, heightPx, cellSize);

    this.entityLayer = entityLayer;

  }

 

  clearEntitiesFromScene() {

    while (this.entityLayer.children.length) {

      this.entityLayer.remove(this.entityLayer.children[0]);

    }

  }

 

  populateRandom(plantCountPct = 0.08, animalCountPct = 0.02) {

    const total = this.grid.cols * this.grid.rows;

    const plantCount = Math.max(1, Math.floor(total * plantCountPct));

    const animalCount = Math.max(1, Math.floor(total * animalCountPct));

 

    const empties = this.grid.emptyCells();

    this.shuffle(empties);

 

    let idx = 0;

    for (let i = 0; i < plantCount && idx < empties.length; i++, idx++) {

      const p = empties[idx];

      const plant = new Plant(this.grid, p.x, p.y);

      this.grid.setCreature(p.x, p.y, plant);

      this.plants.push(plant);

      this.entityLayer.add(plant.mesh);

    }

    for (let i = 0; i < animalCount && idx < empties.length; i++, idx++) {

      const p = empties[idx];

      const animal = new Animal(this.grid, p.x, p.y);

      this.grid.setCreature(p.x, p.y, animal);

      this.animals.push(animal);

      this.entityLayer.add(animal.mesh);

    }

  }

 

  shuffle<T>(arr: T[]) {

    for (let i = arr.length - 1; i > 0; i--) {

      const j = Math.floor(Math.random() * (i + 1));

      [arr[i], arr[j]] = [arr[j], arr[i]];

    }

  }

 

  step() {

    this.tick++;

    this.shuffle(this.animals);

    const survivors: Animal[] = [];

 

    for (const a of this.animals) {

      if (!this.grid.getCreature(a.cx, a.cy) || this.grid.getCreature(a.cx, a.cy) !== a) continue;

 

      const decision = a.decideAction();

      if (decision.action === "eat" && decision.target) {

        const target = this.grid.getCreature(decision.target.x, decision.target.y);

        if (target && target.type === "plant") {

          this.grid.setCreature(decision.target.x, decision.target.y, null);

          const pi = this.plants.indexOf(target as Plant);

          if (pi >= 0) {

            (target as Plant).removeFromScene();

            this.plants.splice(pi, 1);

          }

          a.cyclesSinceLastEat = 0;

        } else {

          const mv = a.randomAdjacentFree();

          if (mv) this.moveAnimal(a, mv.x, mv.y);

        }

        survivors.push(a);

      } else if (decision.action === "move" && decision.target) {

        this.moveAnimal(a, decision.target.x, decision.target.y);

        a.cyclesSinceLastEat++;

        survivors.push(a);

      } else {

        a.cyclesSinceLastEat++;

        survivors.push(a);

      }

    }

 

    const stillAlive: Animal[] = [];

    for (const a of survivors) {

      if (a.cyclesSinceLastEat >= 30) {

        this.grid.setCreature(a.cx, a.cy, null);

        a.removeFromScene();

      } else stillAlive.push(a);

    }

 

    this.animals = stillAlive;

  }

 

  moveAnimal(a: Animal, nx: number, ny: number) {

    if (!this.grid.isInside(nx, ny)) return false;

    if (this.grid.getCreature(nx, ny)) return false;

    this.grid.setCreature(a.cx, a.cy, null);

    a.cx = nx;

    a.cy = ny;

    a.updateMeshPos();

    this.grid.setCreature(nx, ny, a);

    return true;

  }

 

  resize(widthPx: number, heightPx: number) {

    this.grid.resize(widthPx, heightPx);

    this.plants = this.plants.filter((p) => {

      if (!this.grid.isInside(p.cx, p.cy)) {

        p.removeFromScene();

        return false;

      }

      return true;

    });

    this.animals = this.animals.filter((a) => {

      if (!this.grid.isInside(a.cx, a.cy)) {

        a.removeFromScene();

        return false;

      }

      return true;

    });

  }

}
