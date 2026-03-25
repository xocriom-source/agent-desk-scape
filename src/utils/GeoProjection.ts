/**
 * GeoProjection — Mercator projection utilities for converting lat/lon to world coordinates.
 * Reusable across the engine without React dependencies.
 */

const EARTH_RADIUS = 6371000;

export interface WorldPoint {
  x: number;
  z: number;
}

export interface GeoCenter {
  lat: number;
  lon: number;
}

/** Convert lat/lon to meters offset from a center point */
export function latLonToMeters(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number
): WorldPoint {
  const dLat = ((lat - centerLat) * Math.PI) / 180;
  const dLon = ((lon - centerLon) * Math.PI) / 180;
  const cosCenter = Math.cos((centerLat * Math.PI) / 180);
  return {
    x: dLon * EARTH_RADIUS * cosCenter,
    z: -dLat * EARTH_RADIUS,
  };
}

// Scale: 1 unit = 2 meters
const WORLD_SCALE = 1 / 2;

/** Convert meter offsets to world units */
export function metersToWorld(meters: WorldPoint): WorldPoint {
  return {
    x: Math.round(meters.x * WORLD_SCALE * 100) / 100,
    z: Math.round(meters.z * WORLD_SCALE * 100) / 100,
  };
}

/** Convert a single meter value to world units */
export function metersToUnits(m: number): number {
  return m * WORLD_SCALE;
}

/** Convert lat/lon directly to world units */
export function latLonToWorld(
  lat: number,
  lon: number,
  center: GeoCenter
): WorldPoint {
  return metersToWorld(latLonToMeters(lat, lon, center.lat, center.lon));
}

/** Deterministic hash for a string */
export function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Seeded pseudo-random number [0,1) */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}
