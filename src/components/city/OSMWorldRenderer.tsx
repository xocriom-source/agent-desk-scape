/**
 * OSMWorldRenderer v3 — Real polygon footprints via ExtrudeGeometry.
 * Streets with lane markings. Terrain with noise. Arnis-level quality.
 */

import { memo, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { CityBuilding } from "@/types/building";
import type { OSMStreet, BuildingPolygon } from "@/systems/city/OSMCityGenerator";

// ── LOD thresholds ──
const LOD_POLYGON = 40;  // Real extruded polygon
const LOD_BOX = 80;      // Simplified box with windows
const LOD_INST = 150;    // Instanced silhouette
// Beyond 150 → not rendered

// ── Hash for determinism ──
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

// ── Create ExtrudeGeometry from polygon vertices ──
function createBuildingGeometry(polygon: BuildingPolygon, height: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const verts = polygon.vertices;

  if (verts.length < 3) {
    // Fallback to box
    return new THREE.BoxGeometry(Math.max(polygon.w, 0.5), height, Math.max(polygon.d, 0.5));
  }

  // Create shape from polygon vertices (x,z → x,y in Shape space)
  shape.moveTo(verts[0].x, verts[0].z);
  for (let i = 1; i < verts.length; i++) {
    shape.lineTo(verts[i].x, verts[i].z);
  }
  shape.closePath();

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: height,
    bevelEnabled: false,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Rotate so extrusion goes up (Y axis) instead of Z
  geo.rotateX(-Math.PI / 2);
  return geo;
}

// ── Geometry cache to avoid re-creating ──
const geoCache = new Map<string, THREE.BufferGeometry>();

function getCachedGeometry(buildingId: string, polygon: BuildingPolygon, height: number): THREE.BufferGeometry {
  const key = buildingId;
  if (!geoCache.has(key)) {
    const geo = createBuildingGeometry(polygon, height);
    geoCache.set(key, geo);
  }
  return geoCache.get(key)!;
}

// ── Building materials with zone variation ──
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function getBuildingMaterial(color: string, isNear: boolean): THREE.MeshStandardMaterial {
  const key = `${color}-${isNear}`;
  if (!materialCache.has(key)) {
    const baseColor = new THREE.Color(color);
    const mat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: isNear ? 0.65 : 0.8,
      metalness: isNear ? 0.1 : 0.05,
      flatShading: !isNear,
    });
    materialCache.set(key, mat);
  }
  return materialCache.get(key)!;
}

// ── LOD 0: Real polygon extruded building ──
const PolygonBuilding = memo(function PolygonBuilding({ b }: { b: CityBuilding }) {
  const polygon = (b as any).polygon as BuildingPolygon | undefined;
  const hasPolygon = !!(polygon && polygon.vertices && polygon.vertices.length >= 3);
  const fw = polygon?.w || 1;
  const fd = polygon?.d || 1;

  const geometry = useMemo(() => {
    if (!hasPolygon || !polygon) return null;
    return getCachedGeometry(b.id, polygon, b.height);
  }, [b.id, hasPolygon, polygon, b.height]);

  const material = useMemo(
    () => getBuildingMaterial(b.primaryColor, true),
    [b.primaryColor]
  );

  const windowMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#FFDD88",
    emissive: "#FFCC66",
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.6,
  }), []);

  if (!hasPolygon || !geometry) {
    return (
      <group position={[b.coordinates.x, 0, b.coordinates.z]}>
        <mesh position={[0, b.height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[Math.max(fw, 0.5), b.height, Math.max(fd, 0.5)]} />
          <primitive object={material} attach="material" />
        </mesh>
        <RoofDetail height={b.height} w={fw} d={fd} color={b.primaryColor} />
      </group>
    );
  }

  return (
    <group position={[b.coordinates.x, 0, b.coordinates.z]}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[fw + 0.3, fd + 0.3]} />
        <meshBasicMaterial color="#000" transparent opacity={0.15} />
      </mesh>
      {b.height > 3 && (
        <>
          <mesh position={[0, b.height * 0.5, fd / 2 + 0.02]}>
            <planeGeometry args={[fw * 0.7, b.height * 0.6]} />
            <primitive object={windowMat} attach="material" />
          </mesh>
          <mesh position={[fw / 2 + 0.02, b.height * 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[fd * 0.7, b.height * 0.6]} />
            <primitive object={windowMat} attach="material" />
          </mesh>
        </>
      )}
      <RoofDetail height={b.height} w={fw} d={fd} color={b.primaryColor} />
    </group>
  );
});

