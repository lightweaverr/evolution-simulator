import * as THREE from "three";

import type { Grid } from "./Grid";



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



    const geom = new THREE.PlaneGeometry(grid.cellSize, grid.cellSize);

    const mat = new THREE.MeshBasicMaterial({ color: colorHex });

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

  }

}
