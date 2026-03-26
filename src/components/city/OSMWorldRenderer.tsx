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

// ── Urban color palettes — sophisticated readable tones ──
const FACADE_PALETTES = [
  { body: "#C8C0B8", base: "#9A9288", roof: "#787068" },
  { body: "#B0B8C0", base: "#808890", roof: "#606870" },
  { body: "#D0C8B8", base: "#A09888", roof: "#787068" },
  { body: "#A8B0B8", base: "#788088", roof: "#586068" },
  { body: "#C0B8A8", base: "#908878", roof: "#706858" },
  { body: "#B8C0C8", base: "#8890A0", roof: "#687080" },
  { body: "#C8C8C0", base: "#989890", roof: "#787870" },
  { body: "#B8B0A0", base: "#887870", roof: "#685850" },
  { body: "#A8B8C0", base: "#788898", roof: "#587080" },
  { body: "#C0C0B0", base: "#909080", roof: "#707060" },
  { body: "#D0D0C8", base: "#A0A098", roof: "#808078" },
  { body: "#B8B0B8", base: "#888088", roof: "#686068" },
];

function getBuildingPalette(seed: number) {
  return FACADE_PALETTES[seed % FACADE_PALETTES.length];
}

// ── Color variation ──
function varyColor(base: string, seed: number): string {
  const c = new THREE.Color(base);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.l = Math.max(0.2, Math.min(0.85, hsl.l + ((seed % 17) - 8) * 0.015));
  hsl.s = Math.max(0, Math.min(1, hsl.s + ((seed % 11) - 5) * 0.012));
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${c.getHexString()}`;
}

// ── Shared materials ──
const windowLitMat = new THREE.MeshStandardMaterial({
  color: "#D8E8FF", emissive: "#88AADD", emissiveIntensity: 0.4,
  transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.3
});
const windowWarmMat = new THREE.MeshStandardMaterial({
  color: "#FFE8C0", emissive: "#FFCC66", emissiveIntensity: 0.6,
  transparent: true, opacity: 0.65, roughness: 0.1, metalness: 0.2
});
const windowDimMat = new THREE.MeshStandardMaterial({
  color: "#8090A0", emissive: "#405060", emissiveIntensity: 0.08,
  transparent: true, opacity: 0.5, roughness: 0.2, metalness: 0.4
});
const windowDarkMat = new THREE.MeshStandardMaterial({
  color: "#506070", emissive: "#203040", emissiveIntensity: 0.03,
  transparent: true, opacity: 0.6, roughness: 0.15, metalness: 0.5
});
const aoMat = new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.15, depthWrite: false });
const roofEdgeMat = new THREE.MeshStandardMaterial({ color: "#909090", roughness: 0.5, metalness: 0.35 });
const bandMat = new THREE.MeshStandardMaterial({ color: "#707878", roughness: 0.6, metalness: 0.15 });
const roofTopMat = new THREE.MeshStandardMaterial({ color: "#606868", roughness: 0.7, metalness: 0.1 });
const roadMainMat = new THREE.MeshStandardMaterial({ color: "#686868", roughness: 0.78 });
const roadSecMat = new THREE.MeshStandardMaterial({ color: "#606060", roughness: 0.82 });
const roadAlleyMat = new THREE.MeshStandardMaterial({ color: "#585858", roughness: 0.85 });
const sidewalkMat = new THREE.MeshStandardMaterial({ color: "#B0B0A8", roughness: 0.6 });
const laneMat = new THREE.MeshStandardMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.65 });
const centerLineMat = new THREE.MeshStandardMaterial({ color: "#FFD840", transparent: true, opacity: 0.6 });
const grassMat = new THREE.MeshStandardMaterial({ color: "#5A9A48", roughness: 0.88 });
const trunkMat = new THREE.MeshStandardMaterial({ color: "#5A3A1A", roughness: 0.9 });

function pickWindowMat(seed: number, row: number, col: number) {
  const v = (seed + row * 7 + col * 13) % 10;
  if (v < 3) return windowLitMat;
  if (v < 5) return windowWarmMat;
  if (v < 7) return windowDimMat;
  return windowDarkMat;
}

// ── LOD 0: Full extruded polygon with architectural detail ──
const PolygonBuilding = memo(function PolygonBuilding({ b }: { b: CityBuilding }) {
  const polygon = (b as any).polygon as BuildingPolygon | undefined;
  const hasPolygon = !!(polygon?.vertices?.length && polygon.vertices.length >= 3);
  const fw = polygon?.w || 2;
  const fd = polygon?.d || 2;
  const h = b.height;

  const geometry = useMemo(() => {
    if (!hasPolygon || !polygon) return null;
    return getCachedGeometry(b.id, polygon, h);
  }, [b.id, hasPolygon, polygon, h]);

  const seed = useMemo(() => {
    let s = 0;
    for (let i = 0; i < Math.min(b.id.length, 8); i++) s += b.id.charCodeAt(i) * (i + 1);
    return Math.abs(s);
  }, [b.id]);

  const palette = useMemo(() => getBuildingPalette(seed), [seed]);
  const bodyMat = useMemo(() => getMat(varyColor(palette.body, seed), 0.55, 0.08), [palette.body, seed]);
  const baseMat = useMemo(() => getMat(palette.base, 0.7, 0.05), [palette.base]);
  const roofMat = useMemo(() => getMat(palette.roof, 0.65, 0.12), [palette.roof]);

  const isTall = h > 8;
  const isMid = h > 4 && h <= 8;
  const baseH = Math.min(h * 0.15, 1.5);

  const mainMesh = hasPolygon && geometry ? (
    <mesh geometry={geometry} material={bodyMat} castShadow receiveShadow />
  ) : (
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[Math.max(fw, 1), h, Math.max(fd, 1)]} />
      <primitive object={bodyMat} attach="material" />
    </mesh>
  );

  const windowRows = useMemo(() => {
    if (h < 3) return null;
    const rows: JSX.Element[] = [];
    const floorH = isTall ? 1.2 : 1.5;
    const numFloors = Math.max(1, Math.floor((h - baseH - 0.5) / floorH));
    const wSize = Math.min(fw * 0.12, 0.8);
    const wHeight = floorH * 0.5;
    const numW = Math.max(1, Math.floor((fw * 0.7) / (wSize + 0.3)));
    const numD = Math.max(1, Math.floor((fd * 0.7) / (wSize + 0.3)));
    const startW = -(numW - 1) * (wSize + 0.3) / 2;
    const startD = -(numD - 1) * (wSize + 0.3) / 2;

    for (let fl = 0; fl < Math.min(numFloors, 8); fl++) {
      const y = baseH + 0.4 + fl * floorH + floorH * 0.5;
      if (y > h - 0.5) break;
      for (let w = 0; w < numW; w++) {
        const x = startW + w * (wSize + 0.3);
        rows.push(
          <mesh key={`f${fl}w${w}`} position={[x, y, fd / 2 + 0.05]}>
            <planeGeometry args={[wSize, wHeight]} /><primitive object={pickWindowMat(seed, fl, w)} attach="material" />
          </mesh>,
          <mesh key={`b${fl}w${w}`} position={[x, y, -fd / 2 - 0.05]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[wSize, wHeight]} /><primitive object={pickWindowMat(seed, fl, w + 3)} attach="material" />
          </mesh>
        );
      }
      for (let w = 0; w < numD; w++) {
        const z = startD + w * (wSize + 0.3);
        rows.push(
          <mesh key={`r${fl}w${w}`} position={[fw / 2 + 0.05, y, z]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[wSize, wHeight]} /><primitive object={pickWindowMat(seed, fl, w + 6)} attach="material" />
          </mesh>,
          <mesh key={`l${fl}w${w}`} position={[-fw / 2 - 0.05, y, z]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[wSize, wHeight]} /><primitive object={pickWindowMat(seed, fl, w + 9)} attach="material" />
          </mesh>
        );
      }
    }
    return rows;
  }, [h, fw, fd, baseH, isTall, seed]);

  const bands = useMemo(() => {
    if (h < 5) return null;
    const result: JSX.Element[] = [];
    const floorH = isTall ? 1.2 : 1.5;
    const numBands = Math.min(Math.floor(h / floorH), 6);
    for (let i = 1; i <= numBands; i++) {
      const y = baseH + i * floorH;
      if (y > h - 0.5) break;
      result.push(
        <mesh key={`bf${i}`} position={[0, y, fd / 2 + 0.03]}><planeGeometry args={[fw + 0.06, 0.06]} /><primitive object={bandMat} attach="material" /></mesh>,
        <mesh key={`bb${i}`} position={[0, y, -fd / 2 - 0.03]} rotation={[0, Math.PI, 0]}><planeGeometry args={[fw + 0.06, 0.06]} /><primitive object={bandMat} attach="material" /></mesh>,
        <mesh key={`br${i}`} position={[fw / 2 + 0.03, y, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[fd + 0.06, 0.06]} /><primitive object={bandMat} attach="material" /></mesh>,
        <mesh key={`bl${i}`} position={[-fw / 2 - 0.03, y, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[fd + 0.06, 0.06]} /><primitive object={bandMat} attach="material" /></mesh>
      );
    }
    return result;
  }, [h, fw, fd, baseH, isTall]);

  return (
    <group position={[b.coordinates.x, 0, b.coordinates.z]}>
      {mainMesh}
      {h > 3 && (
        <mesh position={[0, baseH / 2, 0]} receiveShadow>
          <boxGeometry args={[fw + 0.08, baseH, fd + 0.08]} />
          <primitive object={baseMat} attach="material" />
        </mesh>
      )}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[fw + 1.0, fd + 1.0]} />
        <primitive object={aoMat} attach="material" />
      </mesh>
      {windowRows}
      {bands}
      {h > 3.5 && (
        <mesh position={[0, h + 0.06, 0]}>
          <boxGeometry args={[fw + 0.2, 0.12, fd + 0.2]} />
          <primitive object={roofEdgeMat} attach="material" />
        </mesh>
      )}
      {h > 2 && (
        <mesh position={[0, h + 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[fw - 0.1, fd - 0.1]} />
          <primitive object={roofTopMat} attach="material" />
        </mesh>
      )}
      {isTall && (
        <group position={[0, h + 0.14, 0]}>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[fw * 0.3, 0.5, fd * 0.3]} />
            <primitive object={roofMat} attach="material" />
          </mesh>
          {seed % 3 === 0 && (
            <mesh position={[fw * 0.15, 0.65, fd * 0.1]}>
              <cylinderGeometry args={[0.04, 0.04, 0.3, 4]} />
              <primitive object={roofEdgeMat} attach="material" />
            </mesh>
          )}
        </group>
      )}
      {isMid && seed % 2 === 0 && (
        <mesh position={[0, h * 0.65, 0]}>
          <boxGeometry args={[fw + 0.15, 0.08, fd + 0.15]} />
          <primitive object={bandMat} attach="material" />
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
  const seed = useMemo(() => {
    let s = 0;
    for (let i = 0; i < Math.min(b.id.length, 6); i++) s += b.id.charCodeAt(i) * (i + 1);
    return Math.abs(s);
  }, [b.id]);
  const palette = getBuildingPalette(seed);
  const material = useMemo(() => getMat(varyColor(palette.body, seed), 0.6, 0.06), [palette.body, seed]);

  return (
    <group position={[b.coordinates.x, 0, b.coordinates.z]}>
      <mesh position={[0, b.height / 2, 0]} castShadow>
        <boxGeometry args={[fw, b.height, fd]} />
        <primitive object={material} attach="material" />
      </mesh>
      {/* Cornice */}
      {b.height > 3 && (
        <mesh position={[0, b.height + 0.05, 0]}>
          <boxGeometry args={[fw + 0.15, 0.1, fd + 0.15]} />
          <primitive object={roofEdgeMat} attach="material" />
        </mesh>
      )}
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
        <meshStandardMaterial color="#78A860" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 3, d * 3]} />
        <meshStandardMaterial color="#5A8A42" roughness={0.92} />
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
