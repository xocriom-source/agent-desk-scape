/**
 * OSM City Generator v5 — Arnis-level real world engine.
 * Real polygon footprints, accurate Mercator projection, full road geometry.
 * Properly spaced buildings with clear street visibility.
 */

import type { CityBuilding, BuildingStyle, District, BuildingCustomizations } from "@/types/building";

// ── Types ──

export interface OSMResponse {
  elements: Array<{
    type: "node" | "way" | "relation";
    id: number;
    lat?: number;
    lon?: number;
    nodes?: number[];
    members?: Array<{ type: string; ref: number; role: string; geometry?: Array<{ lat: number; lon: number }> }>;
    tags?: Record<string, string>;
    bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number };
    geometry?: Array<{ lat: number; lon: number }>;
    center?: { lat: number; lon: number };
  }>;
}

export interface OSMStreet {
  segments: Array<{ x: number; z: number }>;
  width: number;
  type: "main" | "secondary" | "alley";
  name?: string;
  lanes?: number;
}

/** Real polygon footprint for a building */
export interface BuildingPolygon {
  vertices: Array<{ x: number; z: number }>;
  w: number;
  d: number;
}

// OSMCityData defined below with trees/greenAreas support

// ── Geo projection ──

const EARTH_RADIUS = 6371000;

function latLonToMeters(lat: number, lon: number, centerLat: number, centerLon: number): { x: number; z: number } {
  const dLat = ((lat - centerLat) * Math.PI) / 180;
  const dLon = ((lon - centerLon) * Math.PI) / 180;
  const cosCenter = Math.cos((centerLat * Math.PI) / 180);
  return {
    x: dLon * EARTH_RADIUS * cosCenter,
    z: -dLat * EARTH_RADIUS,
  };
}

// Scale: 1 unit = 2 meters
const WORLD_SCALE = 1 / 2;

function toWorld(meters: { x: number; z: number }): { x: number; z: number } {
  return {
    x: Math.round(meters.x * WORLD_SCALE * 100) / 100,
    z: Math.round(meters.z * WORLD_SCALE * 100) / 100,
  };
}

function metersToUnits(m: number): number {
  return m * WORLD_SCALE;
}

// ── Deterministic helpers ──

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ── Style mapping ──

function osmTagsToStyle(tags: Record<string, string>): BuildingStyle {
  const building = tags.building || "";
  const amenity = tags.amenity || "";
  const shop = tags.shop || "";
  const office = tags.office || "";

  if (office || building === "office" || building === "commercial") return "corporate";
  if (shop || amenity === "marketplace") return "agency";
  if (building === "industrial" || building === "warehouse") return "industrial";
  if (amenity === "cafe" || amenity === "restaurant" || amenity === "bar") return "creative";
  if (building === "apartments" || building === "residential" || building === "house") return "minimal";
  if (building === "university" || building === "school" || amenity === "university") return "tech";
  if (building === "church" || building === "cathedral" || amenity === "place_of_worship") return "futuristic";
  if (building === "hospital" || amenity === "hospital") return "startup";

  const styles: BuildingStyle[] = ["corporate", "creative", "minimal", "tech", "agency"];
  return styles[hash(building + amenity) % styles.length];
}

function osmTagsToDistrict(tags: Record<string, string>): District {
  const building = tags.building || "";
  const amenity = tags.amenity || "";
  if (building === "commercial" || building === "office") return "central";
  if (building === "industrial" || building === "warehouse") return "agency";
  if (amenity === "university" || amenity === "school") return "tech";
  if (building === "residential" || building === "apartments") return "startup";
  return "central";
}

function osmHeightMeters(tags: Record<string, string>, seed: number): number {
  if (tags.height) {
    const h = parseFloat(tags.height);
    if (!isNaN(h)) return Math.max(4, Math.min(h, 300));
  }
  if (tags["building:levels"]) {
    const levels = parseInt(tags["building:levels"]);
    if (!isNaN(levels)) return Math.max(4, Math.min(levels * 3.5, 300));
  }
  const building = tags.building || "";
  if (building === "skyscraper") return 80 + seededRandom(seed) * 120;
  if (building === "tower") return 40 + seededRandom(seed) * 30;
  if (building === "office" || building === "commercial") return 15 + seededRandom(seed) * 25;
  if (building === "apartments") return 15 + seededRandom(seed) * 20;
  if (building === "house" || building === "detached") return 6 + seededRandom(seed) * 4;
  if (building === "industrial" || building === "warehouse") return 8 + seededRandom(seed) * 6;
  if (building === "church" || building === "cathedral") return 20 + seededRandom(seed) * 15;
  return 8 + seededRandom(seed) * 15;
}

