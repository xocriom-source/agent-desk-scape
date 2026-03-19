/**
 * OSMWorldRenderer — Renders OSM-sourced buildings and streets with LOD + instancing.
 * This is the REAL WORLD renderer that replaces procedural generation when OSM data is loaded.
 */

import { memo, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { GLBBuildingModel } from "@/components/buildings/GLBBuildingModel";
import type { CityBuilding } from "@/types/building";
import type { OSMStreet } from "@/systems/city/OSMCityGenerator";

// ── LOD thresholds ──
const LOD_GLB = 25;   // Full GLB model
const LOD_BOX = 60;   // Colored box with windows
const LOD_INST = 120;  // Instanced silhouette
// Beyond 120 → not rendered

// ── Hash for determinism ──
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

// ── LOD 0: Full GLB Building ──
const GLBBuilding = memo(function GLBBuilding({ b }: { b: CityBuilding }) {
  const seed = hash(b.id);
  const rotation = (seed % 4) * Math.PI / 2;
  return (
    <group position={[b.coordinates.x, 0, b.coordinates.z]} rotation={[0, rotation, 0]}>
      <GLBBuildingModel
        buildingId={b.id}
        height={b.height}
        primaryColor={b.primaryColor}
        isSkyscraper={b.height > 8}
      />
    </group>
  );
});

// ── LOD 1: Colored box with emissive windows ──
const BoxBuilding = memo(function BoxBuilding({ b }: { b: CityBuilding }) {
  const fp = (b as any).footprint || { w: 2.5, d: 2.5 };
  const seed = hash(b.id);
  const rotation = (seed % 4) * Math.PI / 2;

  return (
    <group position={[b.coordinates.x, 0, b.coordinates.z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, b.height / 2, 0]} castShadow>
        <boxGeometry args={[fp.w, b.height, fp.d]} />
        <meshStandardMaterial color={b.primaryColor} roughness={0.75} />
      </mesh>
      {/* Window strips */}
      {b.height > 3 && (
        <>
          <mesh position={[fp.w / 2 + 0.01, b.height * 0.5, 0]}>
            <planeGeometry args={[0.01, b.height * 0.6]} />
            <meshStandardMaterial
              color="#FFDD88"
              emissive="#FFDD88"
              emissiveIntensity={0.4}
              transparent
              opacity={0.5}
            />
          </mesh>
          <mesh position={[0, b.height * 0.5, fp.d / 2 + 0.01]}>
            <planeGeometry args={[fp.w * 0.6, b.height * 0.6]} />
            <meshStandardMaterial
              color="#FFDD88"
              emissive="#FFDD88"
              emissiveIntensity={0.3}
              transparent
              opacity={0.4}
            />
          </mesh>
        </>
      )}
    </group>
  );
});

// ── LOD 2: Instanced far buildings (single draw call) ──
function FarBuildingInstances({ buildings }: { buildings: CityBuilding[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = buildings.length;

  useEffect(() => {
    if (!meshRef.current || count === 0) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const b = buildings[i];
      const fp = (b as any).footprint || { w: 2, d: 2 };
      dummy.position.set(b.coordinates.x, b.height / 2, b.coordinates.z);
      dummy.scale.set(fp.w, b.height, fp.d);
      dummy.rotation.set(0, (hash(b.id) % 4) * Math.PI / 2, 0);
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
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}

// ── Street Renderer with FULL geometry (segmented polylines) ──
const OSMStreetMeshes = memo(function OSMStreetMeshes({
  streets,
  playerX,
  playerZ,
}: {
  streets: OSMStreet[];
  playerX: number;
  playerZ: number;
}) {
  // Only render streets within view distance
  const visibleStreets = useMemo(() => {
    return streets.filter(st => {
      if (st.segments.length < 2) return false;
      // Check if any segment point is within range
      for (const pt of st.segments) {
        const dx = pt.x - playerX;
        const dz = pt.z - playerZ;
        if (dx * dx + dz * dz < 120 * 120) return true;
      }
      return false;
    });
  }, [streets, Math.round(playerX / 10), Math.round(playerZ / 10)]);

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
            if (len < 0.3) return null;
            const mx = (prev.x + pt.x) / 2;
            const mz = (prev.z + pt.z) / 2;
            const angle = Math.atan2(dx, dz);
            const color = st.type === "main" ? "#2A2A30" : st.type === "secondary" ? "#252530" : "#1E1E25";

            return (
              <mesh key={pi} position={[mx, 0.02, mz]} rotation={[-Math.PI / 2, 0, angle]}>
                <planeGeometry args={[st.width, len]} />
                <meshStandardMaterial color={color} roughness={0.85} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
});

// ── Terrain for OSM area ──
const OSMTerrain = memo(function OSMTerrain({
  bounds,
}: {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}) {
  const padding = 30;
  const w = (bounds.maxX - bounds.minX) + padding * 2;
  const d = (bounds.maxZ - bounds.minZ) + padding * 2;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;

  // Generate terrain with noise
  const geometry = useMemo(() => {
    const res = 48;
    const geo = new THREE.PlaneGeometry(w, d, res, res);
    geo.rotateX(-Math.PI / 2);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      // Subtle terrain variation - flatter in city center
      const distFromCenter = Math.sqrt(x * x + z * z);
      const edgeFactor = Math.min(1, distFromCenter / (Math.max(w, d) * 0.4));
      const noise = Math.sin(x * 0.05) * Math.cos(z * 0.07) * 0.3 +
                    Math.sin(x * 0.12 + 3) * Math.cos(z * 0.1 + 5) * 0.15;
      positions.setY(i, noise * edgeFactor);
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [w, d]);

  return (
    <group position={[cx, -0.05, cz]}>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#1A1E24" roughness={0.95} flatShading />
      </mesh>
      {/* Extended ground plane */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 3, d * 3]} />
        <meshStandardMaterial color="#111418" roughness={1} />
      </mesh>
      {/* Horizon hills */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = Math.max(w, d) * 0.8;
        const hh = 6 + Math.sin(i * 1.3) * 4;
        const hw = 30 + Math.sin(i * 0.7) * 15;
        return (
          <mesh key={i} position={[Math.cos(angle) * dist, hh / 2 - 2, Math.sin(angle) * dist]}>
            <sphereGeometry args={[hw, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2]} />
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
  maxGLBBuildings = 20,
}: OSMWorldRendererProps) {
  // Categorize buildings by LOD based on distance to player
  const { glbBuildings, boxBuildings, farBuildings } = useMemo(() => {
    const glb: CityBuilding[] = [];
    const box: CityBuilding[] = [];
    const far: CityBuilding[] = [];

    // Create a set of user building positions to check overlaps
    const userPositions = new Set(
      userBuildings.map(ub => `${Math.round(ub.coordinates.x / 3)}_${Math.round(ub.coordinates.z / 3)}`)
    );

    for (const b of buildings) {
      // Skip OSM buildings that overlap with user buildings
      const cellKey = `${Math.round(b.coordinates.x / 3)}_${Math.round(b.coordinates.z / 3)}`;
      if (userPositions.has(cellKey)) continue;

      const dx = b.coordinates.x - playerX;
      const dz = b.coordinates.z - playerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > LOD_INST) continue; // Too far, skip

      if (dist < LOD_GLB && glb.length < maxGLBBuildings) {
        glb.push(b);
      } else if (dist < LOD_BOX) {
        box.push(b);
      } else {
        far.push(b);
      }
    }

    return { glbBuildings: glb, boxBuildings: box, farBuildings: far };
  }, [buildings, playerX, playerZ, maxGLBBuildings, userBuildings, Math.round(playerX / 5), Math.round(playerZ / 5)]);

  return (
    <group>
      {/* Terrain */}
      <OSMTerrain bounds={bounds} />

      {/* Streets */}
      <OSMStreetMeshes streets={streets} playerX={playerX} playerZ={playerZ} />

      {/* GLB buildings (nearest) */}
      {glbBuildings.map(b => (
        <GLBBuilding key={b.id} b={b} />
      ))}

      {/* Box buildings (medium distance) */}
      {boxBuildings.map(b => (
        <BoxBuilding key={b.id} b={b} />
      ))}

      {/* Far instanced buildings */}
      <FarBuildingInstances buildings={farBuildings} />

      {/* User buildings (always rendered as GLB regardless of distance) */}
      {userBuildings.map(b => (
        <GLBBuilding key={`user-${b.id}`} b={b} />
      ))}
    </group>
  );
});
