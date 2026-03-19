/**
 * OSM City Generator v3
 * Real polygon footprints, accurate scale, full road geometry.
 * Arnis-level: REAL geography → REAL 3D city.
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
    members?: Array<{ type: string; ref: number; role: string }>;
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
  /** Vertices of the footprint polygon in world coords */
  vertices: Array<{ x: number; z: number }>;
  /** Width/depth bounding box for fallback */
  w: number;
  d: number;
}

export interface OSMCityData {
  buildings: CityBuilding[];
  streets: OSMStreet[];
  center: { lat: number; lon: number };
  radiusMeters: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

// ── Geo projection (Mercator, accurate at city scale) ──

const EARTH_RADIUS = 6371000;

function latLonToMeters(lat: number, lon: number, centerLat: number, centerLon: number): { x: number; z: number } {
  const dLat = ((lat - centerLat) * Math.PI) / 180;
  const dLon = ((lon - centerLon) * Math.PI) / 180;
  const cosCenter = Math.cos((centerLat * Math.PI) / 180);
  return {
    x: dLon * EARTH_RADIUS * cosCenter,
    z: -dLat * EARTH_RADIUS, // Negative because +z is south in Three.js
  };
}

/**
 * Scale: 1 world unit = 1 meter (TRUE SCALE).
 * This gives real proportions. Buildings at real height in meters.
 * We then scale down by a factor for navigability.
 */
const WORLD_SCALE = 1 / 5; // 1 unit = 5 meters → a 50m building = 10 units

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

// ── OSM tag → building style mapping ──

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
  // Return height in METERS (real scale)
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

  // Default: 3-6 stories
  return 8 + seededRandom(seed) * 15;
}

// ── Color palettes (richer, per-zone) ──

const STYLE_COLORS: Record<BuildingStyle, string[]> = {
  corporate: ["#8A9BB5", "#7A8DA8", "#96AACC", "#6B7F9A", "#B0BDD0", "#5A6E85", "#A0ADC0", "#748AA0"],
  creative: ["#C4896A", "#B87A5A", "#D49A7A", "#A06848", "#C89A80", "#8A5838", "#B88A60", "#D0A070"],
  startup: ["#50C88A", "#3AAA70", "#65DDA5", "#40BB80", "#2A8A55", "#38A868", "#4BBB78", "#60CC90"],
  tech: ["#5A6A9A", "#7B6DAA", "#9A66B5", "#4A5A8A", "#6B5D9A", "#6A7AAA", "#5A60A0", "#7B70B5"],
  agency: ["#CD853F", "#B4A490", "#8B6540", "#A0724D", "#D4B080", "#C4A060", "#B89870", "#A08860"],
  minimal: ["#E0D8C8", "#C8D0B8", "#E8DCC0", "#D4C8A0", "#CFC0A0", "#E0D0A8", "#D8C8B0", "#F0E0C0"],
  futuristic: ["#3AAA80", "#7E65B5", "#50C8E0", "#5A9FE0", "#10E890", "#40B0D0", "#6090E0", "#50D0A0"],
  industrial: ["#8A7B8A", "#9A8B7A", "#7B8A8A", "#A08A7A", "#7AAA9A", "#6A6A6A", "#7A7A8A", "#8A8A7A"],
};

// ── Road type mapping ──

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
[out:json][timeout:45];
(
  way["building"](around:${radiusMeters},${lat},${lon});
  way["highway"](around:${radiusMeters},${lat},${lon});
);
out body geom;
  `.trim();
}

export async function fetchOSMData(lat: number, lon: number, radiusMeters: number = 600): Promise<OSMResponse> {
  const query = buildOverpassQuery(lat, lon, radiusMeters);
  const response = await fetch(OVERPASS_API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Convert OSM response into city buildings (with polygon footprints) and streets.
 */
export function convertOSMToCity(
  osmData: OSMResponse,
  centerLat: number,
  centerLon: number
): { buildings: CityBuilding[]; streets: OSMStreet[] } {
  const buildings: CityBuilding[] = [];
  const streets: OSMStreet[] = [];
  const occupiedCells = new Set<string>();

  for (const el of osmData.elements) {
    if (el.type !== "way") continue;
    const tags = el.tags || {};

    // ── Buildings with REAL polygon footprints ──
    if (tags.building) {
      if (!el.geometry || el.geometry.length < 3) continue;

      // Convert all polygon vertices to world coords
      const vertices: Array<{ x: number; z: number }> = [];
      let sumX = 0, sumZ = 0;
      let gMinX = Infinity, gMaxX = -Infinity, gMinZ = Infinity, gMaxZ = -Infinity;

      for (const pt of el.geometry) {
        const meters = latLonToMeters(pt.lat, pt.lon, centerLat, centerLon);
        const world = toWorld(meters);
        vertices.push(world);
        sumX += world.x;
        sumZ += world.z;
        gMinX = Math.min(gMinX, world.x);
        gMaxX = Math.max(gMaxX, world.x);
        gMinZ = Math.min(gMinZ, world.z);
        gMaxZ = Math.max(gMaxZ, world.z);
      }

      const cx = sumX / vertices.length;
      const cz = sumZ / vertices.length;
      const footprintW = gMaxX - gMinX;
      const footprintD = gMaxZ - gMinZ;

      // Skip tiny buildings
      if (footprintW < 0.3 && footprintD < 0.3) continue;

      // De-duplicate by grid cell
      const cellKey = `${Math.round(cx / 1.5)}_${Math.round(cz / 1.5)}`;
      if (occupiedCells.has(cellKey)) continue;
      occupiedCells.add(cellKey);

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
        // Real polygon data
        polygon: { vertices: relativeVertices, w: footprintW, d: footprintD },
      } as CityBuilding & { polygon: BuildingPolygon });
    }

    // ── Roads with FULL geometry ──
    if (tags.highway) {
      const streetType = osmHighwayToType(tags.highway);
      if (!streetType) continue;
      if (!el.geometry || el.geometry.length < 2) continue;

      const segments: Array<{ x: number; z: number }> = [];
      for (const pt of el.geometry) {
        const meters = latLonToMeters(pt.lat, pt.lon, centerLat, centerLon);
        const world = toWorld(meters);
        segments.push(world);
      }

      const widthMeters = osmHighwayToWidthMeters(tags.highway);

      streets.push({
        segments,
        width: metersToUnits(widthMeters),
        type: streetType,
        name: tags.name,
        lanes: osmHighwayToLanes(tags.highway),
      });
    }
  }

  return { buildings, streets };
}

/**
 * Full pipeline: fetch OSM data and convert to city format.
 */
export async function generateCityFromOSM(
  lat: number,
  lon: number,
  radiusMeters: number = 600
): Promise<OSMCityData> {
  console.log(`[OSM] Fetching city data for ${lat}, ${lon} (radius: ${radiusMeters}m)...`);

  const osmData = await fetchOSMData(lat, lon, radiusMeters);
  console.log(`[OSM] Received ${osmData.elements.length} elements`);

  const { buildings, streets } = convertOSMToCity(osmData, lat, lon);
  console.log(`[OSM] Converted: ${buildings.length} buildings, ${streets.length} streets`);

  // Compute bounds
  let minX = 0, maxX = 0, minZ = 0, maxZ = 0;
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

  return {
    buildings,
    streets,
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

// ── Pre-defined city locations ──

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
