/**
 * Procedural City Layout Generator
 * Creates zoned, intentional city blocks with streets, density variation, and focal points.
 * Palette inspired by the Kenney City Kit color swatches.
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
  type: "commercial" | "residential" | "skyline" | "park" | "plaza" | "ai";
  center: { x: number; z: number };
  radius: number;
  density: number;
  heightRange: [number, number];
  styles: BuildingStyle[];
  district: District;
  glowIntensity: number;
}

export const CITY_ZONES: CityZone[] = [
  // ═══ HUMAN DISTRICTS (south/east half) ═══
  // Central commercial hub
  { id: "downtown-core", type: "commercial", center: { x: 8, z: 12 }, radius: 18, density: 0.95, heightRange: [4, 8], styles: ["corporate", "agency", "tech"], district: "central", glowIntensity: 0.9 },
  // Creative quarter — west
  { id: "creative-west", type: "commercial", center: { x: -28, z: 18 }, radius: 15, density: 0.65, heightRange: [2, 5], styles: ["creative", "minimal", "startup"], district: "creator", glowIntensity: 0.5 },
  // Residential south
  { id: "residential-south", type: "residential", center: { x: 10, z: 35 }, radius: 20, density: 0.4, heightRange: [2, 4], styles: ["minimal", "creative", "agency"], district: "startup", glowIntensity: 0.2 },
  // Agency row — southeast
  { id: "agency-se", type: "commercial", center: { x: 32, z: 22 }, radius: 12, density: 0.6, heightRange: [3, 6], styles: ["agency", "corporate", "industrial"], district: "agency", glowIntensity: 0.4 },
  // Tech campus — east
  { id: "tech-east", type: "commercial", center: { x: 35, z: -5 }, radius: 16, density: 0.7, heightRange: [3, 7], styles: ["tech", "startup", "futuristic"], district: "tech", glowIntensity: 0.6 },

  // ═══ AI DISTRICTS (north/west half — clearly separated) ═══
  // AI Skyline — tall autonomous towers
  { id: "ai-skyline", type: "ai", center: { x: -5, z: -30 }, radius: 16, density: 0.85, heightRange: [8, 18], styles: ["futuristic", "tech", "corporate"], district: "ai", glowIntensity: 0.95 },
  // AI Research Campus
  { id: "ai-research", type: "ai", center: { x: -30, z: -22 }, radius: 14, density: 0.6, heightRange: [4, 9], styles: ["tech", "futuristic", "minimal"], district: "ai", glowIntensity: 0.7 },
  // AI Industrial — processing/data centers
  { id: "ai-industrial", type: "ai", center: { x: 25, z: -30 }, radius: 12, density: 0.5, heightRange: [3, 7], styles: ["industrial", "tech", "futuristic"], district: "ai", glowIntensity: 0.4 },

  // ═══ SHARED SPACES ═══
  // Central dividing park (between human & AI)
  { id: "central-park", type: "park", center: { x: 0, z: -5 }, radius: 10, density: 0, heightRange: [0, 0], styles: [], district: "central", glowIntensity: 0 },
  // Human plaza
  { id: "human-plaza", type: "plaza", center: { x: -12, z: 25 }, radius: 6, density: 0, heightRange: [0, 0], styles: [], district: "startup", glowIntensity: 0.3 },
  // AI plaza
  { id: "ai-plaza", type: "plaza", center: { x: -15, z: -35 }, radius: 5, density: 0, heightRange: [0, 0], styles: [], district: "ai", glowIntensity: 0.6 },
];

// ── Street grid ──
export interface Street {
  start: { x: number; z: number };
  end: { x: number; z: number };
  width: number;
  type: "main" | "secondary" | "alley";
}

export const CITY_STREETS: Street[] = [
  // === Main divider boulevard (horizontal — separates Human from AI) ===
  { start: { x: -60, z: -5 }, end: { x: 60, z: -5 }, width: 4, type: "main" },
  // Main vertical
  { start: { x: 0, z: -50 }, end: { x: 0, z: 50 }, width: 3.5, type: "main" },

  // Secondary grid — Human side
  { start: { x: -60, z: 18 }, end: { x: 60, z: 18 }, width: 2.2, type: "secondary" },
  { start: { x: -60, z: 35 }, end: { x: 60, z: 35 }, width: 2, type: "secondary" },
  { start: { x: -18, z: -5 }, end: { x: -18, z: 50 }, width: 2.2, type: "secondary" },
  { start: { x: 20, z: -5 }, end: { x: 20, z: 50 }, width: 2.2, type: "secondary" },

  // Secondary grid — AI side
  { start: { x: -60, z: -22 }, end: { x: 60, z: -22 }, width: 2.2, type: "secondary" },
  { start: { x: -60, z: -38 }, end: { x: 60, z: -38 }, width: 2, type: "secondary" },
  { start: { x: -18, z: -50 }, end: { x: -18, z: -5 }, width: 2.2, type: "secondary" },
  { start: { x: 20, z: -50 }, end: { x: 20, z: -5 }, width: 2.2, type: "secondary" },

  // Diagonal accent
  { start: { x: -35, z: -40 }, end: { x: -10, z: -15 }, width: 2, type: "secondary" },

  // Alleys — Human
  { start: { x: 9, z: 5 }, end: { x: 9, z: 15 }, width: 1.2, type: "alley" },
  { start: { x: -9, z: 5 }, end: { x: -9, z: 15 }, width: 1.2, type: "alley" },
  { start: { x: 25, z: 12 }, end: { x: 40, z: 12 }, width: 1.2, type: "alley" },

  // Alleys — AI
  { start: { x: -9, z: -15 }, end: { x: -9, z: -35 }, width: 1.2, type: "alley" },
  { start: { x: 10, z: -18 }, end: { x: 10, z: -35 }, width: 1.2, type: "alley" },
  { start: { x: -25, z: -30 }, end: { x: -35, z: -30 }, width: 1.2, type: "alley" },
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

// ── Kenney City Kit inspired color palettes ──
// Extracted from the reference swatches: warm oranges/terracotta, cool blues/purples, muted grays
const ZONE_PALETTES: Record<string, { primary: string[]; secondary: string[] }> = {
  commercial: {
    // Warm blues + sky blue (row 1 of swatch)
    primary: ["#6B8FC5", "#5B8DB8", "#82B4E0", "#4A6FA5", "#7AAFDF", "#3A5F8F"],
    secondary: ["#8B8DA0", "#6A6D85", "#9DA0B5", "#5A5D70", "#B0A5B8"],
  },
  skyline: {
    // Deep blues + purples (right side of row 1)
    primary: ["#4A5A8A", "#6B5DAA", "#8A56B5", "#3A4A7A", "#5B4D9A", "#7A6DC5"],
    secondary: ["#2A3050", "#3A4060", "#1A2040", "#4A5070", "#5A6080"],
  },
  residential: {
    // Warm oranges + terracotta (row 2-3 of swatch)
    primary: ["#D4845A", "#C87A50", "#E09570", "#B06840", "#C49075", "#E8A580"],
    secondary: ["#7A5A40", "#8A6A50", "#6A4A30", "#9A7A60", "#5A3A20"],
  },
  ai: {
    // Cool teals + neon accents (futuristic feel, from green + purple in swatch)
    primary: ["#2AAA70", "#40C88A", "#1A8A55", "#55DDA5", "#30BB80", "#6E55B5"],
    secondary: ["#3A4858", "#4A5868", "#2A3848", "#5A6878", "#1A2838"],
  },
};

// ── Focal point buildings ──
const FOCAL_POINTS: Array<{ x: number; z: number; name: string; style: BuildingStyle; height: number; color: string; glow: boolean; district: District }> = [
  // Human landmarks
  { x: 8, z: 10, name: "City Hall", style: "corporate", height: 10, color: "#FFB840", glow: true, district: "central" },
  { x: -30, z: 20, name: "Art Pavilion", style: "creative", height: 5, color: "#E85580", glow: true, district: "creator" },
  { x: 35, z: -3, name: "Innovation Hub", style: "tech", height: 9, color: "#4A9FE0", glow: true, district: "tech" },
  // AI landmarks
  { x: -5, z: -32, name: "Apex Tower", style: "futuristic", height: 18, color: "#00E890", glow: true, district: "ai" },
  { x: -30, z: -20, name: "Neural Core", style: "tech", height: 12, color: "#7A55CC", glow: true, district: "ai" },
  { x: 25, z: -30, name: "Data Nexus", style: "industrial", height: 8, color: "#40C8E0", glow: true, district: "ai" },
];

/**
 * Generate NPC filler buildings to populate the city procedurally.
 */
