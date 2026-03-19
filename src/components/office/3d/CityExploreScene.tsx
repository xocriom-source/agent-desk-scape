import { useRef, useState, useMemo, useCallback, useEffect, memo } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import { WorldTerrain } from "@/components/city/WorldTerrain";
import { WorldChunkRenderer } from "@/components/city/WorldChunkRenderer";
import { OSMWorldRenderer } from "@/components/city/OSMWorldRenderer";
import { getTerrainHeight } from "@/systems/city/WorldGenerator";
import { useDayNight } from "@/hooks/useDayNight";
import { useCityBuildings } from "@/hooks/useCityBuildings";
import { Vehicle3D } from "@/components/city/Vehicle3D";
import { GLBBuildingModel, GLBDetailModel, preloadBuildingModels } from "@/components/buildings/GLBBuildingModel";
import type { CityBuilding } from "@/types/building";
import { STYLE_TRANSPORT_MAP } from "@/types/building";
import { useCityLod } from "@/systems/city/useCityLod";
import { QUALITY_PRESETS, type QualityLevel } from "@/systems/city/QualitySettings";
import type { OSMStreet } from "@/systems/city/OSMCityGenerator";

// Preload GLB models on module load
preloadBuildingModels();

// ── District data ──
const DISTRICTS = [
  { name: "Praça Central", emoji: "🏛️", x: 0, z: 0, radius: 5, color: "#10B981" },
  { name: "Distrito Criativo", emoji: "🎨", x: -14, z: -8, radius: 4, color: "#F59E0B" },
  { name: "Distrito Inovação", emoji: "🔬", x: 14, z: -8, radius: 4, color: "#6366F1" },
  { name: "Distrito Comércio", emoji: "🛍️", x: -14, z: 10, radius: 4, color: "#EF4444" },
  { name: "Distrito Social", emoji: "☕", x: 14, z: 10, radius: 4, color: "#EC4899" },
];

