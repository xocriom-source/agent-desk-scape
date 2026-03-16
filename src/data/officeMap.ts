import type { TileType } from "@/types/agent";

export const TILE_SIZE = 32;
export const MAP_COLS = 64;
export const MAP_ROWS = 52;

export interface RoomDef {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  floorColor: string;
  wallColor: string;
  carpetColor?: string;
}

export const DEFAULT_ROOMS: RoomDef[] = [
  // ── CENTRAL PLAZA (open spawn area with fountain) ──
  { id: "plaza", name: "🏛️ Central Plaza", x: 20, y: 18, w: 14, h: 12, floorColor: "#A09880", wallColor: "#6B6050", carpetColor: "#908868" },
  
  // ── WORK DISTRICT ──
  { id: "work1", name: "Product Team", x: 1, y: 1, w: 14, h: 10, floorColor: "#9B7B55", wallColor: "#5C3A22", carpetColor: "#7A6040" },
  { id: "meeting1", name: "Meeting Room A", x: 18, y: 1, w: 8, h: 5, floorColor: "#8B6B48", wallColor: "#4A2E1A", carpetColor: "#6B5035" },
  { id: "meeting2", name: "Meeting Room B", x: 18, y: 8, w: 8, h: 5, floorColor: "#8E6E4A", wallColor: "#4D3020", carpetColor: "#6E5238" },
  { id: "library", name: "📚 Library", x: 29, y: 1, w: 10, h: 7, floorColor: "#A08058", wallColor: "#5A3820", carpetColor: "#806540" },
  
  // ── CREATIVE DISTRICT ──
  { id: "music_studio", name: "🎵 Music Studio", x: 1, y: 14, w: 8, h: 7, floorColor: "#6A5078", wallColor: "#3A2848", carpetColor: "#5A4068" },
  { id: "art_studio", name: "🎨 Pixel Art Studio", x: 1, y: 24, w: 8, h: 7, floorColor: "#78605A", wallColor: "#4A3830", carpetColor: "#685048" },
  { id: "writing_studio", name: "✍️ Writing Studio", x: 1, y: 34, w: 8, h: 7, floorColor: "#7A7058", wallColor: "#4A4030", carpetColor: "#6A6048" },
  
  // ── INNOVATION DISTRICT ──
  { id: "coding_lab", name: "💻 Coding Lab", x: 38, y: 1, w: 10, h: 8, floorColor: "#506068", wallColor: "#303840", carpetColor: "#405058" },
  { id: "ai_lab", name: "🧪 AI Experiment Lab", x: 38, y: 12, w: 10, h: 8, floorColor: "#485868", wallColor: "#283040", carpetColor: "#384858" },
  
  // ── COMMERCE DISTRICT ──
  { id: "marketplace", name: "🏪 Marketplace", x: 38, y: 24, w: 10, h: 8, floorColor: "#907050", wallColor: "#604028", carpetColor: "#806040" },
  { id: "hiring_board", name: "📋 Agent Hiring", x: 38, y: 35, w: 10, h: 7, floorColor: "#887858", wallColor: "#585038", carpetColor: "#786848" },
  
  // ── SOCIAL DISTRICT ──
  { id: "cafe", name: "☕ Café Filosófico", x: 12, y: 34, w: 8, h: 7, floorColor: "#A58860", wallColor: "#6B4528", carpetColor: "#856D48" },
  { id: "lounge", name: "🛋️ Lounge", x: 12, y: 14, w: 7, h: 7, floorColor: "#A58860", wallColor: "#6B4528", carpetColor: "#856D48" },
  
  // ── EXISTING (kept) ──
  { id: "design", name: "🎨 Design Lab", x: 22, y: 34, w: 10, h: 8, floorColor: "#8A7050", wallColor: "#4A3018", carpetColor: "#6A5538" },
  { id: "server", name: "🖥️ Server Room", x: 50, y: 1, w: 8, h: 7, floorColor: "#706058", wallColor: "#3A2E28", carpetColor: "#5A4E48" },
  { id: "game", name: "🎮 Game Room", x: 50, y: 12, w: 8, h: 7, floorColor: "#8A7050", wallColor: "#4A3520", carpetColor: "#705840" },
  { id: "zen", name: "🧘 Zen Garden", x: 50, y: 22, w: 8, h: 7, floorColor: "#7A7048", wallColor: "#3A3520", carpetColor: "#5A5530" },
  // ── NEW ROOMS ──
  { id: "gym", name: "🏋️ Gym", x: 50, y: 32, w: 8, h: 7, floorColor: "#3A3A3A", wallColor: "#2A2A2A", carpetColor: "#4A4A4A" },
  { id: "reception", name: "🏨 Recepção", x: 12, y: 24, w: 8, h: 6, floorColor: "#C8B898", wallColor: "#6B6050", carpetColor: "#B0A080" },
];