export function generateCityLayout(existingBuildings: CityBuilding[]): CityBuilding[] {
  const npcBuildings: CityBuilding[] = [];
  const occupied = new Set<string>();

  for (const b of existingBuildings) {
    const key = `${Math.round(b.coordinates.x / 3)}_${Math.round(b.coordinates.z / 3)}`;
    occupied.add(key);
  }

  // Place focal point buildings first
  for (const fp of FOCAL_POINTS) {
    const key = `${Math.round(fp.x / 3)}_${Math.round(fp.z / 3)}`;
    if (occupied.has(key) || isOnStreet(fp.x, fp.z, 2)) continue;
    occupied.add(key);

    npcBuildings.push({
      id: `focal-${fp.name.toLowerCase().replace(/\s/g, "-")}`,
      name: fp.name,
      ownerName: fp.district === "ai" ? "AI System" : "City",
      district: fp.district,
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
      ownerId: fp.district === "ai" ? "ai-system" : "npc",
    });
  }

  // Fill zones with buildings on a grid
  for (const zone of CITY_ZONES) {
    if (zone.type === "park" || zone.type === "plaza" || zone.density === 0) continue;

    const palette = ZONE_PALETTES[zone.type] || ZONE_PALETTES.commercial;
    const spacing = zone.type === "residential" ? 7 : zone.type === "ai" ? 5.5 : zone.type === "skyline" ? 6 : 5;
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

        if (r > zone.density) continue;

        const jx = gx + (seededRandom(seed + 1) - 0.5) * jitter;
        const jz = gz + (seededRandom(seed + 2) - 0.5) * jitter;

        const dx = jx - zone.center.x;
        const dz = jz - zone.center.z;
        if (Math.sqrt(dx * dx + dz * dz) > zone.radius) continue;
        if (isOnStreet(jx, jz, 2.2)) continue;
        if (isInClearZone(jx, jz)) continue;

        const gridKey = `${Math.round(jx / 3)}_${Math.round(jz / 3)}`;
        if (occupied.has(gridKey)) continue;
        occupied.add(gridKey);

        const styleIdx = (seed + buildingIndex) % zone.styles.length;
        const style = zone.styles[styleIdx];

        const [minH, maxH] = zone.heightRange;
        const baseH = minH + seededRandom(seed + 3) * (maxH - minH);
        const scaleVar = 0.9 + seededRandom(seed + 4) * 0.3;
        const height = Math.round(baseH * scaleVar * 10) / 10;

        const primaryColor = palette.primary[seed % palette.primary.length];
        const secondaryColor = palette.secondary[seed % palette.secondary.length];

        const isAI = zone.type === "ai";
        const isCommercial = zone.type === "commercial";
        const customizations: BuildingCustomizations = {
          neonSign: (isCommercial && seededRandom(seed + 5) > 0.4) || (isAI && seededRandom(seed + 5) > 0.3),
          rooftop: seededRandom(seed + 6) > 0.7,
          garden: zone.type === "residential" && seededRandom(seed + 7) > 0.5,
          outdoor: isCommercial && seededRandom(seed + 8) > 0.7,
          sculptures: false,
          hologram: isAI && seededRandom(seed + 9) > 0.5,
        };

        const id = `npc-${zone.id}-${buildingIndex}`;
        npcBuildings.push({
          id,
          name: generateBuildingName(style, seed, isAI),
          ownerName: isAI ? generateAIOwnerName(seed) : generateOwnerName(seed),
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
          ownerId: isAI ? "ai-system" : "npc",
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

const AI_BUILDING_NAMES: Record<string, string[]> = {
  corporate: ["Cortex Prime", "Sentinel HQ", "Axis Node", "Omega Grid"],
  tech: ["DeepMind Hub", "Tensor Lab", "GPT Forge", "Vector Core", "Synth Tower"],
  futuristic: ["Quantum Nexus", "Photon Spire", "Neural Beacon", "Singularity"],
  industrial: ["Data Foundry", "Hash Refinery", "Compute Mill", "Token Forge"],
  minimal: ["Node Zero", "Pure Logic", "Clean State"],
  creative: ["Dream Engine", "Generative Lab", "Art Neural"],
  startup: ["AutoPilot", "Self-Scale", "Agent Launch"],
  agency: ["Protocol Agency", "AI Ops", "Auto Desk"],
};

function generateBuildingName(style: BuildingStyle, seed: number, isAI: boolean): string {
  const pool = isAI ? (AI_BUILDING_NAMES[style] || AI_BUILDING_NAMES.tech) : (BUILDING_NAMES[style] || BUILDING_NAMES.corporate);
  return pool[seed % pool.length];
}

const OWNER_NAMES = ["Alex K.", "Maria S.", "David R.", "Elena P.", "James M.", "Sofia L.", "Carlos T.", "Yuki N.", "Omar H.", "Ava C.", "Leo W.", "Nina B.", "Felix G.", "Maya D.", "Liam F."];
function generateOwnerName(seed: number): string {
  return OWNER_NAMES[seed % OWNER_NAMES.length];
}

const AI_OWNER_NAMES = ["Agent-Ω", "Unit-Σ", "Core-Δ", "Node-Λ", "Bot-Ψ", "AI-Φ", "Auto-Θ", "Sys-Π", "Net-Γ", "Logic-Ξ"];
function generateAIOwnerName(seed: number): string {
  return AI_OWNER_NAMES[seed % AI_OWNER_NAMES.length];
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

/**
 * Check if a position is in the AI district
 */
export function isInAIDistrict(x: number, z: number): boolean {
  for (const zone of CITY_ZONES) {
    if (zone.type !== "ai") continue;
    const dx = x - zone.center.x;
    const dz = z - zone.center.z;
    if (Math.sqrt(dx * dx + dz * dz) < zone.radius) return true;
  }
  return false;
}
