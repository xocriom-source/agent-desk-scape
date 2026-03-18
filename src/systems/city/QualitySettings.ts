/**
 * Quality presets for city rendering.
 * Controls LoD distances, chunk radius, max objects, and effects.
 */

export type QualityLevel = "low" | "medium" | "high" | "ultra";

export interface QualityConfig {
  /** Max LoD level rendered (0=full detail only, 4=all levels) */
  maxLod: number;
  /** Distance thresholds for each LoD level */
  lodDistances: [number, number, number, number]; // LOD1, LOD2, LOD3, LOD4
  /** How many chunks around player to load */
  chunkLoadRadius: number;
  /** How many chunks to keep in memory beyond load radius */
  chunkUnloadRadius: number;
  /** Chunk size in world units */
  chunkSize: number;
  /** Max shadow map resolution */
  shadowMapSize: number;
  /** Enable point lights on street lamps */
  enablePointLights: boolean;
  /** Max point lights */
  maxPointLights: number;
  /** Enable NPC rendering */
  enableNPCs: boolean;
  /** Enable parked cars */
  enableVehicles: boolean;
  /** Enable landscaping (trees, bushes, flowers) */
  enableLandscaping: boolean;
  /** Enable fog for LoD transitions */
  fogNear: number;
  fogFar: number;
  /** Max buildings rendered at full detail */
  maxFullDetailBuildings: number;
  /** DPR range */
  dpr: [number, number];
  /** Enable stars */
  enableStars: boolean;
  /** Camera far plane */
  cameraFar: number;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityConfig> = {
  low: {
    maxLod: 2,
    lodDistances: [10, 20, 35, 50],
    chunkLoadRadius: 2,
    chunkUnloadRadius: 3,
    chunkSize: 16,
    shadowMapSize: 256,
    enablePointLights: false,
    maxPointLights: 0,
    enableNPCs: false,
    enableVehicles: false,
    enableLandscaping: false,
    fogNear: 15,
    fogFar: 60,
    maxFullDetailBuildings: 8,
    dpr: [1, 1],
    enableStars: false,
    cameraFar: 150,
  },
  medium: {
    maxLod: 3,
    lodDistances: [15, 30, 50, 80],
    chunkLoadRadius: 3,
    chunkUnloadRadius: 4,
    chunkSize: 16,
    shadowMapSize: 512,
    enablePointLights: true,
    maxPointLights: 8,
    enableNPCs: true,
    enableVehicles: true,
    enableLandscaping: true,
    fogNear: 25,
    fogFar: 100,
    maxFullDetailBuildings: 16,
    dpr: [1, 1.25],
    enableStars: true,
    cameraFar: 300,
  },
  high: {
    maxLod: 4,
    lodDistances: [20, 40, 70, 120],
    chunkLoadRadius: 4,
    chunkUnloadRadius: 6,
    chunkSize: 16,
    shadowMapSize: 512,
    enablePointLights: true,
    maxPointLights: 16,
    enableNPCs: true,
    enableVehicles: true,
    enableLandscaping: true,
    fogNear: 30,
    fogFar: 140,
    maxFullDetailBuildings: 30,
    dpr: [1, 1.5],
    enableStars: true,
    cameraFar: 500,
  },
  ultra: {
    maxLod: 4,
    lodDistances: [25, 50, 90, 160],
    chunkLoadRadius: 5,
    chunkUnloadRadius: 7,
    chunkSize: 16,
    shadowMapSize: 1024,
    enablePointLights: true,
    maxPointLights: 24,
    enableNPCs: true,
    enableVehicles: true,
    enableLandscaping: true,
    fogNear: 40,
    fogFar: 200,
    maxFullDetailBuildings: 50,
    dpr: [1, 2],
    enableStars: true,
    cameraFar: 600,
  },
};

/** Auto-detect quality based on device capabilities */
export function detectQuality(): QualityLevel {
  if (typeof navigator === "undefined") return "medium";

  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 4;
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  if (isMobile || cores <= 2 || memory <= 2) return "low";
  if (cores <= 4 || memory <= 4) return "medium";
  if (cores <= 8) return "high";
  return "ultra";
}
