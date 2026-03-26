/**
 * CityExploreScene — Unified R3F city scene.
 * Uses gameStore + inputStore for centralized state.
 * Modular: PlayerRig, VehicleLayer, NpcLayer, CameraRig, BuildingLayer.
 */

import { useRef, useState, useMemo, useCallback, useEffect, memo } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import { WorldTerrain } from "@/components/city/WorldTerrain";
import { WorldChunkRenderer } from "@/components/city/WorldChunkRenderer";
import { OSMWorldRenderer } from "@/components/city/OSMWorldRenderer";
import { getTerrainHeight } from "@/systems/city/WorldGenerator";
import { useDayNight } from "@/hooks/useDayNight";
import { useCityBuildings } from "@/hooks/useCityBuildings";
import { GLBBuildingModel, preloadBuildingModels } from "@/components/buildings/GLBBuildingModel";
import type { CityBuilding } from "@/types/building";
import { STYLE_TRANSPORT_MAP } from "@/types/building";
import { useCityLod } from "@/systems/city/useCityLod";
import type { OSMStreet, OSMTreeData, OSMGreenArea } from "@/systems/city/OSMCityGenerator";
import { useGameStore } from "@/stores/gameStore";
import { useInputStore } from "@/stores/inputStore";
import { VehicleR3F } from "@/components/city/VehicleR3F";
import { CityNPCSystem } from "@/components/city/CityNPCSystem";
import { Vehicle3D } from "@/components/city/Vehicle3D";
import {
  buildAABBs as buildNewAABBs,
  collidesAABB,
  moveWithCollision,
  findSafeSpawn,
  type AABB,
  type BuildingCollider,
} from "@/city/physics/CollisionSystem";

preloadBuildingModels();

// ── District data ──
const DISTRICTS = [
  { name: "Praça Central", emoji: "🏛️", x: 0, z: 0, radius: 5, color: "#10B981" },
  { name: "Distrito Criativo", emoji: "🎨", x: -14, z: -8, radius: 4, color: "#F59E0B" },
  { name: "Distrito Inovação", emoji: "🔬", x: 14, z: -8, radius: 4, color: "#6366F1" },
  { name: "Distrito Comércio", emoji: "🛍️", x: -14, z: 10, radius: 4, color: "#EF4444" },
  { name: "Distrito Social", emoji: "☕", x: 14, z: 10, radius: 4, color: "#EC4899" },
];

