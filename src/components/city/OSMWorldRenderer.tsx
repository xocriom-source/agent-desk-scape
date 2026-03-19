/**
 * OSMWorldRenderer v4 — Arnis-level real world engine.
 * Real ExtrudeGeometry footprints, physical street meshes with lane markings,
 * procedural terrain with noise, 3-tier LOD, ambient occlusion, zone color variation.
 */

import { memo, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { CityBuilding } from "@/types/building";
import type { OSMStreet, BuildingPolygon } from "@/systems/city/OSMCityGenerator";

// ── LOD thresholds ──
const LOD_POLYGON = 60;   // Near: full extruded polygon with details
const LOD_BOX = 120;      // Mid: simplified box with windows
const LOD_INST = 250;     // Far: instanced silhouette

// ── Create ExtrudeGeometry from real polygon vertices ──
function createBuildingGeometry(polygon: BuildingPolygon, height: number): THREE.BufferGeometry {
  const verts = polygon.vertices;

  if (!verts || verts.length < 3) {
    return new THREE.BoxGeometry(Math.max(polygon.w, 1), height, Math.max(polygon.d, 1));
  }

  // Clean polygon: remove duplicate consecutive points
  const cleanVerts: Array<{ x: number; z: number }> = [verts[0]];
  for (let i = 1; i < verts.length; i++) {
    const prev = cleanVerts[cleanVerts.length - 1];
    if (Math.abs(verts[i].x - prev.x) > 0.01 || Math.abs(verts[i].z - prev.z) > 0.01) {
      cleanVerts.push(verts[i]);
    }
  }

  if (cleanVerts.length < 3) {
    return new THREE.BoxGeometry(Math.max(polygon.w, 1), height, Math.max(polygon.d, 1));
  }

  try {
    const shape = new THREE.Shape();
    shape.moveTo(cleanVerts[0].x, cleanVerts[0].z);
    for (let i = 1; i < cleanVerts.length; i++) {
      shape.lineTo(cleanVerts[i].x, cleanVerts[i].z);
    }
    shape.closePath();

    // Check area — skip degenerate shapes
    const area = Math.abs(THREE.ShapeUtils.area(shape.getPoints(12)));
    if (area < 0.1) {
      return new THREE.BoxGeometry(Math.max(polygon.w, 1), height, Math.max(polygon.d, 1));
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
    });
    // Rotate so extrusion goes up (Y) instead of Z
    geo.rotateX(-Math.PI / 2);
    return geo;
  } catch {
    // Fallback for invalid polygons
    return new THREE.BoxGeometry(Math.max(polygon.w, 1), height, Math.max(polygon.d, 1));
  }
}

// ── Geometry cache ──
const geoCache = new Map<string, THREE.BufferGeometry>();

function getCachedGeometry(buildingId: string, polygon: BuildingPolygon, height: number): THREE.BufferGeometry {
  if (!geoCache.has(buildingId)) {
    geoCache.set(buildingId, createBuildingGeometry(polygon, height));
  }
  return geoCache.get(buildingId)!;
}

// ── Material cache with zone variation ──
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function getBuildingMaterial(color: string, lod: number): THREE.MeshStandardMaterial {
  const key = `${color}-${lod}`;
  if (!materialCache.has(key)) {
    const baseColor = new THREE.Color(color);
    const mat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: lod === 0 ? 0.55 : 0.75,
      metalness: lod === 0 ? 0.12 : 0.05,
      flatShading: lod > 0,
    });
    materialCache.set(key, mat);
  }
  return materialCache.get(key)!;
}

// ── Shared window material ──
const windowMaterial = new THREE.MeshStandardMaterial({
  color: "#FFDD88",
  emissive: "#FFCC66",
  emissiveIntensity: 0.6,
  transparent: true,
  opacity: 0.55,
});

// ── Shared AO ground material ──
const aoGroundMaterial = new THREE.MeshBasicMaterial({
  color: "#000000",
  transparent: true,
  opacity: 0.2,
});

