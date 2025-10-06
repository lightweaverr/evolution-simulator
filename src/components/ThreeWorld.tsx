import { useEffect, useRef } from "react";

import * as THREE from "three";
import { GUI } from "lil-gui";

import { Simulation } from "../simulation/Simulation";

// Extend Performance interface for memory API
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export default function ThreeWorld() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);

  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

    const simulationRef = useRef<any>(null);
    const guiRef = useRef<GUI | null>(null);

  useEffect(() => {
    const container = containerRef.current!;

    if (!container) return;

    // Basic Three setup

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x2b2b2b); // dark grey background

    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio || 1);

    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Create an orthographic camera matched to pixel space so 1 unit = 1px

    function makeCamera(w: number, h: number) {
      // left, right, top, bottom (top>bottom in three)

      const cam = new THREE.OrthographicCamera(0, w, h, 0, -1000, 1000);

      cam.position.z = 10;

      cam.updateProjectionMatrix();

      return cam;
    }

    let width = container.clientWidth;

    let height = container.clientHeight;

    const camera = makeCamera(width, height);

    cameraRef.current = camera;

    // Build grid, creatures, and simulation

    const SIM_CELL_PX = 10; // required 10px grid cells

    // Add a container Group for all cell meshes (for easy clearing)

    const gridLayer = new THREE.Group();

    scene.add(gridLayer);

    const entityLayer = new THREE.Group();

    scene.add(entityLayer);

    // Utility for pixel-aligned positions: cells start at (0,0) top-left

    // function worldToCell(x: number, y: number) {

    //   return { cx: Math.floor(x / SIM_CELL_PX), cy: Math.floor(y / SIM_CELL_PX) };

    // }

    // Grid lines renderer

    let gridLines: THREE.LineSegments | null = null;

    function buildGridLines(grid: Simulation["grid"]) {
      if (gridLines && gridLines.parent) gridLines.parent.remove(gridLines);

      const geom = new THREE.BufferGeometry();

      const vertices: number[] = [];

      const w = grid.cols * grid.cellSize;

      const h = grid.rows * grid.cellSize;

      // vertical lines

      for (let i = 0; i <= grid.cols; i++) {
        const x = i * grid.cellSize;

        vertices.push(x, 0, 0, x, h, 0);
      }

      // horizontal lines

      for (let j = 0; j <= grid.rows; j++) {
        const y = j * grid.cellSize;

        vertices.push(0, y, 0, w, y, 0);
      }

      geom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );

      const mat = new THREE.LineBasicMaterial({
        color: 0xe6e6e6,
        opacity: 0.12,
        transparent: true,
      });

      gridLines = new THREE.LineSegments(geom, mat);

      gridLayer.add(gridLines);
    }

    // initialize simulation

    const sim = new Simulation(width, height, SIM_CELL_PX, entityLayer);

    sim.populateRandom(/*plants*/ 0.08, /*animals*/ 0.02);

    simulationRef.current = sim;

    buildGridLines(sim.grid);

    // Setup GUI for statistics
    const gui = new GUI({ title: "Simulation Stats" });
    guiRef.current = gui;
    
    // Position GUI in top right
    gui.domElement.style.position = "absolute";
    gui.domElement.style.top = "10px";
    gui.domElement.style.right = "10px";
    gui.domElement.style.zIndex = "1000";
    
    // Statistics object that will be updated
    const stats = {
      animalCount: 0,
      plantCount: 0,
      fps: 0,
      memoryUsage: "0 MB",
      tick: 0
    };
    
    // Add controls to GUI
    gui.add(stats, "animalCount").name("Animals").listen();
    gui.add(stats, "plantCount").name("Plants").listen();
    gui.add(stats, "fps").name("FPS").listen();
    gui.add(stats, "memoryUsage").name("Memory").listen();
    gui.add(stats, "tick").name("Tick").listen();

    // sizing

    function onResize() {
      width = container.clientWidth;

      height = container.clientHeight;

      renderer.setSize(width, height);

      if (!cameraRef.current) return;

      const cam = makeCamera(width, height);

      cameraRef.current = cam;

      // update scene camera

      // rebuild grid geometry & resize sim

      sim.resize(width, height);

      buildGridLines(sim.grid);
    }

    onResize();

    window.addEventListener("resize", onResize);

    // Animation & tick loop using RAF and tick interval

    const TICK_MS = 200; // tick duration in ms (simulation steps)

    let lastTick = performance.now();
    let lastFpsUpdate = performance.now();
    let frameCount = 0;

    let rafId = 0;

    function animate(now: number) {
      frameCount++;
      
      // Update FPS every second
      if (now - lastFpsUpdate >= 1000) {
        stats.fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = now;
      }
      
      // Update statistics
      stats.animalCount = sim.animals.length;
      stats.plantCount = sim.plants.length;
      stats.tick = sim.tick;
      
      // Update memory usage
      if (performance.memory) {
        const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        stats.memoryUsage = `${memoryMB} MB`;
      }
      
      if (now - lastTick >= TICK_MS) {
        sim.step();
        lastTick = now;
      }
      if (cameraRef.current) renderer.render(scene, cameraRef.current);
      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId); // stop the loop
      
      // Cleanup GUI
      if (guiRef.current) {
        guiRef.current.destroy();
        guiRef.current = null;
      }

      // dispose entity meshes
      while (entityLayer.children.length) {
        const ch = entityLayer.children[0] as THREE.Mesh;
        if (ch.geometry) ch.geometry.dispose();
        const mat = ch.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else if (mat) mat.dispose();
        entityLayer.remove(ch);
      }

      // dispose grid lines
      if (gridLines) {
        if (gridLines.geometry) gridLines.geometry.dispose();
        const gm = gridLines.material as THREE.Material | THREE.Material[];
        if (Array.isArray(gm)) gm.forEach(m => m.dispose());
        else if (gm) gm.dispose();
        if (gridLines.parent) gridLines.parent.remove(gridLines);
      }

      if (renderer.domElement && renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      renderer.dispose();
    };

  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}