// ── Static building defs ──
const CITY_BUILDINGS = [
  { x: -18, z: -12, w: 3.2, d: 2.8, h: 2.8, color: "#B85C38", rot: 0.15, mirror: false, forceClass: "creative_studio" as const },
  { x: -12, z: -12, w: 2.8, d: 2.4, h: 2.2, color: "#D4C5A9", rot: -0.1, mirror: true, forceClass: "cafe" as const },
  { x: -18, z: -6, w: 3.0, d: 2.6, h: 3.0, color: "#C4828A", rot: Math.PI / 2, mirror: false, forceClass: "creative_studio" as const },
  { x: -12, z: -6, w: 2.6, d: 2.6, h: 2.5, color: "#E8B4B8", rot: 0, mirror: true, forceClass: "cafe" as const },
  { x: -15, z: -9, w: 2.4, d: 2.2, h: 1.8, color: "#D4A040", rot: 0.3, mirror: false, forceClass: "shop" as const },
  { x: -21, z: -9, w: 2.6, d: 2.4, h: 2.0, color: "#9A7A5A", rot: -Math.PI / 4, mirror: true, forceClass: "creative_studio" as const },
  { x: 12, z: -12, w: 3.2, d: 2.8, h: 3.5, color: "#6B7B8D", rot: 0, mirror: false, forceClass: "tech_tower" as const },
  { x: 18, z: -12, w: 2.8, d: 2.4, h: 2.8, color: "#5A6A7D", rot: Math.PI, mirror: true, forceClass: "office" as const },
  { x: 12, z: -6, w: 2.8, d: 2.6, h: 2.5, color: "#3A7A6A", rot: 0.2, mirror: false, forceClass: "tech_tower" as const },
  { x: 18, z: -6, w: 2.6, d: 2.6, h: 3.2, color: "#7A8A9D", rot: -0.15, mirror: true, forceClass: "office" as const },
  { x: 15, z: -9, w: 2.2, d: 2.0, h: 2.4, color: "#4A5A6D", rot: Math.PI / 6, mirror: false, forceClass: "tech_tower" as const },
  { x: 21, z: -9, w: 2.4, d: 2.2, h: 1.8, color: "#5A6A8A", rot: 0, mirror: true, forceClass: "office" as const },
  { x: -18, z: 8, w: 3.2, d: 2.8, h: 2.5, color: "#CD853F", rot: 0, mirror: false, forceClass: "shop" as const },
  { x: -12, z: 8, w: 2.8, d: 2.4, h: 2.2, color: "#B4D4E8", rot: Math.PI / 2, mirror: true, forceClass: "shop" as const },
  { x: -18, z: 14, w: 2.8, d: 2.6, h: 2.8, color: "#8B4513", rot: -0.2, mirror: false, forceClass: "cafe" as const },
  { x: -12, z: 14, w: 2.4, d: 2.4, h: 2.0, color: "#A0522D", rot: 0.4, mirror: true, forceClass: "shop" as const },
  { x: -15, z: 11, w: 2.6, d: 2.2, h: 1.6, color: "#E4B050", rot: 0, mirror: false, forceClass: "cafe" as const },
  { x: -21, z: 11, w: 2.8, d: 2.4, h: 2.2, color: "#6B3A3A", rot: Math.PI, mirror: true, forceClass: "shop" as const },
  { x: 12, z: 8, w: 3.2, d: 2.8, h: 2.2, color: "#E8D4B4", rot: 0.1, mirror: false, forceClass: "cafe" as const },
  { x: 18, z: 8, w: 2.8, d: 2.4, h: 2.5, color: "#B8E8B4", rot: -0.2, mirror: true, forceClass: "creative_studio" as const },
  { x: 12, z: 14, w: 2.8, d: 2.6, h: 2.8, color: "#D4C5A9", rot: Math.PI / 3, mirror: false, forceClass: "cafe" as const },
  { x: 18, z: 14, w: 2.6, d: 2.6, h: 2.0, color: "#C4B08B", rot: 0, mirror: true, forceClass: "creative_studio" as const },
  { x: 15, z: 11, w: 2.4, d: 2.0, h: 1.8, color: "#B85C38", rot: -0.3, mirror: false, forceClass: "shop" as const },
  { x: 21, z: 11, w: 2.6, d: 2.2, h: 2.4, color: "#D49298", rot: 0.25, mirror: true, forceClass: "cafe" as const },
  { x: -6, z: -14, w: 2.8, d: 2.4, h: 3.0, color: "#BFA980", rot: Math.PI / 2, mirror: false },
  { x: 0, z: -14, w: 3.2, d: 2.8, h: 3.5, color: "#6B5A4A", rot: 0, mirror: true },
  { x: 6, z: -14, w: 2.8, d: 2.4, h: 2.8, color: "#8B6B3A", rot: -Math.PI / 2, mirror: false },
  { x: -6, z: 18, w: 2.8, d: 2.4, h: 2.2, color: "#5A6A7A", rot: Math.PI, mirror: true },
  { x: 0, z: 18, w: 3.2, d: 2.8, h: 2.5, color: "#4A3040", rot: 0.5, mirror: false },
  { x: 6, z: 18, w: 2.8, d: 2.4, h: 2.0, color: "#7A5030", rot: -0.5, mirror: true },
  { x: -24, z: -4, w: 2.4, d: 2.2, h: 2.0, color: "#9A7A5A", rot: 0.7, mirror: false },
  { x: -24, z: 4, w: 2.6, d: 2.4, h: 2.4, color: "#6A4A3A", rot: -0.4, mirror: true },
  { x: 24, z: -4, w: 2.4, d: 2.2, h: 2.2, color: "#3A4A5A", rot: Math.PI / 3, mirror: false },
  { x: 24, z: 4, w: 2.6, d: 2.4, h: 1.8, color: "#4A5A7A", rot: -Math.PI / 3, mirror: true },
  { x: -8, z: -20, w: 2.4, d: 2.0, h: 2.0, color: "#C4828A", rot: 0.2, mirror: false },
  { x: 8, z: -20, w: 2.6, d: 2.2, h: 2.4, color: "#D4A040", rot: -0.2, mirror: true },
  { x: -8, z: 22, w: 2.4, d: 2.0, h: 1.8, color: "#B4D4E8", rot: Math.PI, mirror: false },
  { x: 8, z: 22, w: 2.6, d: 2.2, h: 2.2, color: "#E8B4B8", rot: 0, mirror: true },
  { x: -22, z: -16, w: 2.6, d: 2.4, h: 2.6, color: "#8A7A5A", rot: Math.PI / 4, mirror: false },
  { x: 22, z: -16, w: 2.4, d: 2.2, h: 2.4, color: "#5A6A8A", rot: -Math.PI / 4, mirror: true },
  { x: -22, z: 16, w: 2.6, d: 2.4, h: 2.2, color: "#7A5A4A", rot: -Math.PI / 4, mirror: false },
  { x: 22, z: 16, w: 2.4, d: 2.2, h: 2.0, color: "#6A5A5A", rot: Math.PI / 4, mirror: true },
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
  { x: -50, z: 0, w: 3.0, d: 2.6, h: 3.0, color: "#4A4A4A", rot: 0, mirror: false },
  { x: 50, z: 0, w: 3.0, d: 2.6, h: 3.2, color: "#3A3A4A", rot: Math.PI, mirror: true },
  { x: 0, z: -48, w: 3.2, d: 2.8, h: 3.4, color: "#4A4A3A", rot: 0.5, mirror: false },
  { x: 0, z: 48, w: 3.2, d: 2.8, h: 3.0, color: "#3A4A3A", rot: -0.5, mirror: true },
  { x: -40, z: -30, w: 2.8, d: 2.4, h: 2.6, color: "#5A4A4A", rot: Math.PI / 3, mirror: false },
  { x: 40, z: -30, w: 2.8, d: 2.4, h: 2.8, color: "#4A4A5A", rot: -Math.PI / 3, mirror: true },
  { x: -40, z: 30, w: 2.8, d: 2.4, h: 2.4, color: "#4A5A5A", rot: 0, mirror: false },
  { x: 40, z: 30, w: 2.8, d: 2.4, h: 3.0, color: "#5A5A4A", rot: Math.PI, mirror: true },
];

// ── Build collision AABBs from static buildings ──
function buildStaticColliders(): BuildingCollider[] {
  return CITY_BUILDINGS.map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d }));
}

