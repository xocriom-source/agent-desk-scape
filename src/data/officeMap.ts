import type { TileType } from "@/types/agent";

export const TILE_SIZE = 48;
export const MAP_COLS = 30;
export const MAP_ROWS = 22;

// Room definitions for labels
export const ROOMS = [
  { name: "Área de Trabalho", x: 1, y: 1, w: 12, h: 9 },
  { name: "Sala de Reuniões", x: 15, y: 1, w: 8, h: 7 },
  { name: "Lounge", x: 1, y: 12, w: 8, h: 9 },
  { name: "Servidor / Infra", x: 15, y: 10, w: 8, h: 6 },
  { name: "Recepção", x: 11, y: 12, w: 6, h: 9 },
];

// Furniture positions for rendering decorations
export interface FurnitureItem {
  type: "desk" | "plant" | "bookshelf" | "sofa" | "whiteboard" | "server" | "coffee" | "table" | "monitor";
  x: number;
  y: number;
  emoji: string;
}

export const FURNITURE: FurnitureItem[] = [
  // Work area desks
  { type: "desk", x: 2, y: 2, emoji: "🖥️" },
  { type: "desk", x: 5, y: 2, emoji: "🖥️" },
  { type: "desk", x: 8, y: 2, emoji: "🖥️" },
  { type: "desk", x: 2, y: 5, emoji: "🖥️" },
  { type: "desk", x: 5, y: 5, emoji: "🖥️" },
  { type: "desk", x: 8, y: 5, emoji: "🖥️" },
  { type: "desk", x: 11, y: 2, emoji: "🖥️" },
  { type: "desk", x: 11, y: 5, emoji: "🖥️" },
  // Plants
  { type: "plant", x: 1, y: 1, emoji: "🌿" },
  { type: "plant", x: 12, y: 1, emoji: "🪴" },
  { type: "plant", x: 1, y: 8, emoji: "🌱" },
  { type: "plant", x: 9, y: 12, emoji: "🌿" },
  // Meeting room
  { type: "table", x: 17, y: 3, emoji: "🪑" },
  { type: "table", x: 18, y: 3, emoji: "🪑" },
  { type: "table", x: 19, y: 3, emoji: "🪑" },
  { type: "table", x: 17, y: 5, emoji: "🪑" },
  { type: "table", x: 18, y: 5, emoji: "🪑" },
  { type: "table", x: 19, y: 5, emoji: "🪑" },
  { type: "whiteboard", x: 22, y: 2, emoji: "📋" },
  { type: "whiteboard", x: 22, y: 4, emoji: "📊" },
  // Lounge
  { type: "sofa", x: 2, y: 13, emoji: "🛋️" },
  { type: "sofa", x: 2, y: 15, emoji: "🛋️" },
  { type: "coffee", x: 4, y: 14, emoji: "☕" },
  { type: "bookshelf", x: 7, y: 12, emoji: "📚" },
  { type: "bookshelf", x: 8, y: 12, emoji: "📚" },
  // Server room
  { type: "server", x: 16, y: 11, emoji: "🖧" },
  { type: "server", x: 18, y: 11, emoji: "🖧" },
  { type: "server", x: 20, y: 11, emoji: "🖧" },
  { type: "server", x: 16, y: 13, emoji: "🖧" },
  { type: "server", x: 18, y: 13, emoji: "🖧" },
  { type: "monitor", x: 22, y: 12, emoji: "📡" },
  // Reception
  { type: "desk", x: 13, y: 14, emoji: "💻" },
  { type: "plant", x: 15, y: 19, emoji: "🌿" },
  { type: "sofa", x: 12, y: 18, emoji: "🛋️" },
];

// Build tile map
function buildMap(): TileType[][] {
  const map: TileType[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(4 as TileType)
  );

  // Fill rooms with floors
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
  // Horizontal hallway
  for (let x = 1; x < 24; x++) {
    if (map[10]?.[x] === 4) map[10][x] = 0;
    if (map[11]?.[x] === 4) map[11][x] = 0;
  }
  // Vertical hallway
  for (let y = 1; y < 21; y++) {
    if (map[y]?.[13] === 4) map[y][13] = 0;
    if (map[y]?.[14] === 4) map[y][14] = 0;
  }

  // Carpets in meeting room and lounge
  for (let y = 2; y <= 6; y++) {
    for (let x = 16; x <= 21; x++) {
      if (map[y]?.[x] === 0) map[y][x] = 2;
    }
  }
  for (let y = 13; y <= 17; y++) {
    for (let x = 2; x <= 6; x++) {
      if (map[y]?.[x] === 0) map[y][x] = 2;
    }
  }

  // Place walls around rooms
  for (const room of ROOMS) {
    // Top and bottom walls
    for (let x = room.x - 1; x <= room.x + room.w; x++) {
      if (x >= 0 && x < MAP_COLS) {
        if (room.y - 1 >= 0 && map[room.y - 1][x] === 4) map[room.y - 1][x] = 1;
        if (room.y + room.h < MAP_ROWS && map[room.y + room.h][x] === 4) map[room.y + room.h][x] = 1;
      }
    }
    // Left and right walls
    for (let y = room.y - 1; y <= room.y + room.h; y++) {
      if (y >= 0 && y < MAP_ROWS) {
        if (room.x - 1 >= 0 && map[y][room.x - 1] === 4) map[y][room.x - 1] = 1;
        if (room.x + room.w < MAP_COLS && map[y][room.x + room.w] === 4) map[y][room.x + room.w] = 1;
      }
    }
  }

  // Mark furniture as blocking (type 3)
  for (const f of FURNITURE) {
    if (f.y >= 0 && f.y < MAP_ROWS && f.x >= 0 && f.x < MAP_COLS) {
      if (map[f.y][f.x] === 0 || map[f.y][f.x] === 2) {
        map[f.y][f.x] = 3;
      }
    }
  }

  return map;
}

export const TILE_MAP = buildMap();

export function isWalkable(x: number, y: number): boolean {
  if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return false;
  const tile = TILE_MAP[y][x];
  return tile === 0 || tile === 2;
}
