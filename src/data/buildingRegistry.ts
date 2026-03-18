import type { CityBuilding, BuildingStyle, District } from "@/types/building";
import { STYLE_TRANSPORT_MAP } from "@/types/building";

const STORAGE_KEY = "agentoffice_buildings";

// Deterministic hash from string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const STYLE_POOL: BuildingStyle[] = ["corporate", "creative", "startup", "tech", "agency", "minimal", "futuristic", "industrial"];
const COLOR_POOL = [
  "hsl(220 70% 50%)", "hsl(142 70% 45%)", "hsl(330 70% 55%)", "hsl(45 80% 50%)",
  "hsl(270 70% 55%)", "hsl(200 70% 50%)", "hsl(350 70% 50%)", "hsl(15 80% 50%)",
  "hsl(180 60% 45%)", "hsl(280 60% 55%)",
];
const SECONDARY_POOL = [
  "hsl(220 40% 70%)", "hsl(142 40% 65%)", "hsl(330 40% 75%)", "hsl(45 50% 70%)",
  "hsl(270 40% 75%)", "hsl(200 40% 70%)", "hsl(0 0% 60%)", "hsl(30 30% 65%)",
];
const SUFFIX_POOL = ["HQ", "Office", "Tower", "Lab", "Studio", "Hub", "Base", "Works"];

export function generateBuilding(ownerName: string, accountType?: string): CityBuilding {
  const hash = hashString(ownerName.toLowerCase());
  const existingBuildings = getAllBuildings();
  
  // Determine district based on account type or hash
  let district: District = "central";
  if (accountType === "dev" || accountType === "tech") district = "tech";
  else if (accountType === "creator" || accountType === "artist") district = "creator";
  else if (accountType === "startup") district = "startup";
  else if (accountType === "agency") district = "agency";
  else district = (["tech", "creator", "startup", "agency", "central"] as District[])[hash % 5];

  // Generate unique coordinates avoiding overlap
  let x = ((hash % 20) - 10) * 3;
  let z = ((hash % 17) - 8) * 3;
  // Offset by district
  const districtOffsets: Record<District, { x: number; z: number }> = {
    tech: { x: -30, z: -20 },
    creator: { x: 30, z: -20 },
    startup: { x: -30, z: 20 },
    agency: { x: 30, z: 20 },
    central: { x: 0, z: 0 },
    ai: { x: 0, z: -40 },
  };
  x += districtOffsets[district].x;
  z += districtOffsets[district].z;
  
  // Avoid overlap
  for (const b of existingBuildings) {
    if (Math.abs(b.coordinates.x - x) < 4 && Math.abs(b.coordinates.z - z) < 4) {
      x += 5;
      z += 3;
    }
  }

  const style = STYLE_POOL[hash % STYLE_POOL.length];
  const height = 3 + (hash % 8);
  const floors = Math.max(2, Math.floor(height / 1.2));
  const suffix = SUFFIX_POOL[hash % SUFFIX_POOL.length];
  const displayName = `${ownerName.toUpperCase()} ${suffix}`;

  return {
    id: `bld_${hash}_${Date.now()}`,
    ownerId: "",
    ownerName,
    name: displayName,
    district,
    coordinates: { x, z },
    style,
    height,
    floors,
    primaryColor: COLOR_POOL[hash % COLOR_POOL.length],
    secondaryColor: SECONDARY_POOL[hash % SECONDARY_POOL.length],
    customizations: {
      neonSign: true,
      rooftop: hash % 3 === 0,
      garden: hash % 5 === 0,
      outdoor: hash % 4 === 0,
      sculptures: false,
      hologram: hash % 7 === 0,
    },
    bio: "",
    links: [],
    createdAt: new Date().toISOString(),
    claimed: false,
    transportType: STYLE_TRANSPORT_MAP[style] || "car",
  };
}

export function getAllBuildings(): CityBuilding[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export function saveBuilding(building: CityBuilding): void {
  const buildings = getAllBuildings();
  const idx = buildings.findIndex(b => b.id === building.id);
  if (idx >= 0) buildings[idx] = building;
  else buildings.push(building);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buildings));
}

export function claimBuilding(buildingId: string, userId: string): CityBuilding | null {
  const buildings = getAllBuildings();
  const building = buildings.find(b => b.id === buildingId);
  if (!building) return null;
  building.claimed = true;
  building.ownerId = userId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buildings));
  return building;
}

export function getUserBuildings(userId: string): CityBuilding[] {
  return getAllBuildings().filter(b => b.ownerId === userId);
}

export function getBuildingById(id: string): CityBuilding | null {
  return getAllBuildings().find(b => b.id === id) || null;
}

export function updateBuilding(id: string, updates: Partial<CityBuilding>): CityBuilding | null {
  const buildings = getAllBuildings();
  const idx = buildings.findIndex(b => b.id === id);
  if (idx < 0) return null;
  buildings[idx] = { ...buildings[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buildings));
  return buildings[idx];
}

// Seed some example buildings
export function seedDemoBuildings(): void {
  const existing = getAllBuildings();
  if (existing.length > 0) return;
  const demos = [
    { name: "TechFlow", type: "tech" },
    { name: "CreativeLabs", type: "creator" },
    { name: "RocketStart", type: "startup" },
    { name: "DesignAgency", type: "agency" },
    { name: "NeonStudio", type: "creator" },
    { name: "CodeForge", type: "dev" },
    { name: "PixelWorks", type: "creator" },
    { name: "DataVault", type: "tech" },
  ];
  demos.forEach(d => {
    const b = generateBuilding(d.name, d.type);
    b.claimed = true;
    b.ownerId = `demo_${d.name.toLowerCase()}`;
    saveBuilding(b);
  });
}