// ════════════════════════════════════════════
// SUB-COMPONENTS (inside Canvas)
// ════════════════════════════════════════════

// ── PlayerRig: reads inputStore, writes gameStore ──
function PlayerRig({ aabbs, isOSMMode }: { aabbs: AABB[]; isOSMMode: boolean }) {
  const playerPos = useGameStore(s => s.player.position);
  const movementMode = useGameStore(s => s.player.movementMode);
  const isInVehicle = useGameStore(s => s.vehicle.isInVehicle);
  const setPlayerPosition = useGameStore(s => s.setPlayerPosition);
  const setPlayerRotation = useGameStore(s => s.setPlayerRotation);
  const setPlayerMoving = useGameStore(s => s.setPlayerMoving);
  const enterVehicle = useGameStore(s => s.enterVehicle);
  const exitVehicle = useGameStore(s => s.exitVehicle);

  useFrame((_, delta) => {
    if (isInVehicle || movementMode === "fly") return;
    const dt = Math.min(delta, 0.05);
    const keys = useInputStore.getState().keys;

    let dx = 0, dz = 0;
    const speed = isOSMMode ? 18 : 5; // units/sec — brisk walk speed

    if (keys.has("w") || keys.has("arrowup")) dz -= speed * dt;
    if (keys.has("s") || keys.has("arrowdown")) dz += speed * dt;
    if (keys.has("a") || keys.has("arrowleft")) dx -= speed * dt;
    if (keys.has("d") || keys.has("arrowright")) dx += speed * dt;

    if (dx === 0 && dz === 0) {
      setPlayerMoving(false);
      return;
    }

    // Normalize diagonal
    if (dx !== 0 && dz !== 0) {
      const len = Math.hypot(dx, dz);
      dx = (dx / len) * speed * dt;
      dz = (dz / len) * speed * dt;
    }

    setPlayerMoving(true);
    const [nx, nz] = isOSMMode
      ? [playerPos[0] + dx, playerPos[2] + dz]
      : moveWithCollision(playerPos[0], playerPos[2], dx, dz, 0.25, aabbs);
    const worldLimit = isOSMMode ? 500 : 150;
    const fx = Math.max(-worldLimit, Math.min(worldLimit, nx));
    const fz = Math.max(-worldLimit, Math.min(worldLimit, nz));
    const terrainY = isOSMMode ? 0 : getTerrainHeight(fx, fz);
    
    if (fx !== playerPos[0] || fz !== playerPos[2]) {
      setPlayerRotation(Math.atan2(dx, dz));
    }
    setPlayerPosition([fx, terrainY, fz]);
  });

  return null;
}

// ── Vehicle toggle handler (E key) ──
function VehicleToggleHandler() {
  const isInVehicle = useGameStore(s => s.vehicle.isInVehicle);
  const enterVehicle = useGameStore(s => s.enterVehicle);
  const exitVehicle = useGameStore(s => s.exitVehicle);
  const ePressed = useRef(false);

  useFrame(() => {
    const keys = useInputStore.getState().keys;
    if (keys.has("e") && !ePressed.current) {
      ePressed.current = true;
      if (isInVehicle) {
        exitVehicle();
        console.log("[VehicleToggle] Exited vehicle");
      } else {
        enterVehicle("car", "#4A90D9");
        console.log("[VehicleToggle] Entered vehicle");
      }
    }
    if (!keys.has("e")) {
      ePressed.current = false;
    }
  });

  return null;
}

