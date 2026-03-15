import { useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Agent, Player } from "@/types/agent";
import type { RoomDef, FurnitureItem } from "@/data/officeMap";
import { FurnitureModel } from "./FurnitureModels";

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981", idle: "#F59E0B", thinking: "#6366F1", busy: "#EF4444",
};

const S = 0.5; // tile to world scale

// ── Building with exterior (Sims/Habbo style cutaway) ──
function BuildingExterior({
  rooms,
  onFloorClick,
  clickEnabled,
}: {
  rooms: RoomDef[];
  onFloorClick?: (x: number, y: number) => void;
  clickEnabled?: boolean;
}) {
  const pad = 1.5;
  const minX = Math.min(...rooms.map((r) => r.x)) - pad;
  const minY = Math.min(...rooms.map((r) => r.y)) - pad;
  const maxX = Math.max(...rooms.map((r) => r.x + r.w)) + pad;
  const maxY = Math.max(...rooms.map((r) => r.y + r.h)) + pad;
  const bw = (maxX - minX) * S;
  const bh = (maxY - minY) * S;
  const cx = ((minX + maxX) / 2) * S;
  const cz = ((minY + maxY) / 2) * S;

  const foundH = 0.25;   // foundation height
  const wallH = 1.1;     // exterior wall height
  const wallT = 0.25;    // wall thickness
  const brickColor = "#8B6B52";    // warm brown brick
  const brickDark = "#6B4F3A";     // darker accent
  const trimColor = "#D4C8B8";     // light trim/molding
  const foundColor = "#5A5A5A";    // concrete foundation
  const windowColor = "#6BA3D6";   // window glass
  const windowFrame = "#3A3A3A";   // window frame

  const downRef = useRef<{ x: number; y: number; t: number; button: number } | null>(null);

  const handleFloorDown = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    // Don't stopPropagation here — OrbitControls needs the native pointer events.
    downRef.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      t: performance.now(),
      button: e.nativeEvent.button,
    };
  };

  const handleFloorUp = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    const down = downRef.current;
    downRef.current = null;
    if (!down) return;
    if (down.button !== 0) return; // left click only

    const dist = Math.hypot(e.nativeEvent.clientX - down.x, e.nativeEvent.clientY - down.y);
    const dt = performance.now() - down.t;

    // Treat as click only if the pointer didn't move (so drag rotates camera)
    if (dist > 6 || dt > 450) return;

    const tx = Math.floor(e.point.x / S + 0.5);
    const ty = Math.floor(e.point.z / S + 0.5);
    onFloorClick?.(tx, ty);
  };

  // Generate windows along a wall
  const windowsAlongX = (y: number, z: number, count: number, startX: number, spanW: number) => {
    const spacing = spanW / (count + 1);
    return Array.from({ length: count }).map((_, i) => {
      const wx = startX + spacing * (i + 1);
      return (
        <group key={`wx${i}-${z}`} position={[wx, y, z]}>
          {/* Window frame */}
          <mesh><boxGeometry args={[0.35, 0.3, 0.05]} /><meshStandardMaterial color={windowFrame} /></mesh>
          {/* Glass */}
          <mesh position={[0, 0, 0.01]}><boxGeometry args={[0.28, 0.24, 0.02]} /><meshStandardMaterial color={windowColor} transparent opacity={0.6} emissive={windowColor} emissiveIntensity={0.15} /></mesh>
          {/* Sill */}
          <mesh position={[0, -0.17, 0.05]}><boxGeometry args={[0.4, 0.03, 0.08]} /><meshStandardMaterial color={trimColor} /></mesh>
        </group>
      );
    });
  };

  const windowsAlongZ = (y: number, x: number, count: number, startZ: number, spanH: number) => {
    const spacing = spanH / (count + 1);
    return Array.from({ length: count }).map((_, i) => {
      const wz = startZ + spacing * (i + 1);
      return (
        <group key={`wz${i}-${x}`} position={[x, y, wz]}>
          <mesh><boxGeometry args={[0.05, 0.3, 0.35]} /><meshStandardMaterial color={windowFrame} /></mesh>
          <mesh position={[0.01, 0, 0]}><boxGeometry args={[0.02, 0.24, 0.28]} /><meshStandardMaterial color={windowColor} transparent opacity={0.6} emissive={windowColor} emissiveIntensity={0.15} /></mesh>
          <mesh position={[0.05, -0.17, 0]}><boxGeometry args={[0.08, 0.03, 0.4]} /><meshStandardMaterial color={trimColor} /></mesh>
        </group>
      );
    });
  };

  const northZ = cz - bh / 2;
  const southZ = cz + bh / 2;
  const westX = cx - bw / 2;
  const eastX = cx + bw / 2;
  const winY = foundH + wallH * 0.55;
  const nWinX = Math.floor(bw / 1.5);
  const nWinZ = Math.floor(bh / 1.5);

  return (
    <group>
      {/* ── Foundation / Platform ── */}
      <mesh position={[cx, foundH / 2, cz]}>
        <boxGeometry args={[bw + wallT * 2 + 0.1, foundH, bh + wallT * 2 + 0.1]} />
        <meshStandardMaterial color={foundColor} />
      </mesh>
      {/* Foundation trim */}
      <mesh position={[cx, foundH + 0.02, cz]}>
        <boxGeometry args={[bw + wallT * 2 + 0.2, 0.04, bh + wallT * 2 + 0.2]} />
        <meshStandardMaterial color="#707070" />
      </mesh>

      {/* ── Interior floor (clickable) ── */}
      <mesh
        position={[cx, foundH + 0.001, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={handleFloorDown}
        onPointerUp={handleFloorUp}
      >
        <planeGeometry args={[bw, bh]} />
        <meshStandardMaterial color="#E8E0D4" />
      </mesh>
      {/* Floor tile grid */}
      {Array.from({ length: Math.ceil(bw) + 1 }).map((_, i) => (
        <mesh key={`vl${i}`} raycast={() => null} position={[cx - bw / 2 + i, foundH + 0.002, cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.015, bh]} /><meshBasicMaterial color="#D0C8B8" />
        </mesh>
      ))}
      {Array.from({ length: Math.ceil(bh) + 1 }).map((_, i) => (
        <mesh key={`hl${i}`} raycast={() => null} position={[cx, foundH + 0.002, cz - bh / 2 + i]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[bw, 0.015]} /><meshBasicMaterial color="#D0C8B8" />
        </mesh>
      ))}

      {/* ── Exterior Walls (brick) ── */}
      {/* North wall (back - full height, visible) */}
      <mesh position={[cx, foundH + wallH / 2, northZ - wallT / 2]}>
        <boxGeometry args={[bw + wallT * 2, wallH, wallT]} />
        <meshStandardMaterial color={brickColor} />
      </mesh>
      {/* Brick horizontal lines on north wall */}
      {[0.2, 0.4, 0.6, 0.8].map((frac) => (
        <mesh key={`bn${frac}`} position={[cx, foundH + wallH * frac, northZ - wallT / 2 - 0.001]} raycast={() => null}>
          <boxGeometry args={[bw + wallT * 2 + 0.01, 0.015, 0.01]} />
          <meshStandardMaterial color={brickDark} />
        </mesh>
      ))}

      {/* South wall (front - lower, cutaway style) */}
      <mesh position={[cx, foundH + wallH * 0.35 / 2, southZ + wallT / 2]}>
        <boxGeometry args={[bw + wallT * 2, wallH * 0.35, wallT]} />
        <meshStandardMaterial color={brickColor} />
      </mesh>

      {/* West wall (left - full height) */}
      <mesh position={[westX - wallT / 2, foundH + wallH / 2, cz]}>
        <boxGeometry args={[wallT, wallH, bh + wallT * 2]} />
        <meshStandardMaterial color={brickDark} />
      </mesh>

      {/* East wall (right - partial cutaway) */}
      <mesh position={[eastX + wallT / 2, foundH + wallH * 0.5 / 2, cz]}>
        <boxGeometry args={[wallT, wallH * 0.5, bh + wallT * 2]} />
        <meshStandardMaterial color={brickDark} />
      </mesh>

      {/* ── Top trim / molding ── */}
      <mesh position={[cx, foundH + wallH, northZ - wallT / 2]}>
        <boxGeometry args={[bw + wallT * 2 + 0.15, 0.06, wallT + 0.1]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>
      <mesh position={[westX - wallT / 2, foundH + wallH, cz]}>
        <boxGeometry args={[wallT + 0.1, 0.06, bh + wallT * 2 + 0.15]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>

      {/* ── Baseboard (interior) ── */}
      <mesh position={[cx, foundH + 0.025, northZ + 0.03]}>
        <boxGeometry args={[bw, 0.05, 0.04]} /><meshStandardMaterial color="#6B6358" />
      </mesh>
      <mesh position={[westX + 0.03, foundH + 0.025, cz]}>
        <boxGeometry args={[0.04, 0.05, bh]} /><meshStandardMaterial color="#6B6358" />
      </mesh>

      {/* ── Windows on exterior walls ── */}
      {/* North wall windows */}
      {windowsAlongX(winY, northZ - wallT - 0.001, nWinX, cx - bw / 2, bw)}
      {/* West wall windows */}
      {windowsAlongZ(winY, westX - wallT - 0.001, nWinZ, cz - bh / 2, bh)}

      {/* ── Ceiling lights (fluorescent) ── */}
      {Array.from({ length: 8 }).map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        return (
          <group key={`cl${i}`}>
            <mesh position={[cx - bw * 0.3 + col * (bw * 0.2), foundH + wallH - 0.04, cz - bh * 0.2 + row * (bh * 0.4)]}>
              <boxGeometry args={[0.6, 0.025, 0.12]} />
              <meshStandardMaterial color="#FFF8E8" emissive="#FFF8E8" emissiveIntensity={0.4} />
            </mesh>
            <pointLight
              position={[cx - bw * 0.3 + col * (bw * 0.2), foundH + wallH - 0.1, cz - bh * 0.2 + row * (bh * 0.4)]}
              intensity={0.12}
              distance={4}
              color="#FFF5DC"
            />
          </group>
        );
      })}

      {/* ── Ground plane around building ── */}
      <mesh position={[cx, -0.01, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#3A3A3A" />
      </mesh>
    </group>
  );
}

// ── Room 3D ──
function Room3D({
  room,
  onFloorClick,
  clickEnabled,
}: {
  room: RoomDef;
  onFloorClick?: (x: number, y: number) => void;
  clickEnabled?: boolean;
}) {
  const w = room.w * S;
  const h = room.h * S;
  const x = room.x * S + w / 2;
  const z = room.y * S + h / 2;
  const wallH = 0.75;
  const wallT = 0.08;

  const downRef = useRef<{ x: number; y: number; t: number; button: number } | null>(null);

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    downRef.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      t: performance.now(),
      button: e.nativeEvent.button,
    };
  };

  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    const down = downRef.current;
    downRef.current = null;
    if (!down) return;
    if (down.button !== 0) return;

    const dist = Math.hypot(e.nativeEvent.clientX - down.x, e.nativeEvent.clientY - down.y);
    const dt = performance.now() - down.t;
    if (dist > 6 || dt > 450) return;

    const tx = Math.floor(e.point.x / S + 0.5);
    const ty = Math.floor(e.point.z / S + 0.5);
    onFloorClick?.(tx, ty);
  };

  return (
    <group position={[x, 0, z]}>
      {/* Room floor */}
      <mesh
        position={[0, 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={handleDown}
        onPointerUp={handleUp}
      >
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={room.floorColor} />
      </mesh>
      {room.carpetColor && (
        <mesh
          position={[0, 0.006, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerDown={handleDown}
          onPointerUp={handleUp}
        >
          <planeGeometry args={[w * 0.7, h * 0.7]} />
          <meshStandardMaterial color={room.carpetColor} />
        </mesh>
      )}

      {/* Room walls */}
      {/* Back */}
      <mesh position={[0, wallH / 2, -h / 2]}>
        <boxGeometry args={[w + wallT, wallH, wallT]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Left */}
      <mesh position={[-w / 2, wallH / 2, 0]}>
        <boxGeometry args={[wallT, wallH, h + wallT]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Right */}
      <mesh position={[w / 2, wallH / 2, 0]}>
        <boxGeometry args={[wallT, wallH, h + wallT]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Front - door opening in center */}
      {(() => {
        const doorW = 0.5;
        const sideW = (w - doorW) / 2;
        return (
          <>
            <mesh position={[-(doorW / 2 + sideW / 2), wallH / 2, h / 2]}>
              <boxGeometry args={[sideW, wallH, wallT]} />
              <meshStandardMaterial color={room.wallColor} />
            </mesh>
            <mesh position={[(doorW / 2 + sideW / 2), wallH / 2, h / 2]}>
              <boxGeometry args={[sideW, wallH, wallT]} />
              <meshStandardMaterial color={room.wallColor} />
            </mesh>
            {/* Door frame top */}
            <mesh position={[0, wallH - 0.05, h / 2]}>
              <boxGeometry args={[doorW + 0.06, 0.05, wallT + 0.02]} />
              <meshStandardMaterial color="#5C4033" />
            </mesh>
          </>
        );
      })()}

      {/* Room name sign on back wall */}
      <mesh position={[0, wallH - 0.12, -h / 2 + wallT / 2 + 0.001]}>
        <planeGeometry args={[Math.min(w * 0.6, 1.2), 0.15]} />
        <meshStandardMaterial color="#F5F0E8" />
      </mesh>
      <Html position={[0, wallH - 0.12, -h / 2 + wallT / 2 + 0.01]} center>
        <div className="px-2 py-0.5 text-[9px] font-bold text-gray-700 whitespace-nowrap pointer-events-none select-none" style={{ fontFamily: "monospace" }}>
          {room.name}
        </div>
      </Html>
    </group>
  );
}

// ── Character base (shared between agents and player) ──
function useWalkAnimation(
  ref: React.RefObject<THREE.Group | null>,
  leftLeg: React.RefObject<THREE.Mesh | null>,
  rightLeg: React.RefObject<THREE.Mesh | null>,
  leftArm: React.RefObject<THREE.Mesh | null>,
  rightArm: React.RefObject<THREE.Mesh | null>,
  targetX: number,
  targetZ: number,
  smoothPos: React.MutableRefObject<THREE.Vector3>,
  prevPos: React.MutableRefObject<{ x: number; z: number }>,
  lerpSpeed = 0.15
) {
  useFrame(() => {
    if (!ref.current) return;

    smoothPos.current.x += (targetX - smoothPos.current.x) * lerpSpeed;
    smoothPos.current.z += (targetZ - smoothPos.current.z) * lerpSpeed;

    const dx = Math.abs(targetX - smoothPos.current.x);
    const dz = Math.abs(targetZ - smoothPos.current.z);
    const moving = dx > 0.005 || dz > 0.005;

    ref.current.position.set(smoothPos.current.x, 0, smoothPos.current.z);

    // Walking bounce or idle bob
    if (moving) {
      ref.current.position.y = Math.abs(Math.sin(Date.now() * 0.015)) * 0.025;
    } else {
      ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.008;
    }

    // Leg & arm swing
    const swing = moving ? Math.sin(Date.now() * 0.016) * 0.5 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = moving ? swing : leftLeg.current.rotation.x * 0.85;
    if (rightLeg.current) rightLeg.current.rotation.x = moving ? -swing : rightLeg.current.rotation.x * 0.85;
    if (leftArm.current) leftArm.current.rotation.x = moving ? -swing * 0.5 : leftArm.current.rotation.x * 0.85;
    if (rightArm.current) rightArm.current.rotation.x = moving ? swing * 0.5 : rightArm.current.rotation.x * 0.85;

    // Face direction
    if (targetX !== prevPos.current.x || targetZ !== prevPos.current.z) {
      const dirX = targetX - prevPos.current.x;
      const dirZ = targetZ - prevPos.current.z;
      if (Math.abs(dirX) > 0.001 || Math.abs(dirZ) > 0.001) {
        const angle = Math.atan2(dirX, dirZ);
        // Smooth rotation
        let diff = angle - ref.current.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        ref.current.rotation.y += diff * 0.12;
      }
      prevPos.current = { x: targetX, z: targetZ };
    }
  });
}

// ── Agent 3D ──
function Agent3D({ agent, selected, onClick }: { agent: Agent; selected?: boolean; onClick: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const smoothPos = useRef(new THREE.Vector3(agent.x * S, 0, agent.y * S));
  const prevPos = useRef({ x: agent.x * S, z: agent.y * S });
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);

  useWalkAnimation(ref, leftLeg, rightLeg, leftArm, rightArm, agent.x * S, agent.y * S, smoothPos, prevPos, 0.1);

  return (
    <group
      ref={ref}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.22, 0.28, 0.14]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.18, 0.18, 0.16]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 0.47, 0.081]}>
        <boxGeometry args={[0.14, 0.08, 0.01]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Eyes */}
      {[-0.035, 0.035].map((ox, i) => (
        <mesh key={i} position={[ox, 0.48, 0.09]}>
          <boxGeometry args={[0.035, 0.035, 0.01]} />
          <meshStandardMaterial
            color={agent.status === "thinking" ? "#6366F1" : "#00FF88"}
            emissive={agent.status === "thinking" ? "#6366F1" : "#00FF88"}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
      {/* Arms */}
      <mesh ref={leftArm} position={[-0.14, 0.24, 0]}>
        <boxGeometry args={[0.05, 0.18, 0.07]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      <mesh ref={rightArm} position={[0.14, 0.24, 0]}>
        <boxGeometry args={[0.05, 0.18, 0.07]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Antenna + LED */}
      <mesh position={[0, 0.61, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 6]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      <mesh position={[0, 0.67, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={STATUS_COLORS[agent.status]} emissive={STATUS_COLORS[agent.status]} emissiveIntensity={1.8} />
      </mesh>
      {/* Legs */}
      <mesh ref={leftLeg} position={[-0.055, 0.06, 0]}>
        <boxGeometry args={[0.07, 0.12, 0.09]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      <mesh ref={rightLeg} position={[0.055, 0.06, 0]}>
        <boxGeometry args={[0.07, 0.12, 0.09]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.14, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.12} />
      </mesh>
      {/* Selection ring */}
      {(selected || hovered) && (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.26, 32]} />
          <meshBasicMaterial color={selected ? "#6366F1" : "#90CAF9"} transparent opacity={0.7} />
        </mesh>
      )}
      {/* Name tag */}
      <Html position={[0, 0.82, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(20,20,30,0.9)] rounded-full whitespace-nowrap pointer-events-none select-none">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[agent.status] }} />
          <span className="text-[9px] text-white font-bold">{agent.name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Walking dust particles ──
function WalkingDust({ player }: { player: Player }) {
  const particles = useRef<THREE.InstancedMesh>(null);
  const dataRef = useRef<{ positions: Float32Array; velocities: Float32Array; lifetimes: Float32Array; spawnTimer: number }>({
    positions: new Float32Array(30 * 3),
    velocities: new Float32Array(30 * 3),
    lifetimes: new Float32Array(30).fill(-1),
    spawnTimer: 0,
  });
  const prevPos = useRef({ x: player.x, y: player.y });
  const dummy = useRef(new THREE.Object3D());
  const color = useRef(new THREE.Color("#C8B898"));

  useFrame((_, delta) => {
    if (!particles.current) return;
    const d = dataRef.current;
    const dt = Math.min(delta, 0.05);

    const dx = player.x - prevPos.current.x;
    const dy = player.y - prevPos.current.y;
    const speed = Math.hypot(dx, dy);
    prevPos.current = { x: player.x, y: player.y };

    // Spawn particles when moving
    if (speed > 0.01) {
      d.spawnTimer += dt;
      if (d.spawnTimer > 0.06) {
        d.spawnTimer = 0;
        for (let i = 0; i < 30; i++) {
          if (d.lifetimes[i] <= 0) {
            d.positions[i * 3] = player.x * S + (Math.random() - 0.5) * 0.08;
            d.positions[i * 3 + 1] = 0.02;
            d.positions[i * 3 + 2] = player.y * S + (Math.random() - 0.5) * 0.08;
            d.velocities[i * 3] = (Math.random() - 0.5) * 0.3;
            d.velocities[i * 3 + 1] = Math.random() * 0.4 + 0.1;
            d.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
            d.lifetimes[i] = 0.4 + Math.random() * 0.3;
            break;
          }
        }
      }
    }

    // Update all particles
    for (let i = 0; i < 30; i++) {
      if (d.lifetimes[i] > 0) {
        d.lifetimes[i] -= dt;
        d.positions[i * 3] += d.velocities[i * 3] * dt;
        d.positions[i * 3 + 1] += d.velocities[i * 3 + 1] * dt;
        d.positions[i * 3 + 2] += d.velocities[i * 3 + 2] * dt;
        d.velocities[i * 3 + 1] -= 0.5 * dt; // gravity

        const life = Math.max(0, d.lifetimes[i]);
        const scale = life * 0.06;
        dummy.current.position.set(d.positions[i * 3], d.positions[i * 3 + 1], d.positions[i * 3 + 2]);
        dummy.current.scale.setScalar(scale);
      } else {
        dummy.current.scale.setScalar(0);
        dummy.current.position.set(0, -10, 0);
      }
      dummy.current.updateMatrix();
      particles.current.setMatrixAt(i, dummy.current.matrix);
    }
    particles.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={particles} args={[undefined, undefined, 30]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={color.current} transparent opacity={0.5} />
    </instancedMesh>
  );
}

// ── Player 3D (fast interpolation, no lag) ──
function Player3D({ player, config }: { player: Player; config?: { color: string; skinTone?: string } }) {
  const ref = useRef<THREE.Group>(null);
  const smoothPos = useRef(new THREE.Vector3(player.x * S, 0, player.y * S));
  const smoothAngle = useRef(player.angle);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const prevPos = useRef({ x: player.x, y: player.y });

  const color = config?.color || "#4F46E5";
  const skin = config?.skinTone === "light" ? "#FDDCB5" : config?.skinTone === "dark" ? "#8D5B3E" : config?.skinTone === "tan" ? "#C8956C" : "#E8B88A";

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);

    const tx = player.x * S;
    const tz = player.y * S;

    // Delta-time based exponential interpolation (frame-rate independent)
    // Higher factor = snappier response. 1 - e^(-speed*dt) gives consistent feel across framerates
    const posFactor = 1 - Math.exp(-18 * dt);  // Very responsive position tracking
    const rotFactor = 1 - Math.exp(-14 * dt);  // Responsive rotation

    smoothPos.current.x += (tx - smoothPos.current.x) * posFactor;
    smoothPos.current.z += (tz - smoothPos.current.z) * posFactor;

    // Snap if very close to avoid perpetual micro-drift
    if (Math.abs(tx - smoothPos.current.x) < 0.0005) smoothPos.current.x = tx;
    if (Math.abs(tz - smoothPos.current.z) < 0.0005) smoothPos.current.z = tz;

    // Detect movement from actual position changes
    const speed = Math.hypot(player.x - prevPos.current.x, player.y - prevPos.current.y);
    const moving = speed > 0.001;
    prevPos.current = { x: player.x, y: player.y };

    ref.current.position.set(smoothPos.current.x, 0, smoothPos.current.z);

    // Walking bounce or idle bob
    if (moving) {
      ref.current.position.y = Math.abs(Math.sin(Date.now() * 0.015)) * 0.025;
    } else {
      ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.008;
    }

    // Smooth angle interpolation
    let diff = player.angle - smoothAngle.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    smoothAngle.current += diff * rotFactor;
    ref.current.rotation.y = smoothAngle.current;

    // Limb animations
    const swing = moving ? Math.sin(Date.now() * 0.016) * 0.5 : 0;
    const dampFactor = 1 - Math.exp(-8 * dt);
    if (leftLeg.current) leftLeg.current.rotation.x += ((moving ? swing : 0) - leftLeg.current.rotation.x) * dampFactor;
    if (rightLeg.current) rightLeg.current.rotation.x += ((moving ? -swing : 0) - rightLeg.current.rotation.x) * dampFactor;
    if (leftArm.current) leftArm.current.rotation.x += ((moving ? -swing * 0.5 : 0) - leftArm.current.rotation.x) * dampFactor;
    if (rightArm.current) rightArm.current.rotation.x += ((moving ? swing * 0.5 : 0) - rightArm.current.rotation.x) * dampFactor;
  });

  const furColor = "#5C3A1E";       // dark brown fur
  const faceColor = "#C4A882";      // light tan face/muzzle
  const sweaterColor = "#3B5DC9";   // blue sweater
  const glassesColor = "#2ECC40";   // green glasses
  const earringColor = "#FFD700";   // gold earring

  return (
    <group ref={ref}>
      {/* ── Legs ── */}
      <mesh ref={leftLeg} position={[-0.055, 0.06, 0]}>
        <boxGeometry args={[0.07, 0.12, 0.08]} />
        <meshStandardMaterial color="#2D3748" />
      </mesh>
      <mesh ref={rightLeg} position={[0.055, 0.06, 0]}>
        <boxGeometry args={[0.07, 0.12, 0.08]} />
        <meshStandardMaterial color="#2D3748" />
      </mesh>

      {/* ── Body (blue sweater) ── */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.26, 0.26, 0.15]} />
        <meshStandardMaterial color={sweaterColor} />
      </mesh>
      {/* Sweater logo (green circle on chest) */}
      <mesh position={[0, 0.23, 0.076]}>
        <circleGeometry args={[0.04, 8]} />
        <meshStandardMaterial color={glassesColor} />
      </mesh>

      {/* ── Arms (blue sweater sleeves) ── */}
      <mesh ref={leftArm} position={[-0.165, 0.24, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.08]} />
        <meshStandardMaterial color={sweaterColor} />
      </mesh>
      <mesh ref={rightArm} position={[0.165, 0.24, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.08]} />
        <meshStandardMaterial color={sweaterColor} />
      </mesh>
      {/* Hands (fur colored) */}
      <mesh position={[-0.165, 0.13, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      <mesh position={[0.165, 0.13, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color={furColor} />
      </mesh>

      {/* ── Head (ape shape - wider, taller) ── */}
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.22, 0.22, 0.2]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      {/* Fur top (slightly wider on top for ape silhouette) */}
      <mesh position={[0, 0.56, -0.02]}>
        <boxGeometry args={[0.2, 0.06, 0.14]} />
        <meshStandardMaterial color={furColor} />
      </mesh>

      {/* ── Muzzle / Face (protruding lighter area) ── */}
      <mesh position={[0, 0.43, 0.1]}>
        <boxGeometry args={[0.16, 0.14, 0.06]} />
        <meshStandardMaterial color={faceColor} />
      </mesh>
      {/* Nostrils */}
      {[-0.025, 0.025].map((ox, i) => (
        <mesh key={`nostril-${i}`} position={[ox, 0.42, 0.135]}>
          <boxGeometry args={[0.02, 0.02, 0.01]} />
          <meshStandardMaterial color="#3A2510" />
        </mesh>
      ))}
      {/* Mouth line */}
      <mesh position={[0, 0.39, 0.13]}>
        <boxGeometry args={[0.08, 0.01, 0.01]} />
        <meshStandardMaterial color="#3A2510" />
      </mesh>

      {/* ── Green pixel glasses ── */}
      {/* Frame bar */}
      <mesh position={[0, 0.49, 0.11]}>
        <boxGeometry args={[0.22, 0.06, 0.02]} />
        <meshStandardMaterial color={glassesColor} />
      </mesh>
      {/* Left lens (dark) */}
      <mesh position={[-0.055, 0.49, 0.12]}>
        <boxGeometry args={[0.07, 0.04, 0.01]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Right lens (dark) */}
      <mesh position={[0.055, 0.49, 0.12]}>
        <boxGeometry args={[0.07, 0.04, 0.01]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Lens glare (white pixels) */}
      <mesh position={[-0.04, 0.495, 0.126]}>
        <boxGeometry args={[0.02, 0.02, 0.005]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.07, 0.495, 0.126]}>
        <boxGeometry args={[0.02, 0.02, 0.005]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
      </mesh>
      {/* Glasses arms (sides) */}
      <mesh position={[-0.12, 0.49, 0.06]}>
        <boxGeometry args={[0.02, 0.04, 0.1]} />
        <meshStandardMaterial color={glassesColor} />
      </mesh>
      <mesh position={[0.12, 0.49, 0.06]}>
        <boxGeometry args={[0.02, 0.04, 0.1]} />
        <meshStandardMaterial color={glassesColor} />
      </mesh>

      {/* ── Ears ── */}
      <mesh position={[-0.14, 0.48, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.06]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      <mesh position={[-0.14, 0.48, 0]}>
        <boxGeometry args={[0.03, 0.05, 0.04]} />
        <meshStandardMaterial color={faceColor} />
      </mesh>
      <mesh position={[0.14, 0.48, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.06]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      <mesh position={[0.14, 0.48, 0]}>
        <boxGeometry args={[0.03, 0.05, 0.04]} />
        <meshStandardMaterial color={faceColor} />
      </mesh>

      {/* ── Gold earring (left ear) ── */}
      <mesh position={[-0.17, 0.44, 0]}>
        <torusGeometry args={[0.02, 0.005, 6, 8]} />
        <meshStandardMaterial color={earringColor} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── Shadow ── */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} />
      </mesh>

      {/* Crown (boss indicator) */}
      <Html position={[0, 0.68, 0]} center>
        <span className="text-sm select-none pointer-events-none">👑</span>
      </Html>
      {/* Name tag */}
      <Html position={[0, 0.8, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none select-none" style={{ backgroundColor: sweaterColor }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-[9px] text-white font-bold">{player.name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Camera target tracker (single-stage, delta-time based) ──
function CameraTarget({ player, controlsRef }: { player: Player; controlsRef: React.RefObject<any> }) {
  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const factor = 1 - Math.exp(-8 * dt); // Smooth but responsive

    const px = player.x * S;
    const pz = player.y * S;
    const target = controlsRef.current.target;

    target.x += (px - target.x) * factor;
    target.z += (pz - target.z) * factor;
    // Keep y at ground level
    target.y += (0 - target.y) * factor;
  });

  return null;
}

// ── Main Scene ──
interface OfficeSceneProps {
  agents: Agent[];
  player: Player;
  rooms: RoomDef[];
  furniture: FurnitureItem[];
  playerConfig?: { color: string; hairStyle?: string; outfitStyle?: string; skinTone?: string; accessory?: string };
  selectedAgentId?: string;
  onAgentClick: (agent: Agent) => void;
  editMode?: boolean;
  selectedFurnitureId?: string | null;
  hoveredFurnitureId?: string | null;
  onFurnitureClick?: (id: string) => void;
  onFurnitureHover?: (id: string | null) => void;
  onMapClick?: (x: number, y: number) => void;
}

function ControlsUpdater({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  useFrame(() => {
    controlsRef.current?.update();
  });
  return null;
}

export function OfficeScene({
  agents,
  player,
  rooms,
  furniture,
  playerConfig,
  selectedAgentId,
  onAgentClick,
  editMode,
  selectedFurnitureId,
  hoveredFurnitureId,
  onFurnitureClick,
  onFurnitureHover,
  onMapClick,
}: OfficeSceneProps) {
  const controlsRef = useRef<any>(null);

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        style={{ touchAction: "none" }}
        camera={{ position: [14, 12, 14], fov: 35, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        {/* Dark background like Habbo/Sims */}
        <color attach="background" args={["#1A1A2E"]} />
        <fog attach="fog" args={["#1A1A2E", 25, 55]} />

        {/* Indoor lighting - warm office lights */}
        <ambientLight intensity={0.6} color="#FFF5E6" />
        <directionalLight
          position={[10, 20, 8]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        {/* Fill light from opposite side */}
        <directionalLight position={[-8, 10, -6]} intensity={0.3} color="#E8E4DC" />
        <hemisphereLight args={["#FFF8F0", "#D5CFC5", 0.25]} />

        {/* Camera controls - mouse drag rotate, wheel zoom, right-drag pan; works on trackpad wheel for zoom */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          enablePan
          enableZoom
          enableRotate
          minDistance={3}
          maxDistance={22}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.6}
          minAzimuthAngle={-Math.PI}
          maxAzimuthAngle={Math.PI}
          zoomSpeed={0.9}
          rotateSpeed={0.7}
          panSpeed={0.75}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
          target={[player.x * S, 0, player.y * S]}
        />
        <ControlsUpdater controlsRef={controlsRef} />
        <CameraTarget player={player} controlsRef={controlsRef} />

        {/* Building (click-to-move) */}
        <BuildingExterior
          rooms={rooms}
          clickEnabled={!editMode}
          onFloorClick={(x, y) => onMapClick?.(x, y)}
        />

        {/* All interior objects raised by foundation height */}
        <group position={[0, 0.25, 0]}>
          {/* Rooms */}
          {rooms.map((room) => (
            <Room3D
              key={room.id}
              room={room}
              clickEnabled={!editMode}
              onFloorClick={(x, y) => onMapClick?.(x, y)}
            />
          ))}

          {/* Furniture */}
          {furniture.map(f => (
            <FurnitureModel
              key={f.id}
              type={f.type}
              position={[f.x * S, 0, f.y * S]}
              editMode={editMode}
              selected={selectedFurnitureId === f.id}
              hovered={hoveredFurnitureId === f.id}
              onClick={() => onFurnitureClick?.(f.id)}
              onPointerOver={() => onFurnitureHover?.(f.id)}
              onPointerOut={() => onFurnitureHover?.(null)}
            />
          ))}

          {/* Agents */}
          {agents.map(agent => (
            <Agent3D
              key={agent.id}
              agent={agent}
              selected={agent.id === selectedAgentId}
              onClick={() => onAgentClick(agent)}
            />
          ))}

          {/* Player */}
          <Player3D player={player} config={playerConfig} />

          {/* Walking dust particles */}
          <WalkingDust player={player} />
        </group>
      </Canvas>
    </div>
  );
}
