/**
 * CityNPCSystem — Premium pedestrian population.
 * Spawns/despawns NPCs based on player proximity.
 * Each NPC walks between waypoints with simple collision avoidance.
 * Visual: humanoid with distinct clothing, hair, accessories.
 */

import { useRef, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AABB } from "@/city/physics/CollisionSystem";
import { collidesAABB } from "@/city/physics/CollisionSystem";

interface NPCConfig {
  id: string;
  x: number;
  z: number;
  bodyColor: string;
  pantsColor: string;
  skinColor: string;
  hairColor: string;
  name: string;
  speed: number;
  hasHat: boolean;
  hasBag: boolean;
}

const SKIN_COLORS = ["#F5DEB3", "#D2B48C", "#C68642", "#8D5524", "#FFDBB4", "#E8BEAC", "#A0724A", "#FFD5B0"];
const BODY_COLORS = ["#5B7A9D", "#7D5A5A", "#5A7D6A", "#8B6B4A", "#6A5A8B", "#4A7A7A", "#9A6050", "#5A6A4A", "#7A5070", "#5070AA", "#AA7040", "#4A8060"];
const PANTS_COLORS = ["#3A3A50", "#4A4A3A", "#2A3A4A", "#3A2A2A", "#454530", "#2A2A3A", "#3A4A3A"];
const HAIR_COLORS = ["#2A1A0A", "#4A3020", "#6A4A30", "#1A1A1A", "#8A6A40", "#3A2A1A", "#9A7A50", "#5A3A2A"];
const NPC_NAMES = ["Kaori", "Atlas", "Nova", "Ren", "Lyra", "Kai", "Sage", "Rio", "Zara", "Leo", "Mika", "Yuki", "Sol", "Luna", "Sky", "Ava", "Hana", "Finn", "Echo", "Drift"];

function generateNPCs(count: number): NPCConfig[] {
  const npcs: NPCConfig[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = 3 + (i % 5) * 4 + Math.sin(i * 7.3) * 3;
    npcs.push({
      id: `npc-${i}`,
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      bodyColor: BODY_COLORS[i % BODY_COLORS.length],
      pantsColor: PANTS_COLORS[i % PANTS_COLORS.length],
      skinColor: SKIN_COLORS[i % SKIN_COLORS.length],
      hairColor: HAIR_COLORS[i % HAIR_COLORS.length],
      name: NPC_NAMES[i % NPC_NAMES.length],
      speed: 0.5 + (i % 4) * 0.12,
      hasHat: i % 4 === 0,
      hasBag: i % 3 === 0,
    });
  }
  return npcs;
}

/** Single NPC with humanoid body */
const CityNPC = memo(function CityNPC({ config, aabbs }: { config: NPCConfig; aabbs: AABB[] }) {
  const ref = useRef<THREE.Group>(null);
  const state = useRef({
    x: config.x,
    z: config.z,
    targetX: config.x + (Math.random() - 0.5) * 6,
    targetZ: config.z + (Math.random() - 0.5) * 6,
    waitTimer: Math.random() * 2,
    waiting: false,
    walkPhase: Math.random() * Math.PI * 2,
  });

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    const s = state.current;

    if (s.waiting) {
      s.waitTimer -= dt;
      if (s.waitTimer <= 0) {
        s.waiting = false;
        s.targetX = config.x + (Math.random() - 0.5) * 12;
        s.targetZ = config.z + (Math.random() - 0.5) * 12;
      }
    } else {
      const dx = s.targetX - s.x;
      const dz = s.targetZ - s.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.3) {
        s.waiting = true;
        s.waitTimer = 2 + Math.random() * 4;
      } else {
        const nx = s.x + (dx / dist) * config.speed * dt;
        const nz = s.z + (dz / dist) * config.speed * dt;

        if (!collidesAABB(nx, nz, 0.15, aabbs)) {
          s.x = nx;
          s.z = nz;
          s.walkPhase += dt * config.speed * 12;
        } else {
          s.targetX = s.x + (Math.random() - 0.5) * 6;
          s.targetZ = s.z + (Math.random() - 0.5) * 6;
        }

        ref.current.rotation.y = Math.atan2(dx, dz);
      }
    }

    ref.current.position.set(s.x, 0, s.z);
  });

  const walkSwing = Math.sin(state.current.walkPhase) * 0.15;

  return (
    <group ref={ref} position={[config.x, 0, config.z]}>
      {/* Legs */}
      <mesh position={[-0.05, 0.1, 0]}>
        <boxGeometry args={[0.07, 0.2, 0.08]} />
        <meshStandardMaterial color={config.pantsColor} />
      </mesh>
      <mesh position={[0.05, 0.1, 0]}>
        <boxGeometry args={[0.07, 0.2, 0.08]} />
        <meshStandardMaterial color={config.pantsColor} />
      </mesh>
      {/* Feet */}
      <mesh position={[-0.05, 0.015, 0.02]}>
        <boxGeometry args={[0.06, 0.03, 0.1]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>
      <mesh position={[0.05, 0.015, 0.02]}>
        <boxGeometry args={[0.06, 0.03, 0.1]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.2, 0.22, 0.14]} />
        <meshStandardMaterial color={config.bodyColor} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.14, 0.28, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.07]} />
        <meshStandardMaterial color={config.bodyColor} />
      </mesh>
      <mesh position={[0.14, 0.28, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.07]} />
        <meshStandardMaterial color={config.bodyColor} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.14, 0.17, 0]}>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshStandardMaterial color={config.skinColor} />
      </mesh>
      <mesh position={[0.14, 0.17, 0]}>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshStandardMaterial color={config.skinColor} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.14]} />
        <meshStandardMaterial color={config.skinColor} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 0.57, -0.01]}>
        <boxGeometry args={[0.16, 0.06, 0.15]} />
        <meshStandardMaterial color={config.hairColor} />
      </mesh>
      {/* Hat (some NPCs) */}
      {config.hasHat && (
        <mesh position={[0, 0.59, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 8]} />
          <meshStandardMaterial color={config.bodyColor} />
        </mesh>
      )}
      {/* Bag (some NPCs) */}
      {config.hasBag && (
        <mesh position={[0.12, 0.3, -0.06]}>
          <boxGeometry args={[0.04, 0.1, 0.08]} />
          <meshStandardMaterial color="#4A3A2A" />
        </mesh>
      )}
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 6]} />
        <meshBasicMaterial color="#000" transparent opacity={0.15} />
      </mesh>
    </group>
  );
});

interface CityNPCSystemProps {
  playerX: number;
  playerZ: number;
  aabbs: AABB[];
  maxNPCs?: number;
  spawnRadius?: number;
}

export const CityNPCSystem = memo(function CityNPCSystem({
  playerX,
  playerZ,
  aabbs,
  maxNPCs = 12,
  spawnRadius = 40,
}: CityNPCSystemProps) {
  const allNPCs = useMemo(() => generateNPCs(24), []);

  const quantizedX = Math.round(playerX / 2) * 2;
  const quantizedZ = Math.round(playerZ / 2) * 2;

  const visibleNPCs = useMemo(() => {
    return allNPCs
      .filter((npc) => {
        const dist = Math.hypot(npc.x - playerX, npc.z - playerZ);
        return dist < spawnRadius;
      })
      .slice(0, maxNPCs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNPCs, quantizedX, quantizedZ, spawnRadius, maxNPCs]);

  return (
    <group>
      {visibleNPCs.map((npc) => (
        <CityNPC key={npc.id} config={npc} aabbs={aabbs} />
      ))}
    </group>
  );
});