// ── Color palettes — NATURAL, MUTED, REALISTIC (Arnis-like) ──

const STYLE_COLORS: Record<BuildingStyle, string[]> = {
  corporate: ["#C8C0B0", "#B0A898", "#D8D0C0", "#A8A090", "#E0D8C8", "#BEB8A8", "#CCC4B4", "#B8B0A0"],
  creative: ["#D4B896", "#C4A886", "#E4C8A6", "#B89876", "#D0B090", "#C8A880", "#DCC0A0", "#C0A070"],
  startup: ["#B8C8A0", "#A8B890", "#C8D8B0", "#98A880", "#B0C098", "#A0B088", "#C0D0A8", "#90A078"],
  tech: ["#A0A8B8", "#909AA8", "#B0B8C8", "#808898", "#A8B0C0", "#889098", "#B8C0D0", "#98A0B0"],
  agency: ["#D0B898", "#C0A888", "#E0C8A8", "#B09878", "#C8B090", "#B8A080", "#D8C0A0", "#A89068"],
  minimal: ["#E8E0D0", "#D8D0C0", "#F0E8D8", "#D0C8B0", "#E0D8C8", "#C8C0A8", "#EDE4D4", "#DCD4C4"],
  futuristic: ["#B0B8C0", "#A0A8B0", "#C0C8D0", "#9098A0", "#B8C0C8", "#8890A0", "#C8D0D8", "#A8B0B8"],
  industrial: ["#A89890", "#988880", "#B8A8A0", "#887870", "#A09088", "#908078", "#B0A098", "#807068"],
};

// ── Road mapping ──

function osmHighwayToType(highway: string): "main" | "secondary" | "alley" | null {
  switch (highway) {
    case "motorway": case "trunk": case "primary": case "secondary": return "main";
    case "tertiary": case "residential": case "unclassified": return "secondary";
    case "service": case "pedestrian": case "footway": case "path": case "living_street": return "alley";
    default: return null;
  }
}

function osmHighwayToWidthMeters(highway: string): number {
  switch (highway) {
    case "motorway": case "trunk": return 20;
    case "primary": return 14;
    case "secondary": return 12;
    case "tertiary": return 10;
    case "residential": return 8;
    case "service": return 5;
    case "pedestrian": case "footway": return 3;
    default: return 6;
  }
}

function osmHighwayToLanes(highway: string): number {
  switch (highway) {
    case "motorway": case "trunk": return 4;
    case "primary": return 3;
    case "secondary": return 2;
    case "tertiary": case "residential": return 2;
    default: return 1;
  }
}

// ── Overpass API ──

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

function buildOverpassQuery(lat: number, lon: number, radiusMeters: number): string {
  return `
[out:json][timeout:60];
(
  way["building"](around:${radiusMeters},${lat},${lon});
  relation["building"](around:${radiusMeters},${lat},${lon});
  way["highway"](around:${radiusMeters},${lat},${lon});
  way["natural"="tree_row"](around:${radiusMeters},${lat},${lon});
  way["landuse"="grass"](around:${radiusMeters},${lat},${lon});
  way["leisure"="park"](around:${radiusMeters},${lat},${lon});
  node["natural"="tree"](around:${radiusMeters},${lat},${lon});
);
out body geom;
  `.trim();
}

