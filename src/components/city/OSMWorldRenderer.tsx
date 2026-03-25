/**
 * OSMWorldRenderer v6 — Arnis-level real world engine.
 * Real ExtrudeGeometry footprints, physical streets, trees, green areas,
 * natural color palette, proper city block structure.
 */

import { memo, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { CityBuilding } from "@/types/building";
import type { OSMStreet, BuildingPolygon, OSMTreeData, OSMGreenArea } from "@/systems/city/OSMCityGenerator";

// ── LOD thresholds ──
const LOD_POLYGON = 50;
const LOD_BOX = 120;
const LOD_INST = 250;

// ── Create ExtrudeGeometry from real polygon vertices ──
function createBuildingGeometry(polygon: BuildingPolygon, height: number): THREE.BufferGeometry {
  const verts = polygon.vertices;
  if (!verts || verts.length < 3) {
    return new THREE.BoxGeometry(Math.max(polygon.w, 1), height, Math.max(polygon.d, 1));
  }
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
    const area = Math.abs(THREE.ShapeUtils.area(shape.getPoints(12)));
    if (area < 0.1) {
      return new THREE.BoxGeometry(Math.max(polygon.w, 1), height, Math.max(polygon.d, 1));
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    return geo;
  } catch {
    return new THREE.BoxGeometry(Math.max(polygon.w, 1), height, Math.max(polygon.d, 1));
  }
}

// ── Caches ──
const geoCache = new Map<string, THREE.BufferGeometry>();
function getCachedGeometry(id: string, polygon: BuildingPolygon, height: number): THREE.BufferGeometry {
  if (!geoCache.has(id)) geoCache.set(id, createBuildingGeometry(polygon, height));
  return geoCache.get(id)!;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();
function getMat(color: string, roughness: number, metalness: number = 0.05): THREE.MeshStandardMaterial {
  const key = `${color}-${roughness}-${metalness}`;
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  }
  return matCache.get(key)!;
}

// ── Shared materials ──
const windowMat = new THREE.MeshStandardMaterial({ color: "#D0E0FF", emissive: "#88AADD", emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
const aoMat = new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.15, depthWrite: false });
const roadMainMat = new THREE.MeshStandardMaterial({ color: "#505050", roughness: 0.85 });
const roadSecMat = new THREE.MeshStandardMaterial({ color: "#484848", roughness: 0.85 });
const roadAlleyMat = new THREE.MeshStandardMaterial({ color: "#404040", roughness: 0.9 });
const sidewalkMat = new THREE.MeshStandardMaterial({ color: "#909090", roughness: 0.7 });
const laneMat = new THREE.MeshStandardMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.7 });
const centerLineMat = new THREE.MeshStandardMaterial({ color: "#FFD030", transparent: true, opacity: 0.6 });
const grassMat = new THREE.MeshStandardMaterial({ color: "#4A8B3F", roughness: 0.9 });
const trunkMat = new THREE.MeshStandardMaterial({ color: "#5A3A1A", roughness: 0.9 });

