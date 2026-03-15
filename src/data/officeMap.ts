import type { TileType } from "@/types/agent";

export const TILE_W = 64; // isometric tile width
export const TILE_H = 32; // isometric tile height
export const TILE_SIZE = 64; // kept for compatibility
export const MAP_COLS = 36;
export const MAP_ROWS = 28;

export interface RoomDef {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  floorColor: string;
  carpetColor?: string;
}

// Room definitions
export const DEFAULT_ROOMS: RoomDef[] = [
  { id: "work", name: "Área de Trabalho", x: 1, y: 1, w: 12, h: 8, color: "#E8DCC8", floorColor: "#E2D6C0", carpetColor: "#C8BCA8" },
  { id: "meeting", name: "Sala de Reuniões", x: 16, y: 1, w: 8, h: 6, color: "#D4D8E8", floorColor: "#C8CCE0", carpetColor: "#B0B8D8" },
  { id: "lounge", name: "Lounge & Café", x: 1, y: 12, w: 9, h: 8, color: "#D8E4D0", floorColor: "#CEE0C4", carpetColor: "#B8D4AC" },
  { id: "server", name: "Servidor / Infra", x: 16, y: 10, w: 8, h: 6, color: "#E0D8D8", floorColor: "#D8D0D0", carpetColor: "#C0B8B8" },
  { id: "reception", name: "Recepção", x: 11, y: 12, w: 6, h: 8, color: "#E8E0D0", floorColor: "#E4DCC8", carpetColor: "#D0C8B4" },
  { id: "library", name: "Biblioteca", x: 26, y: 1, w: 8, h: 6, color: "#E4DCD0", floorColor: "#DCD4C8", carpetColor: "#C8C0B0" },
  { id: "zen", name: "Sala Zen", x: 26, y: 10, w: 8, h: 6, color: "#D0E0D8", floorColor: "#C4D8D0", carpetColor: "#A8C8BC" },
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
  // Work area
  { id: "f1", type: "desk", x: 2, y: 2, emoji: "🖥️", roomId: "work" },
  { id: "f2", type: "desk", x: 4, y: 2, emoji: "🖥️", roomId: "work" },
  { id: "f3", type: "desk", x: 6, y: 2, emoji: "🖥️", roomId: "work" },
  { id: "f4", type: "desk", x: 8, y: 2, emoji: "🖥️", roomId: "work" },
  { id: "f5", type: "desk", x: 2, y: 5, emoji: "🖥️", roomId: "work" },
  { id: "f6", type: "desk", x: 4, y: 5, emoji: "🖥️", roomId: "work" },
  { id: "f7", type: "desk", x: 6, y: 5, emoji: "🖥️", roomId: "work" },
  { id: "f8", type: "desk", x: 8, y: 5, emoji: "🖥️", roomId: "work" },
  { id: "f9", type: "chair", x: 3, y: 3, emoji: "🪑", roomId: "work" },
  { id: "f10", type: "chair", x: 5, y: 3, emoji: "🪑", roomId: "work" },
  { id: "f11", type: "chair", x: 7, y: 3, emoji: "🪑", roomId: "work" },
  { id: "f12", type: "chair", x: 9, y: 3, emoji: "🪑", roomId: "work" },
  { id: "f13", type: "chair", x: 3, y: 6, emoji: "🪑", roomId: "work" },
  { id: "f14", type: "chair", x: 5, y: 6, emoji: "🪑", roomId: "work" },
  { id: "f15", type: "plant", x: 1, y: 1, emoji: "🌿", roomId: "work" },
  { id: "f16", type: "plant", x: 12, y: 1, emoji: "🪴", roomId: "work" },
  { id: "f17", type: "whiteboard", x: 10, y: 2, emoji: "📋", roomId: "work" },
  { id: "f18", type: "printer", x: 11, y: 5, emoji: "🖨️", roomId: "work" },
  // Meeting room
  { id: "f20", type: "table", x: 18, y: 3, emoji: "🪑", roomId: "meeting" },
  { id: "f21", type: "table", x: 19, y: 3, emoji: "🪑", roomId: "meeting" },
  { id: "f22", type: "table", x: 20, y: 3, emoji: "🪑", roomId: "meeting" },
  { id: "f23", type: "table", x: 18, y: 5, emoji: "🪑", roomId: "meeting" },
  { id: "f24", type: "table", x: 19, y: 5, emoji: "🪑", roomId: "meeting" },
  { id: "f25", type: "screen", x: 22, y: 2, emoji: "📺", roomId: "meeting" },
  { id: "f26", type: "plant", x: 16, y: 1, emoji: "🌿", roomId: "meeting" },
  // Lounge
  { id: "f30", type: "sofa", x: 2, y: 13, emoji: "🛋️", roomId: "lounge" },
  { id: "f31", type: "sofa", x: 2, y: 15, emoji: "🛋️", roomId: "lounge" },
  { id: "f32", type: "coffee", x: 4, y: 14, emoji: "☕", roomId: "lounge" },
  { id: "f33", type: "vending", x: 7, y: 12, emoji: "🥤", roomId: "lounge" },
  { id: "f34", type: "bookshelf", x: 8, y: 12, emoji: "📚", roomId: "lounge" },
  { id: "f35", type: "tv", x: 5, y: 17, emoji: "📺", roomId: "lounge" },
  { id: "f36", type: "plant", x: 1, y: 12, emoji: "🪴", roomId: "lounge" },
  // Server room
  { id: "f40", type: "server", x: 17, y: 11, emoji: "🖧", roomId: "server" },
  { id: "f41", type: "server", x: 18, y: 11, emoji: "🖧", roomId: "server" },
  { id: "f42", type: "server", x: 19, y: 11, emoji: "🖧", roomId: "server" },
  { id: "f43", type: "server", x: 20, y: 11, emoji: "🖧", roomId: "server" },
  { id: "f44", type: "server", x: 17, y: 13, emoji: "🖧", roomId: "server" },
  { id: "f45", type: "server", x: 18, y: 13, emoji: "🖧", roomId: "server" },
  { id: "f46", type: "monitor", x: 22, y: 11, emoji: "📡", roomId: "server" },
  { id: "f47", type: "desk", x: 22, y: 14, emoji: "💻", roomId: "server" },
  // Reception
  { id: "f50", type: "desk", x: 13, y: 14, emoji: "💻", roomId: "reception" },
  { id: "f51", type: "plant", x: 11, y: 12, emoji: "🌿", roomId: "reception" },
  { id: "f52", type: "plant", x: 16, y: 12, emoji: "🌿", roomId: "reception" },
  { id: "f53", type: "sofa", x: 12, y: 17, emoji: "🛋️", roomId: "reception" },
  { id: "f54", type: "sofa", x: 13, y: 17, emoji: "🛋️", roomId: "reception" },
  // Library
  { id: "f60", type: "bookshelf", x: 27, y: 2, emoji: "📚", roomId: "library" },
  { id: "f61", type: "bookshelf", x: 28, y: 2, emoji: "📚", roomId: "library" },
  { id: "f62", type: "bookshelf", x: 29, y: 2, emoji: "📚", roomId: "library" },
  { id: "f63", type: "bookshelf", x: 30, y: 2, emoji: "📚", roomId: "library" },
  { id: "f64", type: "desk", x: 28, y: 5, emoji: "📖", roomId: "library" },
  { id: "f65", type: "desk", x: 30, y: 5, emoji: "📖", roomId: "library" },
  { id: "f66", type: "plant", x: 26, y: 1, emoji: "🌿", roomId: "library" },
  // Zen
  { id: "f70", type: "plant", x: 27, y: 11, emoji: "🌿", roomId: "zen" },
  { id: "f71", type: "plant", x: 29, y: 11, emoji: "🌿", roomId: "zen" },
  { id: "f72", type: "plant", x: 31, y: 11, emoji: "🌿", roomId: "zen" },
  { id: "f73", type: "sofa", x: 28, y: 13, emoji: "🧘", roomId: "zen" },
  { id: "f74", type: "sofa", x: 30, y: 13, emoji: "🧘", roomId: "zen" },
  { id: "f75", type: "water", x: 32, y: 14, emoji: "⛲", roomId: "zen" },
];

