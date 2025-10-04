import * as THREE from "three";

import { Grid } from "./Grid";

import { Plant } from "./Plant";

import { Animal } from "./Animal";

 

export class World {

  scene: THREE.Scene;

  plants: Plant[] = [];

  animals: Animal[] = [];

  cellSize = 10;

  size = 500;

 

  constructor() {

    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(0x1a1a1a);

 

    // Add grid

    const grid = new Grid(this.size, this.cellSize);

    this.scene.add(grid.object3D);

 

    // Spawn plants

    for (let i = 0; i < 100; i++) {

      const x = Math.floor(Math.random() * (this.size / this.cellSize)) * this.cellSize - this.size / 2;

      const y = Math.floor(Math.random() * (this.size / this.cellSize)) * this.cellSize - this.size / 2;

      const plant = new Plant(x, y, this.cellSize);

      this.plants.push(plant);

      this.scene.add(plant.mesh);

    }

 

    // Spawn animals

    for (let i = 0; i < 20; i++) {

      const x = Math.floor(Math.random() * (this.size / this.cellSize)) * this.cellSize - this.size / 2;

      const y = Math.floor(Math.random() * (this.size / this.cellSize)) * this.cellSize - this.size / 2;

      const animal = new Animal(x, y, this.cellSize);

      this.animals.push(animal);

      this.scene.add(animal.mesh);

    }

  }

 

  step() {

    this.animals.forEach((animal, idx) => {

      animal.step(this.plants, this.animals, this.cellSize);

      if (!animal.isAlive()) {

        this.scene.remove(animal.mesh);

        this.animals.splice(idx, 1);

      }

    });

  }

}