// ── LOD 0: Full extruded polygon ──
const PolygonBuilding = memo(function PolygonBuilding({ b }: { b: CityBuilding }) {
  const polygon = (b as any).polygon as BuildingPolygon | undefined;
  const hasPolygon = !!(polygon?.vertices?.length && polygon.vertices.length >= 3);
  const fw = polygon?.w || 2;
  const fd = polygon?.d || 2;

  const geometry = useMemo(() => {
    if (!hasPolygon || !polygon) return null;
    return getCachedGeometry(b.id, polygon, b.height);
  }, [b.id, hasPolygon, polygon, b.height]);

  const material = useMemo(() => getMat(b.primaryColor, 0.55, 0.1), [b.primaryColor]);
  const roofMat = useMemo(() => {
    const c = new THREE.Color(b.primaryColor).multiplyScalar(0.7);
    return getMat(c.getStyle(), 0.75);
  }, [b.primaryColor]);

  const mainMesh = hasPolygon && geometry ? (
    <mesh geometry={geometry} material={material} castShadow receiveShadow />
  ) : (
    <mesh position={[0, b.height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[Math.max(fw, 1), b.height, Math.max(fd, 1)]} />
      <primitive object={material} attach="material" />
    </mesh>
  );

  return (
    <group position={[b.coordinates.x, 0, b.coordinates.z]}>
      {mainMesh}
      {/* AO shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[fw + 0.6, fd + 0.6]} />
        <primitive object={aoMat} attach="material" />
      </mesh>
      {/* Windows */}
      {b.height > 3 && (
        <>
          <mesh position={[0, b.height * 0.45, fd / 2 + 0.05]}>
            <planeGeometry args={[fw * 0.8, b.height * 0.7]} />
            <primitive object={windowMat} attach="material" />
          </mesh>
          <mesh position={[fw / 2 + 0.05, b.height * 0.45, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[fd * 0.8, b.height * 0.7]} />
            <primitive object={windowMat} attach="material" />
          </mesh>
        </>
      )}
      {/* Roof ledge */}
      {b.height > 4 && (
        <mesh position={[0, b.height + 0.1, 0]}>
          <boxGeometry args={[fw + 0.15, 0.2, fd + 0.15]} />
          <primitive object={roofMat} attach="material" />
        </mesh>
      )}
    </group>
  );
});

// ── LOD 1: Simple box ──
const BoxBuilding = memo(function BoxBuilding({ b }: { b: CityBuilding }) {
  const polygon = (b as any).polygon as BuildingPolygon | undefined;
  const fw = Math.max(polygon?.w || 2, 1);
  const fd = Math.max(polygon?.d || 2, 1);
  const material = useMemo(() => getMat(b.primaryColor, 0.65), [b.primaryColor]);

  return (
    <group position={[b.coordinates.x, 0, b.coordinates.z]}>
      <mesh position={[0, b.height / 2, 0]} castShadow>
        <boxGeometry args={[fw, b.height, fd]} />
        <primitive object={material} attach="material" />
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
      const p = (b as any).polygon as BuildingPolygon | undefined;
      const fw = Math.max(p?.w || 2, 1);
      const fd = Math.max(p?.d || 2, 1);
      dummy.position.set(b.coordinates.x, b.height / 2, b.coordinates.z);
      dummy.scale.set(fw, b.height, fd);
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
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}

// ── Street segments ──
function StreetSegments({ street: st }: { street: OSMStreet }) {
  const roadMat = st.type === "main" ? roadMainMat : st.type === "secondary" ? roadSecMat : roadAlleyMat;

  return (
    <group>
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

        return (
          <group key={pi}>
            {/* Road surface */}
            <mesh position={[mx, 0.05, mz]} rotation={[-Math.PI / 2, 0, angle]}>
              <planeGeometry args={[st.width, len]} />
              <primitive object={roadMat} attach="material" />
            </mesh>
            {/* Sidewalks */}
            {st.type !== "alley" && (
              <>
                <mesh position={[mx + Math.cos(angle) * (st.width / 2 + 0.35), 0.08, mz - Math.sin(angle) * (st.width / 2 + 0.35)]} rotation={[-Math.PI / 2, 0, angle]}>
                  <planeGeometry args={[0.7, len]} />
                  <primitive object={sidewalkMat} attach="material" />
                </mesh>
                <mesh position={[mx - Math.cos(angle) * (st.width / 2 + 0.35), 0.08, mz + Math.sin(angle) * (st.width / 2 + 0.35)]} rotation={[-Math.PI / 2, 0, angle]}>
                  <planeGeometry args={[0.7, len]} />
                  <primitive object={sidewalkMat} attach="material" />
                </mesh>
              </>
            )}
            {/* Center line for main roads */}
            {st.type === "main" && len > 1 && (
              <mesh position={[mx, 0.055, mz]} rotation={[-Math.PI / 2, 0, angle]}>
                <planeGeometry args={[0.08, len * 0.9]} />
                <primitive object={centerLineMat} attach="material" />
              </mesh>
            )}
            {/* Edge lines */}
            {st.type !== "alley" && len > 1 && (
              <>
                <mesh position={[mx + Math.cos(angle) * (st.width / 2 - 0.1), 0.055, mz - Math.sin(angle) * (st.width / 2 - 0.1)]} rotation={[-Math.PI / 2, 0, angle]}>
                  <planeGeometry args={[0.06, len * 0.95]} />
                  <primitive object={laneMat} attach="material" />
                </mesh>
                <mesh position={[mx - Math.cos(angle) * (st.width / 2 - 0.1), 0.055, mz + Math.sin(angle) * (st.width / 2 - 0.1)]} rotation={[-Math.PI / 2, 0, angle]}>
                  <planeGeometry args={[0.06, len * 0.95]} />
                  <primitive object={laneMat} attach="material" />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

const OSMStreetMeshes = memo(function OSMStreetMeshes({ streets, playerX, playerZ }: { streets: OSMStreet[]; playerX: number; playerZ: number }) {
  const viewDist = 120;
  const chunkX = Math.round(playerX / 25);
  const chunkZ = Math.round(playerZ / 25);

  const visible = useMemo(() => {
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
      {visible.map((st, i) => <StreetSegments key={i} street={st} />)}
    </group>
  );
});

// ── Trees (instanced for performance) ──
function TreeInstances({ trees, playerX, playerZ }: { trees: OSMTreeData[]; playerX: number; playerZ: number }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const viewDist = 60;
  const chunkKey = `${Math.round(playerX / 20)}_${Math.round(playerZ / 20)}`;

  const visibleTrees = useMemo(() => {
    return trees.filter(t => {
      const dx = t.x - playerX;
      const dz = t.z - playerZ;
      return dx * dx + dz * dz < viewDist * viewDist;
    }).slice(0, 150); // Cap for performance
  }, [trees, chunkKey]);

  const count = visibleTrees.length;

  useEffect(() => {
    if (!trunkRef.current || !canopyRef.current || count === 0) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const t = visibleTrees[i];
      const s = t.size;
      // Trunk
      dummy.position.set(t.x, s * 0.8, t.z);
      dummy.scale.set(s * 0.15, s * 1.6, s * 0.15);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);
      // Canopy
      dummy.position.set(t.x, s * 1.8, t.z);
      dummy.scale.set(s * 1.2, s * 1.4, s * 1.2);
      dummy.updateMatrix();
      canopyRef.current.setMatrixAt(i, dummy.matrix);
      // Vary green
      const g = 0.35 + (i % 7) * 0.05;
      color.setRGB(0.15 + (i % 3) * 0.05, g, 0.1 + (i % 5) * 0.03);
      canopyRef.current.setColorAt(i, color);
    }

    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
    if (canopyRef.current.instanceColor) canopyRef.current.instanceColor.needsUpdate = true;
  }, [visibleTrees, count]);

  if (count === 0) return null;
  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} frustumCulled>
        <cylinderGeometry args={[0.5, 0.6, 1, 4]} />
        <primitive object={trunkMat} attach="material" />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, count]} frustumCulled>
        <sphereGeometry args={[0.5, 5, 4]} />
        <meshStandardMaterial color="#3A7A30" roughness={0.85} />
      </instancedMesh>
    </group>
  );
}

// ── Green areas (parks) ──
function GreenAreas({ areas, playerX, playerZ }: { areas: OSMGreenArea[]; playerX: number; playerZ: number }) {
  const viewDist = 80;
  const chunkKey = `${Math.round(playerX / 25)}_${Math.round(playerZ / 25)}`;
  const visible = useMemo(() => {
    return areas.filter(a => {
      const dx = a.cx - playerX;
      const dz = a.cz - playerZ;
      return dx * dx + dz * dz < viewDist * viewDist;
    });
  }, [areas, chunkKey]);

  return (
    <group>
      {visible.map((area, i) => (
        <mesh key={i} position={[area.cx, 0.06, area.cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[area.w, area.d]} />
          <primitive object={grassMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ── Terrain ──
const OSMTerrain = memo(function OSMTerrain({ bounds }: { bounds: { minX: number; maxX: number; minZ: number; maxZ: number } }) {
  const padding = 30;
  const w = (bounds.maxX - bounds.minX) + padding * 2;
  const d = (bounds.maxZ - bounds.minZ) + padding * 2;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;

  const geometry = useMemo(() => {
    const res = 40;
    const geo = new THREE.PlaneGeometry(w, d, res, res);
    geo.rotateX(-Math.PI / 2);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      const cityR = Math.max(w, d) * 0.22;
      const edge = Math.max(0, (dist - cityR) / (Math.max(w, d) * 0.2));
      const e = Math.min(1, edge);
      const noise = Math.sin(x * 0.015) * Math.cos(z * 0.02) * 2 +
        Math.sin(x * 0.05 + 3) * Math.cos(z * 0.04 + 5) * 0.8;
      positions.setY(i, noise * e * e);
    }
    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [w, d]);

  return (
    <group position={[cx, -0.02, cz]}>
      {/* Green base ground (like grass) */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#5A8A48" roughness={0.92} />
      </mesh>
      {/* Far ground */}
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 5, d * 5]} />
        <meshStandardMaterial color="#3A6A30" roughness={1} />
      </mesh>
      {/* Horizon hills — reduced count */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const dist = Math.max(w, d) * 0.85;
        const hh = 10 + Math.sin(i * 1.3) * 8;
        const hw = 45 + Math.sin(i * 0.7) * 25;
        return (
          <mesh key={i} position={[Math.cos(angle) * dist, hh / 2 - 4, Math.sin(angle) * dist]}>
            <sphereGeometry args={[hw, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#2A5A20" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
});

// ── Main renderer ──
interface OSMWorldRendererProps {
  buildings: CityBuilding[];
  streets: OSMStreet[];
  trees?: OSMTreeData[];
  greenAreas?: OSMGreenArea[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  playerX: number;
  playerZ: number;
  userBuildings?: CityBuilding[];
  maxGLBBuildings?: number;
}

export const OSMWorldRenderer = memo(function OSMWorldRenderer({
  buildings, streets, trees = [], greenAreas = [], bounds, playerX, playerZ, userBuildings = [], maxGLBBuildings = 40,
}: OSMWorldRendererProps) {
  const chunkX = Math.round(playerX / 15);
  const chunkZ = Math.round(playerZ / 15);

  const { polygonBuildings, boxBuildings, farBuildings } = useMemo(() => {
    const poly: CityBuilding[] = [];
    const box: CityBuilding[] = [];
    const far: CityBuilding[] = [];
    const userPos = new Set(userBuildings.map(ub => `${Math.round(ub.coordinates.x / 3)}_${Math.round(ub.coordinates.z / 3)}`));

    const sorted = buildings.map(b => {
      const dx = b.coordinates.x - playerX;
      const dz = b.coordinates.z - playerZ;
      return { b, dist: dx * dx + dz * dz }; // squared distance — skip sqrt
    }).filter(({ b, dist }) => {
      if (dist > LOD_INST * LOD_INST) return false;
      return !userPos.has(`${Math.round(b.coordinates.x / 3)}_${Math.round(b.coordinates.z / 3)}`);
    }).sort((a, b) => a.dist - b.dist);

    for (const { b, dist } of sorted) {
      if (dist < LOD_POLYGON * LOD_POLYGON && poly.length < maxGLBBuildings) poly.push(b);
      else if (dist < LOD_BOX * LOD_BOX && box.length < 120) box.push(b);
      else far.push(b);
    }
    return { polygonBuildings: poly, boxBuildings: box, farBuildings: far };
  }, [buildings, playerX, playerZ, maxGLBBuildings, userBuildings, chunkX, chunkZ]);

  return (
    <group>
      <OSMTerrain bounds={bounds} />
      <GreenAreas areas={greenAreas} playerX={playerX} playerZ={playerZ} />
      <OSMStreetMeshes streets={streets} playerX={playerX} playerZ={playerZ} />
      <TreeInstances trees={trees} playerX={playerX} playerZ={playerZ} />

      {polygonBuildings.map(b => <PolygonBuilding key={b.id} b={b} />)}
      {boxBuildings.map(b => <BoxBuilding key={b.id} b={b} />)}
      <FarBuildingInstances buildings={farBuildings} />
      {userBuildings.map(b => <PolygonBuilding key={`user-${b.id}`} b={b} />)}
    </group>
  );
});
