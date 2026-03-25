/**
 * AssetMatcher — Matches OSM buildings to GLB models based on footprint area and typology.
 * GLB loading is non-blocking to prevent freezing the render loop.
 */

import * as THREE from "three";
import type { OSMBuildingData } from "@/data/OSMService";
import { loadModelClone } from "@/loaders/GLBLoader";
import { metersToUnits } from "@/utils/GeoProjection";

export type BuildingSize = "small" | "medium" | "large";

const MODEL_PATHS: Record<BuildingSize, string[]> = {
  small: [
    "/models/small-buildingA.glb",
    "/models/small-buildingB.glb",
    "/models/small-buildingC.glb",
  ],
  medium: [
    "/models/large-buildingA.glb",
    "/models/large-buildingB.glb",
    "/models/large-buildingC.glb",
  ],
  large: [
    "/models/skyscraperA.glb",
    "/models/skyscraperB.glb",
    "/models/skyscraperC.glb",
  ],
};

export function classifyBuilding(building: OSMBuildingData): BuildingSize {
  const areaM2 = (building.width * 2) * (building.depth * 2);
  if (areaM2 < 200) return "small";
  if (areaM2 < 1000) return "medium";
  return "large";
}

export async function matchAndLoadGLB(
  building: OSMBuildingData,
  seed: number
): Promise<THREE.Group | null> {
  const size = classifyBuilding(building);
  const paths = MODEL_PATHS[size];

  if (!paths || paths.length === 0) return null;

  const modelPath = paths[seed % paths.length];

  try {
    const model = await loadModelClone(modelPath);

    const box = new THREE.Box3().setFromObject(model);
    const modelSize = new THREE.Vector3();
    box.getSize(modelSize);

    if (modelSize.y < 0.01) return null;

    const targetHeight = metersToUnits(building.heightMeters);
    const scale = targetHeight / modelSize.y;
    model.scale.setScalar(scale);

    box.setFromObject(model);
    const minY = box.min.y;
    model.position.set(building.cx, -minY, building.cz);

    model.userData = { buildingId: building.id, glbModel: modelPath };
    return model;
  } catch {
    return null;
  }
}

/**
 * Apply GLB models to a subset of buildings.
 * Each model loads via setTimeout to avoid blocking the main thread.
 */
export async function applyGLBModels(
  buildings: OSMBuildingData[],
  maxGLB: number = 50
): Promise<{ glbGroup: THREE.Group; matched: Set<string> }> {
  const glbGroup = new THREE.Group();
  glbGroup.name = "GLB_Buildings";
  const matched = new Set<string>();

  const candidates = buildings.slice(0, maxGLB);
  let count = 0;

  // Load each model non-blocking
  const loadPromises = candidates.map((b) => {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        try {
          const seed = b.id.charCodeAt(4) || 0;
          const model = await matchAndLoadGLB(b, seed);
          if (model) {
            glbGroup.add(model);
            matched.add(b.id);
            count++;
          }
        } catch (e) {
          // skip silently
        }
        resolve();
      }, 0);
    });
  });

  await Promise.all(loadPromises);

  console.log(`[AssetMatcher] Matched ${count}/${candidates.length} buildings to GLB models`);
  return { glbGroup, matched };
}