// ── Roof detail ──
function RoofDetail({ height, w, d, color }: { height: number; w: number; d: number; color: string }) {
  if (height < 5) return null;
  const roofColor = new THREE.Color(color).multiplyScalar(0.7).getStyle();
  return (
    <group>
      {/* Parapet */}
      <mesh position={[0, height + 0.05, 0]}>
        <boxGeometry args={[w + 0.1, 0.1, d + 0.1]} />
        <meshStandardMaterial color={roofColor} roughness={0.8} />
      </mesh>
      {/* AC unit on tall buildings */}
      {height > 8 && (
        <mesh position={[w * 0.2, height + 0.2, d * 0.2]}>
          <boxGeometry args={[0.4, 0.3, 0.3]} />
          <meshStandardMaterial color="#666" roughness={0.9} metalness={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ── LOD 1: Simplified box with windows ──
const BoxBuilding = memo(function BoxBuilding({ b }: { b: CityBuilding }) {
  const polygon = (b as any).polygon as BuildingPolygon | undefined;
  const fw = polygon?.w || 1.5;
  const fd = polygon?.d || 1.5;

  const darkerColor = useMemo(() => {
    return new THREE.Color(b.primaryColor).multiplyScalar(0.85).getStyle();
  }, [b.primaryColor]);

  return (
    <group position={[b.coordinates.x, 0, b.coordinates.z]}>
      <mesh position={[0, b.height / 2, 0]} castShadow>
        <boxGeometry args={[fw, b.height, fd]} />
        <meshStandardMaterial color={b.primaryColor} roughness={0.75} flatShading />
      </mesh>
      {/* Window strip */}
      {b.height > 2 && (
        <mesh position={[fw / 2 + 0.01, b.height * 0.5, 0]}>
          <planeGeometry args={[0.01, b.height * 0.5]} />
          <meshStandardMaterial color="#FFDD88" emissive="#FFDD88" emissiveIntensity={0.4} transparent opacity={0.5} />
        </mesh>
      )}
      {/* Base shadow */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[fw + 0.2, fd + 0.2]} />
        <meshBasicMaterial color="#000" transparent opacity={0.1} />
      </mesh>
    </group>
  );
});

// ── LOD 2: Instanced far buildings ──
function FarBuildingInstances({ buildings }: { buildings: CityBuilding[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = buildings.length;

  useEffect(() => {
    if (!meshRef.current || count === 0) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const b = buildings[i];
      const polygon = (b as any).polygon as BuildingPolygon | undefined;
      const fw = polygon?.w || 1.5;
      const fd = polygon?.d || 1.5;
      dummy.position.set(b.coordinates.x, b.height / 2, b.coordinates.z);
      dummy.scale.set(fw, b.height, fd);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      color.set(b.primaryColor);
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [buildings, count]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.85} flatShading />
    </instancedMesh>
  );
}

// ── Real street renderer with lane markings ──
const OSMStreetMeshes = memo(function OSMStreetMeshes({
  streets,
  playerX,
  playerZ,
}: {
  streets: OSMStreet[];
  playerX: number;
  playerZ: number;
}) {
  const viewDist = 100;
  const chunkX = Math.round(playerX / 15);
  const chunkZ = Math.round(playerZ / 15);

  const visibleStreets = useMemo(() => {
    return streets.filter(st => {
      if (st.segments.length < 2) return false;
      for (const pt of st.segments) {
        const dx = pt.x - playerX;
        const dz = pt.z - playerZ;
        if (dx * dx + dz * dz < viewDist * viewDist) return true;
      }
      return false;
    });
  }, [streets, chunkX, chunkZ]);

  return (
    <group>
      {visibleStreets.map((st, si) => (
        <group key={si}>
          {st.segments.map((pt, pi) => {
            if (pi === 0) return null;
            const prev = st.segments[pi - 1];
            const dx = pt.x - prev.x;
            const dz = pt.z - prev.z;
            const len = Math.sqrt(dx * dx + dz * dz);
            if (len < 0.2) return null;
            const mx = (prev.x + pt.x) / 2;
            const mz = (prev.z + pt.z) / 2;
            const angle = Math.atan2(dx, dz);

            // Road surface color by type
            const roadColor = st.type === "main" ? "#333338" : st.type === "secondary" ? "#2A2A30" : "#222228";

            return (
              <group key={pi}>
                {/* Road surface */}
                <mesh position={[mx, 0.02, mz]} rotation={[-Math.PI / 2, 0, angle]}>
                  <planeGeometry args={[st.width, len]} />
                  <meshStandardMaterial color={roadColor} roughness={0.9} />
                </mesh>
                {/* Sidewalks (raised edges) */}
                {st.type !== "alley" && (
                  <>
                    <mesh position={[mx + Math.cos(angle) * (st.width / 2 + 0.15), 0.04, mz - Math.sin(angle) * (st.width / 2 + 0.15)]} rotation={[-Math.PI / 2, 0, angle]}>
                      <planeGeometry args={[0.3, len]} />
                      <meshStandardMaterial color="#555560" roughness={0.85} />
                    </mesh>
                    <mesh position={[mx - Math.cos(angle) * (st.width / 2 + 0.15), 0.04, mz + Math.sin(angle) * (st.width / 2 + 0.15)]} rotation={[-Math.PI / 2, 0, angle]}>
                      <planeGeometry args={[0.3, len]} />
                      <meshStandardMaterial color="#555560" roughness={0.85} />
                    </mesh>
                  </>
                )}
                {/* Center lane marking for main roads */}
                {st.type === "main" && len > 1 && (
                  <group>
                    {Array.from({ length: Math.max(1, Math.floor(len / 1.5)) }).map((_, li) => {
                      const t = (li + 0.5) / Math.floor(len / 1.5);
                      const lx = prev.x + dx * t;
                      const lz = prev.z + dz * t;
                      return (
                        <mesh key={li} position={[lx, 0.025, lz]} rotation={[-Math.PI / 2, 0, angle]}>
                          <planeGeometry args={[0.06, 0.6]} />
                          <meshStandardMaterial color="#FFD060" transparent opacity={0.5} />
                        </mesh>
                      );
                    })}
                  </group>
                )}
                {/* Edge line for secondary roads */}
                {st.type === "secondary" && len > 2 && (
                  <mesh position={[mx, 0.025, mz]} rotation={[-Math.PI / 2, 0, angle]}>
                    <planeGeometry args={[0.04, len]} />
                    <meshStandardMaterial color="#666" transparent opacity={0.3} />
                  </mesh>
                )}
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
});

// ── Terrain with noise for OSM area ──
const OSMTerrain = memo(function OSMTerrain({
  bounds,
}: {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}) {
  const padding = 40;
  const w = (bounds.maxX - bounds.minX) + padding * 2;
  const d = (bounds.maxZ - bounds.minZ) + padding * 2;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;

  const geometry = useMemo(() => {
    const res = 64;
    const geo = new THREE.PlaneGeometry(w, d, res, res);
    geo.rotateX(-Math.PI / 2);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);
      const cityRadius = Math.max(w, d) * 0.3;
      // Flat in city center, rolling hills at edges
      const edgeFactor = Math.max(0, (distFromCenter - cityRadius) / (Math.max(w, d) * 0.3));
      const clampedEdge = Math.min(1, edgeFactor);
      const noise =
        Math.sin(x * 0.03) * Math.cos(z * 0.04) * 0.8 +
        Math.sin(x * 0.08 + 3) * Math.cos(z * 0.06 + 5) * 0.4 +
        Math.sin(x * 0.15 + 7) * Math.sin(z * 0.12 + 2) * 0.2;
      positions.setY(i, noise * clampedEdge);
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [w, d]);

  return (
    <group position={[cx, -0.05, cz]}>
      {/* Main terrain */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#1A1E24" roughness={0.95} flatShading />
      </mesh>
      {/* Extended ground plane */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 4, d * 4]} />
        <meshStandardMaterial color="#111418" roughness={1} />
      </mesh>
      {/* Horizon hills */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const dist = Math.max(w, d) * 0.9;
        const hh = 8 + Math.sin(i * 1.3) * 6;
        const hw = 35 + Math.sin(i * 0.7) * 20;
        return (
          <mesh key={i} position={[Math.cos(angle) * dist, hh / 2 - 3, Math.sin(angle) * dist]}>
            <sphereGeometry args={[hw, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#0A0F0A" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
});

// ── Main OSM World Renderer ──
interface OSMWorldRendererProps {
  buildings: CityBuilding[];
  streets: OSMStreet[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  playerX: number;
  playerZ: number;
  userBuildings?: CityBuilding[];
  maxGLBBuildings?: number;
}

export const OSMWorldRenderer = memo(function OSMWorldRenderer({
  buildings,
  streets,
  bounds,
  playerX,
  playerZ,
  userBuildings = [],
  maxGLBBuildings = 30,
}: OSMWorldRendererProps) {
  const chunkX = Math.round(playerX / 8);
  const chunkZ = Math.round(playerZ / 8);

  const { polygonBuildings, boxBuildings, farBuildings } = useMemo(() => {
    const poly: CityBuilding[] = [];
    const box: CityBuilding[] = [];
    const far: CityBuilding[] = [];

    const userPositions = new Set(
      userBuildings.map(ub => `${Math.round(ub.coordinates.x / 2)}_${Math.round(ub.coordinates.z / 2)}`)
    );

    for (const b of buildings) {
      const cellKey = `${Math.round(b.coordinates.x / 2)}_${Math.round(b.coordinates.z / 2)}`;
      if (userPositions.has(cellKey)) continue;

      const dx = b.coordinates.x - playerX;
      const dz = b.coordinates.z - playerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > LOD_INST) continue;

      if (dist < LOD_POLYGON && poly.length < maxGLBBuildings) {
        poly.push(b);
      } else if (dist < LOD_BOX) {
        box.push(b);
      } else {
        far.push(b);
      }
    }

    return { polygonBuildings: poly, boxBuildings: box, farBuildings: far };
  }, [buildings, playerX, playerZ, maxGLBBuildings, userBuildings, chunkX, chunkZ]);

  return (
    <group>
      {/* Terrain */}
      <OSMTerrain bounds={bounds} />

      {/* Streets with lane markings */}
      <OSMStreetMeshes streets={streets} playerX={playerX} playerZ={playerZ} />

      {/* Real polygon buildings (nearest) */}
      {polygonBuildings.map(b => (
        <PolygonBuilding key={b.id} b={b} />
      ))}

      {/* Box buildings (medium distance) */}
      {boxBuildings.map(b => (
        <BoxBuilding key={b.id} b={b} />
      ))}

      {/* Far instanced buildings */}
      <FarBuildingInstances buildings={farBuildings} />

      {/* User buildings (always rendered as polygon regardless of distance) */}
      {userBuildings.map(b => (
        <PolygonBuilding key={`user-${b.id}`} b={b} />
      ))}
    </group>
  );
});
