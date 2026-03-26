/**
 * cityDistricts — Shared district definitions used by both Canvas and Flyover modes.
 * Each district has a clear purpose, identity, and visual language.
 */

export interface CityDistrict {
  id: string;
  name: string;
  emoji: string;
  purpose: string;
  description: string;
  color: string;       // HSL accent
  bgGradient: string;  // CSS gradient for canvas cards
  x: number;
  z: number;
  radius: number;
  buildings: DistrictBuilding[];
}

export interface DistrictBuilding {
  id: string;
  name: string;
  emoji: string;
  type: "landmark" | "functional" | "social" | "creative";
  offsetX: number;
  offsetZ: number;
  height: number;
  width: number;
  depth: number;
  color: string;
}

export const CITY_DISTRICTS: CityDistrict[] = [
  {
    id: "central-plaza",
    name: "Central Plaza",
    emoji: "🏛️",
    purpose: "Hub & Orientation",
    description: "The heart of the city. Where all paths converge and announcements echo.",
    color: "hsl(160, 70%, 45%)",
    bgGradient: "linear-gradient(135deg, hsl(160 70% 20%), hsl(160 50% 12%))",
    x: 0, z: 0, radius: 12,
    buildings: [
      { id: "fountain", name: "City Fountain", emoji: "⛲", type: "landmark", offsetX: 0, offsetZ: 0, height: 3, width: 4, depth: 4, color: "hsl(200 30% 60%)" },
      { id: "info-tower", name: "Info Tower", emoji: "📡", type: "functional", offsetX: 6, offsetZ: -4, height: 8, width: 3, depth: 3, color: "hsl(200 50% 45%)" },
      { id: "welcome-center", name: "Welcome Center", emoji: "🏠", type: "social", offsetX: -6, offsetZ: 4, height: 4, width: 4, depth: 3, color: "hsl(45 60% 55%)" },
    ],
  },
  {
    id: "lounge",
    name: "Social Lounge",
    emoji: "☕",
    purpose: "Community & Networking",
    description: "Relax, chat, and connect with other residents and their agents.",
    color: "hsl(330, 65%, 55%)",
    bgGradient: "linear-gradient(135deg, hsl(330 50% 18%), hsl(350 40% 12%))",
    x: 20, z: 14, radius: 10,
    buildings: [
      { id: "cafe-central", name: "Café Central", emoji: "☕", type: "social", offsetX: 0, offsetZ: 0, height: 3, width: 4, depth: 3, color: "hsl(25 60% 50%)" },
      { id: "rooftop-bar", name: "Rooftop Bar", emoji: "🍷", type: "social", offsetX: 5, offsetZ: -3, height: 5, width: 3, depth: 3, color: "hsl(0 50% 40%)" },
      { id: "park-bench", name: "City Park", emoji: "🌳", type: "landmark", offsetX: -4, offsetZ: 4, height: 1, width: 6, depth: 5, color: "hsl(120 40% 35%)" },
    ],
  },
  {
    id: "library",
    name: "Knowledge Library",
    emoji: "📚",
    purpose: "Learning & Memory",
    description: "Where agents store knowledge, share insights, and build collective memory.",
    color: "hsl(220, 60%, 50%)",
    bgGradient: "linear-gradient(135deg, hsl(220 50% 18%), hsl(240 40% 12%))",
    x: -20, z: -14, radius: 10,
    buildings: [
      { id: "grand-library", name: "Grand Library", emoji: "📚", type: "functional", offsetX: 0, offsetZ: 0, height: 7, width: 5, depth: 4, color: "hsl(220 40% 35%)" },
      { id: "archive", name: "Memory Archive", emoji: "🧠", type: "functional", offsetX: 5, offsetZ: 3, height: 4, width: 3, depth: 3, color: "hsl(260 40% 40%)" },
      { id: "study-room", name: "Study Rooms", emoji: "📖", type: "social", offsetX: -4, offsetZ: -3, height: 3, width: 3, depth: 3, color: "hsl(200 30% 50%)" },
    ],
  },
  {
    id: "workshop",
    name: "Workshop District",
    emoji: "🔧",
    purpose: "Building & Automation",
    description: "Build workflows, train agents, and automate tasks in collaborative workspaces.",
    color: "hsl(35, 80%, 50%)",
    bgGradient: "linear-gradient(135deg, hsl(35 60% 18%), hsl(25 50% 12%))",
    x: 20, z: -14, radius: 10,
    buildings: [
      { id: "main-workshop", name: "Main Workshop", emoji: "🔧", type: "functional", offsetX: 0, offsetZ: 0, height: 5, width: 5, depth: 4, color: "hsl(35 50% 45%)" },
      { id: "automation-lab", name: "Automation Lab", emoji: "⚙️", type: "functional", offsetX: -5, offsetZ: 3, height: 4, width: 3, depth: 3, color: "hsl(210 40% 40%)" },
      { id: "testing-ground", name: "Testing Ground", emoji: "🧪", type: "creative", offsetX: 5, offsetZ: -3, height: 3, width: 4, depth: 3, color: "hsl(50 50% 50%)" },
    ],
  },
  {
    id: "creative",
    name: "Creative Studios",
    emoji: "🎨",
    purpose: "Art & Expression",
    description: "Where agents create art, music, stories, and other cultural artifacts.",
    color: "hsl(280, 60%, 55%)",
    bgGradient: "linear-gradient(135deg, hsl(280 50% 18%), hsl(300 40% 12%))",
    x: -20, z: 14, radius: 10,
    buildings: [
      { id: "art-studio", name: "Art Studio", emoji: "🎨", type: "creative", offsetX: 0, offsetZ: 0, height: 4, width: 4, depth: 4, color: "hsl(280 45% 45%)" },
      { id: "gallery", name: "City Gallery", emoji: "🖼️", type: "creative", offsetX: 5, offsetZ: -2, height: 5, width: 4, depth: 3, color: "hsl(320 40% 40%)" },
      { id: "stage", name: "Open Stage", emoji: "🎭", type: "social", offsetX: -4, offsetZ: 4, height: 2, width: 5, depth: 4, color: "hsl(350 50% 50%)" },
    ],
  },
  {
    id: "marketplace",
    name: "Marketplace",
    emoji: "🏪",
    purpose: "Economy & Trading",
    description: "Trade skills, hire agents, buy and sell digital assets.",
    color: "hsl(145, 65%, 42%)",
    bgGradient: "linear-gradient(135deg, hsl(145 50% 16%), hsl(160 40% 10%))",
    x: -28, z: 0, radius: 8,
    buildings: [
      { id: "trading-hall", name: "Trading Hall", emoji: "💰", type: "functional", offsetX: 0, offsetZ: 0, height: 6, width: 5, depth: 4, color: "hsl(145 40% 35%)" },
      { id: "skill-shop", name: "Skill Shop", emoji: "🎯", type: "functional", offsetX: -4, offsetZ: 3, height: 3, width: 3, depth: 3, color: "hsl(160 50% 40%)" },
    ],
  },
  {
    id: "observatory",
    name: "Observatory",
    emoji: "🔭",
    purpose: "Quests & Discovery",
    description: "Track missions, discover opportunities, and observe the city from above.",
    color: "hsl(200, 70%, 50%)",
    bgGradient: "linear-gradient(135deg, hsl(200 50% 18%), hsl(220 40% 12%))",
    x: 28, z: 0, radius: 8,
    buildings: [
      { id: "lookout-tower", name: "Lookout Tower", emoji: "🔭", type: "landmark", offsetX: 0, offsetZ: 0, height: 10, width: 3, depth: 3, color: "hsl(200 40% 40%)" },
      { id: "quest-board", name: "Quest Board", emoji: "📋", type: "functional", offsetX: 4, offsetZ: -2, height: 3, width: 3, depth: 2, color: "hsl(180 40% 45%)" },
    ],
  },
];

export function getDistrictAt(x: number, z: number): CityDistrict | null {
  for (const d of CITY_DISTRICTS) {
    const dist = Math.hypot(x - d.x, z - d.z);
    if (dist <= d.radius) return d;
  }
  return null;
}

export function getDistrictById(id: string): CityDistrict | undefined {
  return CITY_DISTRICTS.find(d => d.id === id);
}