// ── Static building defs (expanded for a richer city) ──
const CITY_BUILDINGS = [
  // ── Distrito Criativo (creative district — studios & cafes) ──
  { x: -18, z: -12, w: 3.2, d: 2.8, h: 2.8, color: "#B85C38", rot: 0.15, mirror: false, forceClass: "creative_studio" as const },
  { x: -12, z: -12, w: 2.8, d: 2.4, h: 2.2, color: "#D4C5A9", rot: -0.1, mirror: true, forceClass: "cafe" as const },
  { x: -18, z: -6, w: 3.0, d: 2.6, h: 3.0, color: "#C4828A", rot: Math.PI / 2, mirror: false, forceClass: "creative_studio" as const },
  { x: -12, z: -6, w: 2.6, d: 2.6, h: 2.5, color: "#E8B4B8", rot: 0, mirror: true, forceClass: "cafe" as const },
  { x: -15, z: -9, w: 2.4, d: 2.2, h: 1.8, color: "#D4A040", rot: 0.3, mirror: false, forceClass: "shop" as const },
  { x: -21, z: -9, w: 2.6, d: 2.4, h: 2.0, color: "#9A7A5A", rot: -Math.PI / 4, mirror: true, forceClass: "creative_studio" as const },

  // ── Distrito Inovação (tech district — towers & offices) ──
  { x: 12, z: -12, w: 3.2, d: 2.8, h: 3.5, color: "#6B7B8D", rot: 0, mirror: false, forceClass: "tech_tower" as const },
  { x: 18, z: -12, w: 2.8, d: 2.4, h: 2.8, color: "#5A6A7D", rot: Math.PI, mirror: true, forceClass: "office" as const },
  { x: 12, z: -6, w: 2.8, d: 2.6, h: 2.5, color: "#3A7A6A", rot: 0.2, mirror: false, forceClass: "tech_tower" as const },
  { x: 18, z: -6, w: 2.6, d: 2.6, h: 3.2, color: "#7A8A9D", rot: -0.15, mirror: true, forceClass: "office" as const },
  { x: 15, z: -9, w: 2.2, d: 2.0, h: 2.4, color: "#4A5A6D", rot: Math.PI / 6, mirror: false, forceClass: "tech_tower" as const },
  { x: 21, z: -9, w: 2.4, d: 2.2, h: 1.8, color: "#5A6A8A", rot: 0, mirror: true, forceClass: "office" as const },

  // ── Distrito Comércio (commerce — shops & cafes) ──
  { x: -18, z: 8, w: 3.2, d: 2.8, h: 2.5, color: "#CD853F", rot: 0, mirror: false, forceClass: "shop" as const },
  { x: -12, z: 8, w: 2.8, d: 2.4, h: 2.2, color: "#B4D4E8", rot: Math.PI / 2, mirror: true, forceClass: "shop" as const },
  { x: -18, z: 14, w: 2.8, d: 2.6, h: 2.8, color: "#8B4513", rot: -0.2, mirror: false, forceClass: "cafe" as const },
  { x: -12, z: 14, w: 2.4, d: 2.4, h: 2.0, color: "#A0522D", rot: 0.4, mirror: true, forceClass: "shop" as const },
  { x: -15, z: 11, w: 2.6, d: 2.2, h: 1.6, color: "#E4B050", rot: 0, mirror: false, forceClass: "cafe" as const },
  { x: -21, z: 11, w: 2.8, d: 2.4, h: 2.2, color: "#6B3A3A", rot: Math.PI, mirror: true, forceClass: "shop" as const },

  // ── Distrito Social (social — cafes & creative studios) ──
  { x: 12, z: 8, w: 3.2, d: 2.8, h: 2.2, color: "#E8D4B4", rot: 0.1, mirror: false, forceClass: "cafe" as const },
  { x: 18, z: 8, w: 2.8, d: 2.4, h: 2.5, color: "#B8E8B4", rot: -0.2, mirror: true, forceClass: "creative_studio" as const },
  { x: 12, z: 14, w: 2.8, d: 2.6, h: 2.8, color: "#D4C5A9", rot: Math.PI / 3, mirror: false, forceClass: "cafe" as const },
  { x: 18, z: 14, w: 2.6, d: 2.6, h: 2.0, color: "#C4B08B", rot: 0, mirror: true, forceClass: "creative_studio" as const },
  { x: 15, z: 11, w: 2.4, d: 2.0, h: 1.8, color: "#B85C38", rot: -0.3, mirror: false, forceClass: "shop" as const },
  { x: 21, z: 11, w: 2.6, d: 2.2, h: 2.4, color: "#D49298", rot: 0.25, mirror: true, forceClass: "cafe" as const },

  // ── Main avenue buildings (mixed, rotated for variety) ──
  { x: -6, z: -14, w: 2.8, d: 2.4, h: 3.0, color: "#BFA980", rot: Math.PI / 2, mirror: false },
  { x: 0, z: -14, w: 3.2, d: 2.8, h: 3.5, color: "#6B5A4A", rot: 0, mirror: true },
  { x: 6, z: -14, w: 2.8, d: 2.4, h: 2.8, color: "#8B6B3A", rot: -Math.PI / 2, mirror: false },
  { x: -6, z: 18, w: 2.8, d: 2.4, h: 2.2, color: "#5A6A7A", rot: Math.PI, mirror: true },
  { x: 0, z: 18, w: 3.2, d: 2.8, h: 2.5, color: "#4A3040", rot: 0.5, mirror: false },
  { x: 6, z: 18, w: 2.8, d: 2.4, h: 2.0, color: "#7A5030", rot: -0.5, mirror: true },

  // ── Outer ring (varied rotations + mirrors) ──
  { x: -24, z: -4, w: 2.4, d: 2.2, h: 2.0, color: "#9A7A5A", rot: 0.7, mirror: false },
  { x: -24, z: 4, w: 2.6, d: 2.4, h: 2.4, color: "#6A4A3A", rot: -0.4, mirror: true },
  { x: 24, z: -4, w: 2.4, d: 2.2, h: 2.2, color: "#3A4A5A", rot: Math.PI / 3, mirror: false },
  { x: 24, z: 4, w: 2.6, d: 2.4, h: 1.8, color: "#4A5A7A", rot: -Math.PI / 3, mirror: true },
  { x: -8, z: -20, w: 2.4, d: 2.0, h: 2.0, color: "#C4828A", rot: 0.2, mirror: false },
  { x: 8, z: -20, w: 2.6, d: 2.2, h: 2.4, color: "#D4A040", rot: -0.2, mirror: true },
  { x: -8, z: 22, w: 2.4, d: 2.0, h: 1.8, color: "#B4D4E8", rot: Math.PI, mirror: false },
  { x: 8, z: 22, w: 2.6, d: 2.2, h: 2.2, color: "#E8B4B8", rot: 0, mirror: true },

  // ── Corner buildings (all mirrored alternating) ──
  { x: -22, z: -16, w: 2.6, d: 2.4, h: 2.6, color: "#8A7A5A", rot: Math.PI / 4, mirror: false },
  { x: 22, z: -16, w: 2.4, d: 2.2, h: 2.4, color: "#5A6A8A", rot: -Math.PI / 4, mirror: true },
  { x: -22, z: 16, w: 2.6, d: 2.4, h: 2.2, color: "#7A5A4A", rot: -Math.PI / 4, mirror: false },
  { x: 22, z: 16, w: 2.4, d: 2.2, h: 2.0, color: "#6A5A5A", rot: Math.PI / 4, mirror: true },

  // ── Extended city: distant buildings ──
  { x: -30, z: -20, w: 3.0, d: 2.6, h: 3.2, color: "#7A6A5A", rot: 0.6, mirror: false },
  { x: -36, z: -14, w: 2.8, d: 2.4, h: 2.8, color: "#5A4A3A", rot: -0.3, mirror: true },
  { x: -32, z: -8, w: 2.6, d: 2.2, h: 2.0, color: "#9A8A7A", rot: Math.PI / 2, mirror: false },
  { x: -36, z: 0, w: 3.2, d: 2.8, h: 3.5, color: "#6A5A4A", rot: 0, mirror: true },
  { x: -32, z: 8, w: 2.4, d: 2.0, h: 2.2, color: "#8A7A6A", rot: -Math.PI / 6, mirror: false },
  { x: -36, z: 14, w: 2.8, d: 2.4, h: 2.6, color: "#5A6A5A", rot: 0.4, mirror: true },
  { x: -30, z: 20, w: 3.0, d: 2.6, h: 3.0, color: "#7A8A7A", rot: Math.PI, mirror: false },

  { x: 30, z: -20, w: 3.0, d: 2.6, h: 3.0, color: "#5A6A7A", rot: -0.5, mirror: true },
  { x: 36, z: -14, w: 2.8, d: 2.4, h: 2.6, color: "#4A5A6A", rot: 0.3, mirror: false },
  { x: 32, z: -8, w: 2.6, d: 2.2, h: 2.2, color: "#6A7A8A", rot: -Math.PI / 2, mirror: true },
  { x: 36, z: 0, w: 3.2, d: 2.8, h: 3.4, color: "#3A4A5A", rot: 0, mirror: false },
  { x: 32, z: 8, w: 2.4, d: 2.0, h: 2.0, color: "#5A6A8A", rot: Math.PI / 6, mirror: true },
  { x: 36, z: 14, w: 2.8, d: 2.4, h: 2.8, color: "#7A8A9A", rot: -0.4, mirror: false },
  { x: 30, z: 20, w: 3.0, d: 2.6, h: 2.8, color: "#4A6A7A", rot: Math.PI, mirror: true },

  { x: -20, z: -28, w: 2.8, d: 2.4, h: 2.6, color: "#8A6A5A", rot: 0.2, mirror: false },
  { x: -10, z: -28, w: 2.6, d: 2.2, h: 3.0, color: "#6A5A4A", rot: -0.2, mirror: true },
  { x: 0, z: -28, w: 3.0, d: 2.6, h: 3.2, color: "#5A4A3A", rot: 0, mirror: false },
  { x: 10, z: -28, w: 2.6, d: 2.2, h: 2.8, color: "#7A6A5A", rot: 0.6, mirror: true },
  { x: 20, z: -28, w: 2.8, d: 2.4, h: 2.4, color: "#4A5A4A", rot: -0.6, mirror: false },

  { x: -20, z: 28, w: 2.8, d: 2.4, h: 2.4, color: "#5A7A6A", rot: Math.PI / 3, mirror: true },
  { x: -10, z: 28, w: 2.6, d: 2.2, h: 2.8, color: "#7A8A6A", rot: -Math.PI / 3, mirror: false },
  { x: 0, z: 28, w: 3.0, d: 2.6, h: 3.0, color: "#4A6A5A", rot: 0, mirror: true },
  { x: 10, z: 28, w: 2.6, d: 2.2, h: 2.6, color: "#6A7A6A", rot: 0.5, mirror: false },
  { x: 20, z: 28, w: 2.8, d: 2.4, h: 2.2, color: "#8A9A7A", rot: -0.5, mirror: true },

  // ── Far outer ring ──
  { x: -42, z: -10, w: 3.0, d: 2.6, h: 3.0, color: "#5A5A5A", rot: 0.8, mirror: false },
  { x: -42, z: 10, w: 2.8, d: 2.4, h: 2.6, color: "#6A6A6A", rot: -0.8, mirror: true },
  { x: 42, z: -10, w: 3.0, d: 2.6, h: 2.8, color: "#4A4A5A", rot: Math.PI / 4, mirror: false },
  { x: 42, z: 10, w: 2.8, d: 2.4, h: 3.2, color: "#5A5A6A", rot: -Math.PI / 4, mirror: true },
  { x: -28, z: -34, w: 2.6, d: 2.2, h: 2.4, color: "#7A6A6A", rot: 0, mirror: false },
  { x: 0, z: -36, w: 3.2, d: 2.8, h: 3.6, color: "#5A5A4A", rot: 0.3, mirror: true },
  { x: 28, z: -34, w: 2.6, d: 2.2, h: 2.6, color: "#6A5A5A", rot: -0.3, mirror: false },
  { x: -28, z: 34, w: 2.6, d: 2.2, h: 2.2, color: "#5A6A5A", rot: Math.PI, mirror: true },
  { x: 0, z: 36, w: 3.2, d: 2.8, h: 3.4, color: "#4A5A4A", rot: 0, mirror: false },
  { x: 28, z: 34, w: 2.6, d: 2.2, h: 2.8, color: "#6A7A5A", rot: -Math.PI, mirror: true },

  // Ultra distant
  { x: -50, z: 0, w: 3.0, d: 2.6, h: 3.0, color: "#4A4A4A", rot: 0, mirror: false },
  { x: 50, z: 0, w: 3.0, d: 2.6, h: 3.2, color: "#3A3A4A", rot: Math.PI, mirror: true },
  { x: 0, z: -48, w: 3.2, d: 2.8, h: 3.4, color: "#4A4A3A", rot: 0.5, mirror: false },
  { x: 0, z: 48, w: 3.2, d: 2.8, h: 3.0, color: "#3A4A3A", rot: -0.5, mirror: true },
  { x: -40, z: -30, w: 2.8, d: 2.4, h: 2.6, color: "#5A4A4A", rot: Math.PI / 3, mirror: false },
  { x: 40, z: -30, w: 2.8, d: 2.4, h: 2.8, color: "#4A4A5A", rot: -Math.PI / 3, mirror: true },
  { x: -40, z: 30, w: 2.8, d: 2.4, h: 2.4, color: "#4A5A5A", rot: 0, mirror: false },
  { x: 40, z: 30, w: 2.8, d: 2.4, h: 3.0, color: "#5A5A4A", rot: Math.PI, mirror: true },
];

