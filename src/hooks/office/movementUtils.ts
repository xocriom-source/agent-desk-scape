import { isWalkable, MAP_COLS, MAP_ROWS } from "@/data/officeMap";

export type Tile = { x: number; y: number };

export function tileFromFloat(x: number, y: number): Tile {
  return {
    x: Math.floor(x + 0.5),
    y: Math.floor(y + 0.5),
  };
}

export function isWalkableAtFloat(x: number, y: number, radius = 0.28): boolean {
  const pts = [
    [x - radius, y - radius],
    [x + radius, y - radius],
    [x - radius, y + radius],
    [x + radius, y + radius],
  ] as const;

  for (const [px, py] of pts) {
    const t = tileFromFloat(px, py);
    if (!isWalkable(t.x, t.y)) return false;
  }
  return true;
}

export function findClosestWalkable(goal: Tile, maxRadius = 8): Tile | null {
  if (isWalkable(goal.x, goal.y)) return goal;

  for (let r = 1; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // ring only
        const x = goal.x + dx;
        const y = goal.y + dy;
        if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) continue;
        if (isWalkable(x, y)) return { x, y };
      }
    }
  }

  return null;
}

export function bfsPath8(start: Tile, goal: Tile): Tile[] {
  if (start.x === goal.x && start.y === goal.y) return [];
  if (!isWalkable(goal.x, goal.y)) return [];

  const key = (t: Tile) => `${t.x},${t.y}`;
  const q: Tile[] = [start];
  const prev = new Map<string, string>();
  const seen = new Set<string>([key(start)]);

  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    // diagonals
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
  ];

  while (q.length) {
    const cur = q.shift()!;
    for (const d of dirs) {
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;

      if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) continue;
      if (!isWalkable(nx, ny)) continue;

      // Prevent diagonal corner-cutting
      if (d.x !== 0 && d.y !== 0) {
        if (!isWalkable(cur.x + d.x, cur.y) || !isWalkable(cur.x, cur.y + d.y)) continue;
      }

      const nk = `${nx},${ny}`;
      if (seen.has(nk)) continue;
      seen.add(nk);
      prev.set(nk, key(cur));

      if (nx === goal.x && ny === goal.y) {
        const path: Tile[] = [];
        let curKey = nk;
        while (curKey !== key(start)) {
          const [x, y] = curKey.split(",").map(Number);
          path.push({ x, y });
          curKey = prev.get(curKey)!;
        }
        path.reverse();
        return path;
      }

      q.push({ x: nx, y: ny });
    }
  }

  return [];
}
