/**
 * OSM City Generator v2
 * Fetches real-world building and road data from OpenStreetMap via the Overpass API,
 * then converts it into the city's internal format with FULL road geometry.
 * 
 * Arnis-inspired: use REAL geography, render with stylised GLB models.
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
}

export interface OSMCityData {
  buildings: CityBuilding[];
  streets: OSMStreet[];
  center: { lat: number; lon: number };
  radiusMeters: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

// ── Geo projection ──

const EARTH_RADIUS = 6371000;

function latLonToLocal(lat: number, lon: number, centerLat: number, centerLon: number): { x: number; z: number } {
  const dLat = ((lat - centerLat) * Math.PI) / 180;
  const dLon = ((lon - centerLon) * Math.PI) / 180;
  const cosCenter = Math.cos((centerLat * Math.PI) / 180);
  return {
    x: dLon * EARTH_RADIUS * cosCenter,
    z: -dLat * EARTH_RADIUS,
  };
}

/** Scale: 1 city unit ≈ 3 meters (denser than before) */
const METERS_TO_UNITS = 1 / 3;

function toCity(meters: { x: number; z: number }): { x: number; z: number } {
  return {
    x: Math.round(meters.x * METERS_TO_UNITS * 100) / 100,
    z: Math.round(meters.z * METERS_TO_UNITS * 100) / 100,
  };
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

function osmHeightFromTags(tags: Record<string, string>, seed: number): number {
  if (tags.height) {
    const h = parseFloat(tags.height);
    if (!isNaN(h)) return Math.max(3, Math.min(h * METERS_TO_UNITS, 30));
  }
  if (tags["building:levels"]) {
    const levels = parseInt(tags["building:levels"]);
    if (!isNaN(levels)) return Math.max(2, Math.min(levels * 1.2, 30));
  }
  const building = tags.building || "";
  if (building === "skyscraper") return 20 + seededRandom(seed) * 10;
  if (building === "tower") return 14 + seededRandom(seed) * 6;
  if (building === "office" || building === "commercial") return 6 + seededRandom(seed) * 4;
  if (building === "apartments") return 5 + seededRandom(seed) * 5;
  if (building === "house" || building === "detached") return 2.5 + seededRandom(seed);
  if (building === "industrial" || building === "warehouse") return 3 + seededRandom(seed) * 2;
  if (building === "church" || building === "cathedral") return 8 + seededRandom(seed) * 4;

  return 3 + seededRandom(seed) * 5;
}

// ── Color palettes ──

const STYLE_COLORS: Record<BuildingStyle, string[]> = {
  corporate: ["#6B8FC5", "#5B8DB8", "#82B4E0", "#4A6FA5", "#7AAFDF", "#3A5A8A", "#5878B0", "#4A7AC0"],
  creative: ["#D4845A", "#C87A50", "#E09570", "#B06840", "#C49075", "#9A6A3A", "#B87A4A", "#D09060"],
  startup: ["#40C88A", "#2AAA70", "#55DDA5", "#30BB80", "#1A8A55", "#28A868", "#3BBB78", "#50CC90"],
  tech: ["#4A5A8A", "#6B5DAA", "#8A56B5", "#3A4A7A", "#5B4D9A", "#5A6AAA", "#4A5090", "#6B60B5"],
  agency: ["#CD853F", "#B4D4E8", "#8B4513", "#A0522D", "#E4B050", "#C49030", "#D4A040", "#B89050"],
  minimal: ["#D4C5A9", "#B8E8B4", "#E8D4B4", "#C4B08B", "#BFA980", "#D0C090", "#C8B8A0", "#E0D0B0"],
  futuristic: ["#2AAA70", "#6E55B5", "#40C8E0", "#4A9FE0", "#00E890", "#30B0D0", "#5080E0", "#40D0A0"],
  industrial: ["#7A6B8A", "#8A7B6A", "#6B8A7A", "#9A7A6A", "#6A9A8A", "#5A5A5A", "#6A6A7A", "#7A7A6A"],
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

function osmHighwayToWidth(highway: string): number {
  switch (highway) {
    case "motorway": case "trunk": return 5;
    case "primary": case "secondary": return 4;
    case "tertiary": case "residential": return 2.8;
    case "service": case "pedestrian": return 1.8;
    default: return 1.5;
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
  way["landuse"](around:${radiusMeters},${lat},${lon});
  way["natural"](around:${radiusMeters},${lat},${lon});
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
 * Convert OSM response into city buildings and streets with FULL road geometry.
 */
export function convertOSMToCity(
  osmData: OSMResponse,
  centerLat: number,
  centerLon: number
): { buildings: CityBuilding[]; streets: OSMStreet[] } {
  const buildings: CityBuilding[] = [];
  const streets: OSMStreet[] = [];
  const occupiedCells = new Set<string>();
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

  for (const el of osmData.elements) {
    if (el.type !== "way") continue;
    const tags = el.tags || {};

    // ── Buildings ──
    if (tags.building) {
      // Compute centroid from geometry if available
      let cx = 0, cz = 0;
      if (el.geometry && el.geometry.length > 0) {
        let sumLat = 0, sumLon = 0;
        for (const pt of el.geometry) {
          sumLat += pt.lat;
          sumLon += pt.lon;
        }
        sumLat /= el.geometry.length;
        sumLon /= el.geometry.length;
        const local = latLonToLocal(sumLat, sumLon, centerLat, centerLon);
        const city = toCity(local);
        cx = city.x;
        cz = city.z;
      } else if (el.center) {
        const local = latLonToLocal(el.center.lat, el.center.lon, centerLat, centerLon);
        const city = toCity(local);
        cx = city.x;
        cz = city.z;
      } else {
        continue;
      }

      // Compute footprint size from geometry
      let footprintW = 2.5, footprintD = 2.5;
      if (el.geometry && el.geometry.length >= 3) {
        let gMinX = Infinity, gMaxX = -Infinity, gMinZ = Infinity, gMaxZ = -Infinity;
        for (const pt of el.geometry) {
          const local = latLonToLocal(pt.lat, pt.lon, centerLat, centerLon);
          const city = toCity(local);
          gMinX = Math.min(gMinX, city.x);
          gMaxX = Math.max(gMaxX, city.x);
          gMinZ = Math.min(gMinZ, city.z);
          gMaxZ = Math.max(gMaxZ, city.z);
        }
        footprintW = Math.max(1.5, Math.min(gMaxX - gMinX, 8));
        footprintD = Math.max(1.5, Math.min(gMaxZ - gMinZ, 8));
      }

      // De-duplicate by grid cell (2 unit grid)
      const cellKey = `${Math.round(cx / 2)}_${Math.round(cz / 2)}`;
      if (occupiedCells.has(cellKey)) continue;
      occupiedCells.add(cellKey);

      const seed = hash(`osm-${el.id}`);
      const style = osmTagsToStyle(tags);
      const district = osmTagsToDistrict(tags);
      const height = osmHeightFromTags(tags, seed);
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

      minX = Math.min(minX, cx);
      maxX = Math.max(maxX, cx);
      minZ = Math.min(minZ, cz);
      maxZ = Math.max(maxZ, cz);

      buildings.push({
        id: `osm-${el.id}`,
        name,
        ownerName: tags.operator || tags["addr:housename"] || "City",
        district,
        style,
        floors: Math.max(1, Math.ceil(height / 1.2)),
        height,
        primaryColor,
        secondaryColor: "#1A2030",
        bio: tags.description || "",
        links: tags.website ? [tags.website] : [],
        customizations,
        createdAt: new Date().toISOString(),
        coordinates: { x: cx, z: cz },
        claimed: true,
        ownerId: "osm",
        // Store footprint for accurate rendering
        footprint: { w: footprintW, d: footprintD },
      } as CityBuilding & { footprint: { w: number; d: number } });
    }

    // ── Roads with FULL geometry ──
    if (tags.highway) {
      const streetType = osmHighwayToType(tags.highway);
      if (!streetType) continue;
      if (!el.geometry || el.geometry.length < 2) continue;

      const segments: Array<{ x: number; z: number }> = [];
      for (const pt of el.geometry) {
        const local = latLonToLocal(pt.lat, pt.lon, centerLat, centerLon);
        const city = toCity(local);
        segments.push(city);
        minX = Math.min(minX, city.x);
        maxX = Math.max(maxX, city.x);
        minZ = Math.min(minZ, city.z);
        maxZ = Math.max(maxZ, city.z);
      }

      streets.push({
        segments,
        width: osmHighwayToWidth(tags.highway),
        type: streetType,
        name: tags.name,
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
