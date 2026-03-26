/**
 * CityNPCSystem — Lightweight pedestrian population.
 * Spawns/despawns NPCs based on player proximity.
 * Each NPC walks between waypoints with simple collision avoidance.
 */

import { useRef, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { AABB } from "@/city/physics/CollisionSystem";
import { collidesAABB } from "@/city/physics/CollisionSystem";

interface NPCConfig {
  id: string;
  x: number;
  z: number;
  color: string;
  skinColor: string;
  name: string;
  speed: number;
}

const SKIN_COLORS = ["#F5DEB3", "#D2B48C", "#C68642", "#8D5524", "#FFDBB4", "#E8BEAC"];
const BODY_COLORS = ["#7A6B8A", "#8A7B6A", "#6B8A7A", "#9A7A6A", "#6A9A8A", "#6A8A9A", "#5A7A9A", "#9A6A7A", "#7A9A6A", "#6A6A9A"];
const NPC_NAMES = ["Kaori", "Atlas", "Nova", "Ren", "Lyra", "Kai", "Sage", "Rio", "Zara", "Leo", "Mika", "Yuki", "Sol", "Luna", "Sky", "Ava"];

function generateNPCs(count: number, worldSize: number): NPCConfig[] {
  const npcs: NPCConfig[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = 3 + (i % 5) * 4 + Math.sin(i * 7.3) * 3;
    npcs.push({
      id: `npc-${i}`,
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      color: BODY_COLORS[i % BODY_COLORS.length],
      skinColor: SKIN_COLORS[i % SKIN_COLORS.length],
      name: NPC_NAMES[i % NPC_NAMES.length],
      speed: 0.6 + (i % 4) * 0.15,
    });
  }
  return npcs;
}

/** Single NPC with wandering behavior */
const CityNPC = memo(function CityNPC({ config, aabbs }: { config: NPCConfig; aabbs: AABB[] }) {
  const ref = useRef<THREE.Group>(null);
  const state = useRef({
    x: config.x,
    z: config.z,
    targetX: config.x + (Math.random() - 0.5) * 6,
    targetZ: config.z + (Math.random() - 0.5) * 6,
    waitTimer: Math.random() * 2,
    waiting: false,
  });

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    const s = state.current;

    if (s.waiting) {
      s.waitTimer -= dt;
      if (s.waitTimer <= 0) {
        s.waiting = false;
        // Pick new target near origin
        const baseX = config.x;
        const baseZ = config.z;
        s.targetX = baseX + (Math.random() - 0.5) * 12;
        s.targetZ = baseZ + (Math.random() - 0.5) * 12;
      }
    } else {
      const dx = s.targetX - s.x;
      const dz = s.targetZ - s.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.3) {
        s.waiting = true;
        s.waitTimer = 2 + Math.random() * 4;
      } else {
        const speed = config.speed;
        const nx = s.x + (dx / dist) * speed * dt;
        const nz = s.z + (dz / dist) * speed * dt;

        if (!collidesAABB(nx, nz, 0.15, aabbs)) {
          s.x = nx;
          s.z = nz;
        } else {
          // Stuck — pick new target
          s.targetX = s.x + (Math.random() - 0.5) * 6;
          s.targetZ = s.z + (Math.random() - 0.5) * 6;
        }

        ref.current.rotation.y = Math.atan2(dx, dz);
      }
    }

    ref.current.position.set(s.x, 0, s.z);
  });

  const darkColor = new THREE.Color(config.color).multiplyScalar(0.7).getStyle();

  return (
    <group ref={ref} position={[config.x, 0, config.z]}>
      {/* Legs */}
      <mesh position={[-0.045, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.07]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      <mesh position={[0.045, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.07]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.18, 0.2, 0.12]} />
        <meshStandardMaterial color={config.color} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.12, 0.2, 0]}>
        <boxGeometry args={[0.05, 0.16, 0.06]} />
        <meshStandardMaterial color={config.skinColor} />
      </mesh>
      <mesh position={[0.12, 0.2, 0]}>
        <boxGeometry args={[0.05, 0.16, 0.06]} />
        <meshStandardMaterial color={config.skinColor} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshStandardMaterial color={config.skinColor} />
      </mesh>
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 6]} />
        <meshBasicMaterial color="#000" transparent opacity={0.12} />
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
  const allNPCs = useMemo(() => generateNPCs(20, 60), []);

  // Only render NPCs within spawn radius of player
  const visibleNPCs = useMemo(() => {
    return allNPCs
      .filter((npc) => {
        const dist = Math.hypot(npc.x - playerX, npc.z - playerZ);
        return dist < spawnRadius;
      })
      .slice(0, maxNPCs);
  }, [allNPCs, playerX, playerZ, spawnRadius, maxNPCs]);

  return (
    <group>
      {visibleNPCs.map((npc) => (
        <CityNPC key={npc.id} config={npc} aabbs={aabbs} />
      ))}
    </group>
  );
});
