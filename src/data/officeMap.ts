import type { TileType } from "@/types/agent";

export const TILE_SIZE = 40;
export const MAP_COLS = 40;
export const MAP_ROWS = 30;

// Room definitions
export const ROOMS = [
  { name: "🖥️ Área de Trabalho", x: 1, y: 1, w: 14, h: 10, color: "#E8DCC8" },
  { name: "📋 Sala de Reuniões", x: 18, y: 1, w: 10, h: 8, color: "#D4D8E8" },
  { name: "☕ Lounge & Café", x: 1, y: 14, w: 10, h: 10, color: "#D8E4D0" },
  { name: "🖧 Servidor / Infra", x: 18, y: 12, w: 10, h: 8, color: "#E0D8D8" },
  { name: "🏢 Recepção", x: 13, y: 14, w: 7, h: 10, color: "#E8E0D0" },
  { name: "📚 Biblioteca", x: 30, y: 1, w: 9, h: 8, color: "#E4DCD0" },
  { name: "🧘 Sala Zen", x: 30, y: 12, w: 9, h: 8, color: "#D0E0D8" },
  { name: "🎮 Game Room", x: 1, y: 26, w: 10, h: 3, color: "#E0D4E8" },
];

export interface FurnitureItem {
  type: string;
  x: number;
  y: number;
  emoji: string;
  w?: number;
  h?: number;
}

