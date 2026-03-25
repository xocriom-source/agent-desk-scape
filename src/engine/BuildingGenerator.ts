/**
 * BuildingGenerator — Creates extruded building geometry from real OSM polygon footprints.
 * ZERO BoxGeometry. All buildings use THREE.Shape + ExtrudeGeometry.
 */

import * as THREE from "three";
import type { OSMBuildingData } from "@/data/OSMService";
import { metersToUnits, hash, seededRandom } from "@/utils/GeoProjection";

const PALETTES = [
  ["#C8C0B0", "#B0A898", "#D8D0C0", "#A8A090"],
  ["#D4B896", "#C4A886", "#E4C8A6", "#B89876"],
  ["#B8C8A0", "#A8B890", "#C8D8B0", "#98A880"],
  ["#A0A8B8", "#909AA8", "#B0B8C8", "#808898"],
  ["#E8E0D0", "#D8D0C0", "#F0E8D8", "#D0C8B0"],
  ["#A89890", "#988880", "#B8A8A0", "#887870"],
];

function pickColor(seed: number): string {
  const palette = PALETTES[seed % PALETTES.length];
  return palette[seed % palette.length];
}

export function createBuildingMesh(building: OSMBuildingData): THREE.Mesh {
  const shape = new THREE.Shape();
  const verts = building.vertices;

  if (verts.length < 3) {
    shape.moveTo(-0.5, -0.5);
    shape.lineTo(0.5, -0.5);
    shape.lineTo(0.5, 0.5);
    shape.lineTo(-0.5, 0.5);
    shape.closePath();
  } else {
    shape.moveTo(verts[0].x, verts[0].z);
    for (let i = 1; i < verts.length; i++) {
      shape.lineTo(verts[i].x, verts[i].z);
    }
    shape.closePath();
  }

  // Ensure minimum height so buildings are always visible
  const heightUnits = Math.max(metersToUnits(10), metersToUnits(building.heightMeters));

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: heightUnits,
    bevelEnabled: false,
  });

  geometry.rotateX(-Math.PI / 2);

  const seed = hash(building.id);
  const color = pickColor(seed);

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.75 + seededRandom(seed + 1) * 0.15,
    metalness: 0.05,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(building.cx, 0, building.cz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { buildingId: building.id, tags: building.tags };

  return mesh;
}

export function generateAllBuildings(buildings: OSMBuildingData[]): THREE.Group {
  const group = new THREE.Group();
  group.name = "Buildings";

  let count = 0;
  for (const b of buildings) {
    try {
      const mesh = createBuildingMesh(b);
      group.add(mesh);
      count++;
    } catch (e) {
      console.warn(`[BuildingGenerator] Failed to create building ${b.id}`, e);
    }
  }

  console.log(`[BuildingGenerator] Generated ${count} buildings (ExtrudeGeometry)`);
  return group;
}
