/**
 * Procedural City Layout Generator
 * Creates zoned, intentional city blocks with streets, density variation, and focal points.
 */
import type { CityBuilding, BuildingStyle, District, BuildingCustomizations } from "@/types/building";

// ── Deterministic hash ──
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ── Zone definitions ──
export interface CityZone {
  id: string;
  type: "commercial" | "residential" | "skyline" | "park" | "plaza";
  center: { x: number; z: number };
  radius: number;
  density: number; // 0-1
  heightRange: [number, number];
  styles: BuildingStyle[];
  district: District;
  glowIntensity: number; // 0-1 for commercial glow
}

export const CITY_ZONES: CityZone[] = [
  // Central commercial hub — dense, bright, medium-tall
  { id: "downtown-core", type: "commercial", center: { x: 0, z: 0 }, radius: 18, density: 0.95, heightRange: [4, 8], styles: ["corporate", "agency", "tech"], district: "central", glowIntensity: 0.9 },
  // Skyline cluster — tall towers, dramatic silhouette
  { id: "skyline-north", type: "skyline", center: { x: -5, z: -28 }, radius: 14, density: 0.8, heightRange: [8, 16], styles: ["corporate", "futuristic", "tech"], district: "tech", glowIntensity: 0.7 },
  // Tech campus — medium density, modern
  { id: "tech-east", type: "commercial", center: { x: 30, z: -12 }, radius: 16, density: 0.7, heightRange: [3, 7], styles: ["tech", "startup", "futuristic"], district: "tech", glowIntensity: 0.6 },
  // Creative quarter — varied, colorful, medium
  { id: "creative-west", type: "commercial", center: { x: -30, z: 8 }, radius: 15, density: 0.65, heightRange: [2, 5], styles: ["creative", "minimal", "startup"], district: "creator", glowIntensity: 0.5 },
  // Residential south — spacious, lower
  { id: "residential-south", type: "residential", center: { x: 8, z: 30 }, radius: 20, density: 0.4, heightRange: [2, 4], styles: ["minimal", "creative", "agency"], district: "startup", glowIntensity: 0.2 },
  // Agency row — medium, structured
  { id: "agency-se", type: "commercial", center: { x: 28, z: 22 }, radius: 12, density: 0.6, heightRange: [3, 6], styles: ["agency", "corporate", "industrial"], district: "agency", glowIntensity: 0.4 },
  // Industrial fringe
  { id: "industrial-nw", type: "residential", center: { x: -35, z: -25 }, radius: 12, density: 0.35, heightRange: [2, 5], styles: ["industrial", "minimal"], district: "tech", glowIntensity: 0.15 },
  // Central park/plaza (no buildings, but referenced for clearing)
  { id: "central-park", type: "park", center: { x: 15, z: 5 }, radius: 8, density: 0, heightRange: [0, 0], styles: [], district: "central", glowIntensity: 0 },
  // Small secondary plaza
  { id: "south-plaza", type: "plaza", center: { x: -10, z: 20 }, radius: 5, density: 0, heightRange: [0, 0], styles: [], district: "startup", glowIntensity: 0.3 },
];

// ── Street grid ──
export interface Street {
  start: { x: number; z: number };
  end: { x: number; z: number };
  width: number;
  type: "main" | "secondary" | "alley";
}