// ── Player Visual ──
function PlayerVisual({ name, scale = 1 }: { name: string; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  const playerPos = useGameStore(s => s.player.position);
  const playerRot = useGameStore(s => s.player.rotation);
  const isInVehicle = useGameStore(s => s.vehicle.isInVehicle);
  const smoothPos = useRef(new THREE.Vector3(...playerPos));

  useFrame(() => {
    if (!ref.current || isInVehicle) return;
    const terrainY = getTerrainHeight(playerPos[0], playerPos[2]);
    const targetPos = new THREE.Vector3(playerPos[0], terrainY, playerPos[2]);
    smoothPos.current.lerp(targetPos, 0.25);
    ref.current.position.copy(smoothPos.current);
    // Rotation: snap faster to avoid "spinning on its own" feel
    let diff = playerRot - ref.current.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    ref.current.rotation.y += diff * 0.3;
  });

  if (isInVehicle) return null;

  // Scale factor for visibility — OSM buildings are in meters, player needs to match
  const s = scale;

  return (
    <group ref={ref} position={playerPos} scale={[s, s, s]}>
      {/* Feet */}
      <mesh position={[-0.15, 0.06, 0.05]}><boxGeometry args={[0.15, 0.12, 0.25]} /><meshStandardMaterial color="#2A2A2A" /></mesh>
      <mesh position={[0.15, 0.06, 0.05]}><boxGeometry args={[0.15, 0.12, 0.25]} /><meshStandardMaterial color="#2A2A2A" /></mesh>
      {/* Legs */}
      <mesh position={[-0.15, 0.3, 0]}><boxGeometry args={[0.18, 0.35, 0.2]} /><meshStandardMaterial color="#3B6DAA" /></mesh>
      <mesh position={[0.15, 0.3, 0]}><boxGeometry args={[0.18, 0.35, 0.2]} /><meshStandardMaterial color="#3B6DAA" /></mesh>
      {/* Body / Torso */}
      <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[0.6, 0.55, 0.35]} /><meshStandardMaterial color="#10B981" /></mesh>
      {/* Arms */}
      <mesh position={[-0.42, 0.65, 0]}><boxGeometry args={[0.15, 0.5, 0.18]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0.42, 0.65, 0]}><boxGeometry args={[0.15, 0.5, 0.18]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      {/* Head */}
      <mesh position={[0, 1.15, 0]} castShadow><boxGeometry args={[0.45, 0.45, 0.4]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 1.18, 0.21]}><boxGeometry args={[0.1, 0.08, 0.02]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[0.1, 1.18, 0.21]}><boxGeometry args={[0.1, 0.08, 0.02]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[-0.1, 1.19, 0.22]}><boxGeometry args={[0.05, 0.04, 0.01]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[0.1, 1.19, 0.22]}><boxGeometry args={[0.05, 0.04, 0.01]} /><meshStandardMaterial color="#222" /></mesh>
      {/* Hair */}
      <mesh position={[0, 1.4, -0.02]}><boxGeometry args={[0.48, 0.12, 0.44]} /><meshStandardMaterial color="#4A3020" /></mesh>
      {/* Ground glow ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.45, 16]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.25} />
      </mesh>
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.35, 8]} /><meshBasicMaterial color="#000" transparent opacity={0.2} /></mesh>
      {/* Name label */}
      <Html position={[0, 1.8, 0]} center>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap pointer-events-none select-none shadow-lg" style={{ background: "rgba(16, 185, 129, 0.9)" }}>
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[11px] text-white font-bold tracking-wide">{name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── CameraRig: proper chase camera that follows player smoothly ──
function CameraRig({ isOSMMode }: { isOSMMode: boolean }) {
  const { camera } = useThree();
  const playerPos = useGameStore(s => s.player.position);
  const playerRot = useGameStore(s => s.player.rotation);
  const movementMode = useGameStore(s => s.player.movementMode);
  const isInVehicle = useGameStore(s => s.vehicle.isInVehicle);
  const isFlying = movementMode === "fly";

  const cameraState = useRef({
    targetX: 0, targetY: 0, targetZ: 0,
    azimuth: Math.PI * 0.15,
    polar: Math.PI / 3.5,
    distance: isOSMMode ? 25 : 18,
    initialized: false,
  });

  // Mouse orbit
  useEffect(() => {
    let isDragging = false;
    let lastX = 0, lastY = 0;

    const onDown = (e: PointerEvent) => {
      if (e.button === 0 || e.button === 2) { isDragging = true; lastX = e.clientX; lastY = e.clientY; }
    };
    const onUp = () => { isDragging = false; };
    const onMove = (e: PointerEvent) => {
      if (!isDragging || isFlying) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      const s = cameraState.current;
      s.azimuth -= dx * 0.005;
      s.polar = Math.max(0.3, Math.min(Math.PI / 2.3, s.polar + dy * 0.005));
    };
    const onWheel = (e: WheelEvent) => {
      if (isFlying) return;
      const s = cameraState.current;
      const min = isOSMMode ? 8 : 5;
      const max = isOSMMode ? 80 : 45;
      s.distance = Math.max(min, Math.min(max, s.distance + e.deltaY * 0.03));
    };
    const onCtx = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("contextmenu", onCtx);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("contextmenu", onCtx);
    };
  }, [isFlying, isOSMMode]);

  useFrame((_, delta) => {
    if (isFlying) return;
    const dt = Math.min(delta, 0.05);
    const s = cameraState.current;

    // Snap camera to player on first frame
    if (!s.initialized) {
      s.targetX = playerPos[0];
      s.targetY = playerPos[1] + (isOSMMode ? 1 : 0.5);
      s.targetZ = playerPos[2];
      s.initialized = true;
    }

    // Chase: lerp target to player — vehicle needs FAST follow to avoid drift
    const followSpeed = isInVehicle ? 18 : 10;
    const factor = 1 - Math.exp(-followSpeed * dt);
    s.targetX += (playerPos[0] - s.targetX) * factor;
    s.targetZ += (playerPos[2] - s.targetZ) * factor;
    s.targetY += ((playerPos[1] + (isOSMMode ? 1 : 0.5)) - s.targetY) * factor;

    // Vehicle: pull azimuth toward vehicle heading more aggressively
    if (isInVehicle) {
      const targetAzimuth = playerRot + Math.PI;
      let azDiff = targetAzimuth - s.azimuth;
      while (azDiff > Math.PI) azDiff -= Math.PI * 2;
      while (azDiff < -Math.PI) azDiff += Math.PI * 2;
      s.azimuth += azDiff * 0.08;
      // Converge distance quickly
      const targetDist = isOSMMode ? 30 : 22;
      s.distance += (targetDist - s.distance) * factor;
    }

    // Compute camera position from spherical coords
    const dist = s.distance;
    const offX = Math.sin(s.azimuth) * Math.cos(s.polar) * dist;
    const offY = Math.sin(s.polar) * dist;
    const offZ = Math.cos(s.azimuth) * Math.cos(s.polar) * dist;

    const camX = s.targetX + offX;
    const camY = Math.max(1, s.targetY + offY);
    const camZ = s.targetZ + offZ;

    // Smooth camera position — vehicle uses tighter smoothing
    const posFactor = isInVehicle ? factor : factor * 0.8;
    camera.position.x += (camX - camera.position.x) * posFactor;
    camera.position.y += (camY - camera.position.y) * posFactor;
    camera.position.z += (camZ - camera.position.z) * posFactor;
    camera.lookAt(s.targetX, s.targetY, s.targetZ);
  });

  if (isFlying) {
    return <FlightCamera playerPos={playerPos} />;
  }

  return null;
}