export let ROOMS = [...DEFAULT_ROOMS];

export function setRooms(rooms: RoomDef[]) {
  ROOMS = rooms;
  rebuildMap();
}

export interface FurnitureItem {
  id: string;
  type: string;
  x: number;
  y: number;
  emoji: string;
  roomId?: string;
}

export const DEFAULT_FURNITURE: FurnitureItem[] = [
  // ── CENTRAL PLAZA (fountain, benches, trees) ──
  { id: "plaza1", type: "plant_large", x: 24, y: 21, emoji: "🌳", roomId: "plaza" },
  { id: "plaza2", type: "plant_large", x: 30, y: 21, emoji: "🌳", roomId: "plaza" },
  { id: "plaza3", type: "plant_large", x: 24, y: 27, emoji: "🌳", roomId: "plaza" },
  { id: "plaza4", type: "plant_large", x: 30, y: 27, emoji: "🌳", roomId: "plaza" },
  { id: "plaza5", type: "water", x: 27, y: 24, emoji: "⛲", roomId: "plaza" },
  { id: "plaza6", type: "sofa", x: 22, y: 24, emoji: "🪑", roomId: "plaza" },
  { id: "plaza7", type: "sofa", x: 32, y: 24, emoji: "🪑", roomId: "plaza" },
  { id: "plaza8", type: "sofa", x: 27, y: 20, emoji: "🪑", roomId: "plaza" },
  { id: "plaza9", type: "sofa", x: 27, y: 28, emoji: "🪑", roomId: "plaza" },
  { id: "plaza10", type: "lamp", x: 21, y: 19, emoji: "💡", roomId: "plaza" },
  { id: "plaza11", type: "lamp", x: 33, y: 19, emoji: "💡", roomId: "plaza" },
  { id: "plaza12", type: "lamp", x: 21, y: 29, emoji: "💡", roomId: "plaza" },
  { id: "plaza13", type: "lamp", x: 33, y: 29, emoji: "💡", roomId: "plaza" },
  { id: "plaza14", type: "plant", x: 26, y: 22, emoji: "🌿", roomId: "plaza" },
  { id: "plaza15", type: "plant", x: 28, y: 26, emoji: "🌿", roomId: "plaza" },

  // ── Product Team ──
  { id: "f1", type: "desk", x: 2, y: 2, emoji: "🖥️", roomId: "work1" },
  { id: "f2", type: "desk", x: 3, y: 2, emoji: "🖥️", roomId: "work1" },
  { id: "f3", type: "desk", x: 5, y: 2, emoji: "🖥️", roomId: "work1" },
  { id: "f4", type: "desk", x: 6, y: 2, emoji: "🖥️", roomId: "work1" },
  { id: "f5", type: "desk", x: 8, y: 2, emoji: "🖥️", roomId: "work1" },
  { id: "f6", type: "desk", x: 9, y: 2, emoji: "🖥️", roomId: "work1" },
  { id: "f7", type: "chair", x: 2, y: 3, emoji: "🪑", roomId: "work1" },
  { id: "f8", type: "chair", x: 3, y: 3, emoji: "🪑", roomId: "work1" },
  { id: "f9", type: "chair", x: 5, y: 3, emoji: "🪑", roomId: "work1" },
  { id: "f10", type: "chair", x: 6, y: 3, emoji: "🪑", roomId: "work1" },
  { id: "f11", type: "chair", x: 8, y: 3, emoji: "🪑", roomId: "work1" },
  { id: "f12", type: "chair", x: 9, y: 3, emoji: "🪑", roomId: "work1" },
  { id: "f13", type: "desk", x: 2, y: 5, emoji: "🖥️", roomId: "work1" },
  { id: "f14", type: "desk", x: 3, y: 5, emoji: "🖥️", roomId: "work1" },
  { id: "f15", type: "desk", x: 5, y: 5, emoji: "🖥️", roomId: "work1" },
  { id: "f16", type: "desk", x: 6, y: 5, emoji: "🖥️", roomId: "work1" },
  { id: "f17", type: "chair", x: 2, y: 6, emoji: "🪑", roomId: "work1" },
  { id: "f18", type: "chair", x: 3, y: 6, emoji: "🪑", roomId: "work1" },
  { id: "f27", type: "plant", x: 1, y: 1, emoji: "🌿", roomId: "work1" },
  { id: "f28", type: "plant", x: 14, y: 1, emoji: "🪴", roomId: "work1" },
  { id: "f30", type: "whiteboard", x: 11, y: 2, emoji: "📋", roomId: "work1" },
  { id: "f32", type: "printer", x: 13, y: 5, emoji: "🖨️", roomId: "work1" },

  // ── Meeting Room A ──
  { id: "f40", type: "table", x: 20, y: 2, emoji: "📋", roomId: "meeting1" },
  { id: "f41", type: "table", x: 21, y: 2, emoji: "📋", roomId: "meeting1" },
  { id: "f42", type: "table", x: 22, y: 2, emoji: "📋", roomId: "meeting1" },
  { id: "f43", type: "chair", x: 19, y: 3, emoji: "🪑", roomId: "meeting1" },
  { id: "f44", type: "chair", x: 20, y: 3, emoji: "🪑", roomId: "meeting1" },
  { id: "f45", type: "chair", x: 21, y: 3, emoji: "🪑", roomId: "meeting1" },
  { id: "f48", type: "screen", x: 24, y: 1, emoji: "📺", roomId: "meeting1" },

  // ── Meeting Room B ──
  { id: "f50", type: "table", x: 20, y: 9, emoji: "📋", roomId: "meeting2" },
  { id: "f51", type: "table", x: 21, y: 9, emoji: "📋", roomId: "meeting2" },
  { id: "f52", type: "chair", x: 19, y: 10, emoji: "🪑", roomId: "meeting2" },
  { id: "f53", type: "chair", x: 20, y: 10, emoji: "🪑", roomId: "meeting2" },
  { id: "f56", type: "screen", x: 24, y: 8, emoji: "📺", roomId: "meeting2" },

  // ── Library ──
  { id: "f60", type: "bookshelf", x: 30, y: 1, emoji: "📚", roomId: "library" },
  { id: "f61", type: "bookshelf", x: 31, y: 1, emoji: "📚", roomId: "library" },
  { id: "f62", type: "bookshelf", x: 32, y: 1, emoji: "📚", roomId: "library" },
  { id: "f63", type: "bookshelf", x: 33, y: 1, emoji: "📚", roomId: "library" },
  { id: "f64", type: "bookshelf", x: 34, y: 1, emoji: "📚", roomId: "library" },
  { id: "f65", type: "bookshelf", x: 35, y: 1, emoji: "📚", roomId: "library" },
  { id: "f67", type: "desk", x: 31, y: 4, emoji: "📖", roomId: "library" },
  { id: "f68", type: "desk", x: 33, y: 4, emoji: "📖", roomId: "library" },
  { id: "f70", type: "chair", x: 31, y: 5, emoji: "🪑", roomId: "library" },
  { id: "f71", type: "chair", x: 33, y: 5, emoji: "🪑", roomId: "library" },

  // ── Music Studio ──
  { id: "ms1", type: "desk", x: 2, y: 15, emoji: "🎹", roomId: "music_studio" },
  { id: "ms2", type: "desk", x: 4, y: 15, emoji: "🎸", roomId: "music_studio" },
  { id: "ms3", type: "chair", x: 2, y: 16, emoji: "🪑", roomId: "music_studio" },
  { id: "ms4", type: "chair", x: 4, y: 16, emoji: "🪑", roomId: "music_studio" },
  { id: "ms5", type: "screen", x: 6, y: 14, emoji: "🎵", roomId: "music_studio" },
  { id: "ms6", type: "sofa", x: 3, y: 19, emoji: "🛋️", roomId: "music_studio" },
  { id: "ms7", type: "lamp", x: 1, y: 14, emoji: "💡", roomId: "music_studio" },

  // ── Pixel Art Studio ──
  { id: "as1", type: "desk", x: 2, y: 25, emoji: "🎨", roomId: "art_studio" },
  { id: "as2", type: "desk", x: 4, y: 25, emoji: "🖌️", roomId: "art_studio" },
  { id: "as3", type: "chair", x: 2, y: 26, emoji: "🪑", roomId: "art_studio" },
  { id: "as4", type: "chair", x: 4, y: 26, emoji: "🪑", roomId: "art_studio" },
  { id: "as5", type: "whiteboard", x: 6, y: 24, emoji: "🎨", roomId: "art_studio" },
  { id: "as6", type: "painting", x: 7, y: 24, emoji: "🖼️", roomId: "art_studio" },

  // ── Writing Studio ──
  { id: "ws1", type: "desk", x: 2, y: 35, emoji: "📝", roomId: "writing_studio" },
  { id: "ws2", type: "desk", x: 4, y: 35, emoji: "✍️", roomId: "writing_studio" },
  { id: "ws3", type: "chair", x: 2, y: 36, emoji: "🪑", roomId: "writing_studio" },
  { id: "ws4", type: "chair", x: 4, y: 36, emoji: "🪑", roomId: "writing_studio" },
  { id: "ws5", type: "bookshelf", x: 7, y: 34, emoji: "📚", roomId: "writing_studio" },
  { id: "ws6", type: "coffee", x: 6, y: 39, emoji: "☕", roomId: "writing_studio" },

  // ── Coding Lab ──
  { id: "cl1", type: "desk", x: 39, y: 2, emoji: "💻", roomId: "coding_lab" },
  { id: "cl2", type: "desk", x: 41, y: 2, emoji: "💻", roomId: "coding_lab" },
  { id: "cl3", type: "desk", x: 43, y: 2, emoji: "💻", roomId: "coding_lab" },
  { id: "cl4", type: "chair", x: 39, y: 3, emoji: "🪑", roomId: "coding_lab" },
  { id: "cl5", type: "chair", x: 41, y: 3, emoji: "🪑", roomId: "coding_lab" },
  { id: "cl6", type: "chair", x: 43, y: 3, emoji: "🪑", roomId: "coding_lab" },
  { id: "cl7", type: "server", x: 46, y: 2, emoji: "🖧", roomId: "coding_lab" },
  { id: "cl8", type: "whiteboard", x: 45, y: 6, emoji: "📋", roomId: "coding_lab" },

  // ── AI Experiment Lab ──
  { id: "al1", type: "desk", x: 39, y: 13, emoji: "🧪", roomId: "ai_lab" },
  { id: "al2", type: "desk", x: 41, y: 13, emoji: "🔬", roomId: "ai_lab" },
  { id: "al3", type: "chair", x: 39, y: 14, emoji: "🪑", roomId: "ai_lab" },
  { id: "al4", type: "chair", x: 41, y: 14, emoji: "🪑", roomId: "ai_lab" },
  { id: "al5", type: "server", x: 45, y: 12, emoji: "🖧", roomId: "ai_lab" },
  { id: "al6", type: "server", x: 46, y: 12, emoji: "🖧", roomId: "ai_lab" },
  { id: "al7", type: "monitor", x: 44, y: 17, emoji: "📡", roomId: "ai_lab" },

  // ── Marketplace ──
  { id: "mk1", type: "table", x: 39, y: 25, emoji: "🏪", roomId: "marketplace" },
  { id: "mk2", type: "table", x: 41, y: 25, emoji: "💰", roomId: "marketplace" },
  { id: "mk3", type: "table", x: 43, y: 25, emoji: "📦", roomId: "marketplace" },
  { id: "mk4", type: "vending", x: 46, y: 24, emoji: "🥤", roomId: "marketplace" },
  { id: "mk5", type: "screen", x: 45, y: 29, emoji: "📊", roomId: "marketplace" },

  // ── Agent Hiring Board ──
  { id: "hb1", type: "whiteboard", x: 39, y: 35, emoji: "📋", roomId: "hiring_board" },
  { id: "hb2", type: "whiteboard", x: 40, y: 35, emoji: "📋", roomId: "hiring_board" },
  { id: "hb3", type: "desk", x: 42, y: 36, emoji: "💼", roomId: "hiring_board" },
  { id: "hb4", type: "chair", x: 42, y: 37, emoji: "🪑", roomId: "hiring_board" },
  { id: "hb5", type: "sofa", x: 45, y: 38, emoji: "🛋️", roomId: "hiring_board" },

  // ── Café Filosófico ──
  { id: "cf1", type: "table", x: 13, y: 35, emoji: "☕", roomId: "cafe" },
  { id: "cf2", type: "table", x: 15, y: 35, emoji: "☕", roomId: "cafe" },
  { id: "cf3", type: "chair", x: 13, y: 36, emoji: "🪑", roomId: "cafe" },
  { id: "cf4", type: "chair", x: 15, y: 36, emoji: "🪑", roomId: "cafe" },
  { id: "cf5", type: "coffee", x: 18, y: 34, emoji: "☕", roomId: "cafe" },
  { id: "cf6", type: "sofa", x: 14, y: 39, emoji: "🛋️", roomId: "cafe" },
  { id: "cf7", type: "plant", x: 12, y: 34, emoji: "🌿", roomId: "cafe" },

  // ── Lounge ──
  { id: "lg1", type: "sofa", x: 13, y: 15, emoji: "🛋️", roomId: "lounge" },
  { id: "lg2", type: "sofa", x: 14, y: 15, emoji: "🛋️", roomId: "lounge" },
  { id: "lg3", type: "table", x: 13, y: 17, emoji: "☕", roomId: "lounge" },
  { id: "lg4", type: "tv", x: 16, y: 14, emoji: "📺", roomId: "lounge" },
  { id: "lg5", type: "vending", x: 17, y: 18, emoji: "🥤", roomId: "lounge" },

  // ── Design Lab ──
  { id: "dl1", type: "desk", x: 23, y: 35, emoji: "🎨", roomId: "design" },
  { id: "dl2", type: "desk", x: 25, y: 35, emoji: "🎨", roomId: "design" },
  { id: "dl3", type: "chair", x: 23, y: 36, emoji: "🪑", roomId: "design" },
  { id: "dl4", type: "chair", x: 25, y: 36, emoji: "🪑", roomId: "design" },
  { id: "dl5", type: "whiteboard", x: 28, y: 34, emoji: "📋", roomId: "design" },
  { id: "dl6", type: "plant", x: 22, y: 34, emoji: "🌿", roomId: "design" },

  // ── Server Room ──
  { id: "sr1", type: "server", x: 51, y: 2, emoji: "🖧", roomId: "server" },
  { id: "sr2", type: "server", x: 52, y: 2, emoji: "🖧", roomId: "server" },
  { id: "sr3", type: "server", x: 53, y: 2, emoji: "🖧", roomId: "server" },
  { id: "sr4", type: "server", x: 54, y: 2, emoji: "🖧", roomId: "server" },
  { id: "sr5", type: "server", x: 51, y: 4, emoji: "🖧", roomId: "server" },
  { id: "sr6", type: "server", x: 52, y: 4, emoji: "🖧", roomId: "server" },
  { id: "sr7", type: "monitor", x: 55, y: 5, emoji: "🖥️", roomId: "server" },

  // ── Game Room ──
  { id: "gr1", type: "arcade", x: 51, y: 13, emoji: "🕹️", roomId: "game" },
  { id: "gr2", type: "foosball", x: 53, y: 13, emoji: "⚽", roomId: "game" },
  { id: "gr3", type: "pingpong", x: 55, y: 13, emoji: "🏓", roomId: "game" },
  { id: "gr4", type: "sofa", x: 52, y: 16, emoji: "🛋️", roomId: "game" },
  { id: "gr5", type: "tv", x: 56, y: 16, emoji: "📺", roomId: "game" },
  { id: "gr6", type: "vending", x: 56, y: 12, emoji: "🥤", roomId: "game" },

  // ── Zen Garden ──
  { id: "zn1", type: "plant_large", x: 51, y: 23, emoji: "🌳", roomId: "zen" },
  { id: "zn2", type: "plant_large", x: 55, y: 23, emoji: "🌳", roomId: "zen" },
  { id: "zn3", type: "plant", x: 53, y: 25, emoji: "🌿", roomId: "zen" },
  { id: "zn4", type: "water", x: 53, y: 23, emoji: "⛲", roomId: "zen" },
  { id: "zn5", type: "sofa", x: 51, y: 26, emoji: "🧘", roomId: "zen" },
  { id: "zn6", type: "sofa", x: 55, y: 26, emoji: "🧘", roomId: "zen" },
];

