/**
 * CollisionSystem — AABB-based collision detection and resolution.
 * Provides slide-along-wall behavior and safe spawn finding.
 */

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const COLLISION_MARGIN = 0.3;

export interface BuildingCollider {
  x: number;
  z: number;
  w: number;
  d: number;
}

/** Build AABBs from building definitions */
export function buildAABBs(buildings: BuildingCollider[]): AABB[] {
  return buildings.map((b) => ({
    minX: b.x - b.w / 2 - COLLISION_MARGIN,
    maxX: b.x + b.w / 2 + COLLISION_MARGIN,
    minZ: b.z - b.d / 2 - COLLISION_MARGIN,
    maxZ: b.z + b.d / 2 + COLLISION_MARGIN,
  }));
}

/** Check if a circle collides with any AABB */
export function collidesAABB(x: number, z: number, radius: number, aabbs: AABB[]): boolean {
  for (const b of aabbs) {
    if (
      x + radius > b.minX &&
      x - radius < b.maxX &&
      z + radius > b.minZ &&
      z - radius < b.maxZ
    ) {
      return true;
    }
  }
  return false;
}

/** Move with slide collision: try full, then X-only, then Z-only */
export function moveWithCollision(
  curX: number,
  curZ: number,
  dx: number,
  dz: number,
  radius: number,
  aabbs: AABB[]
): [number, number] {
  // Try full move
  if (!collidesAABB(curX + dx, curZ + dz, radius, aabbs)) {
    return [curX + dx, curZ + dz];
  }
  // Try X only
  if (dx !== 0 && !collidesAABB(curX + dx, curZ, radius, aabbs)) {
    return [curX + dx, curZ];
  }
  // Try Z only
  if (dz !== 0 && !collidesAABB(curX, curZ + dz, radius, aabbs)) {
    return [curX, curZ + dz];
  }
  return [curX, curZ];
}

/** Find a safe spawn point near target that doesn't collide */
export function findSafeSpawn(
  targetX: number,
  targetZ: number,
  radius: number,
  aabbs: AABB[],
  maxAttempts: number = 20
): [number, number] {
  // Try target first
  if (!collidesAABB(targetX, targetZ, radius, aabbs)) {
    return [targetX, targetZ];
  }

  // Spiral search
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const dist = attempt * 1.5;
    const angles = 8;
    for (let a = 0; a < angles; a++) {
      const angle = (a / angles) * Math.PI * 2;
      const x = targetX + Math.cos(angle) * dist;
      const z = targetZ + Math.sin(angle) * dist;
      if (!collidesAABB(x, z, radius, aabbs)) {
        console.log(`[Collision] Safe spawn found at attempt ${attempt}, offset ${dist.toFixed(1)}u`);
        return [x, z];
      }
    }
  }

  // Fallback: origin
  console.warn("[Collision] No safe spawn found, using origin");
  return [0, 5];
}