// ── NPC data ──
const NPC_DATA = [
  { x: 2, z: 1, color: "#7A6B8A", name: "Kaori" },
  { x: -2, z: -1, color: "#8A7B6A", name: "Atlas" },
  { x: 0, z: 3, color: "#6B8A7A", name: "Nova" },
  { x: -10, z: -3, color: "#9A7A6A", name: "Corretor" },
  { x: 8, z: 5, color: "#6A9A8A", name: "Turista" },
  { x: 5, z: -5, color: "#6A8A9A", name: "Músico" },
];

// ── AABB collision system ──
interface AABB {
  minX: number; maxX: number;
  minZ: number; maxZ: number;
}

const COLLISION_MARGIN = 0.3;

function buildAABBs(staticBuildings: typeof CITY_BUILDINGS, dynamicBuildings: { coordinates: { x: number; z: number } }[]): AABB[] {
  const aabbs: AABB[] = [];
  for (const b of staticBuildings) {
    aabbs.push({
      minX: b.x - b.w / 2 - COLLISION_MARGIN,
      maxX: b.x + b.w / 2 + COLLISION_MARGIN,
      minZ: b.z - b.d / 2 - COLLISION_MARGIN,
      maxZ: b.z + b.d / 2 + COLLISION_MARGIN,
    });
  }
  for (const b of dynamicBuildings) {
    const hw = 1.4; // half-width of dynamic buildings
    aabbs.push({
      minX: b.coordinates.x - hw,
      maxX: b.coordinates.x + hw,
      minZ: b.coordinates.z - hw,
      maxZ: b.coordinates.z + hw,
    });
  }
  // Plaza fountain
  aabbs.push({ minX: -1.2, maxX: 1.2, minZ: -1.2, maxZ: 1.2 });
  return aabbs;
}

function collidesAABB(x: number, z: number, radius: number, aabbs: AABB[]): boolean {
  for (const b of aabbs) {
    if (x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ) {
      return true;
    }
  }
  return false;
}

// Slide collision: try full movement, then axis-separated
function moveWithCollision(
  curX: number, curZ: number, dx: number, dz: number, radius: number, aabbs: AABB[]
): [number, number] {
  // Try full move
  if (!collidesAABB(curX + dx, curZ + dz, radius, aabbs)) {
    return [curX + dx, curZ + dz];
  }
  // Try X only
  if (dx !== 0 && !collidesAABB(curX + dx, curZ, radius, aabbs)) {
    return [curX + dx, curZ];
  }
  // Try Z only
  if (dz !== 0 && !collidesAABB(curX, curZ + dz, radius, aabbs)) {
    return [curX, curZ + dz];
  }
  return [curX, curZ];
}

// ── Dynamic building (user-owned) using GLB models ──
function LightBuilding3D({ building, highlighted, onClick, occluded }: {
  building: CityBuilding; highlighted?: boolean; onClick?: () => void; occluded?: boolean;
}) {
  const h = building.height;
  const w = 2.4;
  const [hovered, setHovered] = useState(false);

  if (occluded) return null;

  return (
    <group
      position={[building.coordinates.x, 0, building.coordinates.z]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <GLBBuildingModel
        buildingId={building.id}
        height={h}
        primaryColor={building.primaryColor}
        isSkyscraper={h > 7}
      />
      {/* Highlight ring */}
      {(highlighted || hovered) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[w * 0.6, w * 0.6 + 0.4, 6]} />
          <meshStandardMaterial
            color={building.primaryColor}
            emissive={building.primaryColor}
            emissiveIntensity={0.8}
            transparent opacity={hovered ? 0.4 : 0.6}
          />
        </mesh>
      )}
      {hovered && (
        <Html position={[0, h + 1, 0]} center>
          <div className="px-2 py-1 rounded-lg bg-background/90 border border-border text-foreground text-[10px] whitespace-nowrap pointer-events-none backdrop-blur-sm">
            <span className="font-bold">{building.name}</span>
            <span className="text-muted-foreground ml-1">• Visitar</span>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Static building using GLB models ──
function StaticBuildingOccludable({ x, z, w, d, h, color, occluded, seed, lod, rotation, mirror, forceClass }: {
  x: number; z: number; w: number; d: number; h: number; color: string; occluded?: boolean; seed: number; lod?: number;
  rotation?: number; mirror?: boolean; forceClass?: string;
}) {
  if (occluded) return null;
  // Use a deterministic ID based on position
  const buildingId = `static-${x}-${z}-${seed}`;
  return (
    <group position={[x, 0, z]} rotation={[0, rotation || 0, 0]} scale={[mirror ? -1 : 1, 1, 1]}>
      <GLBBuildingModel
        buildingId={buildingId}
        height={h}
        primaryColor={color}
        isSkyscraper={h > 3}
      />
    </group>
  );
}

// ── Simplified Plaza ──
function CityPlaza() {
  return (
    <group>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#B0A890" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.9, 1, 0.24, 12]} />
        <meshStandardMaterial color="#6B6B78" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.06, 12]} />
        <meshStandardMaterial color="#3A80B0" transparent opacity={0.55} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
        <meshStandardMaterial color="#8A8A98" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#C0A870" metalness={0.6} roughness={0.3} />
      </mesh>
      {[[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 1, 4]} />
            <meshStandardMaterial color="#5A3A20" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.5, 6, 6]} />
            <meshStandardMaterial color="#2D5A1E" />
          </mesh>
        </group>
      ))}
      {[[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]].map(([lx, lz], i) => (
        <group key={`l${i}`} position={[lx, 0, lz]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.025, 0.04, 1.8, 4]} />
            <meshStandardMaterial color="#333" metalness={0.6} />
          </mesh>
          <mesh position={[0, 1.82, 0]}>
            <sphereGeometry args={[0.04, 4, 4]} />
            <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── NPC ──
function CityNPC({ startX, startZ, color, aabbs }: { startX: number; startZ: number; color: string; aabbs: AABB[] }) {
  const ref = useRef<THREE.Group>(null);
  const posRef = useRef({ x: startX, z: startZ, targetX: startX, targetZ: startZ });
  const timerRef = useRef(Math.random() * 3);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    const p = posRef.current;
    const dx = p.targetX - p.x;
    const dz = p.targetZ - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.3) {
      timerRef.current += dt;
      if (timerRef.current > 4 + Math.random() * 5) {
        timerRef.current = 0;
        // Pick new target, prefer roads (near axis lines)
        const axis = Math.random() > 0.5;
        p.targetX = axis ? (Math.random() - 0.5) * 30 : startX + (Math.random() - 0.5) * 8;
        p.targetZ = axis ? startZ + (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 30;
      }
    } else {
      const speed = 0.8;
      const nx = p.x + (dx / dist) * speed * dt;
      const nz = p.z + (dz / dist) * speed * dt;
      if (!collidesAABB(nx, nz, 0.15, aabbs)) {
        p.x = nx;
        p.z = nz;
      } else {
        // Pick new target immediately
        timerRef.current = 99;
      }
      ref.current.rotation.y = Math.atan2(dx, dz);
    }
    ref.current.position.set(p.x, 0, p.z);
  });

  const darkColor = new THREE.Color(color).multiplyScalar(0.7).getStyle();

  return (
    <group ref={ref} position={[startX, 0, startZ]}>
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.18, 0.24, 0.12]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.14, 0.14, 0.14]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[-0.045, 0.05, 0]}><boxGeometry args={[0.06, 0.1, 0.07]} /><meshStandardMaterial color={darkColor} /></mesh>
      <mesh position={[0.045, 0.05, 0]}><boxGeometry args={[0.06, 0.1, 0.07]} /><meshStandardMaterial color={darkColor} /></mesh>
    </group>
  );
}