// ── Flight Camera ──
function FlightCamera({ playerPos }: { playerPos: [number, number, number] }) {
  const { camera, gl } = useThree();
  const flyState = useRef({ yaw: 0, pitch: -0.3, x: 0, y: 15, z: 0, initialized: false });

  useEffect(() => {
    const s = flyState.current;
    if (!s.initialized) {
      s.x = playerPos[0]; s.y = 12; s.z = playerPos[2] + 10;
      s.yaw = Math.atan2(playerPos[0] - s.x, playerPos[2] - s.z);
      s.pitch = -0.3; s.initialized = true;
    }

    let isPointerLocked = false;
    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked) return;
      s.yaw -= e.movementX * 0.002;
      s.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, s.pitch - e.movementY * 0.002));
    };
    const canvas = gl.domElement;
    const onClick = () => { if (!isPointerLocked) canvas.requestPointerLock(); };
    const onLockChange = () => { isPointerLocked = document.pointerLockElement === canvas; };

    document.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLockChange);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLockChange);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, [gl, playerPos]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = flyState.current;
    const keys = useInputStore.getState().keys;

    const speed = keys.has("shift") ? 30 : 15;
    const forward = new THREE.Vector3(-Math.sin(s.yaw), 0, -Math.cos(s.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    if (keys.has("w") || keys.has("arrowup")) { s.x += forward.x * speed * dt; s.z += forward.z * speed * dt; }
    if (keys.has("s") || keys.has("arrowdown")) { s.x -= forward.x * speed * dt; s.z -= forward.z * speed * dt; }
    if (keys.has("a") || keys.has("arrowleft")) { s.x -= right.x * speed * dt; s.z -= right.z * speed * dt; }
    if (keys.has("d") || keys.has("arrowright")) { s.x += right.x * speed * dt; s.z += right.z * speed * dt; }
    if (keys.has(" ")) s.y += speed * dt;
    if (keys.has("control")) s.y = Math.max(1, s.y - speed * dt);

    s.x = Math.max(-500, Math.min(500, s.x));
    s.z = Math.max(-500, Math.min(500, s.z));
    s.y = Math.max(1, Math.min(200, s.y));

    camera.position.set(s.x, s.y, s.z);
    const lookDir = new THREE.Vector3(
      -Math.sin(s.yaw) * Math.cos(s.pitch), Math.sin(s.pitch), -Math.cos(s.yaw) * Math.cos(s.pitch)
    );
    camera.lookAt(s.x + lookDir.x * 10, s.y + lookDir.y * 10, s.z + lookDir.z * 10);
  });

  return null;
}

// ── Click-to-move ──
function ClickToMove({ aabbs, isOSMMode }: { aabbs: AABB[]; isOSMMode: boolean }) {
  const [clickTarget, setClickTarget] = useState<[number, number, number] | null>(null);
  const movementMode = useGameStore(s => s.player.movementMode);
  const isInVehicle = useGameStore(s => s.vehicle.isInVehicle);
  const setPlayerPosition = useGameStore(s => s.setPlayerPosition);
  const setPlayerRotation = useGameStore(s => s.setPlayerRotation);

  useFrame((_, delta) => {
    if (!clickTarget || movementMode === "fly" || isInVehicle) return;
    const pos = useGameStore.getState().player.position;
    const dx = clickTarget[0] - pos[0];
    const dz = clickTarget[2] - pos[2];
    const dist = Math.hypot(dx, dz);
    if (dist < 0.3) { setClickTarget(null); return; }
    const step = Math.min(0.25, dist);
    const mx = (dx / dist) * step;
    const mz = (dz / dist) * step;
    const [nx, nz] = isOSMMode ? [pos[0] + mx, pos[2] + mz] : moveWithCollision(pos[0], pos[2], mx, mz, 0.25, aabbs);
    if (nx === pos[0] && nz === pos[2]) { setClickTarget(null); return; }
    setPlayerRotation(Math.atan2(dx, dz));
    const terrainY = isOSMMode ? 0 : getTerrainHeight(nx, nz);
    setPlayerPosition([nx, terrainY, nz]);
  });

  const handleClick = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.button !== 0 || movementMode === "fly" || isInVehicle) return;
    const { x, z } = e.point;
    if (!collidesAABB(x, z, 0.1, aabbs)) {
      setClickTarget([x, 0, z]);
    }
  }, [aabbs, movementMode, isInVehicle]);

  return (
    <>
      <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handleClick}>
        <planeGeometry args={[800, 800]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      {clickTarget && <ClickMarker position={clickTarget} />}
    </>
  );
}

function ClickMarker({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.03;
    ref.current.scale.setScalar(0.8 + Math.sin(Date.now() * 0.005) * 0.2);
  });
  return (
    <mesh ref={ref} position={[position[0], 0.05, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 0.35, 6]} />
      <meshBasicMaterial color="#10B981" transparent opacity={0.6} />
    </mesh>
  );
}