export async function fetchOSMData(lat: number, lon: number, radiusMeters: number = 600): Promise<OSMResponse> {
  const query = buildOverpassQuery(lat, lon, radiusMeters);
  console.log(`[OSM] Fetching from Overpass: ${lat.toFixed(4)}, ${lon.toFixed(4)}, r=${radiusMeters}m`);
  const response = await fetch(OVERPASS_API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  console.log(`[OSM] Raw elements received: ${data.elements?.length || 0}`);
  return data;
}

/**
 * Extract polygon vertices from an OSM element (way or relation outer ring).
 */
function extractPolygonGeometry(
  el: OSMResponse["elements"][0],
  centerLat: number,
  centerLon: number
): Array<{ x: number; z: number }> | null {
  if (el.type === "way" && el.geometry && el.geometry.length >= 3) {
    return el.geometry.map(pt => toWorld(latLonToMeters(pt.lat, pt.lon, centerLat, centerLon)));
  }
  if (el.type === "relation" && el.members) {
    for (const member of el.members) {
      if (member.role === "outer" && member.geometry && member.geometry.length >= 3) {
        return member.geometry.map(pt => toWorld(latLonToMeters(pt.lat, pt.lon, centerLat, centerLon)));
      }
    }
  }
  return null;
}

/** Tree position data extracted from OSM */
export interface OSMTreeData {
  x: number;
  z: number;
  size: number; // 0.5-1.5 scale factor
}

/** Park/green area data */
export interface OSMGreenArea {
  vertices: Array<{ x: number; z: number }>;
  cx: number;
  cz: number;
  w: number;
  d: number;
}

/** Extended city data with vegetation */
export interface OSMCityData {
  buildings: CityBuilding[];
  streets: OSMStreet[];
  trees: OSMTreeData[];
  greenAreas: OSMGreenArea[];
  center: { lat: number; lon: number };
  radiusMeters: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

// ── Road buffer collision helpers ──

interface RoadSegmentBuffer {
  ax: number; az: number;
  bx: number; bz: number;
  halfWidth: number;
}

/** Intersection / junction zone (circle around a road node with many connections) */
interface JunctionZone {
  x: number; z: number;
  radius: number;
}

/** Check if a point is within a buffered road segment (capsule test) */
function pointNearRoadSegment(px: number, pz: number, seg: RoadSegmentBuffer): boolean {
  const dx = seg.bx - seg.ax;
  const dz = seg.bz - seg.az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.01) return false;
  let t = ((px - seg.ax) * dx + (pz - seg.az) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closestX = seg.ax + t * dx;
  const closestZ = seg.az + t * dz;
  const distSq = (px - closestX) ** 2 + (pz - closestZ) ** 2;
  return distSq < seg.halfWidth * seg.halfWidth;
}

/** Robust building-road overlap: test center + 8 perimeter points + 4 edge midpoints */
function buildingOverlapsRoads(
  cx: number, cz: number, fw: number, fd: number,
  roadBuffers: RoadSegmentBuffer[],
  junctions: JunctionZone[]
): boolean {
  // Check junction zones first (fast circle test)
  for (const j of junctions) {
    const dx = cx - j.x;
    const dz = cz - j.z;
    const maxR = j.radius + Math.max(fw, fd) * 0.5;
    if (dx * dx + dz * dz < maxR * maxR) return true;
  }

  // 13-point sampling: center + 4 corners + 4 edge midpoints + 4 inner points
  const hw = fw * 0.48;
  const hd = fd * 0.48;
  const testPoints = [
    { x: cx, z: cz },
    // Corners
    { x: cx - hw, z: cz - hd },
    { x: cx + hw, z: cz - hd },
    { x: cx - hw, z: cz + hd },
    { x: cx + hw, z: cz + hd },
    // Edge midpoints
    { x: cx, z: cz - hd },
    { x: cx, z: cz + hd },
    { x: cx - hw, z: cz },
    { x: cx + hw, z: cz },
    // Inner quarter points
    { x: cx - hw * 0.5, z: cz - hd * 0.5 },
    { x: cx + hw * 0.5, z: cz - hd * 0.5 },
    { x: cx - hw * 0.5, z: cz + hd * 0.5 },
    { x: cx + hw * 0.5, z: cz + hd * 0.5 },
  ];
  for (const pt of testPoints) {
    for (const seg of roadBuffers) {
      if (pointNearRoadSegment(pt.x, pt.z, seg)) return true;
    }
  }
  return false;
}

/** Check if two building AABBs overlap with margin */
function buildingsOverlap(
  ax: number, az: number, aw: number, ad: number,
  bx: number, bz: number, bw: number, bd: number,
  margin: number = 0.15
): boolean {
  return (
    ax - aw / 2 - margin < bx + bw / 2 &&
    ax + aw / 2 + margin > bx - bw / 2 &&
    az - ad / 2 - margin < bz + bd / 2 &&
    az + ad / 2 + margin > bz - bd / 2
  );
}

/** Compute signed area of polygon (positive = CCW) */
function polygonArea(vertices: Array<{ x: number; z: number }>): number {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].z;
    area -= vertices[j].x * vertices[i].z;
  }
  return Math.abs(area) / 2;
}