export const CITY_STREETS: Street[] = [
  // Main arteries (wider, cross-city)
  { start: { x: -60, z: 0 }, end: { x: 60, z: 0 }, width: 3.5, type: "main" },
  { start: { x: 0, z: -50 }, end: { x: 0, z: 50 }, width: 3.5, type: "main" },
  // Secondary grid
  { start: { x: -60, z: -18 }, end: { x: 60, z: -18 }, width: 2.2, type: "secondary" },
  { start: { x: -60, z: 18 }, end: { x: 60, z: 18 }, width: 2.2, type: "secondary" },
  { start: { x: -18, z: -50 }, end: { x: -18, z: 50 }, width: 2.2, type: "secondary" },
  { start: { x: 18, z: -50 }, end: { x: 18, z: 50 }, width: 2.2, type: "secondary" },
  // Diagonal accent road (breaks grid monotony)
  { start: { x: -35, z: -35 }, end: { x: -8, z: -8 }, width: 2, type: "secondary" },
  // Alleys
  { start: { x: -9, z: -12 }, end: { x: -9, z: 12 }, width: 1.2, type: "alley" },
  { start: { x: 9, z: -12 }, end: { x: 9, z: 12 }, width: 1.2, type: "alley" },
  { start: { x: -12, z: -9 }, end: { x: 12, z: -9 }, width: 1.2, type: "alley" },
  { start: { x: -12, z: 9 }, end: { x: 12, z: 9 }, width: 1.2, type: "alley" },
  { start: { x: 22, z: -8 }, end: { x: 38, z: -8 }, width: 1.2, type: "alley" },
  { start: { x: -38, z: 2 }, end: { x: -22, z: 2 }, width: 1.2, type: "alley" },
];

// ── Check if point is on a street ──
function isOnStreet(x: number, z: number, margin: number = 1.5): boolean {
  for (const st of CITY_STREETS) {
    const dx = st.end.x - st.start.x;
    const dz = st.end.z - st.start.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.1) continue;
    const nx = -dz / len;
    const nz = dx / len;
    const t = ((x - st.start.x) * dx + (z - st.start.z) * dz) / (len * len);
    if (t < -0.05 || t > 1.05) continue;
    const dist = Math.abs((x - st.start.x) * nx + (z - st.start.z) * nz);
    if (dist < st.width / 2 + margin) return true;
  }
  return false;
}

// ── Check if inside a park/plaza zone ──
function isInClearZone(x: number, z: number): boolean {
  for (const zone of CITY_ZONES) {
    if (zone.type === "park" || zone.type === "plaza") {
      const dx = x - zone.center.x;
      const dz = z - zone.center.z;
      if (Math.sqrt(dx * dx + dz * dz) < zone.radius) return true;
    }
  }
  return false;
}

// ── Find best zone for a position ──
function getBestZone(x: number, z: number): CityZone | null {
  let best: CityZone | null = null;
  let bestDist = Infinity;
  for (const zone of CITY_ZONES) {
    if (zone.type === "park" || zone.type === "plaza") continue;
    const dx = x - zone.center.x;
    const dz = z - zone.center.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < zone.radius && dist < bestDist) {
      bestDist = dist;
      best = zone;
    }
  }
  return best;
}

// ── Color palettes per zone type ──
const ZONE_PALETTES: Record<string, { primary: string[]; secondary: string[] }> = {
  commercial: {
    primary: ["#4A6FA5", "#5B8DB8", "#3A5F8F", "#6A8FC5", "#2A4F7F", "#7A9FD5"],
    secondary: ["#1E3A5F", "#2A4A6F", "#1A3050", "#3A5A7F", "#0F2A4F"],
  },
  skyline: {
    primary: ["#2A3A5A", "#3A4A6A", "#1A2A4A", "#4A5A7A", "#5A6A8A", "#0A1A3A"],
    secondary: ["#101828", "#1A2838", "#0A1018", "#2A3848", "#3A4858"],
  },
  residential: {
    primary: ["#8B6F5E", "#A08070", "#7A5F4E", "#C0A090", "#9B7F6E", "#B09080"],
    secondary: ["#5A4030", "#6A5040", "#4A3020", "#7A6050", "#8A7060"],
  },
};