// ── Camera Occlusion ──
function CameraOcclusion({ onOccludedBuildings }: { onOccludedBuildings: (ids: Set<string>) => void }) {
  const { camera } = useThree();
  const frameCount = useRef(0);
  const playerPos = useGameStore(s => s.player.position);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 30 !== 0) return;
    const playerVec = new THREE.Vector3(playerPos[0], 0.5, playerPos[2]);
    const camPos = camera.position.clone();
    const dir = playerVec.clone().sub(camPos).normalize();
    const dist = camPos.distanceTo(playerVec);
    const occluded = new Set<string>();
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
          if (cross.length() < 0.3) occluded.add(`static-${b.x}-${b.z}`);
        }
      }
    }
    onOccludedBuildings(occluded);
  });

  return null;
}

// ── Static Building (GLB) ──
function StaticBuildingOccludable({ x, z, w, d, h, color, occluded, seed, lod, rotation, mirror }: {
  x: number; z: number; w: number; d: number; h: number; color: string; occluded?: boolean; seed: number; lod?: number;
  rotation?: number; mirror?: boolean;
}) {
  if (occluded) return null;
  const buildingId = `static-${x}-${z}-${seed}`;
  return (
    <group position={[x, 0, z]} rotation={[0, rotation || 0, 0]} scale={[mirror ? -1 : 1, 1, 1]}>
      <GLBBuildingModel buildingId={buildingId} height={h} primaryColor={color} isSkyscraper={h > 3} />
    </group>
  );
}

// ── Dynamic user building ──
function LightBuilding3D({ building, highlighted, onClick, occluded }: {
  building: CityBuilding; highlighted?: boolean; onClick?: () => void; occluded?: boolean;
}) {
  const h = building.height;
  const [hovered, setHovered] = useState(false);
  if (occluded) return null;

  return (
    <group
      position={[building.coordinates.x, 0, building.coordinates.z]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <GLBBuildingModel buildingId={building.id} height={h} primaryColor={building.primaryColor} isSkyscraper={h > 7} />
      {(highlighted || hovered) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.4, 6]} />
          <meshStandardMaterial color={building.primaryColor} emissive={building.primaryColor} emissiveIntensity={0.8} transparent opacity={hovered ? 0.4 : 0.6} />
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

// ── Plaza ──
function CityPlaza() {
  return (
    <group>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} /><meshStandardMaterial color="#B0A890" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.9, 1, 0.24, 12]} /><meshStandardMaterial color="#6B6B78" roughness={0.6} /></mesh>
      <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.85, 0.85, 0.06, 12]} /><meshStandardMaterial color="#3A80B0" transparent opacity={0.55} roughness={0.05} /></mesh>
      <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.06, 0.08, 0.5, 6]} /><meshStandardMaterial color="#8A8A98" roughness={0.4} /></mesh>
      <mesh position={[0, 0.95, 0]}><sphereGeometry args={[0.1, 8, 8]} /><meshStandardMaterial color="#C0A870" metalness={0.6} roughness={0.3} /></mesh>
      {[[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.07, 0.1, 1, 4]} /><meshStandardMaterial color="#5A3A20" /></mesh>
          <mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.5, 6, 6]} /><meshStandardMaterial color="#2D5A1E" /></mesh>
        </group>
      ))}
    </group>
  );
}

// ── Ground + Roads ──
function CityGround() {
  return (
    <group>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2, 60]} /><meshStandardMaterial color="#2A2A30" /></mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[60, 2]} /><meshStandardMaterial color="#2A2A30" /></mesh>
      {DISTRICTS.slice(1).map((d, i) => (
        <mesh key={i} position={[d.x, 0.008, d.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[d.radius, 16]} /><meshStandardMaterial color={d.color} transparent opacity={0.06} />
        </mesh>
      ))}
    </group>
  );
}

// ── Street Lights ──
const StreetLights = memo(function StreetLights() {
  const dn = useDayNight();
  const emissiveBoost = dn.isNight ? 4 : dn.isSunset ? 2 : 1;
  const positions = useMemo(() => {
    const pts: { x: number; z: number; h: number }[] = [];
    for (let v = -28; v <= 28; v += 8) {
      if (Math.abs(v) < 5) continue;
      pts.push({ x: 1.8, z: v, h: 2.2 }, { x: -1.8, z: v, h: 2.2 }, { x: v, z: 1.8, h: 2.2 }, { x: v, z: -1.8, h: 2.2 });
    }
    return pts;
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, p.h / 2, 0]}><cylinderGeometry args={[0.02, 0.035, p.h, 4]} /><meshStandardMaterial color="#2A2A2A" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[0, p.h + 0.03, 0]}><sphereGeometry args={[0.045, 4, 4]} /><meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={emissiveBoost} /></mesh>
        </group>
      ))}
    </group>
  );
});