/**
 * Convert OSM response into city buildings, streets, trees, and green areas.
 * Two-pass approach: roads first, then buildings filtered against road buffers.
 */
export function convertOSMToCity(
  osmData: OSMResponse,
  centerLat: number,
  centerLon: number
): { buildings: CityBuilding[]; streets: OSMStreet[]; trees: OSMTreeData[]; greenAreas: OSMGreenArea[] } {
  const buildings: CityBuilding[] = [];
  const streets: OSMStreet[] = [];
  const trees: OSMTreeData[] = [];
  const greenAreas: OSMGreenArea[] = [];

  // ── PASS 1: Collect roads, trees, parks (non-buildings) ──
  const roadBuffers: RoadSegmentBuffer[] = [];
  let streetCount = 0;

  for (const el of osmData.elements) {
    const tags = el.tags || {};

    // Trees (individual nodes)
    if (tags.natural === "tree" && el.type === "node" && el.lat && el.lon) {
      const pos = toWorld(latLonToMeters(el.lat, el.lon, centerLat, centerLon));
      const seed = hash(`tree-${el.id}`);
      trees.push({ x: pos.x, z: pos.z, size: 0.6 + seededRandom(seed) * 0.8 });
      continue;
    }

    // Tree rows
    if (tags.natural === "tree_row" && el.geometry) {
      for (const pt of el.geometry) {
        const pos = toWorld(latLonToMeters(pt.lat, pt.lon, centerLat, centerLon));
        const seed = hash(`treerow-${el.id}-${pt.lat}`);
        trees.push({ x: pos.x, z: pos.z, size: 0.5 + seededRandom(seed) * 0.7 });
      }
      continue;
    }

    // Parks and green areas
    if ((tags.landuse === "grass" || tags.leisure === "park") && el.type === "way" && el.geometry && el.geometry.length >= 3) {
      const verts = el.geometry.map(pt => toWorld(latLonToMeters(pt.lat, pt.lon, centerLat, centerLon)));
      let sx = 0, sz = 0, mnx = Infinity, mxx = -Infinity, mnz = Infinity, mxz = -Infinity;
      for (const v of verts) {
        sx += v.x; sz += v.z;
        mnx = Math.min(mnx, v.x); mxx = Math.max(mxx, v.x);
        mnz = Math.min(mnz, v.z); mxz = Math.max(mxz, v.z);
      }
      greenAreas.push({
        vertices: verts,
        cx: sx / verts.length,
        cz: sz / verts.length,
        w: mxx - mnx,
        d: mxz - mnz,
      });
      const parkSeed = hash(`park-${el.id}`);
      const numTrees = Math.min(20, Math.floor((mxx - mnx) * (mxz - mnz) * 0.02));
      for (let t = 0; t < numTrees; t++) {
        const tx = mnx + seededRandom(parkSeed + t * 2) * (mxx - mnx);
        const tz = mnz + seededRandom(parkSeed + t * 2 + 1) * (mxz - mnz);
        trees.push({ x: tx, z: tz, size: 0.7 + seededRandom(parkSeed + t) * 0.8 });
      }
      continue;
    }

    // Roads — collect first so buildings can check against them
    if (tags.highway && el.type === "way") {
      const streetType = osmHighwayToType(tags.highway);
      if (!streetType) continue;
      if (!el.geometry || el.geometry.length < 2) continue;

      const segments: Array<{ x: number; z: number }> = [];
      for (const pt of el.geometry) {
        const world = toWorld(latLonToMeters(pt.lat, pt.lon, centerLat, centerLon));
        segments.push(world);
      }

      const widthMeters = osmHighwayToWidthMeters(tags.highway);
      const widthUnits = metersToUnits(widthMeters);

      streets.push({
        segments,
        width: widthUnits,
        type: streetType,
        name: tags.name,
        lanes: osmHighwayToLanes(tags.highway),
      });

      // Build road buffer segments for building collision checks
      // Buffer = road half-width + sidewalk only (0.5 units) — buildings should be CLOSE to streets like real cities
      const bufferHalfWidth = widthUnits / 2 + 0.5;
      for (let i = 0; i < segments.length - 1; i++) {
        roadBuffers.push({
          ax: segments[i].x, az: segments[i].z,
          bx: segments[i + 1].x, bz: segments[i + 1].z,
          halfWidth: bufferHalfWidth,
        });
      }
      streetCount++;
    }
  }

  // ── Build junction zones from road intersection points ──
  const junctions: JunctionZone[] = [];
  const nodeMap = new Map<string, number>();
  for (const st of streets) {
    for (const pt of st.segments) {
      const key = `${Math.round(pt.x * 2)}_${Math.round(pt.z * 2)}`;
      nodeMap.set(key, (nodeMap.get(key) || 0) + 1);
    }
  }
  for (const st of streets) {
    for (const pt of st.segments) {
      const key = `${Math.round(pt.x * 2)}_${Math.round(pt.z * 2)}`;
      if ((nodeMap.get(key) || 0) >= 2) {
        // Junction: clear a larger area at intersections
        const existing = junctions.find(j => Math.abs(j.x - pt.x) < 2 && Math.abs(j.z - pt.z) < 2);
        if (!existing) {
          junctions.push({ x: pt.x, z: pt.z, radius: st.width / 2 + 3.0 });
        }
      }
    }
  }

  console.log(`[OSM] Pass 1 complete: ${streetCount} streets, ${roadBuffers.length} road segments, ${junctions.length} junctions, ${trees.length} trees, ${greenAreas.length} parks`);

  // ── PASS 2: Collect buildings, filtered against road buffers ──
  let buildingCount = 0;
  let skippedNoGeom = 0;
  let skippedTiny = 0;
  let skippedOnRoad = 0;
  let skippedOverlap = 0;

  // Track placed buildings for overlap detection
  const placedBuildings: Array<{ cx: number; cz: number; w: number; d: number }> = [];

  for (const el of osmData.elements) {
    const tags = el.tags || {};

    // ONLY process elements with building tag
    if (!tags.building) continue;

    const vertices = extractPolygonGeometry(el, centerLat, centerLon);
    if (!vertices || vertices.length < 3) {
      skippedNoGeom++;
      continue;
    }

    let sumX = 0, sumZ = 0;
    let gMinX = Infinity, gMaxX = -Infinity, gMinZ = Infinity, gMaxZ = -Infinity;

    for (const v of vertices) {
      sumX += v.x;
      sumZ += v.z;
      gMinX = Math.min(gMinX, v.x);
      gMaxX = Math.max(gMaxX, v.x);
      gMinZ = Math.min(gMinZ, v.z);
      gMaxZ = Math.max(gMaxZ, v.z);
    }

    const cx = sumX / vertices.length;
    const cz = sumZ / vertices.length;
    const footprintW = gMaxX - gMinX;
    const footprintD = gMaxZ - gMinZ;

    // Skip invalid coordinates
    if (!isFinite(cx) || !isFinite(cz)) {
      skippedNoGeom++;
      continue;
    }

    // Skip tiny buildings (< 3m real footprint area)
    if (footprintW < 0.8 && footprintD < 0.8) {
      skippedTiny++;
      continue;
    }

    // Validate polygon area — skip degenerate/sliver footprints
    const area = polygonArea(vertices);
    if (area < 0.5) {
      skippedTiny++;
      continue;
    }

    // ── ROAD COLLISION CHECK ──
    if (buildingOverlapsRoads(cx, cz, footprintW, footprintD, roadBuffers, junctions)) {
      skippedOnRoad++;
      continue;
    }

    // ── BUILDING OVERLAP CHECK ──
    let hasOverlap = false;
    for (const placed of placedBuildings) {
      if (buildingsOverlap(cx, cz, footprintW, footprintD, placed.cx, placed.cz, placed.w, placed.d)) {
        hasOverlap = true;
        break;
      }
    }
    if (hasOverlap) {
      skippedOverlap++;
      continue;
    }

    // Register as placed
    placedBuildings.push({ cx, cz, w: footprintW, d: footprintD });

    const seed = hash(`osm-${el.id}`);
    const style = osmTagsToStyle(tags);
    const district = osmTagsToDistrict(tags);
    const heightMeters = osmHeightMeters(tags, seed);
    const heightUnits = metersToUnits(heightMeters);
    const colors = STYLE_COLORS[style];
    const primaryColor = colors[seed % colors.length];

    const customizations: BuildingCustomizations = {
      neonSign: style === "corporate" || style === "agency" ? seededRandom(seed + 5) > 0.4 : false,
      rooftop: seededRandom(seed + 6) > 0.7,
      garden: style === "minimal" ? seededRandom(seed + 7) > 0.5 : false,
      outdoor: style === "creative" ? seededRandom(seed + 8) > 0.6 : false,
      sculptures: false,
      hologram: style === "futuristic" ? seededRandom(seed + 9) > 0.5 : false,
    };

    const name = tags.name || generateBuildingName(style, seed);

    // Store polygon vertices relative to centroid for ExtrudeGeometry
    const relativeVertices = vertices.map(v => ({
      x: v.x - cx,
      z: v.z - cz,
    }));

    buildings.push({
      id: `osm-${el.id}`,
      name,
      ownerName: tags.operator || tags["addr:housename"] || "City",
      district,
      style,
      floors: Math.max(1, Math.ceil(heightMeters / 3.5)),
      height: heightUnits,
      primaryColor,
      secondaryColor: "#1A2030",
      bio: tags.description || "",
      links: tags.website ? [tags.website] : [],
      customizations,
      createdAt: new Date().toISOString(),
      coordinates: { x: cx, z: cz },
      claimed: true,
      ownerId: "osm",
      polygon: { vertices: relativeVertices, w: footprintW, d: footprintD },
    } as CityBuilding & { polygon: BuildingPolygon });

    buildingCount++;
  }

  // Generate procedural street trees along roads if we got few from OSM
  if (trees.length < 50) {
    for (const st of streets) {
      if (st.type === "alley") continue;
      for (let i = 0; i < st.segments.length - 1; i++) {
        const a = st.segments[i];
        const b = st.segments[i + 1];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len < 3) continue;
        const nx = -dz / len;
        const nz = dx / len;
        const spacing = 4 + seededRandom(hash(`st-${i}`)) * 3;
        const numTrees = Math.floor(len / spacing);
        for (let t = 0; t < numTrees; t++) {
          const frac = (t + 0.5) / numTrees;
          const px = a.x + dx * frac + nx * (st.width / 2 + 1.5);
          const pz = a.z + dz * frac + nz * (st.width / 2 + 1.5);
          const seed = hash(`stree-${i}-${t}`);
          trees.push({ x: px, z: pz, size: 0.5 + seededRandom(seed) * 0.6 });
          if (seededRandom(seed + 1) > 0.3) {
            trees.push({
              x: a.x + dx * frac - nx * (st.width / 2 + 1.5),
              z: a.z + dz * frac - nz * (st.width / 2 + 1.5),
              size: 0.5 + seededRandom(seed + 2) * 0.6,
            });
          }
        }
      }
    }
  }

  console.log(`[OSM] Converted: ${buildingCount} buildings, ${streetCount} streets, ${trees.length} trees, ${greenAreas.length} parks`);
  console.log(`[OSM] Filtered: ${skippedNoGeom} no-geom, ${skippedTiny} tiny, ${skippedOnRoad} on-road, ${skippedOverlap} overlap`);
  return { buildings, streets, trees, greenAreas };
}

