/**
 * RoadGenerator — Creates road geometry from OSM polyline data.
 * Uses custom strip geometry for accurate road widths.
 */

import * as THREE from "three";
import type { OSMRoadData } from "@/data/OSMService";
import { metersToUnits } from "@/utils/GeoProjection";

const ROAD_COLORS: Record<OSMRoadData["type"], string> = {
  primary: "#3A3A3A",
  secondary: "#4A4A4A",
  residential: "#555555",
  service: "#606060",
  footway: "#888888",
};

/**
 * Create a flat strip mesh along a polyline with given width.
 */
function createRoadStrip(segments: Array<{ x: number; z: number }>, widthUnits: number, color: string): THREE.Mesh | null {
  if (segments.length < 2) return null;

  const halfW = widthUnits / 2;
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < segments.length; i++) {
    const curr = segments[i];

    // Compute direction
    let dx: number, dz: number;
    if (i < segments.length - 1) {
      dx = segments[i + 1].x - curr.x;
      dz = segments[i + 1].z - curr.z;
    } else {
      dx = curr.x - segments[i - 1].x;
      dz = curr.z - segments[i - 1].z;
    }

    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) continue;

    // Normal perpendicular to direction
    const nx = -dz / len;
    const nz = dx / len;

    // Two vertices per segment point (left and right)
    vertices.push(
      curr.x + nx * halfW, 0.05, curr.z + nz * halfW,
      curr.x - nx * halfW, 0.05, curr.z - nz * halfW
    );
  }

  const numPoints = vertices.length / 3 / 2;
  for (let i = 0; i < numPoints - 1; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, c, b, b, c, d);
  }

  if (indices.length === 0) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.9,
    metalness: 0,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Generate all road meshes from OSM data.
 */
export function generateAllRoads(roads: OSMRoadData[]): THREE.Group {
  const group = new THREE.Group();
  group.name = "Roads";

  let count = 0;
  for (const road of roads) {
    const widthUnits = metersToUnits(road.widthMeters);
    const color = ROAD_COLORS[road.type] || "#555555";
    const mesh = createRoadStrip(road.segments, widthUnits, color);
    if (mesh) {
      mesh.userData = { roadId: road.id, name: road.name };
      group.add(mesh);
      count++;
    }
  }

  console.log(`[RoadGenerator] Generated ${count} roads`);
  return group;
}