// ── Parked Cars ──
const VoxelParkedCars = memo(function VoxelParkedCars() {
  const cars = useMemo(() => [
    { x: -16, z: -3, color: "#D4A030", rot: 0 }, { x: -10, z: -3, color: "#C94040", rot: 0 },
    { x: 16, z: -3, color: "#3A7A6A", rot: Math.PI }, { x: 10, z: -3, color: "#5A6A8A", rot: Math.PI },
    { x: -16, z: 3, color: "#B85C38", rot: 0 }, { x: 10, z: 3, color: "#6B3A3A", rot: Math.PI },
  ], []);

  return (
    <group>
      {cars.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.rot, 0]}>
          <mesh position={[0, 0.13, 0]}><boxGeometry args={[0.35, 0.18, 0.55]} /><meshStandardMaterial color={c.color} /></mesh>
          <mesh position={[0, 0.27, 0]}><boxGeometry args={[0.31, 0.14, 0.3]} /><meshStandardMaterial color={c.color} /></mesh>
          {[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sz], wi) => (
            <mesh key={wi} position={[sx*0.16, 0.04, sz*0.2]}><boxGeometry args={[0.04, 0.08, 0.08]} /><meshStandardMaterial color="#222" /></mesh>
          ))}
          <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.4, 0.6]} /><meshBasicMaterial color="#000" transparent opacity={0.08} /></mesh>
        </group>
      ))}
    </group>
  );
});

// ════════════════════════════════════════════
// MAIN EXPORTED COMPONENT
// ════════════════════════════════════════════

interface CityExploreSceneProps {
  playerName: string;
  onReady?: () => void;
  onBuildingClick?: (buildingId: string) => void;
  osmBuildings?: CityBuilding[];
  osmStreets?: OSMStreet[];
  osmTrees?: OSMTreeData[];
  osmGreenAreas?: OSMGreenArea[];
  osmBounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  isOSMMode?: boolean;
}

