/**
 * OSMService — Standalone Overpass API service for fetching real-world building/road/vegetation data.
 * No React dependencies. Includes polygon validation.
 */

import { latLonToWorld, metersToUnits, hash, seededRandom } from "@/utils/GeoProjection";
import type { GeoCenter, WorldPoint } from "@/utils/GeoProjection";

// ── Types ──

export interface OSMElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  members?: Array<{ type: string; ref: number; role: string; geometry?: Array<{ lat: number; lon: number }> }>;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
  center?: { lat: number; lon: number };
}

export interface OSMBuildingData {
  id: string;
  vertices: WorldPoint[];
  cx: number;
  cz: number;
  width: number;
  depth: number;
  heightMeters: number;
  tags: Record<string, string>;
}

export interface OSMRoadData {
  id: string;
  segments: WorldPoint[];
  widthMeters: number;
  type: "primary" | "secondary" | "residential" | "service" | "footway";
  name?: string;
}

export interface OSMTreeData {
  x: number;
  z: number;
  size: number;
}

export interface OSMGreenArea {
  vertices: WorldPoint[];
  cx: number;
  cz: number;
}

export interface OSMCityResult {
  buildings: OSMBuildingData[];
  roads: OSMRoadData[];
  trees: OSMTreeData[];
  greenAreas: OSMGreenArea[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

// ── Overpass API ──

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

function buildQuery(lat: number, lon: number, radius: number): string {
  return `[out:json][timeout:60];(way["building"](around:${radius},${lat},${lon});relation["building"](around:${radius},${lat},${lon});way["highway"](around:${radius},${lat},${lon});way["natural"="tree_row"](around:${radius},${lat},${lon});way["landuse"="grass"](around:${radius},${lat},${lon});way["leisure"="park"](around:${radius},${lat},${lon});node["natural"="tree"](around:${radius},${lat},${lon}););out body geom;`;
}

export async function fetchOSMRaw(lat: number, lon: number, radius: number = 600): Promise<OSMElement[]> {
  console.log(`[OSMService] Fetching ${lat.toFixed(4)}, ${lon.toFixed(4)} r=${radius}m`);
  const res = await fetch(OVERPASS_API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(buildQuery(lat, lon, radius))}`,
  });
  if (!res.ok) throw new Error(`[OSMService] Overpass error: ${res.status}`);
  const data = await res.json();
  console.log(`[OSMService] Received ${data.elements?.length || 0} elements`);
  return data.elements || [];
}

// ── Polygon validation ──

function isValidPolygon(vertices: Array<{ lat: number; lon: number }> | undefined): boolean {
  return !!vertices && vertices.length >= 3;
}

// ── Height estimation ──

function estimateHeight(tags: Record<string, string>, seed: number): number {
  if (tags.height) { const h = parseFloat(tags.height); if (!isNaN(h)) return Math.max(4, Math.min(h, 300)); }
  if (tags["building:levels"]) { const l = parseInt(tags["building:levels"]); if (!isNaN(l)) return Math.max(4, Math.min(l * 3.5, 300)); }
  const b = tags.building || "";
  if (b === "skyscraper") return 80 + seededRandom(seed) * 120;
  if (b === "tower") return 40 + seededRandom(seed) * 30;
  if (b === "office" || b === "commercial") return 15 + seededRandom(seed) * 25;
  if (b === "apartments") return 15 + seededRandom(seed) * 20;
  if (b === "house" || b === "detached") return 6 + seededRandom(seed) * 4;
  if (b === "industrial" || b === "warehouse") return 8 + seededRandom(seed) * 6;
  return 8 + seededRandom(seed) * 15;
}

// ── Road classification ──

function classifyRoad(highway: string): OSMRoadData["type"] | null {
  if (["motorway", "trunk", "primary"].includes(highway)) return "primary";
  if (["secondary", "tertiary"].includes(highway)) return "secondary";
  if (["residential", "unclassified", "living_street"].includes(highway)) return "residential";
  if (highway === "service") return "service";
  if (["pedestrian", "footway", "path"].includes(highway)) return "footway";
  return null;
}

function roadWidth(type: OSMRoadData["type"]): number {
  switch (type) {
    case "primary": return 14;
    case "secondary": return 10;
    case "residential": return 8;
    case "service": return 5;
    case "footway": return 3;
    default: return 6;
  }
}

// ── Polygon extraction with validation ──

function extractVertices(el: OSMElement, center: GeoCenter): WorldPoint[] | null {
  if (el.type === "way" && isValidPolygon(el.geometry)) {
    return el.geometry!.map(pt => latLonToWorld(pt.lat, pt.lon, center));
  }
  if (el.type === "relation" && el.members) {
    for (const m of el.members) {
      if (m.role === "outer" && isValidPolygon(m.geometry)) {
        return m.geometry!.map(pt => latLonToWorld(pt.lat, pt.lon, center));
      }
    }
  }
  return null;
}

// ── Road buffer collision helpers ──

interface RoadSegBuffer {
  ax: number; az: number;
  bx: number; bz: number;
  halfWidth: number;
}

interface JunctionZone {
  x: number; z: number;
  radius: number;
}

function pointNearRoad(px: number, pz: number, seg: RoadSegBuffer): boolean {
  const dx = seg.bx - seg.ax;
  const dz = seg.bz - seg.az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.01) return false;
  let t = ((px - seg.ax) * dx + (pz - seg.az) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = seg.ax + t * dx;
  const cz = seg.az + t * dz;
  return (px - cx) ** 2 + (pz - cz) ** 2 < seg.halfWidth * seg.halfWidth;
}

function footprintOverlapsRoad(cx: number, cz: number, w: number, d: number, roads: RoadSegBuffer[], junctions: JunctionZone[]): boolean {
  // Check junctions first
  for (const j of junctions) {
    const dx = cx - j.x;
    const dz = cz - j.z;
    const maxR = j.radius + Math.max(w, d) * 0.5;
    if (dx * dx + dz * dz < maxR * maxR) return true;
  }
  // 13-point sampling
  const hw = w * 0.48;
  const hd = d * 0.48;
  const pts = [
    { x: cx, z: cz },
    { x: cx - hw, z: cz - hd }, { x: cx + hw, z: cz - hd },
    { x: cx - hw, z: cz + hd }, { x: cx + hw, z: cz + hd },
    { x: cx, z: cz - hd }, { x: cx, z: cz + hd },
    { x: cx - hw, z: cz }, { x: cx + hw, z: cz },
    { x: cx - hw * 0.5, z: cz - hd * 0.5 }, { x: cx + hw * 0.5, z: cz - hd * 0.5 },
    { x: cx - hw * 0.5, z: cz + hd * 0.5 }, { x: cx + hw * 0.5, z: cz + hd * 0.5 },
  ];
  for (const pt of pts) {
    for (const seg of roads) {
      if (pointNearRoad(pt.x, pt.z, seg)) return true;
    }
  }
  return false;
}

function aabbOverlap(ax: number, az: number, aw: number, ad: number, bx: number, bz: number, bw: number, bd: number): boolean {
  return ax - aw / 2 - 0.5 < bx + bw / 2 && ax + aw / 2 + 0.5 > bx - bw / 2 &&
    az - ad / 2 - 0.5 < bz + bd / 2 && az + ad / 2 + 0.5 > bz - bd / 2;
}

function polygonArea(vertices: Array<{ x: number; z: number }>): number {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].z - vertices[j].x * vertices[i].z;
  }
  return Math.abs(area) / 2;
}

// ── Main conversion (two-pass: roads first, then filtered buildings) ──

export function convertOSMElements(elements: OSMElement[], center: GeoCenter): OSMCityResult {
  const buildings: OSMBuildingData[] = [];
  const roads: OSMRoadData[] = [];
  const trees: OSMTreeData[] = [];
  const greenAreas: OSMGreenArea[] = [];
  const roadBuffers: RoadSegBuffer[] = [];

  let skippedBuildings = 0;
  let skippedOnRoad = 0;
  let skippedOverlap = 0;

  // ── PASS 1: Non-building elements (roads, trees, parks) ──
  for (const el of elements) {
    const tags = el.tags || {};

    // Trees
    if (tags.natural === "tree" && el.type === "node" && el.lat && el.lon) {
      const pos = latLonToWorld(el.lat, el.lon, center);
      trees.push({ x: pos.x, z: pos.z, size: 0.6 + seededRandom(hash(`t-${el.id}`)) * 0.8 });
      continue;
    }

    // Tree rows
    if (tags.natural === "tree_row" && el.geometry) {
      for (const pt of el.geometry) {
        const pos = latLonToWorld(pt.lat, pt.lon, center);
        trees.push({ x: pos.x, z: pos.z, size: 0.5 + seededRandom(hash(`tr-${el.id}-${pt.lat}`)) * 0.7 });
      }
      continue;
    }

    // Parks
    if ((tags.landuse === "grass" || tags.leisure === "park") && el.type === "way" && isValidPolygon(el.geometry)) {
      const verts = el.geometry!.map(pt => latLonToWorld(pt.lat, pt.lon, center));
      let sx = 0, sz = 0;
      for (const v of verts) { sx += v.x; sz += v.z; }
      greenAreas.push({ vertices: verts, cx: sx / verts.length, cz: sz / verts.length });
      const seed = hash(`park-${el.id}`);
      const mn = { x: Math.min(...verts.map(v => v.x)), z: Math.min(...verts.map(v => v.z)) };
      const mx = { x: Math.max(...verts.map(v => v.x)), z: Math.max(...verts.map(v => v.z)) };
      const n = Math.min(20, Math.floor((mx.x - mn.x) * (mx.z - mn.z) * 0.02));
      for (let i = 0; i < n; i++) {
        trees.push({ x: mn.x + seededRandom(seed + i * 2) * (mx.x - mn.x), z: mn.z + seededRandom(seed + i * 2 + 1) * (mx.z - mn.z), size: 0.7 + seededRandom(seed + i) * 0.8 });
      }
      continue;
    }

    // Roads — collect with buffers
    if (tags.highway && el.type === "way" && el.geometry && el.geometry.length >= 2) {
      const type = classifyRoad(tags.highway);
      if (!type) continue;
      const segments = el.geometry.map(pt => latLonToWorld(pt.lat, pt.lon, center));
      const widthM = roadWidth(type);
      roads.push({ id: `road-${el.id}`, segments, widthMeters: widthM, type, name: tags.name });

      // Build road buffer (half-width + 2.0 unit margin)
      const bufferHW = metersToUnits(widthM) / 2 + 2.0;
      for (let i = 0; i < segments.length - 1; i++) {
        roadBuffers.push({
          ax: segments[i].x, az: segments[i].z,
          bx: segments[i + 1].x, bz: segments[i + 1].z,
          halfWidth: bufferHW,
        });
      }
    }
  }

  // Build junction zones
  const junctions: JunctionZone[] = [];
  const nodeMap = new Map<string, number>();
  for (const r of roads) {
    for (const pt of r.segments) {
      const key = `${Math.round(pt.x * 2)}_${Math.round(pt.z * 2)}`;
      nodeMap.set(key, (nodeMap.get(key) || 0) + 1);
    }
  }
  for (const r of roads) {
    for (const pt of r.segments) {
      const key = `${Math.round(pt.x * 2)}_${Math.round(pt.z * 2)}`;
      if ((nodeMap.get(key) || 0) >= 2) {
        if (!junctions.find(j => Math.abs(j.x - pt.x) < 2 && Math.abs(j.z - pt.z) < 2)) {
          junctions.push({ x: pt.x, z: pt.z, radius: metersToUnits(roadWidth(r.type)) / 2 + 3.0 });
        }
      }
    }
  }

  // ── PASS 2: Buildings filtered against roads and each other ──
  const placedBuildings: Array<{ cx: number; cz: number; w: number; d: number }> = [];

  for (const el of elements) {
    const tags = el.tags || {};
    if (!tags.building) continue;

    const verts = extractVertices(el, center);
    if (!verts || verts.length < 3) { skippedBuildings++; continue; }

    let sx = 0, sz = 0, mnx = Infinity, mxx = -Infinity, mnz = Infinity, mxz = -Infinity;
    for (const v of verts) {
      sx += v.x; sz += v.z;
      mnx = Math.min(mnx, v.x); mxx = Math.max(mxx, v.x);
      mnz = Math.min(mnz, v.z); mxz = Math.max(mxz, v.z);
    }
    const cx = sx / verts.length;
    const cz = sz / verts.length;
    const w = mxx - mnx;
    const d = mxz - mnz;
    if (w < 0.8 && d < 0.8) { skippedBuildings++; continue; }
    if (!isFinite(cx) || !isFinite(cz)) { skippedBuildings++; continue; }

    // Road collision check
    if (footprintOverlapsRoad(cx, cz, w, d, roadBuffers)) { skippedOnRoad++; continue; }

    // Building overlap check
    let hasOverlap = false;
    for (const placed of placedBuildings) {
      if (aabbOverlap(cx, cz, w, d, placed.cx, placed.cz, placed.w, placed.d)) {
        hasOverlap = true;
        break;
      }
    }
    if (hasOverlap) { skippedOverlap++; continue; }

    placedBuildings.push({ cx, cz, w, d });

    const seed = hash(`osm-${el.id}`);
    buildings.push({
      id: `osm-${el.id}`,
      vertices: verts.map(v => ({ x: v.x - cx, z: v.z - cz })),
      cx, cz, width: w, depth: d,
      heightMeters: estimateHeight(tags, seed),
      tags,
    });
  }

  // Bounds
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const b of buildings) { minX = Math.min(minX, b.cx); maxX = Math.max(maxX, b.cx); minZ = Math.min(minZ, b.cz); maxZ = Math.max(maxZ, b.cz); }
  for (const r of roads) { for (const s of r.segments) { minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x); minZ = Math.min(minZ, s.z); maxZ = Math.max(maxZ, s.z); } }
  if (!isFinite(minX)) { minX = -50; maxX = 50; minZ = -50; maxZ = 50; }

  console.log(`[OSMService] Converted: ${buildings.length} buildings, ${roads.length} roads, ${trees.length} trees, ${greenAreas.length} parks`);
  console.log(`[OSMService] Filtered: ${skippedBuildings} invalid, ${skippedOnRoad} on-road, ${skippedOverlap} overlap`);
  return { buildings, roads, trees, greenAreas, bounds: { minX, maxX, minZ, maxZ } };
}

/** Full pipeline: fetch + convert */
export async function fetchAndConvertCity(lat: number, lon: number, radius: number = 600): Promise<OSMCityResult> {
  const elements = await fetchOSMRaw(lat, lon, radius);
  return convertOSMElements(elements, { lat, lon });
}