/**
 * Full pipeline: fetch OSM data and convert to city format.
 */
export async function generateCityFromOSM(
  lat: number,
  lon: number,
  radiusMeters: number = 600
): Promise<OSMCityData> {
  console.log(`[OSM] === Starting city generation for ${lat.toFixed(4)}, ${lon.toFixed(4)} (r=${radiusMeters}m) ===`);

  const osmData = await fetchOSMData(lat, lon, radiusMeters);
  const { buildings, streets, trees, greenAreas } = convertOSMToCity(osmData, lat, lon);

  // Compute bounds
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const b of buildings) {
    minX = Math.min(minX, b.coordinates.x);
    maxX = Math.max(maxX, b.coordinates.x);
    minZ = Math.min(minZ, b.coordinates.z);
    maxZ = Math.max(maxZ, b.coordinates.z);
  }
  for (const s of streets) {
    for (const pt of s.segments) {
      minX = Math.min(minX, pt.x);
      maxX = Math.max(maxX, pt.x);
      minZ = Math.min(minZ, pt.z);
      maxZ = Math.max(maxZ, pt.z);
    }
  }

  if (!isFinite(minX)) { minX = -50; maxX = 50; minZ = -50; maxZ = 50; }

  console.log(`[OSM] World bounds: X[${minX.toFixed(0)}..${maxX.toFixed(0)}] Z[${minZ.toFixed(0)}..${maxZ.toFixed(0)}]`);
  console.log(`[OSM] === Generation complete: ${buildings.length} buildings, ${streets.length} streets, ${trees.length} trees ===`);

  return {
    buildings,
    streets,
    trees,
    greenAreas,
    center: { lat, lon },
    radiusMeters,
    bounds: { minX, maxX, minZ, maxZ },
  };
}

