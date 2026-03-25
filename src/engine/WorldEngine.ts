/**
 * WorldEngine — Hybrid pipeline orchestrator.
 * Pipeline: OSM fetch → Terrain → Roads → Buildings (progressive) → Instancing → LOD → GLB (async)
 * Render loop starts IMMEDIATELY. All generation is non-blocking.
 */

import * as THREE from "three";
import { SceneManager } from "@/renderer/SceneManager";
import { fetchAndConvertCity, type OSMCityResult } from "@/data/OSMService";
import { generateBuildingsProgressive } from "@/engine/DensityController";
import { generateAllRoads } from "@/engine/RoadGenerator";
import { createTerrain, generateTrees } from "@/engine/Terrain";
import { createInstancedBuildings } from "@/engine/InstancedBuildingSystem";
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

    // LOD update in render loop
    this.sceneManager.onUpdate(() => {
      this.lodManager.update(this.sceneManager.camera.position);
    });

    // START RENDER LOOP IMMEDIATELY
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
   * Load city — non-blocking, render loop stays alive.
   */
  async loadCity(lat: number, lon: number, radius: number = 600): Promise<void> {
    this.loadCityAsync(lat, lon, radius);
  }

  private async loadCityAsync(lat: number, lon: number, radius: number): Promise<void> {
    try {
      // ── Phase 1: Fetch OSM data ──
      this.setStatus("loading");
      console.log(`[WorldEngine] Loading city: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      this.cityData = await fetchAndConvertCity(lat, lon, radius);
      console.log(`[OSM] buildings: ${this.cityData.buildings.length}`);
      console.log(`[OSM] roads: ${this.cityData.roads.length}`);
      console.log(`[OSM] trees: ${this.cityData.trees.length}`);

      const bounds = this.cityData.bounds;
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cz = (bounds.minZ + bounds.maxZ) / 2;
      const span = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);

      this.setStatus("generating");

      // ── Phase 2: Terrain (instant, lightweight) ──
      const terrain = createTerrain({ size: 2000 });
      this.sceneManager.scene.add(terrain);
      console.log("[WorldEngine] Terrain added");

      // ── Phase 3: Roads (deferred) ──
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

      // ── Phase 4: Buildings PROGRESSIVE (chunked, non-blocking) ──
      const buildingsGroup = generateBuildingsProgressive(
        cityData.buildings,
        cx, cz,
        (generated, total) => {
          console.log(`[GEN] buildings: ${generated}/${total}`);
        }
      );
      this.sceneManager.scene.add(buildingsGroup);
      this.lodManager.registerExtrudeGroup(buildingsGroup);

      // ── Phase 5: Instanced buildings for far distance ──
      setTimeout(() => {
        try {
          console.log("[GEN] creating instanced buildings...");
          const instanced = createInstancedBuildings(cityData.buildings);
          this.sceneManager.scene.add(instanced);
          this.lodManager.registerInstancedGroup(instanced);
          // Disable LOD initially so everything is visible
          // Enable after GLBs are loaded
          console.log("[GEN] instanced buildings added");
        } catch (e) {
          console.warn("[WorldEngine] Instancing failed:", e);
        }
      }, 100);

      // ── Phase 6: Trees (deferred) ──
      setTimeout(() => {
        try {
          const trees = generateTrees(cityData.trees, 300);
          this.sceneManager.scene.add(trees);
          console.log("[GEN] trees added");
        } catch (e) {
          console.warn("[WorldEngine] Tree generation failed:", e);
        }
      }, 200);

      // ── Phase 7: GLB models (async, delayed — bonus not base) ──
      setTimeout(async () => {
        try {
          console.log("[GEN] loading GLB models...");
          const { glbGroup, matched } = await applyGLBModels(cityData.buildings, 30);
          if (matched.size > 0) {
            this.sceneManager.scene.add(glbGroup);
            this.lodManager.registerGLBGroup(glbGroup);

            // Now enable LOD since we have all tiers
            this.lodManager.setEnabled(true);

            // Hide extruded versions of matched buildings
            for (const child of buildingsGroup.children) {
              if (child.userData?.buildingId && matched.has(child.userData.buildingId)) {
                child.visible = false;
              }
            }
            console.log(`[GEN] ${matched.size} GLB models applied`);
          }
        } catch (e) {
          console.warn("[WorldEngine] GLB loading skipped:", e);
        }
      }, 1000);

      // ── Center camera ──
      this.sceneManager.camera.position.set(cx + span * 0.4, span * 0.5, cz + span * 0.4);
      this.sceneManager.controls.target.set(cx, 0, cz);

      this.setStatus("ready");
      console.log(`[WorldEngine] City dispatched! ${cityData.buildings.length} buildings, ${cityData.roads.length} roads`);
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
