/**
 * Terrain — Ground plane with subtle noise and horizon effect.
 */

import * as THREE from "three";
import { seededRandom } from "@/utils/GeoProjection";

export interface TerrainOptions {
  size?: number;
  segments?: number;
  color?: string;
  noiseScale?: number;
}

/**
 * Create a terrain ground plane with subtle height variation.
 */
export function createTerrain(opts: TerrainOptions = {}): THREE.Mesh {
  const { size = 2000, segments = 128, color = "#6B8F4E", noiseScale = 0.3 } = opts;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  // Apply subtle noise
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    // Simple noise approximation
    const noise = seededRandom(Math.floor(x * 0.1 + 5000) * 1000 + Math.floor(z * 0.1 + 5000));
    pos.setY(i, (noise - 0.5) * noiseScale);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.95,
    metalness: 0,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.name = "Terrain";

  console.log(`[Terrain] Created ${size}x${size} ground plane`);
  return mesh;
}

/**
 * Create simple tree meshes for vegetation.
 */
export function createTree(x: number, z: number, scale: number): THREE.Group {
  const group = new THREE.Group();

  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 1.5 * scale, 6),
    new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9 })
  );
  trunk.position.y = 0.75 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  // Canopy
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(1.2 * scale, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x4A7A2E, roughness: 0.85 })
  );
  canopy.position.y = 2.2 * scale;
  canopy.castShadow = true;
  group.add(canopy);

  group.position.set(x, 0, z);
  return group;
}

/**
 * Generate tree instances from OSM tree data.
 */
export function generateTrees(treesData: Array<{ x: number; z: number; size: number }>, maxTrees: number = 500): THREE.Group {
  const group = new THREE.Group();
  group.name = "Trees";

  const limit = Math.min(treesData.length, maxTrees);
  for (let i = 0; i < limit; i++) {
    const t = treesData[i];
    group.add(createTree(t.x, t.z, t.size));
  }

  console.log(`[Terrain] Generated ${limit} trees`);
  return group;
}
