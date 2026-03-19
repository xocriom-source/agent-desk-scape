/**
 * World Generator — Creates a massive, continuous city with terrain, streets, and thousands of buildings.
 * Uses procedural noise for terrain elevation and deterministic seeding for consistent world generation.
 */

// ── Noise function (simplified Perlin-like) ──

function hash2D(x: number, z: number): number {
  let h = (x * 73856093) ^ (z * 19349663);
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = (h >> 16) ^ h;
  return (h & 0x7fffffff) / 0x7fffffff;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function noise2D(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const sx = smoothstep(fx);
  const sz = smoothstep(fz);

  const n00 = hash2D(ix, iz);
  const n10 = hash2D(ix + 1, iz);
  const n01 = hash2D(ix, iz + 1);
  const n11 = hash2D(ix + 1, iz + 1);

  const nx0 = n00 + sx * (n10 - n00);
  const nx1 = n01 + sx * (n11 - n01);
  return nx0 + sz * (nx1 - nx0);
}

/** Multi-octave fractal noise */
function fbm(x: number, z: number, octaves: number = 4, lacunarity: number = 2, gain: number = 0.5): number {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let maxAmp = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise2D(x * freq, z * freq) * amp;
    maxAmp += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / maxAmp;
}

// ── Terrain ──

/** Get terrain height at world position. Returns a gentle elevation. */
export function getTerrainHeight(x: number, z: number): number {
  // Large gentle hills
  const largeHills = fbm(x * 0.008, z * 0.008, 3, 2, 0.5) * 3.0;
  // Medium bumps
  const medBumps = fbm(x * 0.025 + 100, z * 0.025 + 100, 2, 2, 0.4) * 0.8;
  // Flatten center area (downtown should be relatively flat)
  const distFromCenter = Math.sqrt(x * x + z * z);
  const centerFlatten = Math.min(1, distFromCenter / 60);
  
  return (largeHills + medBumps) * centerFlatten;
}

// ── World Building Generation ──

export interface WorldBuilding {
  x: number;
  z: number;
  y: number; // terrain height
  w: number;
  d: number;
  h: number;
  color: string;
  rot: number;
  seed: number;
  isSkyscraper: boolean;
  /** 0=center, increases outward. Used for density/height falloff */
  distFromCenter: number;
}

export interface WorldStreet {
  x1: number; z1: number;
  x2: number; z2: number;
  width: number;
  isMain: boolean;
}

export interface WorldChunk {
  cx: number;
  cz: number;
  key: string;
  buildings: WorldBuilding[];
  streets: WorldStreet[];
}

const CHUNK_SIZE = 20;
const BLOCK_SIZE = 4.5; // spacing between buildings
const STREET_WIDTH_MAIN = 3;
const STREET_WIDTH_SECONDARY = 2;

// Color palettes by distance from center
const PALETTES = {
  downtown: ["#6B8FC5", "#5B8DB8", "#4A6FA5", "#7AAFDF", "#4A5A8A", "#6B5DAA"],
  midtown: ["#D4845A", "#C87A50", "#B06840", "#CD853F", "#8B4513", "#A0522D"],
  suburban: ["#D4C5A9", "#B8E8B4", "#E8D4B4", "#C4B08B", "#BFA980", "#2D5A1E"],
  industrial: ["#7A6B8A", "#8A7B6A", "#6B8A7A", "#9A7A6A", "#6A9A8A", "#5A5A5A"],
};

function pickPalette(dist: number): string[] {
  if (dist < 30) return PALETTES.downtown;
  if (dist < 60) return PALETTES.midtown;
  if (dist < 100) return PALETTES.suburban;
  return PALETTES.industrial;
}

function heightForDist(dist: number, seed: number): number {
  const r = hash2D(seed, seed * 7);
  if (dist < 20) return 4 + r * 14; // Downtown: tall
  if (dist < 40) return 3 + r * 8;
  if (dist < 70) return 2 + r * 5;
  if (dist < 100) return 1.5 + r * 3;
  return 1 + r * 2;
}

/** Check if a position should be a street (grid-based) */
function isStreetPosition(wx: number, wz: number): boolean {
  // Main grid every 20 units
  const mainX = Math.abs(wx % CHUNK_SIZE) < STREET_WIDTH_MAIN / 2;
  const mainZ = Math.abs(wz % CHUNK_SIZE) < STREET_WIDTH_MAIN / 2;
  // Secondary grid every 10 units
  const secX = Math.abs((wx + CHUNK_SIZE / 2) % (CHUNK_SIZE / 2)) < STREET_WIDTH_SECONDARY / 2;
  const secZ = Math.abs((wz + CHUNK_SIZE / 2) % (CHUNK_SIZE / 2)) < STREET_WIDTH_SECONDARY / 2;
  return mainX || mainZ || secX || secZ;
}

/** Generate all buildings in a single chunk */
export function generateChunk(cx: number, cz: number): WorldChunk {
  const key = `${cx},${cz}`;
  const buildings: WorldBuilding[] = [];
  const streets: WorldStreet[] = [];
  
  const baseX = cx * CHUNK_SIZE;
  const baseZ = cz * CHUNK_SIZE;
  
  // Generate streets for this chunk
  // Horizontal streets
  streets.push({
    x1: baseX, z1: baseZ,
    x2: baseX + CHUNK_SIZE, z2: baseZ,
    width: STREET_WIDTH_MAIN, isMain: true,
  });
  streets.push({
    x1: baseX, z1: baseZ + CHUNK_SIZE / 2,
    x2: baseX + CHUNK_SIZE, z2: baseZ + CHUNK_SIZE / 2,
    width: STREET_WIDTH_SECONDARY, isMain: false,
  });
  // Vertical streets
  streets.push({
    x1: baseX, z1: baseZ,
    x2: baseX, z2: baseZ + CHUNK_SIZE,
    width: STREET_WIDTH_MAIN, isMain: true,
  });
  streets.push({
    x1: baseX + CHUNK_SIZE / 2, z1: baseZ,
    x2: baseX + CHUNK_SIZE / 2, z2: baseZ + CHUNK_SIZE,
    width: STREET_WIDTH_SECONDARY, isMain: false,
  });

  // Fill chunk with buildings
  const margin = STREET_WIDTH_MAIN / 2 + 0.5;
  
  for (let gx = margin; gx < CHUNK_SIZE - margin; gx += BLOCK_SIZE) {
    for (let gz = margin; gz < CHUNK_SIZE - margin; gz += BLOCK_SIZE) {
      const wx = baseX + gx;
      const wz = baseZ + gz;
      
      // Skip if on a street
      if (isStreetPosition(wx, wz)) continue;
      
      const seed = Math.abs(((wx * 73856093) ^ (wz * 19349663)) | 0);
      const r = hash2D(seed, seed + 1);
      
      // Density: skip some spots based on distance
      const distFromCenter = Math.sqrt(wx * wx + wz * wz);
      const density = distFromCenter < 30 ? 0.95 : distFromCenter < 60 ? 0.85 : distFromCenter < 100 ? 0.7 : 0.5;
      if (r > density) continue;
      
      // Add jitter
      const jx = wx + (hash2D(seed + 2, seed + 3) - 0.5) * 1.5;
      const jz = wz + (hash2D(seed + 4, seed + 5) - 0.5) * 1.5;
      
      const h = heightForDist(distFromCenter, seed);
      const palette = pickPalette(distFromCenter);
      const color = palette[seed % palette.length];
      const terrainY = getTerrainHeight(jx, jz);
      
      buildings.push({
        x: jx,
        z: jz,
        y: terrainY,
        w: 2 + hash2D(seed + 6, seed + 7) * 1.5,
        d: 2 + hash2D(seed + 8, seed + 9) * 1.5,
        h,
        color,
        rot: [0, Math.PI / 2, Math.PI, Math.PI * 1.5][seed % 4],
        seed,
        isSkyscraper: h > 8,
        distFromCenter,
      });
    }
  }
  
  return { cx, cz, key, buildings, streets };
}

/** Get chunks that should be loaded based on camera position */
export function getVisibleChunks(
  camX: number, camZ: number,
  loadRadius: number
): Array<{ cx: number; cz: number; dist: number }> {
  const pcx = Math.floor(camX / CHUNK_SIZE);
  const pcz = Math.floor(camZ / CHUNK_SIZE);
  const chunks: Array<{ cx: number; cz: number; dist: number }> = [];
  
  for (let dx = -loadRadius; dx <= loadRadius; dx++) {
    for (let dz = -loadRadius; dz <= loadRadius; dz++) {
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > loadRadius + 0.5) continue;
      chunks.push({ cx: pcx + dx, cz: pcz + dz, dist });
    }
  }
  
  chunks.sort((a, b) => a.dist - b.dist);
  return chunks;
}

export { CHUNK_SIZE };
