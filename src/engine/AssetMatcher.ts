/**
 * AssetMatcher — Matches OSM buildings to GLB models based on footprint area and typology.
 */

import * as THREE from "three";
import type { OSMBuildingData } from "@/data/OSMService";
import { loadModelClone } from "@/loaders/GLBLoader";
import { metersToUnits } from "@/utils/GeoProjection";

export type BuildingSize = "small" | "medium" | "large";

// GLB model paths by size category (from existing project assets)
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

/**
 * Classify building by footprint area (in real meters²).
 */
export function classifyBuilding(building: OSMBuildingData): BuildingSize {
  // Width/depth are in world units (1 unit = 2m), convert back to meters
  const areaM2 = (building.width * 2) * (building.depth * 2);
  if (areaM2 < 200) return "small";
  if (areaM2 < 1000) return "medium";
  return "large";
}

/**
 * Try to load and fit a GLB model for a building.
 * Returns null if no models are available.
 */
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

    // Fit model to building footprint
    const box = new THREE.Box3().setFromObject(model);
    const modelSize = new THREE.Vector3();
    box.getSize(modelSize);

    if (modelSize.y < 0.01) return null;

    // Scale to match building height
    const targetHeight = metersToUnits(building.heightMeters);
    const scale = targetHeight / modelSize.y;
    model.scale.setScalar(scale);

    // Recompute bounds after scaling
    box.setFromObject(model);
    const minY = box.min.y;
    model.position.set(building.cx, -minY, building.cz);

    model.userData = { buildingId: building.id, glbModel: modelPath };
    return model;
  } catch {
    // Model not found — return null for fallback to extrude
    return null;
  }
}

/**
 * Apply GLB models to a subset of buildings.
 * Buildings that fail to load get skipped (caller should use extruded fallback).
 */
export async function applyGLBModels(
  buildings: OSMBuildingData[],
  maxGLB: number = 50
): Promise<{ glbGroup: THREE.Group; matched: Set<string> }> {
  const glbGroup = new THREE.Group();
  glbGroup.name = "GLB_Buildings";
  const matched = new Set<string>();

  // Only try GLB for a subset to maintain performance
  const candidates = buildings.slice(0, maxGLB);
  let count = 0;

  for (const b of candidates) {
    const seed = b.id.charCodeAt(4) || 0;
    const model = await matchAndLoadGLB(b, seed);
    if (model) {
      glbGroup.add(model);
      matched.add(b.id);
      count++;
    }
  }

  console.log(`[AssetMatcher] Matched ${count}/${candidates.length} buildings to GLB models`);
  return { glbGroup, matched };
}
