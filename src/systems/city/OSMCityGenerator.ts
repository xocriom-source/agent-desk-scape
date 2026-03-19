/**
 * OSM City Generator
 * Fetches real-world building and road data from OpenStreetMap via the Overpass API,
 * then converts it into the city's internal format (CityBuilding[] and Street[]).
 * 
 * The Arnis-inspired approach: use REAL geography for layout, but render with
 * our stylised GLB models — not Minecraft blocks.
 */

import type { CityBuilding, BuildingStyle, District, BuildingCustomizations } from "@/types/building";
import type { Street } from "./CityLayoutGenerator";

// ── Types ──

export interface OSMNode {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

export interface OSMWay {
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
}

export interface OSMRelation {
  id: number;
  members: Array<{ type: string; ref: number; role: string }>;
  tags?: Record<string, string>;
}

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

export interface OSMCityData {
  buildings: CityBuilding[];
  streets: Street[];
  center: { lat: number; lon: number };
  radiusMeters: number;
}

// ── Geo projection ──

const EARTH_RADIUS = 6371000; // meters

/** Convert lat/lon to local x/z meters relative to a center point */
function latLonToLocal(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number
): { x: number; z: number } {
  const dLat = ((lat - centerLat) * Math.PI) / 180;
  const dLon = ((lon - centerLon) * Math.PI) / 180;
  const cosCenter = Math.cos((centerLat * Math.PI) / 180);

  // x = east-west, z = south-north (inverted for Three.js where -z is north)
  const x = dLon * EARTH_RADIUS * cosCenter;
  const z = -dLat * EARTH_RADIUS; // negative because Three.js z goes "into screen"

  return { x, z };
}

/** Scale from real meters to city units (1 city unit ≈ 5 meters) */
const METERS_TO_CITY_UNITS = 1 / 5;

function toCity(meters: { x: number; z: number }): { x: number; z: number } {
  return {
    x: Math.round(meters.x * METERS_TO_CITY_UNITS * 10) / 10,
    z: Math.round(meters.z * METERS_TO_CITY_UNITS * 10) / 10,
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

  // Default based on hash for variety
  const styles: BuildingStyle[] = ["corporate", "creative", "minimal", "tech", "agency"];
  return styles[hash(building + amenity) % styles.length];
}

function osmTagsToDistrict(tags: Record<string, string>): District {
  const building = tags.building || "";
  const amenity = tags.amenity || "";
  const landuse = tags.landuse || "";

  if (building === "commercial" || building === "office") return "central";
  if (building === "industrial" || building === "warehouse") return "agency";
  if (amenity === "university" || amenity === "school") return "tech";
  if (building === "residential" || building === "apartments") return "startup";
  return "central";
}

function osmHeightFromTags(tags: Record<string, string>): number {
  // Try explicit height
  if (tags.height) {
    const h = parseFloat(tags.height);
    if (!isNaN(h)) return Math.max(2, Math.min(h * METERS_TO_CITY_UNITS, 20));
  }
  // Try levels
  if (tags["building:levels"]) {
    const levels = parseInt(tags["building:levels"]);
    if (!isNaN(levels)) return Math.max(2, Math.min(levels * 0.8, 20));
  }
  // Defaults by type
  const building = tags.building || "";
  if (building === "skyscraper") return 16;
  if (building === "tower") return 12;
  if (building === "office" || building === "commercial") return 6;
  if (building === "apartments") return 5;
  if (building === "house" || building === "detached") return 2.5;
  if (building === "industrial" || building === "warehouse") return 3;
  if (building === "church" || building === "cathedral") return 7;

  return 3 + seededRandom(hash(JSON.stringify(tags))) * 3;
}

// ── Color palettes ──

const STYLE_COLORS: Record<BuildingStyle, string[]> = {
  corporate: ["#6B8FC5", "#5B8DB8", "#82B4E0", "#4A6FA5", "#7AAFDF"],
  creative: ["#D4845A", "#C87A50", "#E09570", "#B06840", "#C49075"],
  startup: ["#40C88A", "#2AAA70", "#55DDA5", "#30BB80", "#1A8A55"],
  tech: ["#4A5A8A", "#6B5DAA", "#8A56B5", "#3A4A7A", "#5B4D9A"],
  agency: ["#CD853F", "#B4D4E8", "#8B4513", "#A0522D", "#E4B050"],
  minimal: ["#D4C5A9", "#B8E8B4", "#E8D4B4", "#C4B08B", "#BFA980"],
  futuristic: ["#2AAA70", "#6E55B5", "#40C8E0", "#4A9FE0", "#00E890"],
  industrial: ["#7A6B8A", "#8A7B6A", "#6B8A7A", "#9A7A6A", "#6A9A8A"],
};

// ── Road type mapping ──

function osmHighwayToStreetType(highway: string): Street["type"] | null {
  switch (highway) {
    case "motorway":
    case "trunk":
    case "primary":
    case "secondary":
      return "main";
    case "tertiary":
    case "residential":
    case "unclassified":
      return "secondary";
    case "service":
    case "pedestrian":
    case "footway":
    case "path":
      return "alley";
    default:
      return null;
  }
}

function osmHighwayToWidth(highway: string): number {
  switch (highway) {
    case "motorway":
    case "trunk":
      return 4;
    case "primary":
    case "secondary":
      return 3.5;
    case "tertiary":
    case "residential":
      return 2.2;
    case "service":
    case "pedestrian":
      return 1.5;
    default:
      return 1.2;
  }
}

// ── Overpass API ──

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

/**
 * Build an Overpass QL query for buildings and roads within a bounding box.
 */
function buildOverpassQuery(lat: number, lon: number, radiusMeters: number): string {
  return `
[out:json][timeout:30];
(
  way["building"](around:${radiusMeters},${lat},${lon});
  way["highway"](around:${radiusMeters},${lat},${lon});
);
out center tags;
  `.trim();
}

/**
 * Fetch OSM data from the Overpass API.
 */
export async function fetchOSMData(
  lat: number,
  lon: number,
  radiusMeters: number = 500
): Promise<OSMResponse> {
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
 * Convert OSM response into city buildings and streets.
 */
export function convertOSMToCity(
  osmData: OSMResponse,
  centerLat: number,
  centerLon: number
): { buildings: CityBuilding[]; streets: Street[] } {
  const buildings: CityBuilding[] = [];
  const streets: Street[] = [];
  const occupiedCells = new Set<string>();

  for (const el of osmData.elements) {
    if (el.type !== "way") continue;
    const tags = el.tags || {};

    // ── Buildings ──
    if (tags.building) {
      const center = el.center;
      if (!center) continue;

      const localMeters = latLonToLocal(center.lat, center.lon, centerLat, centerLon);
      const pos = toCity(localMeters);

      // De-duplicate by grid cell
      const cellKey = `${Math.round(pos.x / 3)}_${Math.round(pos.z / 3)}`;
      if (occupiedCells.has(cellKey)) continue;
      occupiedCells.add(cellKey);

      const seed = hash(`osm-${el.id}`);
      const style = osmTagsToStyle(tags);
      const district = osmTagsToDistrict(tags);
      const height = osmHeightFromTags(tags);
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

      buildings.push({
        id: `osm-${el.id}`,
        name,
        ownerName: tags.operator || tags["addr:housename"] || "City",
        district,
        style,
        floors: Math.max(1, Math.ceil(height / 0.8)),
        height,
        primaryColor,
        secondaryColor: "#1A2030",
        bio: tags.description || "",
        links: tags.website ? [tags.website] : [],
        customizations,
        createdAt: new Date().toISOString(),
        coordinates: { x: pos.x, z: pos.z },
        claimed: true,
        ownerId: "osm",
      });
    }

    // ── Roads ──
    if (tags.highway) {
      const streetType = osmHighwayToStreetType(tags.highway);
      if (!streetType) continue;

      // Use the geometry endpoints (first and last node center approximation)
      // Since we requested `out center`, we only have the center point.
      // For proper roads, we'd need `out geom`, but center + bounds is enough for a grid.
      if (el.bounds) {
        const startMeters = latLonToLocal(el.bounds.minlat, el.bounds.minlon, centerLat, centerLon);
        const endMeters = latLonToLocal(el.bounds.maxlat, el.bounds.maxlon, centerLat, centerLon);
        const start = toCity(startMeters);
        const end = toCity(endMeters);

        // Skip very short segments
        const dx = end.x - start.x;
        const dz = end.z - start.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len < 1.5) continue;

        streets.push({
          start: { x: start.x, z: start.z },
          end: { x: end.x, z: end.z },
          width: osmHighwayToWidth(tags.highway),
          type: streetType,
        });
      }
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
  radiusMeters: number = 500
): Promise<OSMCityData> {
  console.log(`[OSM] Fetching city data for ${lat}, ${lon} (radius: ${radiusMeters}m)...`);

  const osmData = await fetchOSMData(lat, lon, radiusMeters);
  console.log(`[OSM] Received ${osmData.elements.length} elements from Overpass API`);

  const { buildings, streets } = convertOSMToCity(osmData, lat, lon);
  console.log(`[OSM] Converted to ${buildings.length} buildings and ${streets.length} streets`);

  return {
    buildings,
    streets,
    center: { lat, lon },
    radiusMeters,
  };
}

// ── Name generator ──

const BUILDING_NAMES: Record<string, string[]> = {
  corporate: ["Atlas Corp", "Meridian HQ", "Pinnacle", "Summit", "Vertex", "Nexus", "Vanguard"],
  creative: ["Prism Studio", "Canvas Lab", "Mosaic", "Palette", "Artisan", "Muse"],
  startup: ["LaunchPad", "Iterate", "Sprint Hub", "Catalyst", "Ignite", "Ember"],
  tech: ["ByteForge", "DataCore", "NeuralNet", "QuantumBit", "CyberDen", "Algo"],
  agency: ["BrandCraft", "Strategos", "Impulse", "Elevate", "Amplify", "Synapse"],
  minimal: ["Blank Studio", "Pure", "Essence", "Core", "Simple", "Clarity"],
  futuristic: ["Neon Spire", "Holo Tower", "Quantum", "Photon", "Zenith", "Aurora"],
  industrial: ["Ironworks", "Steel Mill", "Foundry", "Anvil", "Crucible"],
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
  { id: "manhattan", name: "Manhattan", country: "USA", emoji: "🗽", lat: 40.7580, lon: -73.9855, radius: 400, description: "Times Square area — dense skyscrapers and iconic avenues" },
  { id: "tokyo-shibuya", name: "Shibuya", country: "Japan", emoji: "🗼", lat: 35.6595, lon: 139.7004, radius: 350, description: "Shibuya crossing — neon-lit commercial district" },
  { id: "paris-center", name: "Paris Centre", country: "France", emoji: "🗼", lat: 48.8566, lon: 2.3522, radius: 400, description: "Île de la Cité — historic Parisian architecture" },
  { id: "london-city", name: "City of London", country: "UK", emoji: "🇬🇧", lat: 51.5138, lon: -0.0984, radius: 400, description: "Financial district — mix of old and modern towers" },
  { id: "dubai-downtown", name: "Downtown Dubai", country: "UAE", emoji: "🏙️", lat: 25.1972, lon: 55.2744, radius: 500, description: "Burj Khalifa area — ultra-modern skyline" },
  { id: "saopaulo-av", name: "Av. Paulista", country: "Brazil", emoji: "🇧🇷", lat: -23.5613, lon: -46.6558, radius: 400, description: "São Paulo's main avenue — corporate towers and culture" },
  { id: "singapore", name: "Marina Bay", country: "Singapore", emoji: "🇸🇬", lat: 1.2838, lon: 103.8591, radius: 400, description: "Marina Bay — futuristic waterfront skyline" },
  { id: "berlin-mitte", name: "Berlin Mitte", country: "Germany", emoji: "🇩🇪", lat: 52.5200, lon: 13.4050, radius: 400, description: "Central Berlin — mix of historic and modern" },
  { id: "rio-centro", name: "Centro do Rio", country: "Brazil", emoji: "🇧🇷", lat: -22.9068, lon: -43.1729, radius: 400, description: "Rio downtown — colonial meets modern" },
  { id: "hong-kong", name: "Central HK", country: "China", emoji: "🇭🇰", lat: 22.2796, lon: 114.1588, radius: 350, description: "Central — dense skyscraper canyon" },
  { id: "amsterdam", name: "Amsterdam Centrum", country: "Netherlands", emoji: "🇳🇱", lat: 52.3676, lon: 4.9041, radius: 350, description: "Canal ring — charming low-rise density" },
  { id: "barcelona", name: "Eixample", country: "Spain", emoji: "🇪🇸", lat: 41.3874, lon: 2.1686, radius: 400, description: "Grid superblocks — Gaudí's neighborhood" },
];
