/**
 * GLB Asset Registry — catalog of all downloaded 3D models
 * from the Kenney City Kit Commercial pack.
 */

export interface GLBAsset {
  id: string;
  path: string;
  category: "building" | "skyscraper" | "detail" | "low-detail";
  /** Approximate scale factor to match city grid */
  scale: number;
}

const BASE = "/models/";

export const GLB_BUILDINGS: GLBAsset[] = [
  { id: "building-a", path: `${BASE}building-a.glb`, category: "building", scale: 1 },
  { id: "building-b", path: `${BASE}building-b.glb`, category: "building", scale: 1 },
  { id: "building-c", path: `${BASE}building-c.glb`, category: "building", scale: 1 },
  { id: "building-d", path: `${BASE}building-d.glb`, category: "building", scale: 1 },
  { id: "building-e", path: `${BASE}building-e.glb`, category: "building", scale: 1 },
  { id: "building-f", path: `${BASE}building-f.glb`, category: "building", scale: 1 },
  { id: "building-g", path: `${BASE}building-g.glb`, category: "building", scale: 1 },
  { id: "building-h", path: `${BASE}building-h.glb`, category: "building", scale: 1 },
  { id: "building-i", path: `${BASE}building-i.glb`, category: "building", scale: 1 },
  { id: "building-k", path: `${BASE}building-k.glb`, category: "building", scale: 1 },
  { id: "building-l", path: `${BASE}building-l.glb`, category: "building", scale: 1 },
  { id: "building-m", path: `${BASE}building-m.glb`, category: "building", scale: 1 },
  { id: "building-n", path: `${BASE}building-n.glb`, category: "building", scale: 1 },
];

export const GLB_SKYSCRAPERS: GLBAsset[] = [
  { id: "skyscraper-a", path: `${BASE}building-skyscraper-a.glb`, category: "skyscraper", scale: 1 },
  { id: "skyscraper-b", path: `${BASE}building-skyscraper-b.glb`, category: "skyscraper", scale: 1 },
  { id: "skyscraper-c", path: `${BASE}building-skyscraper-c.glb`, category: "skyscraper", scale: 1 },
  { id: "skyscraper-d", path: `${BASE}building-skyscraper-d.glb`, category: "skyscraper", scale: 1 },
  { id: "skyscraper-e", path: `${BASE}building-skyscraper-e.glb`, category: "skyscraper", scale: 1 },
];

export const GLB_DETAILS: GLBAsset[] = [
  { id: "awning", path: `${BASE}detail-awning.glb`, category: "detail", scale: 1 },
  { id: "awning-wide", path: `${BASE}detail-awning-wide.glb`, category: "detail", scale: 1 },
  { id: "overhang", path: `${BASE}detail-overhang.glb`, category: "detail", scale: 1 },
  { id: "overhang-wide", path: `${BASE}detail-overhang-wide.glb`, category: "detail", scale: 1 },
  { id: "parasol-a", path: `${BASE}detail-parasol-a.glb`, category: "detail", scale: 1 },
  { id: "parasol-b", path: `${BASE}detail-parasol-b.glb`, category: "detail", scale: 1 },
];

export const ALL_GLB_ASSETS = [...GLB_BUILDINGS, ...GLB_SKYSCRAPERS, ...GLB_DETAILS];

/** Get all preloadable paths for useGLTF.preload */
export function getAllModelPaths(): string[] {
  return ALL_GLB_ASSETS.map(a => a.path);
}

/** Pick a deterministic building model based on a hash seed */
export function pickBuildingModel(seed: number, isSkyscraper: boolean): GLBAsset {
  const pool = isSkyscraper ? GLB_SKYSCRAPERS : GLB_BUILDINGS;
  return pool[seed % pool.length];
}

/** Pick a deterministic detail model */
export function pickDetailModel(seed: number): GLBAsset {
  return GLB_DETAILS[seed % GLB_DETAILS.length];
}
