/**
 * OSMWorldRenderer v7 — Progressive, non-blocking real world engine.
 * Real ExtrudeGeometry footprints, physical streets, trees, green areas,
 * natural color palette, proper city block structure.
 * 
 * Key improvements:
 * - Increased LOD distances for OSM scale
 * - Progressive building rendering (batched per frame)
 * - Instanced far buildings for performance
 * - Robust terrain that shows immediately
 */

import { memo, useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { CityBuilding } from "@/types/building";
import type { OSMStreet, BuildingPolygon, OSMTreeData, OSMGreenArea } from "@/systems/city/OSMCityGenerator";

// ── LOD thresholds (in world units, 1 unit = 2m) ──
const LOD_POLYGON = 120;  // < 240m: full extrude
const LOD_BOX = 300;      // < 600m: simple box
const LOD_INST = 600;     // < 1200m: instanced

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

// ── Color variation: deterministic subtle shift per building ──
function varyColor(base: string, seed: number): string {
  const c = new THREE.Color(base);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.l = Math.max(0.15, Math.min(0.85, hsl.l + ((seed % 17) - 8) * 0.012));
  hsl.s = Math.max(0, Math.min(1, hsl.s + ((seed % 11) - 5) * 0.015));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${c.getHexString()}`;
}

// ── Shared materials ──
const windowDayMat = new THREE.MeshStandardMaterial({ color: "#C8D8F0", emissive: "#6688BB", emissiveIntensity: 0.15, transparent: true, opacity: 0.45 });
const windowNightMat = new THREE.MeshStandardMaterial({ color: "#FFE8A0", emissive: "#FFD060", emissiveIntensity: 0.8, transparent: true, opacity: 0.6 });
const windowDimMat = new THREE.MeshStandardMaterial({ color: "#556677", emissive: "#334455", emissiveIntensity: 0.05, transparent: true, opacity: 0.3 });
const aoMat = new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.18, depthWrite: false });
const roofEdgeMat = new THREE.MeshStandardMaterial({ color: "#888", roughness: 0.6, metalness: 0.3 });
const roadMainMat = new THREE.MeshStandardMaterial({ color: "#606060", roughness: 0.82 });
const roadSecMat = new THREE.MeshStandardMaterial({ color: "#585858", roughness: 0.85 });
const roadAlleyMat = new THREE.MeshStandardMaterial({ color: "#505050", roughness: 0.9 });
const sidewalkMat = new THREE.MeshStandardMaterial({ color: "#8A8A8A", roughness: 0.65 });
const laneMat = new THREE.MeshStandardMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.6 });
const centerLineMat = new THREE.MeshStandardMaterial({ color: "#FFD030", transparent: true, opacity: 0.5 });
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

  // Vary color per building for visual interest
  const buildingColor = useMemo(() => {
    const seed = b.id.charCodeAt(0) + b.id.charCodeAt(b.id.length - 1) * 7;
    return varyColor(b.primaryColor, seed);
  }, [b.primaryColor, b.id]);

  const material = useMemo(() => getMat(buildingColor, 0.55, 0.1), [buildingColor]);
  const roofMat = useMemo(() => {
    const c = new THREE.Color(buildingColor).multiplyScalar(0.65);
    return getMat(c.getStyle(), 0.7, 0.1);
  }, [buildingColor]);

  // Deterministic window lighting pattern
  const windowSeed = useMemo(() => b.id.charCodeAt(2) || 0, [b.id]);
  const getWindowMat = (faceIndex: number) => {
    const lit = ((windowSeed + faceIndex * 3) % 5) > 1;
    return lit ? windowDayMat : windowDimMat;
  };

  const mainMesh = hasPolygon && geometry ? (
    <mesh geometry={geometry} material={material} castShadow receiveShadow />
  ) : (
    <mesh position={[0, b.height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[Math.max(fw, 1), b.height, Math.max(fd, 1)]} />
      <primitive object={material} attach="material" />
    </mesh>
  );

  const windowH = b.height * 0.65;
  const windowY = b.height * 0.45;

  return (
    <group position={[b.coordinates.x, 0, b.coordinates.z]}>
      {mainMesh}
      {/* AO shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[fw + 0.8, fd + 0.8]} />
        <primitive object={aoMat} attach="material" />
      </mesh>
      {/* Windows on all 4 faces for taller buildings */}
      {b.height > 2.5 && (
        <>
          {/* Front */}
          <mesh position={[0, windowY, fd / 2 + 0.04]}>
            <planeGeometry args={[fw * 0.75, windowH]} />
            <primitive object={getWindowMat(0)} attach="material" />
          </mesh>
          {/* Back */}
          <mesh position={[0, windowY, -fd / 2 - 0.04]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[fw * 0.75, windowH]} />
            <primitive object={getWindowMat(1)} attach="material" />
          </mesh>
          {/* Right */}
          <mesh position={[fw / 2 + 0.04, windowY, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[fd * 0.75, windowH]} />
            <primitive object={getWindowMat(2)} attach="material" />
          </mesh>
          {/* Left */}
          <mesh position={[-fw / 2 - 0.04, windowY, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[fd * 0.75, windowH]} />
            <primitive object={getWindowMat(3)} attach="material" />
          </mesh>
        </>
      )}
      {/* Roof ledge for taller buildings */}
      {b.height > 3.5 && (
        <mesh position={[0, b.height + 0.08, 0]}>
          <boxGeometry args={[fw + 0.12, 0.16, fd + 0.12]} />
          <primitive object={roofEdgeMat} attach="material" />
        </mesh>
      )}
      {/* Roof accent for mid buildings */}
      {b.height > 5 && b.height < 12 && (
        <mesh position={[0, b.height + 0.2, 0]}>
          <boxGeometry args={[fw * 0.4, 0.3, fd * 0.4]} />
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
  const viewDist = 250;
  const chunkX = Math.round(playerX / 40);
  const chunkZ = Math.round(playerZ / 40);

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
  const viewDist = 120;
  const chunkKey = `${Math.round(playerX / 30)}_${Math.round(playerZ / 30)}`;

  const visibleTrees = useMemo(() => {
    return trees.filter(t => {
      const dx = t.x - playerX;
      const dz = t.z - playerZ;
      return dx * dx + dz * dz < viewDist * viewDist;
    }).slice(0, 300);
  }, [trees, chunkKey]);

  const count = visibleTrees.length;

  useEffect(() => {
    if (!trunkRef.current || !canopyRef.current || count === 0) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const t = visibleTrees[i];
      const s = t.size;
      dummy.position.set(t.x, s * 0.8, t.z);
      dummy.scale.set(s * 0.15, s * 1.6, s * 0.15);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(t.x, s * 1.8, t.z);
      dummy.scale.set(s * 1.2, s * 1.4, s * 1.2);
      dummy.updateMatrix();
      canopyRef.current.setMatrixAt(i, dummy.matrix);
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
  const viewDist = 150;
  const chunkKey = `${Math.round(playerX / 40)}_${Math.round(playerZ / 40)}`;
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
  const padding = 60;
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
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#6A9A58" roughness={0.88} />
      </mesh>
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 3, d * 3]} />
        <meshStandardMaterial color="#4A7A3A" roughness={0.95} />
      </mesh>
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

// ── Progressive building loader — renders buildings in batches over frames ──
function useProgressiveBuildings(
  buildings: CityBuilding[],
  playerX: number,
  playerZ: number,
  maxGLBBuildings: number
) {
  const [renderedCount, setRenderedCount] = useState(0);
  const BATCH_SIZE = 30;
  const totalBuildings = buildings.length;

  // Reset when buildings change
  useEffect(() => {
    setRenderedCount(0);
    console.log(`[OSMWorldRenderer] Progressive load started: ${totalBuildings} buildings`);
  }, [totalBuildings]);

  // Progressively add more buildings each frame
  useFrame(() => {
    if (renderedCount < totalBuildings) {
      setRenderedCount(prev => Math.min(prev + BATCH_SIZE, totalBuildings));
    }
  });

  const chunkX = Math.round(playerX / 20);
  const chunkZ = Math.round(playerZ / 20);

  const result = useMemo(() => {
    const poly: CityBuilding[] = [];
    const box: CityBuilding[] = [];
    const far: CityBuilding[] = [];
    
    // Only process buildings up to renderedCount
    const activeBuildings = buildings.slice(0, renderedCount);

    const sorted = activeBuildings.map(b => {
      const dx = b.coordinates.x - playerX;
      const dz = b.coordinates.z - playerZ;
      return { b, dist: dx * dx + dz * dz };
    }).filter(({ dist }) => {
      return dist < LOD_INST * LOD_INST;
    }).sort((a, b) => a.dist - b.dist);

    for (const { b, dist } of sorted) {
      if (dist < LOD_POLYGON * LOD_POLYGON && poly.length < maxGLBBuildings) poly.push(b);
      else if (dist < LOD_BOX * LOD_BOX && box.length < 200) box.push(b);
      else far.push(b);
    }
    return { polygonBuildings: poly, boxBuildings: box, farBuildings: far };
  }, [buildings, renderedCount, playerX, playerZ, maxGLBBuildings, chunkX, chunkZ]);

  return { ...result, renderedCount, totalBuildings };
}

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
  buildings, streets, trees = [], greenAreas = [], bounds, playerX, playerZ, userBuildings = [], maxGLBBuildings = 80,
}: OSMWorldRendererProps) {

  const { polygonBuildings, boxBuildings, farBuildings, renderedCount, totalBuildings } = useProgressiveBuildings(
    buildings, playerX, playerZ, maxGLBBuildings
  );

  // Log progress
  useEffect(() => {
    if (renderedCount > 0 && renderedCount >= totalBuildings) {
      console.log(`[OSMWorldRenderer] All ${totalBuildings} buildings rendered. Poly: ${polygonBuildings.length}, Box: ${boxBuildings.length}, Far: ${farBuildings.length}`);
    }
  }, [renderedCount, totalBuildings, polygonBuildings.length, boxBuildings.length, farBuildings.length]);

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
