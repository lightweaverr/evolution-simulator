
import * as THREE from 'three';

export const CELL_SIZE = 10; // or import from elsewhere

export const HEALTH_UNIT = 30;

export const PLANT_SPAWN_RATE = 0.01;

export const PLANT_GEOM = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
export const PLANT_MAT = new THREE.MeshBasicMaterial({ color: 0x6b8e23 }); // olive green

export const ANIMAL_GEOM = PLANT_GEOM; // same geometry is fine
export const ANIMAL_MAT = new THREE.MeshBasicMaterial({ color: 0xd2b48c }); // tan
