// src/simulation/Simulation.ts
import * as THREE from "three";
import { Grid } from "./Grid";
import { Plant } from "./Plant";
import { Animal } from "./Animal";
import { HEALTH_UNIT, PLANT_SPAWN_RATE } from "./constants";

export class Simulation {
  grid: Grid;
  plants: Plant[] = [];
  animals: Animal[] = [];
  tick = 0;
  cellSize: number;
  entityLayer: THREE.Group;

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
      // ensure animal still occupies its grid cell (not killed/moved)
      if (!this.grid.getCreature(a.cx, a.cy) || this.grid.getCreature(a.cx, a.cy) !== a) continue;

      const decision = a.decideAction();

      if (decision.action === "eat" && decision.target) {
        const target = this.grid.getCreature(decision.target.x, decision.target.y);
        if (target && target.type === "plant") {
          // eat: remove plant from grid & scene
          this.grid.setCreature(decision.target.x, decision.target.y, null);
          const pi = this.plants.indexOf(target as Plant);
          if (pi >= 0) {
            (target as Plant).removeFromScene();
            this.plants.splice(pi, 1);
          }
          // eating resets starvation counter
          a.cyclesSinceLastEat = 0;
          a.health += HEALTH_UNIT;
          // we do not automatically move into the eaten cell (keeps original behavior)
        } else {
          // fallback: try to move randomly
          const mv = a.randomAdjacentFree();
          if (mv) {
            const moved = this.moveAnimal(a, mv.x, mv.y);
            if (moved) {
              a.energy -= 1.0; // moving cost
              a.health -= 1.0;
            }
          }
        }
        survivors.push(a);
      } else if (decision.action === "move" && decision.target) {
        const moved = this.moveAnimal(a, decision.target.x, decision.target.y);
        if (moved) {
          a.cyclesSinceLastEat++;
    
          a.energy -= 1.0; // moving cost
          survivors.push(a);
        } else {
          // move failed: treat as a stay
          a.cyclesSinceLastEat++;
          a.energy -= 0.3; // staying cost
          survivors.push(a);
        }
      } else {
        // stay
        a.cyclesSinceLastEat++;
        a.energy -= 0.3; // staying cost
        survivors.push(a);
      }
    }

    // filter out animals that starved (old behavior)
    const stillAlive: Animal[] = [];
    for (const a of survivors) {
      if (a.energy < 0) {
        this.grid.setCreature(a.cx, a.cy, null);
        a.removeFromScene();
      } else stillAlive.push(a);
    }

    this.animals = stillAlive;

    // Plant respawning: each empty cell has a chance to spawn a plant
    this.spawnPlants();
  }

  moveAnimal(a: Animal, nx: number, ny: number) {
    if (!this.grid.isInside(nx, ny)) return false;
    if (this.grid.getCreature(nx, ny)) return false;
    const oldX = a.cx;
    const oldY = a.cy;

    this.grid.setCreature(oldX, oldY, null);

    // update animal coords + mesh
    a.cx = nx;
    a.cy = ny;
    a.updateMeshPos();

    // set new occupancy
    this.grid.setCreature(nx, ny, a);

    // record last move direction for wanderLust bias
    a.lastMoveDir = { x: nx - oldX, y: ny - oldY };

    return true;
  }

  spawnPlants() {
    // Get all empty cells
    const emptyCells = this.grid.emptyCells();
    
    // For each empty cell, check if a plant should spawn
    for (const cell of emptyCells) {
      if (Math.random() < PLANT_SPAWN_RATE) {
        const plant = new Plant(this.grid, cell.x, cell.y);
        this.grid.setCreature(cell.x, cell.y, plant);
        this.plants.push(plant);
        this.entityLayer.add(plant.mesh);
      }
    }
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
