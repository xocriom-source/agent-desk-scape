/**
 * DensityController — Chunked progressive building generation.
 * Groups buildings by spatial chunks and generates them incrementally
 * to avoid blocking the main thread.
 */

import * as THREE from "three";
import type { OSMBuildingData } from "@/data/OSMService";
import { createBuildingMesh } from "@/engine/BuildingGenerator";

const CHUNK_SIZE = 200; // world units per chunk
const MAX_BUILDINGS_PER_FRAME = 20;

export interface ChunkData {
  key: string;
  buildings: OSMBuildingData[];
  generated: boolean;
}

function getChunkKey(x: number, z: number): string {
  return `${Math.floor(x / CHUNK_SIZE)}_${Math.floor(z / CHUNK_SIZE)}`;
}

/**
 * Group buildings into spatial chunks for progressive loading.
 */
export function chunkBuildings(buildings: OSMBuildingData[]): Map<string, ChunkData> {
  const chunks = new Map<string, ChunkData>();

  for (const b of buildings) {
    const key = getChunkKey(b.cx, b.cz);
    if (!chunks.has(key)) {
      chunks.set(key, { key, buildings: [], generated: false });
    }
    chunks.get(key)!.buildings.push(b);
  }

  console.log(`[DensityController] ${buildings.length} buildings → ${chunks.size} chunks`);
  return chunks;
}

/**
 * Sort chunks by distance from a center point (camera position).
 * Nearest chunks are generated first.
 */
export function sortChunksByDistance(
  chunks: Map<string, ChunkData>,
  cx: number,
  cz: number
): ChunkData[] {
  const sorted = Array.from(chunks.values());
  sorted.sort((a, b) => {
    const aCx = a.buildings.reduce((s, bl) => s + bl.cx, 0) / a.buildings.length;
    const aCz = a.buildings.reduce((s, bl) => s + bl.cz, 0) / a.buildings.length;
    const bCx = b.buildings.reduce((s, bl) => s + bl.cx, 0) / b.buildings.length;
    const bCz = b.buildings.reduce((s, bl) => s + bl.cz, 0) / b.buildings.length;
    const distA = (aCx - cx) ** 2 + (aCz - cz) ** 2;
    const distB = (bCx - cx) ** 2 + (bCz - cz) ** 2;
    return distA - distB;
  });
  return sorted;
}

/**
 * Progressively generate buildings chunk by chunk using requestIdleCallback/setTimeout.
 * Returns the group immediately; meshes are added over multiple frames.
 */
export function generateBuildingsProgressive(
  buildings: OSMBuildingData[],
  centerX: number,
  centerZ: number,
  onChunkDone?: (generated: number, total: number) => void
): THREE.Group {
  const group = new THREE.Group();
  group.name = "Buildings";

  const chunks = chunkBuildings(buildings);
  const sorted = sortChunksByDistance(chunks, centerX, centerZ);

  let chunkIndex = 0;
  let totalGenerated = 0;

  function processNextChunk() {
    if (chunkIndex >= sorted.length) {
      console.log(`[DensityController] All ${totalGenerated} buildings generated across ${sorted.length} chunks`);
      return;
    }

    const chunk = sorted[chunkIndex];
    chunkIndex++;

    // Generate buildings in this chunk in batches
    let bIdx = 0;
    function processBatch() {
      const end = Math.min(bIdx + MAX_BUILDINGS_PER_FRAME, chunk.buildings.length);
      for (; bIdx < end; bIdx++) {
        try {
          const mesh = createBuildingMesh(chunk.buildings[bIdx]);
          group.add(mesh);
          totalGenerated++;
        } catch (e) {
          // skip invalid buildings silently
        }
      }

      if (bIdx < chunk.buildings.length) {
        // More buildings in this chunk — continue next frame
        setTimeout(processBatch, 0);
      } else {
        // Chunk complete
        chunk.generated = true;
        onChunkDone?.(totalGenerated, buildings.length);
        // Move to next chunk
        setTimeout(processNextChunk, 0);
      }
    }

    processBatch();
  }

  // Start generating immediately (non-blocking)
  setTimeout(processNextChunk, 0);

  return group;
}