// ── Focal point buildings ──
const FOCAL_POINTS: Array<{ x: number; z: number; name: string; style: BuildingStyle; height: number; color: string; glow: boolean }> = [
  { x: 0, z: -2, name: "City Hall", style: "corporate", height: 10, color: "#D4AF37", glow: true },
  { x: -6, z: -30, name: "Apex Tower", style: "futuristic", height: 18, color: "#00BFFF", glow: true },
  { x: 30, z: -15, name: "Innovation Hub", style: "tech", height: 9, color: "#00FF88", glow: true },
  { x: -32, z: 10, name: "Art Pavilion", style: "creative", height: 5, color: "#FF6B9D", glow: true },
];

/**
 * Generate NPC filler buildings to populate the city procedurally.
 * These fill zones with contextually appropriate buildings.
 */
export function generateCityLayout(existingBuildings: CityBuilding[]): CityBuilding[] {
  const npcBuildings: CityBuilding[] = [];
  const occupied = new Set<string>();

  // Mark existing building positions
  for (const b of existingBuildings) {
    const key = `${Math.round(b.coordinates.x / 3)}_${Math.round(b.coordinates.z / 3)}`;
    occupied.add(key);
  }

  // Track last model used per zone to avoid repetition
  const lastModelPerZone: Record<string, number> = {};

  // Place focal point buildings first
  for (const fp of FOCAL_POINTS) {
    const key = `${Math.round(fp.x / 3)}_${Math.round(fp.z / 3)}`;
    if (occupied.has(key) || isOnStreet(fp.x, fp.z, 2)) continue;
    occupied.add(key);

    npcBuildings.push({
      id: `focal-${fp.name.toLowerCase().replace(/\s/g, "-")}`,
      name: fp.name,
      ownerName: "City",
      district: "central",
      style: fp.style,
      floors: Math.ceil(fp.height / 1.2),
      height: fp.height,
      primaryColor: fp.color,
      secondaryColor: "#111828",
      bio: "",
      links: [],
      customizations: { neonSign: true, rooftop: true, garden: false, outdoor: false, sculptures: fp.glow, hologram: fp.glow },
      createdAt: new Date().toISOString(),
      coordinates: { x: fp.x, z: fp.z },
      claimed: true,
      ownerId: "npc",
    });
  }

  // Fill zones with buildings on a grid
  for (const zone of CITY_ZONES) {
    if (zone.type === "park" || zone.type === "plaza" || zone.density === 0) continue;

    const palette = ZONE_PALETTES[zone.type] || ZONE_PALETTES.commercial;

    // Grid spacing based on density
    const spacing = zone.type === "residential" ? 7 : zone.type === "skyline" ? 6 : 5;
    const jitter = spacing * 0.3;

    const minX = zone.center.x - zone.radius;
    const maxX = zone.center.x + zone.radius;
    const minZ = zone.center.z - zone.radius;
    const maxZ = zone.center.z + zone.radius;

    let buildingIndex = 0;

    for (let gx = minX; gx <= maxX; gx += spacing) {
      for (let gz = minZ; gz <= maxZ; gz += spacing) {
        const seed = hash(`${zone.id}-${gx}-${gz}`);
        const r = seededRandom(seed);

        // Density check — skip some slots
        if (r > zone.density) continue;

        // Jitter position
        const jx = gx + (seededRandom(seed + 1) - 0.5) * jitter;
        const jz = gz + (seededRandom(seed + 2) - 0.5) * jitter;

        // Check constraints
        const dx = jx - zone.center.x;
        const dz = jz - zone.center.z;
        if (Math.sqrt(dx * dx + dz * dz) > zone.radius) continue;
        if (isOnStreet(jx, jz, 2.2)) continue;
        if (isInClearZone(jx, jz)) continue;

        const gridKey = `${Math.round(jx / 3)}_${Math.round(jz / 3)}`;
        if (occupied.has(gridKey)) continue;
        occupied.add(gridKey);

        // Pick style — avoid repeating same model next to each other
        const styleIdx = (seed + buildingIndex) % zone.styles.length;
        const style = zone.styles[styleIdx];

        // Height with variation
        const [minH, maxH] = zone.heightRange;
        const baseH = minH + seededRandom(seed + 3) * (maxH - minH);
        const scaleVar = 0.9 + seededRandom(seed + 4) * 0.3; // 0.9–1.2
        const height = Math.round(baseH * scaleVar * 10) / 10;

        // Color from zone palette
        const primaryColor = palette.primary[seed % palette.primary.length];
        const secondaryColor = palette.secondary[seed % palette.secondary.length];

        // Contextual customizations
        const isCommercial = zone.type === "commercial";
        const customizations: BuildingCustomizations = {
          neonSign: isCommercial && seededRandom(seed + 5) > 0.4,
          rooftop: seededRandom(seed + 6) > 0.7,
          garden: zone.type === "residential" && seededRandom(seed + 7) > 0.5,
          outdoor: isCommercial && seededRandom(seed + 8) > 0.7,
          sculptures: false,
          hologram: zone.type === "skyline" && seededRandom(seed + 9) > 0.8,
        };

        const id = `npc-${zone.id}-${buildingIndex}`;
        npcBuildings.push({
          id,
          name: generateBuildingName(style, seed),
          ownerName: generateOwnerName(seed),
          district: zone.district,
          style,
          floors: Math.max(2, Math.ceil(height / 1.2)),
          height,
          primaryColor,
          secondaryColor,
          bio: "",
          links: [],
          customizations,
          createdAt: new Date().toISOString(),
          coordinates: { x: Math.round(jx * 10) / 10, z: Math.round(jz * 10) / 10 },
          claimed: true,
          ownerId: "npc",
        });

        buildingIndex++;
      }
    }
  }

  return npcBuildings;
}