// ── LOD 0: Full extruded polygon building ──
const PolygonBuilding = memo(function PolygonBuilding({ b }: { b: CityBuilding }) {
  const polygon = (b as any).polygon as BuildingPolygon | undefined;
  const hasPolygon = !!(polygon && polygon.vertices && polygon.vertices.length >= 3);
  const fw = polygon?.w || 2;
  const fd = polygon?.d || 2;

  const geometry = useMemo(() => {
    if (!hasPolygon || !polygon) return null;
    return getCachedGeometry(b.id, polygon, b.height);
  }, [b.id, hasPolygon, polygon, b.height]);

  const material = useMemo(() => getBuildingMaterial(b.primaryColor, 0), [b.primaryColor]);

  // Darker variant for roof/sides
  const roofColor = useMemo(() => new THREE.Color(b.primaryColor).multiplyScalar(0.65).getStyle(), [b.primaryColor]);

  if (!hasPolygon || !geometry) {
    // Fallback to box with proper dimensions
    return (
      <group position={[b.coordinates.x, 0, b.coordinates.z]}>
        <mesh position={[0, b.height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[Math.max(fw, 1), b.height, Math.max(fd, 1)]} />
          <primitive object={material} attach="material" />
        </mesh>
        {/* Fake AO on ground */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[fw + 0.5, fd + 0.5]} />
          <primitive object={aoGroundMaterial} attach="material" />
        </mesh>
        <RoofDetail height={b.height} w={fw} d={fd} color={b.primaryColor} />
        {b.height > 4 && <WindowStrips height={b.height} w={fw} d={fd} />}
      </group>
    );
  }

  return (
    <group position={[b.coordinates.x, 0, b.coordinates.z]}>
      {/* Main extruded building */}
      <mesh geometry={geometry} material={material} castShadow receiveShadow />

      {/* Fake AO shadow on ground */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[fw + 0.8, fd + 0.8]} />
        <primitive object={aoGroundMaterial} attach="material" />
      </mesh>

      {/* Window strips on multiple faces */}
      {b.height > 4 && <WindowStrips height={b.height} w={fw} d={fd} />}

      {/* Roof detail */}
      <RoofDetail height={b.height} w={fw} d={fd} color={b.primaryColor} />
    </group>
  );
});

// ── Window strips on building faces ──
function WindowStrips({ height, w, d }: { height: number; w: number; d: number }) {
  const windowRows = Math.max(1, Math.floor(height / 3));

  return (
    <group>
      {/* Front face */}
      <mesh position={[0, height * 0.45, d / 2 + 0.03]}>
        <planeGeometry args={[w * 0.8, height * 0.7]} />
        <primitive object={windowMaterial} attach="material" />
      </mesh>
      {/* Right face */}
      <mesh position={[w / 2 + 0.03, height * 0.45, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d * 0.8, height * 0.7]} />
        <primitive object={windowMaterial} attach="material" />
      </mesh>
      {/* Back face */}
      <mesh position={[0, height * 0.45, -d / 2 - 0.03]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w * 0.7, height * 0.65]} />
        <primitive object={windowMaterial} attach="material" />
      </mesh>
      {/* Left face */}
      <mesh position={[-w / 2 - 0.03, height * 0.45, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[d * 0.7, height * 0.65]} />
        <primitive object={windowMaterial} attach="material" />
      </mesh>
    </group>
  );
}

// ── Roof details ──
function RoofDetail({ height, w, d, color }: { height: number; w: number; d: number; color: string }) {
  if (height < 5) return null;
  const roofColor = new THREE.Color(color).multiplyScalar(0.6).getStyle();
  return (
    <group>
      {/* Parapet/ledge */}
      <mesh position={[0, height + 0.08, 0]}>
        <boxGeometry args={[w + 0.15, 0.16, d + 0.15]} />
        <meshStandardMaterial color={roofColor} roughness={0.75} />
      </mesh>
      {/* AC unit on tall buildings */}
      {height > 10 && (
        <mesh position={[w * 0.2, height + 0.35, d * 0.15]}>
          <boxGeometry args={[0.6, 0.4, 0.5]} />
          <meshStandardMaterial color="#555" roughness={0.9} metalness={0.3} />
        </mesh>
      )}
      {/* Antenna on very tall buildings */}
      {height > 20 && (
        <mesh position={[0, height + 1.5, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 3, 4]} />
          <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ── LOD 1: Simplified box with window strip ──
const BoxBuilding = memo(function BoxBuilding({ b }: { b: CityBuilding }) {
  const polygon = (b as any).polygon as BuildingPolygon | undefined;
  const fw = polygon?.w || 2;
  const fd = polygon?.d || 2;
  const material = useMemo(() => getBuildingMaterial(b.primaryColor, 1), [b.primaryColor]);

  return (
    <group position={[b.coordinates.x, 0, b.coordinates.z]}>
      <mesh position={[0, b.height / 2, 0]} castShadow>
        <boxGeometry args={[Math.max(fw, 1), b.height, Math.max(fd, 1)]} />
        <primitive object={material} attach="material" />
      </mesh>
      {/* Single window strip */}
      {b.height > 3 && (
        <mesh position={[fw / 2 + 0.02, b.height * 0.45, 0]}>
          <planeGeometry args={[0.01, b.height * 0.6]} />
          <meshStandardMaterial color="#FFDD88" emissive="#FFDD88" emissiveIntensity={0.4} transparent opacity={0.5} />
        </mesh>
      )}
      {/* Ground AO */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[fw + 0.3, fd + 0.3]} />
        <meshBasicMaterial color="#000" transparent opacity={0.12} />
      </mesh>
    </group>
  );
});

// ── LOD 2: High-perf instanced silhouettes ──
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
      const fw = Math.max(polygon?.w || 2, 1);
      const fd = Math.max(polygon?.d || 2, 1);
      dummy.position.set(b.coordinates.x, b.height / 2, b.coordinates.z);
      dummy.scale.set(fw, b.height, fd);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      color.set(b.primaryColor).multiplyScalar(0.7);
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

// ── Real street renderer with lane markings, sidewalks ──
const OSMStreetMeshes = memo(function OSMStreetMeshes({
  streets,
  playerX,
  playerZ,
}: {
  streets: OSMStreet[];
  playerX: number;
  playerZ: number;
}) {
  const viewDist = 150;
  const chunkX = Math.round(playerX / 20);
  const chunkZ = Math.round(playerZ / 20);

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
        <StreetSegments key={si} street={st} />
      ))}
    </group>
  );
});

// ── Individual street with all segments ──
function StreetSegments({ street: st }: { street: OSMStreet }) {
  const roadColor = st.type === "main" ? "#333338" : st.type === "secondary" ? "#2A2A30" : "#222228";

  return (
    <group>
      {st.segments.map((pt, pi) => {
        if (pi === 0) return null;
        const prev = st.segments[pi - 1];
        const dx = pt.x - prev.x;
        const dz = pt.z - prev.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.3) return null;
        const mx = (prev.x + pt.x) / 2;
        const mz = (prev.z + pt.z) / 2;
        const angle = Math.atan2(dx, dz);

        return (
          <group key={pi}>
            {/* Road surface */}
            <mesh position={[mx, 0.03, mz]} rotation={[-Math.PI / 2, 0, angle]}>
              <planeGeometry args={[st.width, len]} />
              <meshStandardMaterial color={roadColor} roughness={0.92} />
            </mesh>

            {/* Sidewalks (raised edges) */}
            {st.type !== "alley" && (
              <>
                {/* Right sidewalk */}
                <mesh position={[
                  mx + Math.cos(angle) * (st.width / 2 + 0.2),
                  0.06,
                  mz - Math.sin(angle) * (st.width / 2 + 0.2)
                ]} rotation={[-Math.PI / 2, 0, angle]}>
                  <planeGeometry args={[0.4, len]} />
                  <meshStandardMaterial color="#555560" roughness={0.8} />
                </mesh>
                {/* Left sidewalk */}
                <mesh position={[
                  mx - Math.cos(angle) * (st.width / 2 + 0.2),
                  0.06,
                  mz + Math.sin(angle) * (st.width / 2 + 0.2)
                ]} rotation={[-Math.PI / 2, 0, angle]}>
                  <planeGeometry args={[0.4, len]} />
                  <meshStandardMaterial color="#555560" roughness={0.8} />
                </mesh>
              </>
            )}

            {/* Center lane marking for main roads */}
            {st.type === "main" && len > 1.5 && (
              <group>
                {Array.from({ length: Math.max(1, Math.floor(len / 2)) }).map((_, li) => {
                  const t = (li + 0.5) / Math.floor(len / 2);
                  const lx = prev.x + dx * t;
                  const lz = prev.z + dz * t;
                  return (
                    <mesh key={li} position={[lx, 0.035, lz]} rotation={[-Math.PI / 2, 0, angle]}>
                      <planeGeometry args={[0.08, 0.8]} />
                      <meshStandardMaterial color="#FFD060" transparent opacity={0.5} />
                    </mesh>
                  );
                })}
              </group>
            )}

            {/* Edge lines for secondary roads */}
            {st.type === "secondary" && len > 2 && (
              <mesh position={[mx, 0.035, mz]} rotation={[-Math.PI / 2, 0, angle]}>
                <planeGeometry args={[0.05, len]} />
                <meshStandardMaterial color="#666" transparent opacity={0.3} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ── Terrain with fractal noise ──
const OSMTerrain = memo(function OSMTerrain({
  bounds,
}: {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}) {
  const padding = 60;
  const w = (bounds.maxX - bounds.minX) + padding * 2;
  const d = (bounds.maxZ - bounds.minZ) + padding * 2;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;

  const geometry = useMemo(() => {
    const res = 80;
    const geo = new THREE.PlaneGeometry(w, d, res, res);
    geo.rotateX(-Math.PI / 2);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);
      const cityRadius = Math.max(w, d) * 0.25;
      // Flat in city center, gentle hills at edges
      const edgeFactor = Math.max(0, (distFromCenter - cityRadius) / (Math.max(w, d) * 0.25));
      const clampedEdge = Math.min(1, edgeFactor);
      const noise =
        Math.sin(x * 0.02) * Math.cos(z * 0.03) * 1.2 +
        Math.sin(x * 0.06 + 3) * Math.cos(z * 0.05 + 5) * 0.6 +
        Math.sin(x * 0.12 + 7) * Math.sin(z * 0.1 + 2) * 0.3;
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
      <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 5, d * 5]} />
        <meshStandardMaterial color="#111418" roughness={1} />
      </mesh>
      {/* Horizon hills */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const dist = Math.max(w, d) * 0.8;
        const hh = 10 + Math.sin(i * 1.3) * 8;
        const hw = 40 + Math.sin(i * 0.7) * 25;
        return (
          <mesh key={i} position={[Math.cos(angle) * dist, hh / 2 - 4, Math.sin(angle) * dist]}>
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
  maxGLBBuildings = 40,
}: OSMWorldRendererProps) {
  const chunkX = Math.round(playerX / 10);
  const chunkZ = Math.round(playerZ / 10);

  const { polygonBuildings, boxBuildings, farBuildings } = useMemo(() => {
    const poly: CityBuilding[] = [];
    const box: CityBuilding[] = [];
    const far: CityBuilding[] = [];

    const userPositions = new Set(
      userBuildings.map(ub => `${Math.round(ub.coordinates.x / 3)}_${Math.round(ub.coordinates.z / 3)}`)
    );

    for (const b of buildings) {
      const cellKey = `${Math.round(b.coordinates.x / 3)}_${Math.round(b.coordinates.z / 3)}`;
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

      {/* User buildings (always rendered as polygon) */}
      {userBuildings.map(b => (
        <PolygonBuilding key={`user-${b.id}`} b={b} />
      ))}
    </group>
  );
});