// ── Ground + Roads (kept for procedural mode, but now layered on terrain) ──
function CityGround() {
  return (
    <group>
      {/* Main cross roads */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 60]} />
        <meshStandardMaterial color="#2A2A30" />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 2]} />
        <meshStandardMaterial color="#2A2A30" />
      </mesh>
      {/* Ring roads */}
      {[
        [0, -7, 20, 1.5], [0, 7, 20, 1.5], [-7, 0, 1.5, 20], [7, 0, 1.5, 20],
      ].map(([x, z, w, h], i) => (
        <mesh key={i} position={[x, 0.014, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#282830" />
        </mesh>
      ))}
      {/* Sidewalks along main roads */}
      {[
        [1.3, 0, 0.5, 60], [-1.3, 0, 0.5, 60],
        [0, 1.3, 60, 0.5], [0, -1.3, 60, 0.5],
      ].map(([x, z, w, h], i) => (
        <mesh key={`sw-${i}`} position={[x, 0.013, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#252530" />
        </mesh>
      ))}
      {/* District ground indicators */}
      {DISTRICTS.slice(1).map((d, i) => (
        <mesh key={i} position={[d.x, 0.008, d.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[d.radius, 16]} />
          <meshStandardMaterial color={d.color} transparent opacity={0.06} />
        </mesh>
      ))}
    </group>
  );
}

// ── Street Lights — emissive only, NO point lights for FPS ──
const StreetLights = memo(function StreetLights() {
  const dn = useDayNight();
  const emissiveBoost = dn.isNight ? 4 : dn.isSunset ? 2 : 1;

  const positions = useMemo(() => {
    const pts: { x: number; z: number; h: number }[] = [];
    for (let v = -28; v <= 28; v += 8) {
      if (Math.abs(v) < 5) continue;
      pts.push({ x: 1.8, z: v, h: 2.2 });
      pts.push({ x: -1.8, z: v, h: 2.2 });
      pts.push({ x: v, z: 1.8, h: 2.2 });
      pts.push({ x: v, z: -1.8, h: 2.2 });
    }
    return pts;
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, p.h / 2, 0]}>
            <cylinderGeometry args={[0.02, 0.035, p.h, 4]} />
            <meshStandardMaterial color="#2A2A2A" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, p.h + 0.03, 0]}>
            <sphereGeometry args={[0.045, 4, 4]} />
            <meshStandardMaterial
              color="#FFE8A0"
              emissive="#FFD060"
              emissiveIntensity={emissiveBoost}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
});

// ── Landscaping: Trees, Bushes, Flower Beds, Park Benches ──
function CityTree({ x, z, scale = 1, variant = 0 }: { x: number; z: number; scale?: number; variant?: number }) {
  const trunkH = 0.6 * scale;
  const crownColors = ["#1A6B2A", "#2D5A1E", "#1B7A30", "#3A7A2A"];
  const crownColor = crownColors[variant % crownColors.length];
  const crownSize = (0.5 + variant * 0.08) * scale;

  return (
    <group position={[x, 0, z]}>
      {/* Trunk */}
      <mesh position={[0, trunkH / 2, 0]}>
        <cylinderGeometry args={[0.04 * scale, 0.07 * scale, trunkH, 5]} />
        <meshStandardMaterial color="#5A3A20" roughness={0.9} />
      </mesh>
      {/* Crown layers */}
      <mesh position={[0, trunkH + crownSize * 0.4, 0]}>
        <sphereGeometry args={[crownSize, 6, 5]} />
        <meshStandardMaterial color={crownColor} roughness={0.85} />
      </mesh>
      {variant % 2 === 0 && (
        <mesh position={[crownSize * 0.3, trunkH + crownSize * 0.2, crownSize * 0.2]}>
          <sphereGeometry args={[crownSize * 0.6, 5, 4]} />
          <meshStandardMaterial color={crownColor} roughness={0.85} />
        </mesh>
      )}
      {/* Shadow circle */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[crownSize * 1.2, 6]} />
        <meshBasicMaterial color="#000" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

function Bush({ x, z, color = "#2A6A2A" }: { x: number; z: number; color?: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.18, 5, 4]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.1, 0.08]}>
        <sphereGeometry args={[0.12, 4, 3]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

function FlowerBed({ x, z, w = 1.5, d = 0.5 }: { x: number; z: number; w?: number; d?: number }) {
  const flowers = useMemo(() => {
    const f: { ox: number; oz: number; color: string }[] = [];
    const colors = ["#FF6B8A", "#FFB347", "#87CEEB", "#DDA0DD", "#FF69B4", "#FFA500"];
    for (let i = 0; i < 8; i++) {
      f.push({
        ox: (Math.random() - 0.5) * w * 0.8,
        oz: (Math.random() - 0.5) * d * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return f;
  }, [w, d]);

  return (
    <group position={[x, 0, z]}>
      {/* Soil bed */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[w, 0.06, d]} />
        <meshStandardMaterial color="#3A2A18" roughness={0.95} />
      </mesh>
      {/* Border */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[w + 0.06, 0.04, d + 0.06]} />
        <meshStandardMaterial color="#6B6B6B" roughness={0.8} />
      </mesh>
      {/* Flowers */}
      {flowers.map((f, i) => (
        <group key={i} position={[f.ox, 0.08, f.oz]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.06, 3]} />
            <meshStandardMaterial color="#3A6A2A" />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <sphereGeometry args={[0.025, 4, 3]} />
            <meshStandardMaterial color={f.color} emissive={f.color} emissiveIntensity={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ParkBench({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.6, 0.03, 0.22]} />
        <meshStandardMaterial color="#8B6B3A" roughness={0.85} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.35, -0.09]}>
        <boxGeometry args={[0.6, 0.2, 0.02]} />
        <meshStandardMaterial color="#8B6B3A" roughness={0.85} />
      </mesh>
      {/* Legs */}
      {[-0.25, 0.25].map((lx, i) => (
        <mesh key={i} position={[lx, 0.11, 0]}>
          <boxGeometry args={[0.03, 0.22, 0.18]} />
          <meshStandardMaterial color="#333" metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function CityLandscaping() {
  return (
    <group>
      {/* Trees along main roads */}
      {[-20, -14, -8, 8, 14, 20].map((v, i) => (
        <group key={`roadtrees-${i}`}>
          <CityTree x={2.5} z={v} scale={0.9} variant={i} />
          <CityTree x={-2.5} z={v} scale={0.85} variant={i + 1} />
          <CityTree x={v} z={2.5} scale={0.9} variant={i + 2} />
          <CityTree x={v} z={-2.5} scale={0.85} variant={i + 3} />
        </group>
      ))}

      {/* Park area near Praça Central */}
      <CityTree x={-5.5} z={-5.5} scale={1.1} variant={0} />
      <CityTree x={5.5} z={-5.5} scale={1.0} variant={1} />
      <CityTree x={-5.5} z={5.5} scale={1.0} variant={2} />
      <CityTree x={5.5} z={5.5} scale={1.1} variant={3} />

      {/* Bushes along sidewalks */}
      {[-16, -10, 10, 16].map((v, i) => (
        <group key={`bushes-${i}`}>
          <Bush x={2.2} z={v + 1} />
          <Bush x={-2.2} z={v - 1} color="#1A5A2A" />
          <Bush x={v + 1} z={2.2} color="#2A7A3A" />
          <Bush x={v - 1} z={-2.2} />
        </group>
      ))}

      {/* Flower beds at district entrances */}
      <FlowerBed x={-9} z={-7} w={1.2} d={0.4} />
      <FlowerBed x={9} z={-7} w={1.2} d={0.4} />
      <FlowerBed x={-9} z={7} w={1.2} d={0.4} />
      <FlowerBed x={9} z={7} w={1.2} d={0.4} />

      {/* Flower beds near plaza */}
      <FlowerBed x={-3} z={-6} w={2} d={0.5} />
      <FlowerBed x={3} z={6} w={2} d={0.5} />

      {/* Park benches */}
      <ParkBench x={-6} z={-4} rotation={Math.PI / 4} />
      <ParkBench x={6} z={-4} rotation={-Math.PI / 4} />
      <ParkBench x={-6} z={4} rotation={-Math.PI / 4} />
      <ParkBench x={6} z={4} rotation={Math.PI / 4} />
      <ParkBench x={3} z={-2.5} rotation={0} />
      <ParkBench x={-3} z={2.5} rotation={Math.PI} />

      {/* Green patches (grass areas) */}
      {[
        [-8, -10, 3, 2], [8, -10, 3, 2],
        [-8, 10, 3, 2], [8, 10, 3, 2],
        [-20, 2, 2, 3], [20, 2, 2, 3],
      ].map(([gx, gz, gw, gd], i) => (
        <mesh key={`grass-${i}`} position={[gx, 0.006, gz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[gw, gd]} />
          <meshStandardMaterial color="#1A4A1A" roughness={0.95} />
        </mesh>
      ))}

      {/* Large trees in green patches */}
      <CityTree x={-8} z={-10} scale={1.3} variant={0} />
      <CityTree x={8} z={-10} scale={1.2} variant={1} />
      <CityTree x={-8} z={10} scale={1.2} variant={2} />
      <CityTree x={8} z={10} scale={1.3} variant={3} />
      <CityTree x={-20} z={2} scale={1.1} variant={4} />
      <CityTree x={20} z={2} scale={1.1} variant={5} />

      {/* Hedge rows near buildings */}
      {[-15, -9, 9, 15].map((hx, i) => (
        <group key={`hedge-${i}`}>
          {Array.from({ length: 4 }).map((_, j) => (
            <Bush key={j} x={hx} z={-14 + j * 2.5} color="#1B5A20" />
          ))}
        </group>
      ))}
    </group>
  );
}

// ── Voxel Parked Cars (diorama style) ──
function VoxelParkedCars() {
  const cars = useMemo(() => [
    { x: -16, z: -3, color: "#D4A030", rot: 0 },
    { x: -10, z: -3, color: "#C94040", rot: 0 },
    { x: 16, z: -3, color: "#3A7A6A", rot: Math.PI },
    { x: 10, z: -3, color: "#5A6A8A", rot: Math.PI },
    { x: -16, z: 3, color: "#B85C38", rot: 0 },
    { x: 10, z: 3, color: "#6B3A3A", rot: Math.PI },
    { x: -3, z: -10, color: "#D4C5A9", rot: Math.PI / 2 },
    { x: -3, z: 10, color: "#4A3040", rot: Math.PI / 2 },
    { x: 3, z: -16, color: "#E8B4B8", rot: -Math.PI / 2 },
    { x: 3, z: 16, color: "#7A5030", rot: -Math.PI / 2 },
    // Delivery van
    { x: -20, z: 0, color: "#E07030", rot: Math.PI / 2 },
    { x: 20, z: 0, color: "#3080C0", rot: -Math.PI / 2 },
  ], []);

  return (
    <group>
      {cars.map((c, i) => {
        const isVan = i >= 10;
        const bw = isVan ? 0.5 : 0.35;
        const bl = isVan ? 0.8 : 0.55;
        const bh = isVan ? 0.25 : 0.18;
        const cabH = isVan ? 0.2 : 0.14;
        return (
          <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.rot, 0]}>
            {/* Body */}
            <mesh position={[0, bh / 2 + 0.04, 0]}>
              <boxGeometry args={[bw, bh, bl]} />
              <meshStandardMaterial color={c.color} />
            </mesh>
            {/* Cabin */}
            <mesh position={[0, bh + cabH / 2 + 0.04, isVan ? -0.1 : 0]}>
              <boxGeometry args={[bw - 0.04, cabH, isVan ? bl * 0.5 : bl * 0.55]} />
              <meshStandardMaterial color={c.color} />
            </mesh>
            {/* Windows */}
            <mesh position={[0, bh + cabH / 2 + 0.04, isVan ? -0.1 + (bl * 0.25 + 0.01) : bl * 0.275 + 0.01]}>
              <boxGeometry args={[bw - 0.06, cabH - 0.04, 0.01]} />
              <meshStandardMaterial color="#1a1a2e" emissive="#AADDFF" emissiveIntensity={0.3} />
            </mesh>
            {/* Wheels */}
            {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], wi) => (
              <mesh key={wi} position={[sx * bw * 0.45, 0.04, sz * bl * 0.35]}>
                <boxGeometry args={[0.04, 0.08, 0.08]} />
                <meshStandardMaterial color="#222" />
              </mesh>
            ))}
            {/* Headlights */}
            {[-1, 1].map(side => (
              <mesh key={`hl-${side}`} position={[side * bw * 0.35, bh * 0.5 + 0.04, bl / 2 + 0.01]}>
                <boxGeometry args={[0.06, 0.04, 0.01]} />
                <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={0.5} />
              </mesh>
            ))}
            {/* Shadow */}
            <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[bw + 0.08, bl + 0.08]} />
              <meshBasicMaterial color="#000" transparent opacity={0.08} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Player ──
function CityPlayer({ position, name, rotation }: { position: [number, number, number]; name: string; rotation: number }) {
  const ref = useRef<THREE.Group>(null);
  const smoothPos = useRef(new THREE.Vector3(...position));

  useFrame(() => {
    if (!ref.current) return;
    const terrainY = getTerrainHeight(position[0], position[2]);
    const targetPos = new THREE.Vector3(position[0], terrainY, position[2]);
    smoothPos.current.lerp(targetPos, 0.18);
    ref.current.position.copy(smoothPos.current);
    ref.current.position.y += Math.sin(Date.now() * 0.003) * 0.008;
    // Smooth rotate towards movement direction
    const targetRot = rotation;
    let diff = targetRot - ref.current.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    ref.current.rotation.y += diff * 0.15;
  });

  return (
    <group ref={ref} position={position}>
      <mesh position={[-0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[-0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color="#4A90D9" /></mesh>
      <mesh position={[0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color="#4A90D9" /></mesh>
      <mesh position={[0, 0.27, 0]} castShadow><boxGeometry args={[0.26, 0.24, 0.15]} /><meshStandardMaterial color="#2E8B57" /></mesh>
      <mesh position={[-0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0, 0.48, 0]} castShadow><boxGeometry args={[0.24, 0.22, 0.2]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[-0.08, 0.72, 0]}><boxGeometry args={[0.06, 0.28, 0.05]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0.08, 0.72, 0]}><boxGeometry args={[0.06, 0.28, 0.05]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[-0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.16, 8]} /><meshBasicMaterial color="#000" transparent opacity={0.18} /></mesh>
      <Html position={[0, 1.05, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none select-none bg-emerald-700">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-white font-bold">{name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Click-to-move marker ──
function ClickMarker({ position }: { position: [number, number, number] | null }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current || !position) return;
    ref.current.rotation.y += 0.03;
    ref.current.scale.setScalar(0.8 + Math.sin(Date.now() * 0.005) * 0.2);
  });
  if (!position) return null;
  return (
    <mesh ref={ref} position={[position[0], 0.05, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 0.35, 6]} />
      <meshBasicMaterial color="#10B981" transparent opacity={0.6} />
    </mesh>
  );
}

// ── Camera occlusion system ──
function CameraOcclusion({
  playerPos,
  onOccludedBuildings,
}: {
  playerPos: [number, number, number];
  onOccludedBuildings: (ids: Set<string>) => void;
}) {
  const { camera } = useThree();
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 30 !== 0) return; // Check every 30 frames (was 10)

    const playerVec = new THREE.Vector3(playerPos[0], 0.5, playerPos[2]);
    const camPos = camera.position.clone();
    const dir = playerVec.clone().sub(camPos).normalize();
    const dist = camPos.distanceTo(playerVec);

    const occluded = new Set<string>();

    // Only check nearby buildings (within 30 units) for occlusion
    for (const b of CITY_BUILDINGS) {
      const bDist = Math.abs(b.x - playerPos[0]) + Math.abs(b.z - playerPos[2]);
      if (bDist > 30) continue;
      
      const bCenter = new THREE.Vector3(b.x, b.h / 2, b.z);
      const camDist = camPos.distanceTo(bCenter);
      if (camDist < dist && camDist > 2) {
        const toB = bCenter.clone().sub(camPos).normalize();
        const dot = dir.dot(toB);
        if (dot > 0.7) {
          const cross = new THREE.Vector3().crossVectors(dir, toB);
          if (cross.length() < 0.3) {
            occluded.add(`static-${b.x}-${b.z}`);
          }
        }
      }
    }

    onOccludedBuildings(occluded);
  });

  return null;
}

// ── Flight mode camera controller ──
function FlightCamera({ active, playerPos }: { active: boolean; playerPos: [number, number, number] }) {
  const { camera, gl } = useThree();
  const flyState = useRef({
    yaw: 0,
    pitch: -0.3,
    x: 0, y: 15, z: 0,
    initialized: false,
  });
  const keysRef = useRef(new Set<string>());

  useEffect(() => {
    if (!active) return;
    const s = flyState.current;
    if (!s.initialized) {
      s.x = playerPos[0];
      s.y = 12;
      s.z = playerPos[2] + 10;
      s.yaw = Math.atan2(playerPos[0] - s.x, playerPos[2] - s.z);
      s.pitch = -0.3;
      s.initialized = true;
    }

    const onDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());

    let isPointerLocked = false;
    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked) return;
      s.yaw -= e.movementX * 0.002;
      s.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, s.pitch - e.movementY * 0.002));
    };

    const canvas = gl.domElement;
    const onClick = () => {
      if (active && !isPointerLocked) {
        canvas.requestPointerLock();
      }
    };
    const onLockChange = () => {
      isPointerLocked = document.pointerLockElement === canvas;
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    document.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLockChange);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      document.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLockChange);
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
      keysRef.current.clear();
    };
  }, [active, gl, playerPos]);

  useFrame((_, delta) => {
    if (!active) return;
    const dt = Math.min(delta, 0.05);
    const s = flyState.current;
    const keys = keysRef.current;

    const speed = keys.has("shift") ? 30 : 15;
    const forward = new THREE.Vector3(-Math.sin(s.yaw), 0, -Math.cos(s.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    if (keys.has("w") || keys.has("arrowup")) { s.x += forward.x * speed * dt; s.z += forward.z * speed * dt; }
    if (keys.has("s") || keys.has("arrowdown")) { s.x -= forward.x * speed * dt; s.z -= forward.z * speed * dt; }
    if (keys.has("a") || keys.has("arrowleft")) { s.x -= right.x * speed * dt; s.z -= right.z * speed * dt; }
    if (keys.has("d") || keys.has("arrowright")) { s.x += right.x * speed * dt; s.z += right.z * speed * dt; }
    if (keys.has(" ")) s.y += speed * dt;
    if (keys.has("control")) s.y = Math.max(1, s.y - speed * dt);

    // Clamp to world bounds
    s.x = Math.max(-200, Math.min(200, s.x));
    s.z = Math.max(-200, Math.min(200, s.z));
    s.y = Math.max(1, Math.min(120, s.y));

    camera.position.set(s.x, s.y, s.z);
    const lookDir = new THREE.Vector3(
      -Math.sin(s.yaw) * Math.cos(s.pitch),
      Math.sin(s.pitch),
      -Math.cos(s.yaw) * Math.cos(s.pitch)
    );
    camera.lookAt(s.x + lookDir.x * 10, s.y + lookDir.y * 10, s.z + lookDir.z * 10);
  });

  return null;
}

// ── Camera Follow (ground mode) ──
function CameraFollow({ target, controlsRef, active }: {
  target: [number, number, number]; controlsRef: React.RefObject<any>; active: boolean;
}) {
  useFrame((_, delta) => {
    if (!active || !controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const factor = 1 - Math.exp(-6 * dt);
    const t = controlsRef.current.target;
    t.x += (target[0] - t.x) * factor;
    t.z += (target[2] - t.z) * factor;
    t.y += (0.5 - t.y) * factor;
    controlsRef.current.update();
  });
  return null;
}

// ── OSM Building renderer ──
function OSMBuildingRenderer({ building, onClick }: { building: CityBuilding; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const h = building.height;

  return (
    <group
      position={[building.coordinates.x, 0, building.coordinates.z]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <GLBBuildingModel
        buildingId={building.id}
        height={h}
        primaryColor={building.primaryColor}
        isSkyscraper={h > 7}
      />
      {hovered && (
        <Html position={[0, h + 1, 0]} center>
          <div className="px-2 py-1 rounded-lg bg-background/90 border border-border text-foreground text-[10px] whitespace-nowrap pointer-events-none backdrop-blur-sm">
            <span className="font-bold">{building.name}</span>
            <span className="text-muted-foreground ml-1">• {building.style}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── OSM Streets renderer ──
function OSMStreetRenderer({ streets }: { streets: Array<{ start: { x: number; z: number }; end: { x: number; z: number }; width: number; type: string }> }) {
  return (
    <group>
      {streets.map((st, idx) => {
        const dx = st.end.x - st.start.x;
        const dz = st.end.z - st.start.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.5) return null;
        const mx = (st.start.x + st.end.x) / 2;
        const mz = (st.start.z + st.end.z) / 2;
        const angle = Math.atan2(dx, dz);
        const roadColor = st.type === "main" ? "#2A2A30" : st.type === "secondary" ? "#252530" : "#222228";

        return (
          <group key={`osm-st-${idx}`}>
            <mesh rotation={[-Math.PI / 2, 0, angle]} position={[mx, -0.013, mz]}>
              <planeGeometry args={[st.width, len]} />
              <meshStandardMaterial color={roadColor} roughness={0.85} />
            </mesh>
            {/* Center line for main roads */}
            {st.type === "main" && Array.from({ length: Math.floor(len / 3) }).map((_, i) => {
              const t = (i + 0.5) / Math.floor(len / 3);
              const px = st.start.x + dx * t;
              const pz = st.start.z + dz * t;
              return (
                <mesh key={i} rotation={[-Math.PI / 2, 0, angle]} position={[px, -0.01, pz]}>
                  <planeGeometry args={[0.06, 0.8]} />
                  <meshStandardMaterial color="#FFD060" transparent opacity={0.35} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

// ── Main Export ──
interface CityExploreSceneProps {
  playerName: string;
  flyMode?: boolean;
  inVehicle?: boolean;
  vehicleType?: string;
  vehicleColor?: string;
  onVehicleToggle?: (val: boolean) => void;
  onReady?: () => void;
  onBuildingClick?: (buildingId: string) => void;
  /** OSM buildings from real-world data */
  osmBuildings?: CityBuilding[];
  /** OSM streets from real-world data */
  osmStreets?: OSMStreet[];
  /** OSM bounds */
  osmBounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** Whether OSM mode is active */
  isOSMMode?: boolean;
}

export function CityExploreScene({ playerName, flyMode, inVehicle, vehicleType, vehicleColor, onVehicleToggle, onReady, onBuildingClick, osmBuildings, osmStreets, osmBounds, isOSMMode }: CityExploreSceneProps) {
  const controlsRef = useRef<any>(null);
  const dn = useDayNight();

  // ── LoD system ──
  const buildingDefs = useMemo(() => CITY_BUILDINGS.map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d, h: b.h, color: b.color, rot: b.rot, mirror: b.mirror, forceClass: (b as any).forceClass })), []);
  const { quality, config: lodConfig, changeQuality, computeFrame } = useCityLod(buildingDefs);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const userId = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_user");
    return stored ? JSON.parse(stored).email || "" : "";
  }, []);

  const { visibleBuildings, userBuilding, updateCameraCenter } = useCityBuildings(userId);

  const startPos = useMemo<[number, number, number]>(() => {
    if (userBuilding) {
      const sx = Math.max(-35, Math.min(35, userBuilding.coordinates.x * 0.4));
      const sz = Math.max(-35, Math.min(35, userBuilding.coordinates.z * 0.4));
      return [sx + 2, 0, sz + 2];
    }
    return [0, 0, 5];
  }, [userBuilding]);

  const [playerPos, setPlayerPos] = useState<[number, number, number]>(startPos);
  const [playerRot, setPlayerRot] = useState(0);
  const [clickTarget, setClickTarget] = useState<[number, number, number] | null>(null);
  const [occludedBuildings, setOccludedBuildings] = useState<Set<string>>(new Set());
  const hasSpawned = useRef(false);

  // Compute LoD for all static buildings based on player position
  const lodFrame = useMemo(() => computeFrame(playerPos[0], playerPos[2]), [computeFrame, playerPos]);

  useEffect(() => {
    if (!hasSpawned.current && userBuilding) {
      setPlayerPos(startPos);
      hasSpawned.current = true;
    }
  }, [startPos, userBuilding]);

  // Dynamic buildings mapped
  const dynamicBuildings = useMemo(() => {
    return visibleBuildings.slice(0, 20).map(b => ({
      ...b,
      coordinates: { ...b.coordinates, x: b.coordinates.x * 0.4, z: b.coordinates.z * 0.4 },
    }));
  }, [visibleBuildings]);

  // Build collision AABBs
  const aabbs = useMemo(() => buildAABBs(CITY_BUILDINGS, dynamicBuildings), [dynamicBuildings]);

  // Click-to-move: walk towards target
  useEffect(() => {
    if (!clickTarget || flyMode) return;
    const interval = setInterval(() => {
      setPlayerPos(prev => {
        const dx = clickTarget[0] - prev[0];
        const dz = clickTarget[2] - prev[2];
        const dist = Math.hypot(dx, dz);
        if (dist < 0.3) {
          setClickTarget(null);
          return prev;
        }
        const step = Math.min(0.25, dist);
        const mx = (dx / dist) * step;
        const mz = (dz / dist) * step;
        const [nx, nz] = moveWithCollision(prev[0], prev[2], mx, mz, 0.25, aabbs);
        if (nx === prev[0] && nz === prev[2]) {
          setClickTarget(null);
          return prev;
        }
        setPlayerRot(Math.atan2(dx, dz));
        updateCameraCenter(nx * 2.5, nz * 2.5);
        return [nx, getTerrainHeight(nx, nz), nz] as [number, number, number];
      });
    }, 33);
    return () => clearInterval(interval);
  }, [clickTarget, aabbs, flyMode, updateCameraCenter]);

  const handleFloorClick = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.button !== 0 || flyMode) return;
    const { x, z } = e.point;
    // Only allow clicking on walkable ground (not inside buildings)
    if (!collidesAABB(x, z, 0.1, aabbs)) {
      setClickTarget([x, 0, z]);
    }
  }, [aabbs, flyMode]);

  // Keyboard movement (ground mode)
  useEffect(() => {
    if (flyMode) return; // Flight mode has its own controls

    const keys = new Set<string>();
    const onDown = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e" && onVehicleToggle) onVehicleToggle(!inVehicle);
    };
    const onUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    const baseSpeed = inVehicle ? 0.45 : 0.2;
    const interval = setInterval(() => {
      let dx = 0, dz = 0;
      if (keys.has("arrowup") || keys.has("w")) dz -= baseSpeed;
      if (keys.has("arrowdown") || keys.has("s")) dz += baseSpeed;
      if (keys.has("arrowleft") || keys.has("a")) dx -= baseSpeed;
      if (keys.has("arrowright") || keys.has("d")) dx += baseSpeed;

      if (dx !== 0 || dz !== 0) {
        // Normalize diagonal
        if (dx !== 0 && dz !== 0) {
          const len = Math.hypot(dx, dz);
          dx = (dx / len) * baseSpeed;
          dz = (dz / len) * baseSpeed;
        }
        setClickTarget(null); // Cancel click-to-move

        setPlayerPos(prev => {
          const playerRadius = inVehicle ? 0.4 : 0.25;
          const [nx, nz] = moveWithCollision(prev[0], prev[2], dx, dz, playerRadius, aabbs);
          // Clamp to expanded world bounds
          const fx = Math.max(-150, Math.min(150, nx));
          const fz = Math.max(-150, Math.min(150, nz));
          const terrainY = getTerrainHeight(fx, fz);
          if (fx !== prev[0] || fz !== prev[2]) {
            setPlayerRot(Math.atan2(dx, dz));
            updateCameraCenter(fx * 2.5, fz * 2.5);
          }
          return [fx, terrainY, fz] as [number, number, number];
        });
      }
    }, 33);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      clearInterval(interval);
    };
  }, [updateCameraCenter, inVehicle, onVehicleToggle, aabbs, flyMode]);

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Quality Settings UI */}
      <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
        <button
          onClick={() => setShowQualityMenu(!showQualityMenu)}
          className="px-2 py-1 text-[10px] rounded bg-background/80 border border-border text-foreground backdrop-blur-sm hover:bg-accent transition-colors"
        >
          ⚙ {quality.toUpperCase()}
        </button>
        {showQualityMenu && (
          <div className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-background/90 border border-border backdrop-blur-sm">
            {(["low", "medium", "high", "ultra"] as QualityLevel[]).map(q => (
              <button
                key={q}
                onClick={() => { changeQuality(q); setShowQualityMenu(false); }}
                className={`px-3 py-1 text-[10px] rounded transition-colors ${
                  quality === q
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                {q.toUpperCase()}
                <span className="ml-1 text-muted-foreground">
                  {q === "low" ? "• 30+ FPS" : q === "medium" ? "• 60 FPS" : q === "high" ? "• Detail" : "• Max"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LoD Stats Overlay */}
      <div className="absolute bottom-2 left-2 z-20 px-2 py-1 text-[9px] rounded bg-background/60 text-muted-foreground backdrop-blur-sm pointer-events-none">
        LOD: {lodFrame.lodBuildings.filter(b => b.lod === 0).length} HD |{" "}
        {lodFrame.lodBuildings.filter(b => b.lod === 1).length} Med |{" "}
        {lodFrame.lodBuildings.filter(b => b.lod >= 2).length} Low |{" "}
        Chunks: {lodFrame.chunks.length}
      </div>

      <Canvas
        shadows
        style={{ touchAction: "none", width: "100%", height: "100%", display: "block" }}
        camera={{ position: [12, 25, 30], fov: 45, near: 0.5, far: Math.min(lodConfig.cameraFar, 500) }}
        gl={{ antialias: false, powerPreference: "high-performance", stencil: false, depth: true }}
        dpr={Math.min(Array.isArray(lodConfig.dpr) ? lodConfig.dpr[1] : lodConfig.dpr, 1.5)}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = dn.exposure;
          onReady?.();
        }}
      >
        <color attach="background" args={[dn.bgColor]} />
        <fog attach="fog" args={[dn.fogColor, lodConfig.fogNear * 2, lodConfig.fogFar * 2]} />

        {/* Simplified lighting — fewer lights = more FPS */}
        <ambientLight intensity={dn.ambientIntensity * 0.8} color={dn.isNight ? "#4466AA" : dn.ambientColor} />
        
        <directionalLight
          position={dn.sunPosition}
          intensity={dn.sunIntensity * 0.9}
          castShadow
          shadow-mapSize-width={lodConfig.shadowMapSize}
          shadow-mapSize-height={lodConfig.shadowMapSize}
          shadow-camera-far={40}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.001}
          color={dn.sunColor}
        />
        {/* Warm ground bounce via hemisphere */}
        <hemisphereLight args={[dn.isNight ? "#334466" : dn.skyColor, "#FFE0B0", dn.hemiIntensity * 0.9]} />

        {/* Moon */}
        {dn.isNight && (
          <group position={[-20, 30, -15]}>
            <mesh>
              <sphereGeometry args={[2, 16, 16]} />
              <meshBasicMaterial color="#E8E8F0" />
            </mesh>
            <mesh>
              <sphereGeometry args={[3, 16, 16]} />
              <meshBasicMaterial color="#8899CC" transparent opacity={0.08} />
            </mesh>
            <directionalLight
              position={[0, 0, 0]}
              target-position={[0, 0, 0]}
              intensity={0.3}
              color="#8899CC"
            />
          </group>
        )}
        {dn.isSunset && (
          <group position={[-20, 25, -15]}>
            <mesh>
              <sphereGeometry args={[1.5, 12, 12]} />
              <meshBasicMaterial color="#D8D8E8" transparent opacity={dn.starOpacity * 0.8} />
            </mesh>
          </group>
        )}

        {lodConfig.enableStars && dn.showStars && <Stars radius={100} depth={50} count={1500} factor={4} saturation={0.3} fade speed={0.5} />}

        {/* Ground mode controls */}
        {!flyMode && (
          <>
            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.15}
              enablePan={false}
              enableZoom
              enableRotate
              minDistance={8}
              maxDistance={60}
              minPolarAngle={Math.PI / 8}
              maxPolarAngle={Math.PI / 2.8}
              zoomSpeed={0.8}
              rotateSpeed={0.5}
              target={[playerPos[0], playerPos[1] + 0.5, playerPos[2]]}
            />
            <CameraFollow target={playerPos} controlsRef={controlsRef} active={!flyMode} />
          </>
        )}

        {/* Flight mode */}
        <FlightCamera active={!!flyMode} playerPos={playerPos} />

        {/* Camera occlusion */}
        <CameraOcclusion playerPos={playerPos} onOccludedBuildings={setOccludedBuildings} />

        {/* Clickable ground (extended for larger world) */}
        <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handleFloorClick}>
          <planeGeometry args={[800, 800]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* World Terrain with elevation */}
        <WorldTerrain size={400} resolution={80} />

        {/* World Chunk-based building renderer (massive city) */}
        <WorldChunkRenderer
          playerX={playerPos[0]}
          playerZ={playerPos[2]}
          loadRadius={Math.min(lodConfig.chunkLoadRadius + 1, 4)}
          maxGLBBuildings={Math.min(lodConfig.maxFullDetailBuildings, 15)}
        />

        <CityGround />
        <CityPlaza />
        <StreetLights />
        {lodConfig.enableLandscaping && <CityLandscaping />}
        {lodConfig.enableVehicles && <VoxelParkedCars />}

        {/* Click marker */}
        <ClickMarker position={clickTarget} />

        {/* Static buildings — only render nearby ones as GLB, skip far ones (WorldChunkRenderer covers them) */}
        {lodFrame.lodBuildings
          .filter(lb => lb.lod <= 1) // Only render HD and Med LOD — far buildings handled by WorldChunkRenderer
          .map((lb) => {
            const posSeed = Math.abs(((lb.def.x * 73856093) ^ (lb.def.z * 19349663)) | 0) + lb.index * 37;
            const bDef = CITY_BUILDINGS[lb.index];
            return (
              <StaticBuildingOccludable
                key={lb.index}
                x={lb.def.x} z={lb.def.z} w={lb.def.w} d={lb.def.d} h={lb.def.h} color={lb.def.color}
                seed={posSeed}
                occluded={occludedBuildings.has(`static-${lb.def.x}-${lb.def.z}`)}
                lod={lb.lod}
                rotation={bDef?.rot || 0}
                mirror={bDef?.mirror || false}
                forceClass={(bDef as any)?.forceClass}
              />
            );
          })}

        {/* Dynamic buildings */}
        {dynamicBuildings.map(b => (
          <LightBuilding3D
            key={b.id}
            building={b}
            highlighted={userBuilding?.id === b.id}
            onClick={() => onBuildingClick?.(b.id)}
            occluded={false}
          />
        ))}


        {/* OSM real-world buildings */}
        {isOSMMode && osmBuildings && osmBuildings.map(b => (
          <OSMBuildingRenderer
            key={b.id}
            building={b}
            onClick={() => onBuildingClick?.(b.id)}
          />
        ))}

        {/* OSM real-world streets */}
        {isOSMMode && osmStreets && <OSMStreetRenderer streets={osmStreets} />}

        {/* User building vehicle */}
        {userBuilding && dynamicBuildings.filter(b => b.id === userBuilding.id).map(b => {
          const transport = b.transportType || STYLE_TRANSPORT_MAP[b.style] || "car";
          if (transport === "none") return null;
          return (
            <Vehicle3D
              key={`v-${b.id}`}
              type={transport}
              position={[b.coordinates.x + 1.5, 0, b.coordinates.z + 1.5]}
              color={b.primaryColor}
              ownerName={b.name}
              isActive
            />
          );
        })}

        {/* NPCs with collision awareness (quality-gated) */}
        {lodConfig.enableNPCs && NPC_DATA.map((npc, i) => (
          <CityNPC key={i} startX={npc.x} startZ={npc.z} color={npc.color} aabbs={aabbs} />
        ))}

        {/* Player + vehicle */}
        {inVehicle && vehicleType && vehicleType !== "none" && (
          <Vehicle3D type={vehicleType as any} position={playerPos} color={vehicleColor} ownerName={playerName} isActive />
        )}
        {!inVehicle && <CityPlayer position={playerPos} name={playerName} rotation={playerRot} />}
      </Canvas>
    </div>
  );
}
