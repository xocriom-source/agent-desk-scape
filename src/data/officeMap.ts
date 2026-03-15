import type { TileType } from "@/types/agent";

export const TILE_SIZE = 32;
export const MAP_COLS = 48;
export const MAP_ROWS = 36;

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
  // Top-left: Main work area (large) - dark wood floor, warm glow
  { id: "work1", name: "Product Team", x: 1, y: 1, w: 14, h: 10, floorColor: "#5C4A3A", wallColor: "#3D2E22", carpetColor: "#4A3828" },
  // Top-center: Meeting rooms - moody purple/neon
  { id: "meeting1", name: "Meeting Room A", x: 18, y: 1, w: 8, h: 5, floorColor: "#4A3D50", wallColor: "#2E2235", carpetColor: "#3D2E45" },
  { id: "meeting2", name: "Meeting Room B", x: 18, y: 8, w: 8, h: 5, floorColor: "#4D3A4A", wallColor: "#352230", carpetColor: "#402E40" },
  // Top-right: Library / Quiet zone - warm wood
  { id: "library", name: "Library", x: 29, y: 1, w: 10, h: 7, floorColor: "#6B5840", wallColor: "#3D3028", carpetColor: "#5A4830" },
  // Mid-left: Design / Creative area - teal accent
  { id: "design", name: "Design Lab", x: 1, y: 14, w: 10, h: 8, floorColor: "#3A4A48", wallColor: "#223530", carpetColor: "#2E3D38" },
  // Mid-center: Lounge / Kitchen - warm planks
  { id: "lounge", name: "Lounge", x: 14, y: 16, w: 10, h: 8, floorColor: "#6B5540", wallColor: "#4A3828", carpetColor: "#5A4530" },
  // Mid-right: Server / Infra - dark tech
  { id: "server", name: "Server Room", x: 29, y: 11, w: 10, h: 7, floorColor: "#2E3038", wallColor: "#1A1E28", carpetColor: "#252830" },
  // Bottom: Reception / Entrance - boardwalk
  { id: "reception", name: "Reception", x: 14, y: 27, w: 12, h: 7, floorColor: "#7A6548", wallColor: "#4A3828", carpetColor: "#685538" },
  // Bottom-left: Game room - neon/fun
  { id: "game", name: "Game Room", x: 1, y: 25, w: 10, h: 8, floorColor: "#3A3050", wallColor: "#252040", carpetColor: "#302845" },
  // Bottom-right: Zen room - swamp green
  { id: "zen", name: "Zen Garden", x: 29, y: 21, w: 10, h: 8, floorColor: "#3A4A30", wallColor: "#223020", carpetColor: "#2E3D25" },
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
  // Product Team - desks in pairs with chairs
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
  { id: "f19", type: "chair", x: 5, y: 6, emoji: "🪑", roomId: "work1" },
  { id: "f20", type: "chair", x: 6, y: 6, emoji: "🪑", roomId: "work1" },
  { id: "f21", type: "desk", x: 2, y: 8, emoji: "🖥️", roomId: "work1" },
  { id: "f22", type: "desk", x: 3, y: 8, emoji: "🖥️", roomId: "work1" },
  { id: "f23", type: "desk", x: 5, y: 8, emoji: "🖥️", roomId: "work1" },
  { id: "f24", type: "desk", x: 6, y: 8, emoji: "🖥️", roomId: "work1" },
  { id: "f25", type: "chair", x: 2, y: 9, emoji: "🪑", roomId: "work1" },
  { id: "f26", type: "chair", x: 3, y: 9, emoji: "🪑", roomId: "work1" },
  { id: "f27", type: "plant", x: 1, y: 1, emoji: "🌿", roomId: "work1" },
  { id: "f28", type: "plant", x: 14, y: 1, emoji: "🪴", roomId: "work1" },
  { id: "f29", type: "plant", x: 1, y: 10, emoji: "🌱", roomId: "work1" },
  { id: "f30", type: "whiteboard", x: 11, y: 2, emoji: "📋", roomId: "work1" },
  { id: "f31", type: "whiteboard", x: 12, y: 2, emoji: "📊", roomId: "work1" },
  { id: "f32", type: "printer", x: 13, y: 5, emoji: "🖨️", roomId: "work1" },
  { id: "f33", type: "water", x: 13, y: 8, emoji: "🚰", roomId: "work1" },
  { id: "f34", type: "trash", x: 10, y: 9, emoji: "🗑️", roomId: "work1" },

  // Meeting Room A
  { id: "f40", type: "table", x: 20, y: 2, emoji: "📋", roomId: "meeting1" },
  { id: "f41", type: "table", x: 21, y: 2, emoji: "📋", roomId: "meeting1" },
  { id: "f42", type: "table", x: 22, y: 2, emoji: "📋", roomId: "meeting1" },
  { id: "f43", type: "chair", x: 19, y: 3, emoji: "🪑", roomId: "meeting1" },
  { id: "f44", type: "chair", x: 20, y: 3, emoji: "🪑", roomId: "meeting1" },
  { id: "f45", type: "chair", x: 21, y: 3, emoji: "🪑", roomId: "meeting1" },
  { id: "f46", type: "chair", x: 22, y: 3, emoji: "🪑", roomId: "meeting1" },
  { id: "f47", type: "chair", x: 23, y: 3, emoji: "🪑", roomId: "meeting1" },
  { id: "f48", type: "screen", x: 24, y: 1, emoji: "📺", roomId: "meeting1" },
  { id: "f49", type: "plant", x: 18, y: 1, emoji: "🌿", roomId: "meeting1" },

  // Meeting Room B
  { id: "f50", type: "table", x: 20, y: 9, emoji: "📋", roomId: "meeting2" },
  { id: "f51", type: "table", x: 21, y: 9, emoji: "📋", roomId: "meeting2" },
  { id: "f52", type: "chair", x: 19, y: 10, emoji: "🪑", roomId: "meeting2" },
  { id: "f53", type: "chair", x: 20, y: 10, emoji: "🪑", roomId: "meeting2" },
  { id: "f54", type: "chair", x: 21, y: 10, emoji: "🪑", roomId: "meeting2" },
  { id: "f55", type: "chair", x: 22, y: 10, emoji: "🪑", roomId: "meeting2" },
  { id: "f56", type: "screen", x: 24, y: 8, emoji: "📺", roomId: "meeting2" },

  // Library
  { id: "f60", type: "bookshelf", x: 30, y: 1, emoji: "📚", roomId: "library" },
  { id: "f61", type: "bookshelf", x: 31, y: 1, emoji: "📚", roomId: "library" },
  { id: "f62", type: "bookshelf", x: 32, y: 1, emoji: "📚", roomId: "library" },
  { id: "f63", type: "bookshelf", x: 33, y: 1, emoji: "📚", roomId: "library" },
  { id: "f64", type: "bookshelf", x: 34, y: 1, emoji: "📚", roomId: "library" },
  { id: "f65", type: "bookshelf", x: 35, y: 1, emoji: "📚", roomId: "library" },
  { id: "f66", type: "bookshelf", x: 36, y: 1, emoji: "📚", roomId: "library" },
  { id: "f67", type: "desk", x: 31, y: 4, emoji: "📖", roomId: "library" },
  { id: "f68", type: "desk", x: 33, y: 4, emoji: "📖", roomId: "library" },
  { id: "f69", type: "desk", x: 35, y: 4, emoji: "📖", roomId: "library" },
  { id: "f70", type: "chair", x: 31, y: 5, emoji: "🪑", roomId: "library" },
  { id: "f71", type: "chair", x: 33, y: 5, emoji: "🪑", roomId: "library" },
  { id: "f72", type: "chair", x: 35, y: 5, emoji: "🪑", roomId: "library" },
  { id: "f73", type: "plant", x: 29, y: 1, emoji: "🌿", roomId: "library" },
  { id: "f74", type: "plant", x: 38, y: 1, emoji: "🪴", roomId: "library" },

  // Design Lab
  { id: "f80", type: "desk", x: 2, y: 15, emoji: "🖥️", roomId: "design" },
  { id: "f81", type: "desk", x: 3, y: 15, emoji: "🖥️", roomId: "design" },
  { id: "f82", type: "desk", x: 5, y: 15, emoji: "🎨", roomId: "design" },
  { id: "f83", type: "desk", x: 6, y: 15, emoji: "🎨", roomId: "design" },
  { id: "f84", type: "chair", x: 2, y: 16, emoji: "🪑", roomId: "design" },
  { id: "f85", type: "chair", x: 3, y: 16, emoji: "🪑", roomId: "design" },
  { id: "f86", type: "chair", x: 5, y: 16, emoji: "🪑", roomId: "design" },
  { id: "f87", type: "chair", x: 6, y: 16, emoji: "🪑", roomId: "design" },
  { id: "f88", type: "whiteboard", x: 8, y: 14, emoji: "📋", roomId: "design" },
  { id: "f89", type: "whiteboard", x: 9, y: 14, emoji: "🎨", roomId: "design" },
  { id: "f90", type: "desk", x: 2, y: 19, emoji: "🖥️", roomId: "design" },
  { id: "f91", type: "desk", x: 3, y: 19, emoji: "🖥️", roomId: "design" },
  { id: "f92", type: "chair", x: 2, y: 20, emoji: "🪑", roomId: "design" },
  { id: "f93", type: "chair", x: 3, y: 20, emoji: "🪑", roomId: "design" },
  { id: "f94", type: "plant", x: 1, y: 14, emoji: "🌿", roomId: "design" },
  { id: "f95", type: "plant", x: 10, y: 14, emoji: "🪴", roomId: "design" },

  // Lounge
  { id: "f100", type: "sofa", x: 15, y: 17, emoji: "🛋️", roomId: "lounge" },
  { id: "f101", type: "sofa", x: 16, y: 17, emoji: "🛋️", roomId: "lounge" },
  { id: "f102", type: "sofa", x: 15, y: 19, emoji: "🛋️", roomId: "lounge" },
  { id: "f103", type: "sofa", x: 16, y: 19, emoji: "🛋️", roomId: "lounge" },
  { id: "f104", type: "table", x: 15, y: 18, emoji: "☕", roomId: "lounge" },
  { id: "f105", type: "table", x: 16, y: 18, emoji: "🍩", roomId: "lounge" },
  { id: "f106", type: "coffee", x: 20, y: 16, emoji: "☕", roomId: "lounge" },
  { id: "f107", type: "vending", x: 21, y: 16, emoji: "🥤", roomId: "lounge" },
  { id: "f108", type: "vending", x: 22, y: 16, emoji: "🍫", roomId: "lounge" },
  { id: "f109", type: "tv", x: 19, y: 21, emoji: "📺", roomId: "lounge" },
  { id: "f110", type: "sofa", x: 18, y: 21, emoji: "🛋️", roomId: "lounge" },
  { id: "f111", type: "plant", x: 14, y: 16, emoji: "🌿", roomId: "lounge" },
  { id: "f112", type: "plant", x: 23, y: 16, emoji: "🪴", roomId: "lounge" },

  // Server Room
  { id: "f120", type: "server", x: 30, y: 12, emoji: "🖧", roomId: "server" },
  { id: "f121", type: "server", x: 31, y: 12, emoji: "🖧", roomId: "server" },
  { id: "f122", type: "server", x: 32, y: 12, emoji: "🖧", roomId: "server" },
  { id: "f123", type: "server", x: 33, y: 12, emoji: "🖧", roomId: "server" },
  { id: "f124", type: "server", x: 34, y: 12, emoji: "🖧", roomId: "server" },
  { id: "f125", type: "server", x: 30, y: 14, emoji: "🖧", roomId: "server" },
  { id: "f126", type: "server", x: 31, y: 14, emoji: "🖧", roomId: "server" },
  { id: "f127", type: "server", x: 32, y: 14, emoji: "🖧", roomId: "server" },
  { id: "f128", type: "server", x: 33, y: 14, emoji: "🖧", roomId: "server" },
  { id: "f129", type: "server", x: 34, y: 14, emoji: "🖧", roomId: "server" },
  { id: "f130", type: "monitor", x: 36, y: 12, emoji: "📡", roomId: "server" },
  { id: "f131", type: "monitor", x: 37, y: 12, emoji: "🖥️", roomId: "server" },
  { id: "f132", type: "desk", x: 36, y: 15, emoji: "💻", roomId: "server" },
  { id: "f133", type: "chair", x: 37, y: 15, emoji: "🪑", roomId: "server" },

  // Reception
  { id: "f140", type: "desk", x: 18, y: 28, emoji: "💻", roomId: "reception" },
  { id: "f141", type: "desk", x: 19, y: 28, emoji: "💻", roomId: "reception" },
  { id: "f142", type: "sofa", x: 15, y: 30, emoji: "🛋️", roomId: "reception" },
  { id: "f143", type: "sofa", x: 16, y: 30, emoji: "🛋️", roomId: "reception" },
  { id: "f144", type: "sofa", x: 22, y: 30, emoji: "🛋️", roomId: "reception" },
  { id: "f145", type: "sofa", x: 23, y: 30, emoji: "🛋️", roomId: "reception" },
  { id: "f146", type: "table", x: 17, y: 30, emoji: "📰", roomId: "reception" },
  { id: "f147", type: "table", x: 21, y: 30, emoji: "📰", roomId: "reception" },
  { id: "f148", type: "plant", x: 14, y: 27, emoji: "🌿", roomId: "reception" },
  { id: "f149", type: "plant", x: 25, y: 27, emoji: "🌿", roomId: "reception" },
  { id: "f150", type: "plant", x: 14, y: 33, emoji: "🪴", roomId: "reception" },
  { id: "f151", type: "plant", x: 25, y: 33, emoji: "🪴", roomId: "reception" },

  // Game Room
  { id: "f160", type: "table", x: 2, y: 26, emoji: "🎮", roomId: "game" },
  { id: "f161", type: "table", x: 4, y: 26, emoji: "🕹️", roomId: "game" },
  { id: "f162", type: "sofa", x: 6, y: 26, emoji: "🛋️", roomId: "game" },
  { id: "f163", type: "sofa", x: 7, y: 26, emoji: "🛋️", roomId: "game" },
  { id: "f164", type: "tv", x: 9, y: 25, emoji: "📺", roomId: "game" },
  { id: "f165", type: "table", x: 2, y: 29, emoji: "🎯", roomId: "game" },
  { id: "f166", type: "table", x: 4, y: 29, emoji: "🎱", roomId: "game" },
  { id: "f167", type: "vending", x: 9, y: 30, emoji: "🥤", roomId: "game" },
  { id: "f168", type: "plant", x: 1, y: 25, emoji: "🌿", roomId: "game" },

  // Zen Garden
  { id: "f170", type: "plant", x: 30, y: 22, emoji: "🌿", roomId: "zen" },
  { id: "f171", type: "plant", x: 32, y: 22, emoji: "🌿", roomId: "zen" },
  { id: "f172", type: "plant", x: 34, y: 22, emoji: "🌿", roomId: "zen" },
  { id: "f173", type: "plant", x: 36, y: 22, emoji: "🌿", roomId: "zen" },
  { id: "f174", type: "plant", x: 30, y: 26, emoji: "🪴", roomId: "zen" },
  { id: "f175", type: "plant", x: 38, y: 26, emoji: "🪴", roomId: "zen" },
  { id: "f176", type: "sofa", x: 32, y: 25, emoji: "🧘", roomId: "zen" },
  { id: "f177", type: "sofa", x: 34, y: 25, emoji: "🧘", roomId: "zen" },
  { id: "f178", type: "sofa", x: 36, y: 25, emoji: "🧘", roomId: "zen" },
  { id: "f179", type: "water", x: 34, y: 23, emoji: "⛲", roomId: "zen" },
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