export let FURNITURE = [...DEFAULT_FURNITURE];

export function setFurniture(items: FurnitureItem[]) {
  FURNITURE = items;
  rebuildMap();
}

// Isometric conversion
export function toIso(x: number, y: number): { sx: number; sy: number } {
  return {
    sx: (x - y) * (TILE_W / 2),
    sy: (x + y) * (TILE_H / 2),
  };
}

export function fromIso(sx: number, sy: number): { x: number; y: number } {
  return {
    x: Math.floor((sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2),
    y: Math.floor((sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2),
  };
}

let TILE_MAP: TileType[][] = [];

function buildMap(): TileType[][] {
  const map: TileType[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(4 as TileType)
  );

  for (const room of ROOMS) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        if (y >= 0 && y < MAP_ROWS && x >= 0 && x < MAP_COLS) {
          map[y][x] = 0;
        }
      }
    }
  }

  // Hallways
  for (let x = 1; x < 34; x++) {
    for (let y = 9; y <= 10; y++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }
  for (let y = 1; y < 20; y++) {
    for (let x = 14; x <= 15; x++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }
  for (let y = 1; y < 16; y++) {
    for (let x = 24; x <= 25; x++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }

  // Carpet in certain rooms
  for (const room of ROOMS) {
    if (room.carpetColor) {
      for (let y = room.y + 1; y < room.y + room.h - 1; y++) {
        for (let x = room.x + 1; x < room.x + room.w - 1; x++) {
          if (map[y]?.[x] === 0) map[y][x] = 2;
        }
      }
    }
  }

  // Walls
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

  // Furniture blocking
  for (const f of FURNITURE) {
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
