import * as THREE from "three";
import type { Grid } from "./Grid";
import { PLANT_GEOM, PLANT_MAT, ANIMAL_GEOM, ANIMAL_MAT } from './constants.ts';





export abstract class Creature {

  cx: number;

  cy: number;

  mesh: THREE.Mesh;

  grid: Grid;

  type: "plant" | "animal";


  constructor(

    grid: Grid,

    cx: number,

    cy: number,

    colorHex: number,

    type: "plant" | "animal"

  ) {

    this.grid = grid;

    this.cx = cx;

    this.cy = cy;

    this.type = type;


    const isPlant = this.type === "plant";
    const geom = isPlant ? PLANT_GEOM : ANIMAL_GEOM;
    const mat = isPlant ? PLANT_MAT : ANIMAL_MAT;

    this.mesh = new THREE.Mesh(geom, mat);

    this.updateMeshPos();

  }



  updateMeshPos() {

    const x = this.cx * this.grid.cellSize + this.grid.cellSize / 2;

    const y = this.cy * this.grid.cellSize + this.grid.cellSize / 2;

    this.mesh.position.set(x, y, 0);

  }



  removeFromScene() {
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    const mat = this.mesh.material as THREE.Material | THREE.Material[];
    if (Array.isArray(mat)) mat.forEach(m => m.dispose());
    else if (mat) mat.dispose();
  }
  
}