export let FURNITURE = [...DEFAULT_FURNITURE];

export function setFurniture(items: FurnitureItem[]) {
  FURNITURE = items;
  rebuildMap();
}

let TILE_MAP: TileType[][] = [];

function buildMap(): TileType[][] {
  const map: TileType[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(4 as TileType)
  );

  // Fill rooms
  for (const room of ROOMS) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        if (y >= 0 && y < MAP_ROWS && x >= 0 && x < MAP_COLS) {
          map[y][x] = 0;
        }
      }
    }
  }

  // Hallways connecting rooms
  // Main horizontal hallway (middle)
  for (let x = 1; x < 40; x++) {
    for (let y = 12; y <= 13; y++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }
  // Vertical hallway left
  for (let y = 1; y < 34; y++) {
    for (let x = 12; x <= 13; x++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }
  // Vertical hallway center
  for (let y = 1; y < 34; y++) {
    for (let x = 27; x <= 28; x++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }
  // Secondary horizontal (bottom area)
  for (let x = 1; x < 40; x++) {
    for (let y = 24; y <= 24; y++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }
  // Connect reception to hallways
  for (let y = 24; y <= 27; y++) {
    for (let x = 14; x <= 25; x++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }

  // Carpet inside rooms
  for (const room of ROOMS) {
    if (room.carpetColor) {
      for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
        for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
          if (map[y]?.[x] === 0) map[y][x] = 2;
        }
      }
    }
  }

  // Walls around rooms
  for (const room of ROOMS) {
    for (let x = room.x - 1; x <= room.x + room.w; x++) {
      if (x >= 0 && x < MAP_COLS) {
        if (room.y - 1 >= 0 && map[room.y - 1][x] === 4) map[room.y - 1][x] = 1;
        if (room.y + room.h < MAP_ROWS && map[room.y + room.h][x] === 4) map[room.y + room.h][x] = 1;
      }
    }
    for (let y = room.y - 1; y <= room.y + room.h; y++) {
      if (y >= 0 && y < MAP_ROWS) {
        if (room.x - 1 >= 0 && map[y][room.x - 1] === 4) map[y][room.x - 1] = 1;
        if (room.x + room.w < MAP_COLS && map[y][room.x + room.w] === 4) map[y][room.x + room.w] = 1;
      }
    }
  }

  // Building interior fill (corridors) so rooms connect (keeps room walls as blockers)
  const padding = 3;
  const minRoomX = Math.min(...ROOMS.map((r) => r.x));
  const minRoomY = Math.min(...ROOMS.map((r) => r.y));
  const maxRoomX = Math.max(...ROOMS.map((r) => r.x + r.w - 1));
  const maxRoomY = Math.max(...ROOMS.map((r) => r.y + r.h - 1));

  const bMinX = Math.max(0, Math.floor(minRoomX - padding));
  const bMinY = Math.max(0, Math.floor(minRoomY - padding));
  const bMaxX = Math.min(MAP_COLS - 1, Math.floor(maxRoomX + padding));
  const bMaxY = Math.min(MAP_ROWS - 1, Math.floor(maxRoomY + padding));

  for (let y = bMinY; y <= bMaxY; y++) {
    for (let x = bMinX; x <= bMaxX; x++) {
      if (map[y][x] === 4) map[y][x] = 0;
    }
  }

  // Exterior boundary walls (keeps player inside the building)
  for (let x = bMinX; x <= bMaxX; x++) {
    if (map[bMinY]?.[x] === 0) map[bMinY][x] = 1;
    if (map[bMaxY]?.[x] === 0) map[bMaxY][x] = 1;
  }
  for (let y = bMinY; y <= bMaxY; y++) {
    if (map[y]?.[bMinX] === 0) map[y][bMinX] = 1;
    if (map[y]?.[bMaxX] === 0) map[y][bMaxX] = 1;
  }

  // Door openings on room walls (so you don't get stuck inside rooms)
  const carveDoor = (x: number, y: number, ox: number, oy: number) => {
    if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return;
    const outX = x + ox;
    const outY = y + oy;
    if (outX < 0 || outX >= MAP_COLS || outY < 0 || outY >= MAP_ROWS) return;

    // Only carve if it leads to non-wall space
    if (map[outY][outX] === 1) return;

    if (map[y][x] === 1) map[y][x] = 0;
    if (map[outY][outX] === 4) map[outY][outX] = 0;
  };

  for (const room of ROOMS) {
    const cx = room.x + Math.floor(room.w / 2);
    const cy = room.y + Math.floor(room.h / 2);

    const candidates = [
      // prefer south then north, then sides
      { x: cx, y: room.y + room.h, ox: 0, oy: 1 },
      { x: cx, y: room.y - 1, ox: 0, oy: -1 },
      { x: room.x + room.w, y: cy, ox: 1, oy: 0 },
      { x: room.x - 1, y: cy, ox: -1, oy: 0 },
    ];

    for (const c of candidates) {
      const outX = c.x + c.ox;
      const outY = c.y + c.oy;
      if (outX < 0 || outX >= MAP_COLS || outY < 0 || outY >= MAP_ROWS) continue;
      if (map[outY][outX] === 1) continue;
      carveDoor(c.x, c.y, c.ox, c.oy);
      break;
    }
  }

  // Furniture blocking (only larger items; small props are walkable to reduce "stuck")
  const BLOCKING_TYPES = new Set([
    "desk",
    "table",
    "sofa",
    "bookshelf",
    "server",
    "vending",
    "tv",
    "printer",
    "screen",
  ]);

  for (const f of FURNITURE) {
    if (!BLOCKING_TYPES.has(f.type)) continue;
    if (f.y >= 0 && f.y < MAP_ROWS && f.x >= 0 && f.x < MAP_COLS) {
      if (map[f.y][f.x] === 0 || map[f.y][f.x] === 2) {
        map[f.y][f.x] = 3;
      }
    }
  }

  return map;
}

function rebuildMap() {
  TILE_MAP = buildMap();
}

TILE_MAP = buildMap();
export { TILE_MAP };

export function isWalkable(x: number, y: number): boolean {
  if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return false;
  const tile = TILE_MAP[y][x];
  return tile === 0 || tile === 2;
}

export function getRoomAt(x: number, y: number): RoomDef | undefined {
  return ROOMS.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}
