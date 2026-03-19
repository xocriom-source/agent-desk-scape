/**
 * WorldChunkRenderer — Renders buildings in visible chunks with LOD.
 * Optimized: reduced re-renders, better instancing, stable keys.
 */

import { memo, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { GLBBuildingModel } from "@/components/buildings/GLBBuildingModel";
import {
  generateChunk,
  getVisibleChunks,
  getTerrainHeight,
  CHUNK_SIZE,
  type WorldChunk,
  type WorldBuilding,
} from "@/systems/city/WorldGenerator";

// ── LOD thresholds ──
const LOD_GLB = 35;      // Within 35 units → full GLB
const LOD_BOX = 80;      // Within 80 → colored box
// Beyond 80 → instanced block

// ── Chunk cache ──
const chunkCache = new Map<string, WorldChunk>();

function getCachedChunk(cx: number, cz: number): WorldChunk {
  const key = `${cx},${cz}`;
  if (!chunkCache.has(key)) {
    chunkCache.set(key, generateChunk(cx, cz));
  }
  return chunkCache.get(key)!;
}

// ── Simple box building (medium LOD) — merged geometry approach ──
const BoxBuilding = memo(function BoxBuilding({ b }: { b: WorldBuilding }) {
  return (
    <mesh position={[b.x, b.y + b.h / 2, b.z]} rotation={[0, b.rot, 0]} castShadow>
      <boxGeometry args={[b.w, b.h, b.d]} />
      <meshStandardMaterial color={b.color} roughness={0.75} />
    </mesh>
  );
});

// ── GLB building (high detail) ──
const DetailBuilding = memo(function DetailBuilding({ b }: { b: WorldBuilding }) {
  return (
    <group position={[b.x, b.y, b.z]} rotation={[0, b.rot, 0]}>
      <GLBBuildingModel
        buildingId={`world-${b.seed}`}
        height={b.h}
        primaryColor={b.color}
        isSkyscraper={b.isSkyscraper}
      />
    </group>
  );
});

// ── Instanced far buildings — single draw call for hundreds ──
function FarBuildingInstances({ buildings }: { buildings: WorldBuilding[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = buildings.length;

  useEffect(() => {
    if (!meshRef.current || count === 0) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const b = buildings[i];
      dummy.position.set(b.x, b.y + b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.rotation.set(0, b.rot, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      color.set(b.color);
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [buildings, count]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}

// ── Street renderer using instanced meshes for perf ──
const ChunkStreets = memo(function ChunkStreets({ chunk }: { chunk: WorldChunk }) {
  return (
    <group>
      {chunk.streets.map((st, i) => {
        const dx = st.x2 - st.x1;
        const dz = st.z2 - st.z1;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.5) return null;
        const mx = (st.x1 + st.x2) / 2;
        const mz = (st.z1 + st.z2) / 2;
        const my = getTerrainHeight(mx, mz);
        const angle = Math.atan2(dx, dz);
        const color = st.isMain ? "#2A2A30" : "#222228";

        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, angle]} position={[mx, my + 0.01, mz]}>
            <planeGeometry args={[st.width, len]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        );
      })}
    </group>
  );
});

// ── Main World Chunk Renderer ──
interface WorldChunkRendererProps {
  playerX: number;
  playerZ: number;
  loadRadius?: number;
  maxGLBBuildings?: number;
}

export const WorldChunkRenderer = memo(function WorldChunkRenderer({
  playerX,
  playerZ,
  loadRadius = 5,
  maxGLBBuildings = 30,
}: WorldChunkRendererProps) {
  // Only recompute when player crosses chunk boundary
  const chunkX = Math.floor(playerX / CHUNK_SIZE);
  const chunkZ = Math.floor(playerZ / CHUNK_SIZE);

  const visibleChunkCoords = useMemo(
    () => getVisibleChunks(playerX, playerZ, loadRadius),
    [chunkX, chunkZ, loadRadius]
  );

  const { glbBuildings, boxBuildings, farBuildings, chunks } = useMemo(() => {
    const glb: WorldBuilding[] = [];
    const box: WorldBuilding[] = [];
    const far: WorldBuilding[] = [];
    const loadedChunks: WorldChunk[] = [];

    for (const cc of visibleChunkCoords) {
      const chunk = getCachedChunk(cc.cx, cc.cz);
      loadedChunks.push(chunk);

      for (const b of chunk.buildings) {
        const dx = b.x - playerX;
        const dz = b.z - playerZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < LOD_GLB && glb.length < maxGLBBuildings) {
          glb.push(b);
        } else if (dist < LOD_BOX) {
          box.push(b);
        } else {
          far.push(b);
        }
      }
    }

    return { glbBuildings: glb, boxBuildings: box, farBuildings: far, chunks: loadedChunks };
  }, [visibleChunkCoords, chunkX, chunkZ, playerX, playerZ, maxGLBBuildings]);

  return (
    <group>
      {/* Streets */}
      {chunks.map((chunk) => (
        <ChunkStreets key={chunk.key} chunk={chunk} />
      ))}

      {/* High detail GLB buildings */}
      {glbBuildings.map((b) => (
        <DetailBuilding key={`glb-${b.seed}`} b={b} />
      ))}

      {/* Medium detail box buildings */}
      {boxBuildings.map((b) => (
        <BoxBuilding key={`box-${b.seed}`} b={b} />
      ))}

      {/* Far instanced buildings */}
      <FarBuildingInstances buildings={farBuildings} />
    </group>
  );
});