export const FURNITURE: FurnitureItem[] = [
  // === Área de Trabalho ===
  // Row 1 desks
  { type: "desk", x: 2, y: 2, emoji: "🖥️" },
  { type: "desk", x: 4, y: 2, emoji: "🖥️" },
  { type: "desk", x: 6, y: 2, emoji: "🖥️" },
  { type: "desk", x: 8, y: 2, emoji: "🖥️" },
  // Row 2 desks
  { type: "desk", x: 2, y: 5, emoji: "🖥️" },
  { type: "desk", x: 4, y: 5, emoji: "🖥️" },
  { type: "desk", x: 6, y: 5, emoji: "🖥️" },
  { type: "desk", x: 8, y: 5, emoji: "🖥️" },
  // Row 3 desks
  { type: "desk", x: 2, y: 8, emoji: "🖥️" },
  { type: "desk", x: 4, y: 8, emoji: "🖥️" },
  { type: "desk", x: 6, y: 8, emoji: "🖥️" },
  { type: "desk", x: 8, y: 8, emoji: "🖥️" },
  // Chairs (beside desks)
  { type: "chair", x: 3, y: 3, emoji: "🪑" },
  { type: "chair", x: 5, y: 3, emoji: "🪑" },
  { type: "chair", x: 7, y: 3, emoji: "🪑" },
  { type: "chair", x: 9, y: 3, emoji: "🪑" },
  { type: "chair", x: 3, y: 6, emoji: "🪑" },
  { type: "chair", x: 5, y: 6, emoji: "🪑" },
  { type: "chair", x: 7, y: 6, emoji: "🪑" },
  { type: "chair", x: 9, y: 6, emoji: "🪑" },
  // Work area plants
  { type: "plant", x: 1, y: 1, emoji: "🌿" },
  { type: "plant", x: 14, y: 1, emoji: "🪴" },
  { type: "plant", x: 1, y: 10, emoji: "🌱" },
  { type: "plant", x: 14, y: 10, emoji: "🌿" },
  // Whiteboard
  { type: "whiteboard", x: 11, y: 2, emoji: "📋" },
  { type: "whiteboard", x: 12, y: 2, emoji: "📊" },
  // Printer
  { type: "printer", x: 13, y: 5, emoji: "🖨️" },
  // Water cooler
  { type: "water", x: 13, y: 8, emoji: "🚰" },

  // === Sala de Reuniões ===
  { type: "table", x: 20, y: 3, emoji: "🪑" },
  { type: "table", x: 21, y: 3, emoji: "🪑" },
  { type: "table", x: 22, y: 3, emoji: "🪑" },
  { type: "table", x: 23, y: 3, emoji: "🪑" },
  { type: "table", x: 20, y: 5, emoji: "🪑" },
  { type: "table", x: 21, y: 5, emoji: "🪑" },
  { type: "table", x: 22, y: 5, emoji: "🪑" },
  { type: "table", x: 23, y: 5, emoji: "🪑" },
  { type: "screen", x: 26, y: 2, emoji: "📺" },
  { type: "screen", x: 26, y: 4, emoji: "📺" },
  { type: "whiteboard", x: 26, y: 6, emoji: "📋" },
  { type: "plant", x: 18, y: 1, emoji: "🌿" },
  { type: "plant", x: 27, y: 1, emoji: "🪴" },

  // === Lounge & Café ===
  { type: "sofa", x: 2, y: 15, emoji: "🛋️" },
  { type: "sofa", x: 2, y: 17, emoji: "🛋️" },
  { type: "coffee", x: 4, y: 16, emoji: "☕" },
  { type: "table", x: 5, y: 16, emoji: "🍩" },
  { type: "vending", x: 8, y: 14, emoji: "🥤" },
  { type: "vending", x: 9, y: 14, emoji: "🍫" },
  { type: "bookshelf", x: 1, y: 22, emoji: "📚" },
  { type: "bookshelf", x: 2, y: 22, emoji: "📚" },
  { type: "plant", x: 10, y: 14, emoji: "🌿" },
  { type: "plant", x: 1, y: 14, emoji: "🪴" },
  { type: "sofa", x: 6, y: 19, emoji: "🛋️" },
  { type: "table", x: 7, y: 19, emoji: "🍕" },
  { type: "tv", x: 4, y: 21, emoji: "📺" },

  // === Servidor / Infra ===
  { type: "server", x: 19, y: 13, emoji: "🖧" },
  { type: "server", x: 20, y: 13, emoji: "🖧" },
  { type: "server", x: 21, y: 13, emoji: "🖧" },
  { type: "server", x: 22, y: 13, emoji: "🖧" },
  { type: "server", x: 19, y: 15, emoji: "🖧" },
  { type: "server", x: 20, y: 15, emoji: "🖧" },
  { type: "server", x: 21, y: 15, emoji: "🖧" },
  { type: "server", x: 22, y: 15, emoji: "🖧" },
  { type: "monitor", x: 25, y: 13, emoji: "📡" },
  { type: "monitor", x: 26, y: 13, emoji: "🖥️" },
  { type: "desk", x: 25, y: 17, emoji: "💻" },
  { type: "chair", x: 26, y: 17, emoji: "🪑" },

  // === Recepção ===
  { type: "desk", x: 15, y: 16, emoji: "💻" },
  { type: "plant", x: 13, y: 14, emoji: "🌿" },
  { type: "plant", x: 19, y: 14, emoji: "🌿" },
  { type: "sofa", x: 14, y: 21, emoji: "🛋️" },
  { type: "sofa", x: 15, y: 21, emoji: "🛋️" },
  { type: "table", x: 16, y: 20, emoji: "📰" },
  { type: "plant", x: 13, y: 23, emoji: "🌿" },
  { type: "plant", x: 19, y: 23, emoji: "🪴" },

  // === Biblioteca ===
  { type: "bookshelf", x: 31, y: 2, emoji: "📚" },
  { type: "bookshelf", x: 32, y: 2, emoji: "📚" },
  { type: "bookshelf", x: 33, y: 2, emoji: "📚" },
  { type: "bookshelf", x: 34, y: 2, emoji: "📚" },
  { type: "bookshelf", x: 35, y: 2, emoji: "📚" },
  { type: "bookshelf", x: 36, y: 2, emoji: "📚" },
  { type: "desk", x: 32, y: 5, emoji: "📖" },
  { type: "desk", x: 34, y: 5, emoji: "📖" },
  { type: "desk", x: 36, y: 5, emoji: "📖" },
  { type: "chair", x: 32, y: 6, emoji: "🪑" },
  { type: "chair", x: 34, y: 6, emoji: "🪑" },
  { type: "chair", x: 36, y: 6, emoji: "🪑" },
  { type: "plant", x: 30, y: 1, emoji: "🌿" },
  { type: "plant", x: 38, y: 1, emoji: "🪴" },

  // === Sala Zen ===
  { type: "plant", x: 31, y: 13, emoji: "🌿" },
  { type: "plant", x: 33, y: 13, emoji: "🌿" },
  { type: "plant", x: 35, y: 13, emoji: "🌿" },
  { type: "plant", x: 37, y: 13, emoji: "🌿" },
  { type: "sofa", x: 32, y: 16, emoji: "🧘" },
  { type: "sofa", x: 34, y: 16, emoji: "🧘" },
  { type: "sofa", x: 36, y: 16, emoji: "🧘" },
  { type: "plant", x: 30, y: 19, emoji: "🪴" },
  { type: "plant", x: 38, y: 19, emoji: "🪴" },
  { type: "water", x: 31, y: 18, emoji: "⛲" },

  // === Game Room ===
  { type: "table", x: 2, y: 27, emoji: "🎮" },
  { type: "table", x: 4, y: 27, emoji: "🕹️" },
  { type: "sofa", x: 6, y: 27, emoji: "🛋️" },
  { type: "tv", x: 8, y: 26, emoji: "📺" },
];

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

  // Hallways
  // Main horizontal hallway
  for (let x = 1; x < 39; x++) {
    for (let y = 11; y <= 12; y++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }
  // Main vertical hallway
  for (let y = 1; y < 29; y++) {
    for (let x = 16; x <= 17; x++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }
  // Secondary vertical (right side)
  for (let y = 1; y < 20; y++) {
    for (let x = 29; x <= 29; x++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }
  // Connection to game room
  for (let y = 24; y <= 26; y++) {
    for (let x = 1; x <= 10; x++) {
      if (y < MAP_ROWS && x < MAP_COLS && map[y][x] === 4) map[y][x] = 0;
    }
  }

  // Carpets in meeting room
  for (let y = 2; y <= 7; y++) {
    for (let x = 19; x <= 26; x++) {
      if (map[y]?.[x] === 0) map[y][x] = 2;
    }
  }
  // Carpet in lounge
  for (let y = 15; y <= 21; y++) {
    for (let x = 2; x <= 9; x++) {
      if (map[y]?.[x] === 0) map[y][x] = 2;
    }
  }
  // Carpet in zen room
  for (let y = 13; y <= 18; y++) {
    for (let x = 31; x <= 37; x++) {
      if (map[y]?.[x] === 0) map[y][x] = 2;
    }
  }
  // Carpet in library
  for (let y = 3; y <= 7; y++) {
    for (let x = 31; x <= 37; x++) {
      if (map[y]?.[x] === 0) map[y][x] = 2;
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

  // Furniture as blocking
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
