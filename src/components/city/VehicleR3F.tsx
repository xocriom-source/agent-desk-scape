/**
 * VehicleR3F — R3F vehicle component with kinematic physics.
 * Uses the VehicleController for realistic movement.
 */

import { useRef, useEffect, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { useInputStore } from "@/stores/inputStore";
import {
  stepVehiclePhysics,
  inputToVehicleControls,
  getVehicleConfig,
  type VehiclePhysicsState,
} from "@/city/physics/VehicleController";
import type { AABB } from "@/city/physics/CollisionSystem";
import { collidesAABB } from "@/city/physics/CollisionSystem";

interface VehicleR3FProps {
  aabbs: AABB[];
  playerName: string;
}

export const VehicleR3F = memo(function VehicleR3F({ aabbs, playerName }: VehicleR3FProps) {
  const ref = useRef<THREE.Group>(null);
  const wheelRefs = useRef<THREE.Mesh[]>([]);

  const vehicle = useGameStore((s) => s.vehicle);
  const playerPos = useGameStore((s) => s.player.position);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const setPlayerRotation = useGameStore((s) => s.setPlayerRotation);
  const setVehicleVelocity = useGameStore((s) => s.setVehicleVelocity);

  const physicsState = useRef<VehiclePhysicsState>({
    x: playerPos[0],
    z: playerPos[2],
    heading: 0,
    velocity: 0,
    steeringAngle: 0,
    throttle: 0,
    steering: 0,
  });

  // Sync initial position and heading when entering vehicle
  useEffect(() => {
    if (vehicle.isInVehicle) {
      const state = useGameStore.getState();
      physicsState.current.x = state.player.position[0];
      physicsState.current.z = state.player.position[2];
      physicsState.current.heading = state.player.rotation; // Match player's facing direction
      physicsState.current.velocity = 0;
      physicsState.current.steeringAngle = 0;
      console.log("[VehicleR3F:enter] heading=", state.player.rotation.toFixed(2));
    }
  }, [vehicle.isInVehicle]);

  const config = getVehicleConfig(vehicle.currentType);

  useFrame((_, delta) => {
    if (!vehicle.isInVehicle || !ref.current) return;
    const dt = Math.min(delta, 0.05);

    const keys = useInputStore.getState().keys;
    const { throttle, steering } = inputToVehicleControls(keys);

    physicsState.current.throttle = throttle;
    physicsState.current.steering = steering;

    const collisionCheck = (x: number, z: number, radius: number) =>
      collidesAABB(x, z, radius, aabbs);

    physicsState.current = stepVehiclePhysics(
      physicsState.current,
      config,
      delta,
      collisionCheck
    );

    const { x, z, heading, velocity, steeringAngle } = physicsState.current;

    // Update game store
    setPlayerPosition([x, 0, z]);
    setPlayerRotation(heading);
    setVehicleVelocity(velocity);

    // Update visual position
    ref.current.position.set(x, 0, z);
    ref.current.rotation.y = heading;

    // Body lean on turns (subtle roll)
    const leanAngle = -steeringAngle * Math.min(1, Math.abs(velocity) / 5) * 0.08;
    ref.current.rotation.z = leanAngle;

    // Wheel spin animation
    const wheelSpeed = velocity * dt * 10;
    wheelRefs.current.forEach((wheel) => {
      if (wheel) wheel.rotation.x += wheelSpeed;
    });
  });

  if (!vehicle.isInVehicle) return null;

  const color = vehicle.color;
  const speedKmh = Math.abs(physicsState.current.velocity * 3.6).toFixed(0);

  return (
    <group ref={ref} position={[playerPos[0], 0, playerPos[2]]}>
      {/* Car body */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.45, 0.22, 0.9]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.35, -0.05]} castShadow>
        <boxGeometry args={[0.4, 0.18, 0.5]} />
        <meshStandardMaterial color="#222" metalness={0.4} roughness={0.2} />
      </mesh>
      {/* Windows */}
      {[0.201, -0.201].map((x, i) => (
        <mesh key={i} position={[x, 0.35, -0.05]}>
          <boxGeometry args={[0.01, 0.14, 0.45]} />
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} metalness={0.8} />
        </mesh>
      ))}
      {/* Wheels */}
      {[
        [-0.22, 0.08, 0.3],
        [0.22, 0.08, 0.3],
        [-0.22, 0.08, -0.3],
        [0.22, 0.08, -0.3],
      ].map(([x, y, z], i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) wheelRefs.current[i] = el; }}
          position={[x, y, z]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.07, 0.07, 0.05, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      {/* Headlights */}
      {[-0.14, 0.14].map((x, i) => (
        <mesh key={`hl-${i}`} position={[x, 0.18, 0.46]}>
          <boxGeometry args={[0.07, 0.05, 0.02]} />
          <meshStandardMaterial color="#FFE" emissive="#FFD" emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* Taillights */}
      {[-0.14, 0.14].map((x, i) => (
        <mesh key={`tl-${i}`} position={[x, 0.18, -0.46]}>
          <boxGeometry args={[0.07, 0.04, 0.02]} />
          <meshStandardMaterial color="#F44" emissive="#F44" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 1.1]} />
        <meshBasicMaterial color="#000" transparent opacity={0.15} />
      </mesh>

      {/* Speedometer */}
      <Html position={[0, 0.7, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none select-none bg-black/70 backdrop-blur-sm border border-white/10">
          <span className="text-[10px] font-mono text-emerald-400 font-bold">{speedKmh} km/h</span>
          <span className="text-[8px] text-gray-400 ml-1">{playerName}</span>
        </div>
      </Html>
    </group>
  );
});
