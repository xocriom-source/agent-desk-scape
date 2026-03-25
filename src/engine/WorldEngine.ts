/**
 * WorldEngine — Main orchestrator that unifies all city generation systems.
 * Phases: OSM fetch → Terrain → Roads → Buildings → GLB → LOD
 */

import * as THREE from "three";
import { SceneManager } from "@/renderer/SceneManager";
import { fetchAndConvertCity, type OSMCityResult } from "@/data/OSMService";
import { generateAllBuildings } from "@/engine/BuildingGenerator";
import { generateAllRoads } from "@/engine/RoadGenerator";
import { createTerrain, generateTrees } from "@/engine/Terrain";
import { applyGLBModels } from "@/engine/AssetMatcher";
import { LODManager } from "@/engine/LODManager";

export type EngineStatus = "idle" | "loading" | "generating" | "ready" | "error";

export interface WorldEngineOptions {
  container: HTMLElement;
  lat?: number;
  lon?: number;
  radius?: number;
}

export class WorldEngine {
  private sceneManager: SceneManager;
  private lodManager: LODManager;
  private status: EngineStatus = "idle";
  private cityData: OSMCityResult | null = null;
  private onStatusChange?: (status: EngineStatus) => void;

  constructor(opts: WorldEngineOptions) {
    console.log("[WorldEngine] Initializing...");

    this.sceneManager = new SceneManager({ container: opts.container });
    this.lodManager = new LODManager();

    // Register LOD update in render loop
    this.sceneManager.onUpdate(() => {
      this.lodManager.update(this.sceneManager.camera.position);
    });

    this.sceneManager.start();
    this.setStatus("idle");
    console.log("[WorldEngine] Ready — render loop active");
  }

  private setStatus(s: EngineStatus) {
    this.status = s;
    console.log(`[WorldEngine] Status: ${s}`);
    this.onStatusChange?.(s);
  }

  /** Subscribe to status changes */
  onStatus(cb: (status: EngineStatus) => void) {
    this.onStatusChange = cb;
  }

  /** Get current status */
  getStatus(): EngineStatus {
    return this.status;
  }

  /**
   * Load and generate a city from real-world coordinates.
   */
  async loadCity(lat: number, lon: number, radius: number = 600): Promise<void> {
    try {
      // Phase 1: Fetch OSM data
      this.setStatus("loading");
      console.log(`[WorldEngine] Loading city: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      this.cityData = await fetchAndConvertCity(lat, lon, radius);

      // Phase 2: Generate terrain
      this.setStatus("generating");
      const terrain = createTerrain({ size: 2000 });
      this.sceneManager.scene.add(terrain);

      // Phase 3: Generate roads
      const roads = generateAllRoads(this.cityData.roads);
      this.sceneManager.scene.add(roads);

      // Phase 4: Generate buildings (extruded)
      const buildings = generateAllBuildings(this.cityData.buildings);
      this.sceneManager.scene.add(buildings);
      this.lodManager.registerGroup(buildings);

      // Phase 5: Try GLB models (non-blocking, fallback to extrude)
      try {
        const { glbGroup, matched } = await applyGLBModels(this.cityData.buildings, 30);
        if (matched.size > 0) {
          // Hide extruded versions of matched buildings
          for (const child of buildings.children) {
            if (child.userData?.buildingId && matched.has(child.userData.buildingId)) {
              child.visible = false;
            }
          }
          this.sceneManager.scene.add(glbGroup);
          this.lodManager.registerGroup(glbGroup);
        }
      } catch (e) {
        console.warn("[WorldEngine] GLB loading skipped:", e);
      }

      // Phase 6: Trees
      const trees = generateTrees(this.cityData.trees, 300);
      this.sceneManager.scene.add(trees);

      // Center camera on city
      const bounds = this.cityData.bounds;
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cz = (bounds.minZ + bounds.maxZ) / 2;
      const span = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
      this.sceneManager.camera.position.set(cx + span * 0.4, span * 0.5, cz + span * 0.4);
      this.sceneManager.controls.target.set(cx, 0, cz);

      this.setStatus("ready");
      console.log(`[WorldEngine] City generation complete! ${this.cityData.buildings.length} buildings, ${this.cityData.roads.length} roads`);
    } catch (error) {
      console.error("[WorldEngine] Failed to load city:", error);
      this.setStatus("error");
      throw error;
    }
  }

  /** Clean up and destroy */
  dispose() {
    this.sceneManager.dispose();
    this.cityData = null;
    console.log("[WorldEngine] Disposed");
  }

  /** Access the Three.js scene for external additions */
  getScene(): THREE.Scene {
    return this.sceneManager.scene;
  }

  /** Access the camera */
  getCamera(): THREE.PerspectiveCamera {
    return this.sceneManager.camera;
  }
}