// ── Name generator ──

const BUILDING_NAMES: Record<string, string[]> = {
  corporate: ["Atlas Corp", "Meridian HQ", "Pinnacle", "Summit", "Vertex", "Nexus", "Vanguard", "Apex"],
  creative: ["Prism Studio", "Canvas Lab", "Mosaic", "Palette", "Artisan", "Muse", "Atelier"],
  startup: ["LaunchPad", "Iterate", "Sprint Hub", "Catalyst", "Ignite", "Ember", "Nova"],
  tech: ["ByteForge", "DataCore", "NeuralNet", "QuantumBit", "CyberDen", "Algo", "Matrix"],
  agency: ["BrandCraft", "Strategos", "Impulse", "Elevate", "Amplify", "Synapse", "Optic"],
  minimal: ["Blank Studio", "Pure", "Essence", "Core", "Simple", "Clarity", "Mono"],
  futuristic: ["Neon Spire", "Holo Tower", "Quantum", "Photon", "Zenith", "Aurora", "Prism"],
  industrial: ["Ironworks", "Steel Mill", "Foundry", "Anvil", "Crucible", "Forge", "Silo"],
};

function generateBuildingName(style: BuildingStyle, seed: number): string {
  const pool = BUILDING_NAMES[style] || BUILDING_NAMES.corporate;
  return pool[seed % pool.length];
}

