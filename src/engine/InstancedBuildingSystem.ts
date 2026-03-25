/**
 * InstancedBuildingSystem — Creates InstancedMesh representations
 * of buildings for ultra-efficient distant rendering.
 * Groups buildings by similar size categories and renders them
 * as instanced simplified boxes with unique transforms.
 */

import * as THREE from "three";
import type { OSMBuildingData } from "@/data/OSMService";
import { metersToUnits, hash, seededRandom } from "@/utils/GeoProjection";

type SizeCategory = "tiny" | "small" | "medium" | "tall" | "tower";

interface CategoryConfig {
  geometry: THREE.BufferGeometry;
  material: THREE.MeshStandardMaterial;
}

function categorize(b: OSMBuildingData): SizeCategory {
  const h = b.heightMeters;
  if (h < 8) return "tiny";
  if (h < 15) return "small";
  if (h < 30) return "medium";
  if (h < 60) return "tall";
  return "tower";
}

const CATEGORY_COLORS: Record<SizeCategory, string> = {
  tiny: "#C8C0B0",
  small: "#B8B0A0",
  medium: "#A8A098",
  tall: "#909AA8",
  tower: "#8090A8",
};

/**
 * Create instanced meshes for all buildings, grouped by size category.
 * Each category gets ONE InstancedMesh with unique per-instance transforms.
 */
export function createInstancedBuildings(buildings: OSMBuildingData[]): THREE.Group {
  const group = new THREE.Group();
  group.name = "InstancedBuildings";

  // Group buildings by category
  const categories = new Map<SizeCategory, OSMBuildingData[]>();
  for (const b of buildings) {
    const cat = categorize(b);
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(b);
  }

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  for (const [cat, blds] of categories) {
    if (blds.length === 0) continue;

    // Simplified box geometry (unit cube, scaled per instance)
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(CATEGORY_COLORS[cat]),
      roughness: 0.8,
      metalness: 0.05,
    });

    const instanced = new THREE.InstancedMesh(geo, mat, blds.length);
    instanced.castShadow = true;
    instanced.receiveShadow = true;
    instanced.name = `Instanced_${cat}`;

    for (let i = 0; i < blds.length; i++) {
      const b = blds[i];
      const w = Math.max(1, b.width);
      const d = Math.max(1, b.depth);
      const h = Math.max(metersToUnits(10), metersToUnits(b.heightMeters));

      position.set(b.cx, h / 2, b.cz);
      quaternion.identity();

      // Slight random rotation for variety
      const seed = hash(b.id);
      const rotY = seededRandom(seed + 99) * 0.1 - 0.05;
      quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);

      scale.set(w, h, d);
      matrix.compose(position, quaternion, scale);
      instanced.setMatrixAt(i, matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
    group.add(instanced);
    console.log(`[InstancedSystem] ${cat}: ${blds.length} instances`);
  }

  console.log(`[InstancedSystem] Total: ${buildings.length} instanced buildings`);
  return group;
}
