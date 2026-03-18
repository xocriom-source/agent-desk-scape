/**
 * Chunk Manager — divides city into grid chunks,
 * loads/unloads based on player position.
 */

export interface ChunkCoord {
  cx: number;
  cz: number;
}

export interface ChunkData {
  coord: ChunkCoord;
  key: string;
  worldX: number;
  worldZ: number;
  /** Static building indices in this chunk */
  buildingIndices: number[];
  /** Distance from player chunk */
  distance: number;
}

export interface BuildingDef {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
}

function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

export function worldToChunk(wx: number, wz: number, chunkSize: number): ChunkCoord {
  return {
    cx: Math.floor(wx / chunkSize),
    cz: Math.floor(wz / chunkSize),
  };
}

/**
 * Given player position, buildings, and chunk config,
 * returns the set of visible chunks sorted by distance.
 */
export function computeVisibleChunks(
  playerX: number,
  playerZ: number,
  chunkSize: number,
  loadRadius: number,
  buildings: BuildingDef[]
): ChunkData[] {
  const playerChunk = worldToChunk(playerX, playerZ, chunkSize);
  const chunks: ChunkData[] = [];
  const buildingMap = new Map<string, number[]>();

  // Pre-assign buildings to chunks
  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    const bc = worldToChunk(b.x, b.z, chunkSize);
    const k = chunkKey(bc.cx, bc.cz);
    if (!buildingMap.has(k)) buildingMap.set(k, []);
    buildingMap.get(k)!.push(i);
  }

  // Generate chunks within load radius
  for (let dx = -loadRadius; dx <= loadRadius; dx++) {
    for (let dz = -loadRadius; dz <= loadRadius; dz++) {
      const cx = playerChunk.cx + dx;
      const cz = playerChunk.cz + dz;
      const dist = Math.hypot(dx, dz);
      if (dist > loadRadius + 0.5) continue;

      const k = chunkKey(cx, cz);
      chunks.push({
        coord: { cx, cz },
        key: k,
        worldX: cx * chunkSize + chunkSize / 2,
        worldZ: cz * chunkSize + chunkSize / 2,
        buildingIndices: buildingMap.get(k) || [],
        distance: dist,
      });
    }
  }

  // Sort by distance (closest first)
  chunks.sort((a, b) => a.distance - b.distance);
  return chunks;
}

/**
 * Determine LoD level for a building based on distance to camera.
 * 0 = full detail, 1 = simplified, 2 = low poly, 3 = sprite/block, 4 = 2D
 */
export function getLodLevel(
  distance: number,
  lodDistances: [number, number, number, number],
  maxLod: number
): number {
  if (distance < lodDistances[0]) return 0;
  if (distance < lodDistances[1]) return Math.min(1, maxLod);
  if (distance < lodDistances[2]) return Math.min(2, maxLod);
  if (distance < lodDistances[3]) return Math.min(3, maxLod);
  return Math.min(4, maxLod);
}

/**
 * Check if a chunk should be preloaded based on player movement direction.
 */
export function getPreloadChunks(
  playerX: number,
  playerZ: number,
  velocityX: number,
  velocityZ: number,
  chunkSize: number,
  preloadDistance: number
): ChunkCoord[] {
  if (Math.abs(velocityX) < 0.01 && Math.abs(velocityZ) < 0.01) return [];

  const speed = Math.hypot(velocityX, velocityZ);
  const dirX = velocityX / speed;
  const dirZ = velocityZ / speed;

  const preloads: ChunkCoord[] = [];
  for (let i = 1; i <= preloadDistance; i++) {
    const futureX = playerX + dirX * chunkSize * i;
    const futureZ = playerZ + dirZ * chunkSize * i;
    preloads.push(worldToChunk(futureX, futureZ, chunkSize));
  }
  return preloads;
}