// ── City Presets ──

export interface CityPreset {
  id: string;
  name: string;
  country: string;
  emoji: string;
  lat: number;
  lon: number;
  radius: number;
  description: string;
}

export const CITY_PRESETS: CityPreset[] = [
  { id: "manhattan", name: "Manhattan", country: "USA", emoji: "🗽", lat: 40.7580, lon: -73.9855, radius: 500, description: "Times Square — dense skyscrapers" },
  { id: "tokyo-shibuya", name: "Shibuya", country: "Japan", emoji: "🗼", lat: 35.6595, lon: 139.7004, radius: 400, description: "Shibuya crossing — neon district" },
  { id: "paris-center", name: "Paris Centre", country: "France", emoji: "🗼", lat: 48.8566, lon: 2.3522, radius: 450, description: "Île de la Cité — historic Paris" },
  { id: "london-city", name: "City of London", country: "UK", emoji: "🇬🇧", lat: 51.5138, lon: -0.0984, radius: 450, description: "Financial district — modern towers" },
  { id: "dubai-downtown", name: "Downtown Dubai", country: "UAE", emoji: "🏙️", lat: 25.1972, lon: 55.2744, radius: 600, description: "Burj Khalifa — ultra-modern" },
  { id: "saopaulo-av", name: "Av. Paulista", country: "Brazil", emoji: "🇧🇷", lat: -23.5613, lon: -46.6558, radius: 500, description: "São Paulo — corporate towers" },
  { id: "singapore", name: "Marina Bay", country: "Singapore", emoji: "🇸🇬", lat: 1.2838, lon: 103.8591, radius: 450, description: "Marina Bay — futuristic skyline" },
  { id: "berlin-mitte", name: "Berlin Mitte", country: "Germany", emoji: "🇩🇪", lat: 52.5200, lon: 13.4050, radius: 450, description: "Central Berlin — historic + modern" },
  { id: "rio-centro", name: "Centro do Rio", country: "Brazil", emoji: "🇧🇷", lat: -22.9068, lon: -43.1729, radius: 450, description: "Rio downtown — colonial meets modern" },
  { id: "hong-kong", name: "Central HK", country: "China", emoji: "🇭🇰", lat: 22.2796, lon: 114.1588, radius: 400, description: "Central — skyscraper canyon" },
  { id: "amsterdam", name: "Amsterdam", country: "Netherlands", emoji: "🇳🇱", lat: 52.3676, lon: 4.9041, radius: 400, description: "Canal ring — charming density" },
  { id: "barcelona", name: "Eixample", country: "Spain", emoji: "🇪🇸", lat: 41.3874, lon: 2.1686, radius: 450, description: "Grid superblocks — Gaudí's area" },
];