// ── Name generators ──
const BUILDING_NAMES: Record<string, string[]> = {
  corporate: ["Atlas Corp", "Meridian HQ", "Pinnacle", "Summit", "Vertex", "Nexus", "Vanguard", "Citadel", "Keystone", "Paragon"],
  creative: ["Prism Studio", "Canvas Lab", "Mosaic", "Palette", "Artisan", "Muse", "Atelier", "Chromatic", "Fresco"],
  startup: ["LaunchPad", "Iterate", "Sprint Hub", "Catalyst", "Ignite", "Ember", "Flux", "Pivot", "Surge"],
  tech: ["ByteForge", "DataCore", "NeuralNet", "QuantumBit", "CyberDen", "Algo", "CodeVault", "Matrix", "TechNova"],
  agency: ["BrandCraft", "Strategos", "Impulse", "Elevate", "Amplify", "Synapse", "Forge", "Blueprint"],
  minimal: ["Blank Studio", "Pure", "Essence", "Core", "Simple", "Clarity", "Base"],
  futuristic: ["Neon Spire", "Holo Tower", "Quantum", "Photon", "Zenith", "Aurora", "Eclipse"],
  industrial: ["Ironworks", "Steel Mill", "Foundry", "Anvil", "Crucible", "Refinery"],
};

function generateBuildingName(style: BuildingStyle, seed: number): string {
  const names = BUILDING_NAMES[style] || BUILDING_NAMES.corporate;
  return names[seed % names.length];
}

const OWNER_NAMES = ["Alex K.", "Maria S.", "David R.", "Elena P.", "James M.", "Sofia L.", "Carlos T.", "Yuki N.", "Omar H.", "Ava C.", "Leo W.", "Nina B.", "Felix G.", "Maya D.", "Liam F."];
function generateOwnerName(seed: number): string {
  return OWNER_NAMES[seed % OWNER_NAMES.length];
}

/**
 * Get zone glow intensity for a building position
 */
export function getZoneGlow(x: number, z: number): number {
  let maxGlow = 0;
  for (const zone of CITY_ZONES) {
    const dx = x - zone.center.x;
    const dz = z - zone.center.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < zone.radius) {
      const falloff = 1 - (dist / zone.radius);
      maxGlow = Math.max(maxGlow, zone.glowIntensity * falloff);
    }
  }
  return maxGlow;
}