export function CityExploreScene({
  playerName, onReady, onBuildingClick,
  osmBuildings, osmStreets, osmTrees, osmGreenAreas, osmBounds, isOSMMode,
}: CityExploreSceneProps) {
  const dn = useDayNight();

  // Debug: log OSM data when it arrives
  useEffect(() => {
    if (isOSMMode && osmBuildings) {
      console.log(`[CityScene:osm] ${osmBuildings.length} buildings, bounds:`, osmBounds);
      if (osmBuildings.length > 0) {
        const b0 = osmBuildings[0];
        console.log(`[CityScene:osm] First building at (${b0.coordinates.x.toFixed(1)}, ${b0.coordinates.z.toFixed(1)}), height=${b0.height}`);
      }
    }
  }, [isOSMMode, osmBuildings, osmBounds]);

  // LoD system
  const buildingDefs = useMemo(() => CITY_BUILDINGS.map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d, h: b.h, color: b.color, rot: b.rot, mirror: b.mirror, forceClass: (b as any).forceClass })), []);
  const { config: lodConfig, computeFrame } = useCityLod(buildingDefs);

  // userId is no longer needed here - buildings are passed from parent
  const userId = "";

  const { visibleBuildings, userBuilding, updateCameraCenter } = useCityBuildings(userId);

  // Safe spawn — procedural mode
  const hasSpawned = useRef(false);
  useEffect(() => {
    if (hasSpawned.current || isOSMMode) return;
    const colliders = buildStaticColliders();
    const staticAABBs = buildNewAABBs(colliders);
    let sx = 0, sz = 5;
    if (userBuilding) {
      sx = Math.max(-80, Math.min(80, userBuilding.coordinates.x));
      sz = Math.max(-80, Math.min(80, userBuilding.coordinates.z));
    }
    const [safeX, safeZ] = findSafeSpawn(sx + 2, sz + 2, 0.25, staticAABBs);
    const terrainY = getTerrainHeight(safeX, safeZ);
    useGameStore.getState().setPlayerPosition([safeX, terrainY, safeZ]);
    hasSpawned.current = true;
    console.log("[CityScene:spawn:procedural]", { safeX, safeZ, terrainY });
  }, [userBuilding, isOSMMode]);

  // Safe spawn — OSM mode: teleport player to center of loaded city
  const osmSpawned = useRef(false);
  useEffect(() => {
    if (!isOSMMode || !osmBounds || osmSpawned.current) return;
    const cx = (osmBounds.minX + osmBounds.maxX) / 2;
    const cz = (osmBounds.minZ + osmBounds.maxZ) / 2;
    useGameStore.getState().setPlayerPosition([cx, 0, cz]);
    osmSpawned.current = true;
    console.log("[CityScene:spawn:osm]", { cx, cz, bounds: osmBounds });
  }, [isOSMMode, osmBounds]);

  // Dynamic buildings — use coordinates as stored (no scaling)
  const dynamicBuildings = useMemo(() => {
    return visibleBuildings.slice(0, 20);
  }, [visibleBuildings]);

  // Build unified AABBs
  const aabbs = useMemo(() => {
    const colliders: BuildingCollider[] = CITY_BUILDINGS.map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d }));
    for (const b of dynamicBuildings) {
      colliders.push({ x: b.coordinates.x, z: b.coordinates.z, w: 2.8, d: 2.8 });
    }
    // Fountain
    colliders.push({ x: 0, z: 0, w: 2.4, d: 2.4 });
    return buildNewAABBs(colliders);
  }, [dynamicBuildings]);

  // LoD per frame
  const playerPos = useGameStore(s => s.player.position);
  const lodFrame = useMemo(() => computeFrame(playerPos[0], playerPos[2]), [computeFrame, playerPos]);
  const [occludedBuildings, setOccludedBuildings] = useState<Set<string>>(new Set());

  // Sync camera center for building loading — use player position directly
  useEffect(() => {
    updateCameraCenter(playerPos[0], playerPos[2]);
  }, [playerPos, updateCameraCenter]);

  return (
    <div className="absolute inset-0 w-full h-full">

      <Canvas
        shadows
        style={{ touchAction: "none", width: "100%", height: "100%", display: "block" }}
        camera={{ position: isOSMMode ? [15, 30, 35] : [12, 25, 30], fov: 50, near: 0.5, far: isOSMMode ? 2000 : Math.min(lodConfig.cameraFar, 400) }}
        gl={{ antialias: true, powerPreference: "high-performance", stencil: false, depth: true }}
        dpr={[0.85, 1.25]}
        frameloop="always"
        performance={{ min: 0.5 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = Math.max(dn.exposure, 1.2);
          onReady?.();
          console.log("[CityScene:ready] Canvas initialized");
        }}
      >
        <color attach="background" args={[dn.bgColor]} />
        <fog attach="fog" args={[
          dn.fogColor,
          isOSMMode ? Math.max(dn.fogNear, 80) : lodConfig.fogNear * 2.5,
          isOSMMode ? Math.max(dn.fogFar, 500) : lodConfig.fogFar * 2.5
        ]} />

        {/* Lighting — bright, warm, readable */}
        <ambientLight intensity={Math.max(dn.ambientIntensity, 0.5)} color={dn.ambientColor} />
        <directionalLight
          position={dn.sunPosition}
          intensity={dn.sunIntensity * 1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={80}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-bias={-0.0005}
          color={dn.sunColor}
        />
        {/* Fill light — prevents pitch-black shadows */}
        <directionalLight
          position={[-dn.sunPosition[0] * 0.6, dn.sunPosition[1] * 0.5, -dn.sunPosition[2] * 0.6]}
          intensity={dn.sunIntensity * 0.45}
          color={dn.isNight ? "#4466AA" : "#D0DDE8"}
        />
        {/* Rim/back light for depth */}
        <directionalLight
          position={[dn.sunPosition[0] * 0.3, dn.sunPosition[1] * 0.8, dn.sunPosition[2] * -1]}
          intensity={dn.sunIntensity * 0.2}
          color="#E8D8C8"
        />
        <hemisphereLight args={[dn.skyColor, dn.groundColor, dn.hemiIntensity * 1.4]} />

        {dn.isNight && (
          <group position={[-20, 30, -15]}>
            <mesh><sphereGeometry args={[2, 16, 16]} /><meshBasicMaterial color="#E8E8F0" /></mesh>
            <pointLight position={[0, 0, 0]} intensity={0.3} color="#8899CC" distance={200} />
          </group>
        )}
        {lodConfig.enableStars && dn.showStars && <Stars radius={80} depth={30} count={800} factor={3} saturation={0.3} fade speed={0.3} />}

        {/* ── CORE SYSTEMS ── */}
        <CameraRig isOSMMode={!!isOSMMode} />
        <PlayerRig aabbs={aabbs} isOSMMode={!!isOSMMode} />
        <VehicleToggleHandler />
        <ClickToMove aabbs={aabbs} isOSMMode={!!isOSMMode} />
        {!isOSMMode && <CameraOcclusion onOccludedBuildings={setOccludedBuildings} />}

        {/* ── VEHICLE ── */}
        <VehicleR3F aabbs={isOSMMode ? [] : aabbs} playerName={playerName} />

        {/* ── PLAYER VISUAL ── */}
        <PlayerVisual name={playerName} scale={isOSMMode ? 2 : 1} />

        {/* ── NPCs (proximity-based, both modes) ── */}
        <CityNPCSystem
          playerX={playerPos[0]}
          playerZ={playerPos[2]}
          aabbs={isOSMMode ? [] : aabbs}
          maxNPCs={isOSMMode ? 16 : 12}
          spawnRadius={isOSMMode ? 30 : 40}
        />

        {/* ── Coordinate axes (only dev, hidden from production feel) ── */}

        {isOSMMode && osmBuildings && osmStreets && osmBounds && (
          <OSMWorldRenderer
            buildings={osmBuildings}
            streets={osmStreets}
            trees={osmTrees}
            greenAreas={osmGreenAreas}
            bounds={osmBounds}
            playerX={playerPos[0]}
            playerZ={playerPos[2]}
            userBuildings={dynamicBuildings}
            maxGLBBuildings={80}
          />
        )}

        {/* ── WORLD: Procedural ── */}
        {!isOSMMode && (
          <>
            <WorldTerrain size={400} resolution={80} />
            <WorldChunkRenderer
              playerX={playerPos[0]}
              playerZ={playerPos[2]}
              loadRadius={Math.min(lodConfig.chunkLoadRadius + 1, 4)}
              maxGLBBuildings={Math.min(lodConfig.maxFullDetailBuildings, 15)}
            />
            <CityGround />
            <CityPlaza />
            <StreetLights />
            {lodConfig.enableVehicles && <VoxelParkedCars />}
          </>
        )}

        {/* Static buildings (procedural mode) */}
        {!isOSMMode && lodFrame.lodBuildings
          .filter(lb => lb.lod <= 1)
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
              />
            );
          })}

        {/* Dynamic user buildings */}
        {!isOSMMode && dynamicBuildings.map(b => (
          <LightBuilding3D
            key={b.id}
            building={b}
            highlighted={userBuilding?.id === b.id}
            onClick={() => onBuildingClick?.(b.id)}
            occluded={false}
          />
        ))}

        {/* User building parked vehicle (decorative) */}
        {!isOSMMode && userBuilding && dynamicBuildings.filter(b => b.id === userBuilding.id).map(b => {
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
      </Canvas>
    </div>
  );
}
