/**
 * WorldEngine — Main orchestrator that unifies all city generation systems.
 * Phases: OSM fetch → Terrain → Roads → Buildings → GLB → LOD
 * RENDER LOOP STARTS IMMEDIATELY — data loads progressively.
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

    // START RENDER LOOP IMMEDIATELY — never block this
    this.sceneManager.start();
    this.setStatus("idle");
    console.log("[WorldEngine] Ready — render loop active");
  }

  private setStatus(s: EngineStatus) {
    this.status = s;
    console.log(`[WorldEngine] Status: ${s}`);
    this.onStatusChange?.(s);
  }

  onStatus(cb: (status: EngineStatus) => void) {
    this.onStatusChange = cb;
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  /**
   * Load and generate a city from real-world coordinates.
   * NON-BLOCKING: render loop stays alive throughout.
   */
  async loadCity(lat: number, lon: number, radius: number = 600): Promise<void> {
    // Don't await — let it run in background
    this.loadCityAsync(lat, lon, radius);
  }

  private async loadCityAsync(lat: number, lon: number, radius: number): Promise<void> {
    try {
      // Phase 1: Fetch OSM data
      this.setStatus("loading");
      console.log(`[WorldEngine] Loading city: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      this.cityData = await fetchAndConvertCity(lat, lon, radius);
      console.log(`[OSM] buildings: ${this.cityData.buildings.length}`);
      console.log(`[OSM] roads: ${this.cityData.roads.length}`);
      console.log(`[OSM] trees: ${this.cityData.trees.length}`);

      // Phase 2: Generate terrain IMMEDIATELY (lightweight)
      this.setStatus("generating");
      const terrain = createTerrain({ size: 2000 });
      this.sceneManager.scene.add(terrain);
      console.log("[WorldEngine] Terrain added");

      // Phase 3: Generate roads — non-blocking via setTimeout
      const cityData = this.cityData;
      setTimeout(() => {
        try {
          console.log("[GEN] generating roads...");
          const roads = generateAllRoads(cityData.roads);
          this.sceneManager.scene.add(roads);
          console.log("[GEN] roads added");
        } catch (e) {
          console.warn("[WorldEngine] Road generation failed:", e);
        }
      }, 0);

      // Phase 4: Generate buildings — non-blocking via setTimeout
      setTimeout(() => {
        try {
          console.log("[GEN] generating buildings...");
          const buildings = generateAllBuildings(cityData.buildings);
          this.sceneManager.scene.add(buildings);
          this.lodManager.registerGroup(buildings);
          console.log(`[GEN] ${buildings.children.length} buildings added`);

          // Phase 5: Try GLB models (non-blocking)
          setTimeout(async () => {
            try {
              const { glbGroup, matched } = await applyGLBModels(cityData.buildings, 30);
              if (matched.size > 0) {
                for (const child of buildings.children) {
                  if (child.userData?.buildingId && matched.has(child.userData.buildingId)) {
                    child.visible = false;
                  }
                }
                this.sceneManager.scene.add(glbGroup);
                this.lodManager.registerGroup(glbGroup);
                console.log(`[GEN] ${matched.size} GLB models applied`);
              }
            } catch (e) {
              console.warn("[WorldEngine] GLB loading skipped:", e);
            }
          }, 0);
        } catch (e) {
          console.warn("[WorldEngine] Building generation failed:", e);
        }
      }, 0);

      // Phase 6: Trees — non-blocking
      setTimeout(() => {
        try {
          const trees = generateTrees(cityData.trees, 300);
          this.sceneManager.scene.add(trees);
          console.log("[GEN] trees added");
        } catch (e) {
          console.warn("[WorldEngine] Tree generation failed:", e);
        }
      }, 10);

      // Center camera on city
      const bounds = this.cityData.bounds;
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cz = (bounds.minZ + bounds.maxZ) / 2;
      const span = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
      this.sceneManager.camera.position.set(cx + span * 0.4, span * 0.5, cz + span * 0.4);
      this.sceneManager.controls.target.set(cx, 0, cz);

      this.setStatus("ready");
      console.log(`[WorldEngine] City generation dispatched! ${this.cityData.buildings.length} buildings, ${this.cityData.roads.length} roads`);
    } catch (error) {
      console.error("[WorldEngine] Failed to load city:", error);
      this.setStatus("error");
    }
  }

  dispose() {
    this.sceneManager.dispose();
    this.cityData = null;
    console.log("[WorldEngine] Disposed");
  }

  getScene(): THREE.Scene {
    return this.sceneManager.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.sceneManager.camera;
  }
}
