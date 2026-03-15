import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { Agent, Player } from "@/types/agent";
import type { RoomDef, FurnitureItem } from "@/data/officeMap";
import playerApeImg from "@/assets/player-ape.webp";
import { FurnitureModel } from "./FurnitureModels";
import { useDayNight } from "@/hooks/useDayNight";

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981", idle: "#F59E0B", thinking: "#6366F1", busy: "#EF4444",
};

const S = 0.5; // tile to world scale

// ── Distant skyline building with glowing windows ──
function SkylineBuilding({ position, width, height, color }: { position: [number, number, number]; width: number; height: number; color: string }) {
  const windows = useMemo(() => {
    const rows = Math.floor(height / 0.5);
    const cols = Math.max(2, Math.floor(width / 0.5));
    const data: { r: number; c: number; lit: boolean }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        data.push({ r, c, lit: Math.random() > 0.4 });
      }
    }
    return { rows, cols, data };
  }, [height, width]);

  return (
    <group>
      <mesh position={[position[0], height / 2, position[2]]}>
        <boxGeometry args={[width, height, width * 0.6]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Rooftop accent */}
      <mesh position={[position[0], height + 0.03, position[2]]}>
        <boxGeometry args={[width + 0.06, 0.06, width * 0.6 + 0.06]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Windows on front face */}
      {windows.data.map((w, i) => (
        <mesh key={i} position={[
          position[0] - width / 2 + 0.25 + w.c * (width / (windows.cols + 0.5)),
          0.3 + w.r * 0.5,
          position[2] + width * 0.3 + 0.01,
        ]}>
          <boxGeometry args={[0.15, 0.2, 0.01]} />
          <meshStandardMaterial
            color={w.lit ? "#FFE4A8" : "#0A0A14"}
            emissive={w.lit ? "#FFD060" : "#000"}
            emissiveIntensity={w.lit ? 0.6 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Exterior Ground with subtle grid pattern ──
function ExteriorGround({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <mesh position={[cx, -0.02, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#141820" />
      </mesh>
      {/* Roads/paths */}
      {[-20, -10, 0, 10, 20].map(off => (
        <mesh key={`rh-${off}`} position={[cx, -0.015, cz + off]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[70, 0.8]} />
          <meshStandardMaterial color="#1E222A" />
        </mesh>
      ))}
      {[-20, -10, 0, 10, 20].map(off => (
        <mesh key={`rv-${off}`} position={[cx + off, -0.015, cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.8, 70]} />
          <meshStandardMaterial color="#1E222A" />
        </mesh>
      ))}
    </group>
  );
}

// ── Street lamp ──
function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 1.6, 6]} />
        <meshStandardMaterial color="#333" metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} intensity={0.3} distance={4} color="#FFD060" />
    </group>
  );
}



// ── Building with exterior (user's building - Sims-style cutaway) ──
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

  const foundH = 0.35;
  const wallH = 1.3;
  const wallT = 0.2;
  const brickColor = "#8B5E3C";
  const brickDark = "#6B4226";
  const trimColor = "#D4C4A8";
  const windowGlassLit = "#FFE4A8";
  const windowGlassDark = "#1A1A2A";

  const downRef = useRef<{ x: number; y: number; t: number; button: number } | null>(null);

  const handleFloorDown = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    downRef.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, t: performance.now(), button: e.nativeEvent.button };
  };

  const handleFloorUp = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    const down = downRef.current;
    downRef.current = null;
    if (!down || down.button !== 0) return;
    if (Math.hypot(e.nativeEvent.clientX - down.x, e.nativeEvent.clientY - down.y) > 6) return;
    if (performance.now() - down.t > 450) return;
    const tx = Math.floor(e.point.x / S + 0.5);
    const ty = Math.floor(e.point.z / S + 0.5);
    onFloorClick?.(tx, ty);
  };

  const northZ = cz - bh / 2;
  const southZ = cz + bh / 2;
  const westX = cx - bw / 2;
  const eastX = cx + bw / 2;

  const extWindowStates = useMemo(() => {
    const states: Record<string, boolean[]> = {};
    const genKey = (axis: string, fixedPos: number, count: number) => {
      const key = `${axis}-${fixedPos.toFixed(2)}`;
      if (!states[key]) states[key] = Array.from({ length: count }, () => Math.random() > 0.3);
      return states[key];
    };
    return genKey;
  }, []);

  const makeWindows = (axis: 'x' | 'z', fixedPos: number, wallStart: number, wallSpan: number, y: number, count: number) => {
    const spacing = wallSpan / (count + 1);
    const litStates = extWindowStates(axis, fixedPos, count);
    return Array.from({ length: count }).map((_, i) => {
      const offset = wallStart + spacing * (i + 1);
      const lit = litStates[i];
      const pos: [number, number, number] = axis === 'x' ? [offset, y, fixedPos] : [fixedPos, y, offset];
      const size: [number, number, number] = axis === 'x' ? [0.28, 0.32, 0.03] : [0.03, 0.32, 0.28];
      return (
        <mesh key={`w${axis}${i}-${fixedPos}`} position={pos}>
          <boxGeometry args={size} />
          <meshStandardMaterial color={lit ? windowGlassLit : windowGlassDark} emissive={lit ? "#FFD060" : "#000"} emissiveIntensity={lit ? 0.3 : 0} />
        </mesh>
      );
    });
  };

  const nWinX = Math.floor(bw / 1.2);
  const nWinZ = Math.floor(bh / 1.2);
  const winY = foundH + wallH * 0.5;

  return (
    <group>
      {/* Sidewalk around building */}
      <mesh position={[cx, -0.008, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bw + 4, bh + 4]} />
        <meshStandardMaterial color="#888880" />
      </mesh>

      {/* Foundation */}
      <mesh position={[cx, foundH / 2, cz]}>
        <boxGeometry args={[bw + wallT * 2 + 0.1, foundH, bh + wallT * 2 + 0.1]} />
        <meshStandardMaterial color="#555048" roughness={0.95} />
      </mesh>
      <mesh position={[cx, foundH + 0.02, cz]}>
        <boxGeometry args={[bw + wallT * 2 + 0.2, 0.04, bh + wallT * 2 + 0.2]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>

      {/* Interior floor */}
      <mesh position={[cx, foundH + 0.001, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerDown={handleFloorDown} onPointerUp={handleFloorUp}>
        <planeGeometry args={[bw, bh]} />
        <meshStandardMaterial color="#9B7B55" roughness={0.85} />
      </mesh>
      {Array.from({ length: Math.ceil(bw / 0.5) + 1 }).map((_, i) => (
        <mesh key={`vl${i}`} raycast={() => null} position={[cx - bw / 2 + i * 0.5, foundH + 0.002, cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, bh]} /><meshBasicMaterial color="#7A6040" />
        </mesh>
      ))}

      {/* Walls (LOW - never block agents) */}
      <mesh position={[cx, foundH + wallH * 0.25, northZ - wallT / 2]}>
        <boxGeometry args={[bw + wallT * 2, wallH * 0.5, wallT]} />
        <meshStandardMaterial color={brickColor} roughness={0.95} transparent opacity={0.7} />
      </mesh>
      <mesh position={[westX - wallT / 2, foundH + wallH * 0.25, cz]}>
        <boxGeometry args={[wallT, wallH * 0.5, bh + wallT * 2]} />
        <meshStandardMaterial color={brickDark} roughness={0.95} transparent opacity={0.7} />
      </mesh>
      <mesh position={[cx, foundH + wallH * 0.1 / 2, southZ + wallT / 2]}>
        <boxGeometry args={[bw + wallT * 2, wallH * 0.1, wallT]} />
        <meshStandardMaterial color={brickColor} roughness={0.95} transparent opacity={0.5} />
      </mesh>
      <mesh position={[eastX + wallT / 2, foundH + wallH * 0.1 / 2, cz]}>
        <boxGeometry args={[wallT, wallH * 0.1, bh + wallT * 2]} />
        <meshStandardMaterial color={brickDark} roughness={0.95} transparent opacity={0.5} />
      </mesh>

      {/* Top trim */}
      <mesh position={[cx, foundH + wallH * 0.52, northZ - wallT / 2]}>
        <boxGeometry args={[bw + wallT * 2 + 0.3, 0.04, wallT + 0.1]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>
      <mesh position={[westX - wallT / 2, foundH + wallH * 0.52, cz]}>
        <boxGeometry args={[wallT + 0.1, 0.04, bh + wallT * 2 + 0.3]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>

      {/* Baseboard */}
      <mesh position={[cx, foundH + 0.03, northZ + 0.04]}>
        <boxGeometry args={[bw, 0.06, 0.05]} /><meshStandardMaterial color="#6B5840" />
      </mesh>
      <mesh position={[westX + 0.04, foundH + 0.03, cz]}>
        <boxGeometry args={[0.05, 0.06, bh]} /><meshStandardMaterial color="#6B5840" />
      </mesh>

      {/* Windows */}
      {makeWindows('x', northZ - wallT - 0.001, cx - bw / 2, bw, winY, nWinX)}
      {makeWindows('z', westX - wallT - 0.001, cz - bh / 2, bh, winY, nWinZ)}

      {/* Interior lights */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const bulbColors = ["#FFB347", "#FF6B6B", "#4ECDC4", "#FFE66D", "#FF6BB5", "#6BCB77"];
        const bc = bulbColors[i];
        const lx = cx - bw * 0.3 + col * (bw * 0.3);
        const lz = cz - bh * 0.2 + row * (bh * 0.4);
        return (
          <group key={`cl${i}`}>
            <mesh position={[lx, foundH + wallH - 0.1, lz]}>
              <cylinderGeometry args={[0.004, 0.004, 0.18, 4]} />
              <meshBasicMaterial color="#333" />
            </mesh>
            <mesh position={[lx, foundH + wallH - 0.22, lz]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color={bc} emissive={bc} emissiveIntensity={1.2} />
            </mesh>
          </group>
        );
      })}
      <pointLight position={[cx - bw * 0.2, foundH + wallH - 0.3, cz]} intensity={0.3} distance={6} color="#FFD090" />
      <pointLight position={[cx + bw * 0.2, foundH + wallH - 0.3, cz]} intensity={0.3} distance={6} color="#FFD090" />

      {/* String lights */}
      {Array.from({ length: 10 }).map((_, i) => {
        const t = i / 9;
        const lx = cx - bw * 0.42 + t * bw * 0.84;
        const ly = foundH + wallH - 0.06;
        const lz = northZ + wallT * 0.6;
        const sag = Math.sin(t * Math.PI) * 0.1;
        const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#FF6BB5", "#6BCB77"];
        return (
          <mesh key={`sl${i}`} position={[lx, ly - sag, lz]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color={colors[i % 5]} emissive={colors[i % 5]} emissiveIntensity={1.5} />
          </mesh>
        );
      })}

      {/* Neon sign */}
      <mesh position={[cx, foundH + wallH * 0.7, northZ + wallT * 0.6]}>
        <boxGeometry args={[1.4, 0.35, 0.02]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>
      <mesh position={[cx, foundH + wallH * 0.7, northZ + wallT * 0.62]}>
        <boxGeometry args={[1.3, 0.28, 0.01]} />
        <meshStandardMaterial color="#FF6B00" emissive="#FF6B00" emissiveIntensity={1.8} transparent opacity={0.9} />
      </mesh>

      {/* Building label */}
      <Html position={[cx, foundH + wallH + 0.3, cz]} center>
        <div className="px-3 py-1 text-[10px] font-bold whitespace-nowrap pointer-events-none select-none rounded-lg bg-primary/80 text-white border border-primary/50">
          👑 Meu Prédio
        </div>
      </Html>
    </group>
  );
}

// ── Room 3D ──
function Room3D({ room, onFloorClick, clickEnabled }: { room: RoomDef; onFloorClick?: (x: number, y: number) => void; clickEnabled?: boolean }) {
  const w = room.w * S;
  const h = room.h * S;
  const x = room.x * S + w / 2;
  const z = room.y * S + h / 2;
  const wallH = 0.18;
  const wallT = 0.04;
  const baseH = 0.03;

  const downRef = useRef<{ x: number; y: number; t: number; button: number } | null>(null);
  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    downRef.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, t: performance.now(), button: e.nativeEvent.button };
  };
  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    const down = downRef.current;
    downRef.current = null;
    if (!down || down.button !== 0) return;
    if (Math.hypot(e.nativeEvent.clientX - down.x, e.nativeEvent.clientY - down.y) > 6) return;
    if (performance.now() - down.t > 450) return;
    const tx = Math.floor(e.point.x / S + 0.5);
    const ty = Math.floor(e.point.z / S + 0.5);
    onFloorClick?.(tx, ty);
  };

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerDown={handleDown} onPointerUp={handleUp}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={room.floorColor} />
      </mesh>
      {room.carpetColor && (
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handleDown} onPointerUp={handleUp}>
          <planeGeometry args={[w * 0.7, h * 0.7]} />
          <meshStandardMaterial color={room.carpetColor} />
        </mesh>
      )}
      {/* Floor borders */}
      <mesh position={[0, baseH / 2, -h / 2 + wallT / 2]}><boxGeometry args={[w, baseH, wallT]} /><meshStandardMaterial color={room.wallColor} /></mesh>
      <mesh position={[-w / 2 + wallT / 2, baseH / 2, 0]}><boxGeometry args={[wallT, baseH, h]} /><meshStandardMaterial color={room.wallColor} /></mesh>
      {/* Ultra-low walls */}
      <mesh position={[0, wallH * 0.5, -h / 2]}><boxGeometry args={[w + wallT, wallH, wallT]} /><meshStandardMaterial color={room.wallColor} transparent opacity={0.6} /></mesh>
      <mesh position={[-w / 2, wallH * 0.5, 0]}><boxGeometry args={[wallT, wallH, h + wallT]} /><meshStandardMaterial color={room.wallColor} transparent opacity={0.6} /></mesh>
      {/* Front + right strips */}
      <mesh position={[0, baseH / 2, h / 2 - wallT / 2]}><boxGeometry args={[w, baseH, wallT]} /><meshStandardMaterial color={room.wallColor} opacity={0.5} transparent /></mesh>
      <mesh position={[w / 2 - wallT / 2, baseH / 2, 0]}><boxGeometry args={[wallT, baseH, h]} /><meshStandardMaterial color={room.wallColor} opacity={0.5} transparent /></mesh>
      {/* Label */}
      <Html position={[0, wallH + 0.08, -h / 2 + 0.02]} center>
        <div className="px-2 py-0.5 text-[9px] font-bold whitespace-nowrap pointer-events-none select-none rounded-sm" style={{ fontFamily: "monospace", color: "#FFE8C8", backgroundColor: "rgba(20,20,30,0.75)", textShadow: "0 0 6px #00CED1" }}>
          {room.name}
        </div>
      </Html>
    </group>
  );
}

// ── Walk animation hook ──
function useWalkAnimation(
  ref: React.RefObject<THREE.Group | null>,
  leftLeg: React.RefObject<THREE.Mesh | null>,
  rightLeg: React.RefObject<THREE.Mesh | null>,
  leftArm: React.RefObject<THREE.Mesh | null>,
  rightArm: React.RefObject<THREE.Mesh | null>,
  targetX: number, targetZ: number,
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
    if (moving) ref.current.position.y = Math.abs(Math.sin(Date.now() * 0.015)) * 0.025;
    else ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.008;
    const swing = moving ? Math.sin(Date.now() * 0.016) * 0.5 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = moving ? swing : leftLeg.current.rotation.x * 0.85;
    if (rightLeg.current) rightLeg.current.rotation.x = moving ? -swing : rightLeg.current.rotation.x * 0.85;
    if (leftArm.current) leftArm.current.rotation.x = moving ? -swing * 0.5 : leftArm.current.rotation.x * 0.85;
    if (rightArm.current) rightArm.current.rotation.x = moving ? swing * 0.5 : rightArm.current.rotation.x * 0.85;
    if (targetX !== prevPos.current.x || targetZ !== prevPos.current.z) {
      const dirX = targetX - prevPos.current.x;
      const dirZ = targetZ - prevPos.current.z;
      if (Math.abs(dirX) > 0.001 || Math.abs(dirZ) > 0.001) {
        const angle = Math.atan2(dirX, dirZ);
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
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }} onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}>
      <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[0.22, 0.28, 0.14]} /><meshStandardMaterial color={agent.color} /></mesh>
      <mesh position={[0, 0.47, 0]} castShadow><boxGeometry args={[0.18, 0.18, 0.16]} /><meshStandardMaterial color={agent.color} /></mesh>
      <mesh position={[0, 0.47, 0.081]}><boxGeometry args={[0.14, 0.08, 0.01]} /><meshStandardMaterial color="#1a1a2e" /></mesh>
      {[-0.035, 0.035].map((ox, i) => (
        <mesh key={i} position={[ox, 0.48, 0.09]}><boxGeometry args={[0.035, 0.035, 0.01]} /><meshStandardMaterial color={agent.status === "thinking" ? "#6366F1" : "#00FF88"} emissive={agent.status === "thinking" ? "#6366F1" : "#00FF88"} emissiveIntensity={1.2} /></mesh>
      ))}
      <mesh ref={leftArm} position={[-0.14, 0.24, 0]}><boxGeometry args={[0.05, 0.18, 0.07]} /><meshStandardMaterial color={agent.color} /></mesh>
      <mesh ref={rightArm} position={[0.14, 0.24, 0]}><boxGeometry args={[0.05, 0.18, 0.07]} /><meshStandardMaterial color={agent.color} /></mesh>
      <mesh position={[0, 0.61, 0]}><cylinderGeometry args={[0.008, 0.008, 0.1, 6]} /><meshStandardMaterial color={agent.color} /></mesh>
      <mesh position={[0, 0.67, 0]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color={STATUS_COLORS[agent.status]} emissive={STATUS_COLORS[agent.status]} emissiveIntensity={1.8} /></mesh>
      <mesh ref={leftLeg} position={[-0.055, 0.06, 0]}><boxGeometry args={[0.07, 0.12, 0.09]} /><meshStandardMaterial color={agent.color} /></mesh>
      <mesh ref={rightLeg} position={[0.055, 0.06, 0]}><boxGeometry args={[0.07, 0.12, 0.09]} /><meshStandardMaterial color={agent.color} /></mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.14, 16]} /><meshBasicMaterial color="#000" transparent opacity={0.12} /></mesh>
      {(selected || hovered) && (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.2, 0.26, 32]} /><meshBasicMaterial color={selected ? "#6366F1" : "#90CAF9"} transparent opacity={0.7} /></mesh>
      )}
      <Html position={[0, 0.82, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(20,20,30,0.9)] rounded-full whitespace-nowrap pointer-events-none select-none">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[agent.status] }} />
          <span className="text-[9px] text-white font-bold">{agent.name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Walking dust ──
function WalkingDust({ player }: { player: Player }) {
  const particles = useRef<THREE.InstancedMesh>(null);
  const dataRef = useRef<{ positions: Float32Array; velocities: Float32Array; lifetimes: Float32Array; spawnTimer: number }>({
    positions: new Float32Array(30 * 3), velocities: new Float32Array(30 * 3), lifetimes: new Float32Array(30).fill(-1), spawnTimer: 0,
  });
  const prevPos = useRef({ x: player.x, y: player.y });
  const dummy = useRef(new THREE.Object3D());
  const color = useRef(new THREE.Color("#C8B898"));

  useFrame((_, delta) => {
    if (!particles.current) return;
    const d = dataRef.current;
    const dt = Math.min(delta, 0.05);
    const speed = Math.hypot(player.x - prevPos.current.x, player.y - prevPos.current.y);
    prevPos.current = { x: player.x, y: player.y };
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
    for (let i = 0; i < 30; i++) {
      if (d.lifetimes[i] > 0) {
        d.lifetimes[i] -= dt;
        d.positions[i * 3] += d.velocities[i * 3] * dt;
        d.positions[i * 3 + 1] += d.velocities[i * 3 + 1] * dt;
        d.positions[i * 3 + 2] += d.velocities[i * 3 + 2] * dt;
        d.velocities[i * 3 + 1] -= 0.5 * dt;
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

// ── Player 3D ──
function Player3D({ player, config }: { player: Player; config?: { color: string; skinTone?: string } }) {
  const ref = useRef<THREE.Group>(null);
  const smoothPos = useRef(new THREE.Vector3(player.x * S, 0, player.y * S));
  const smoothAngle = useRef(player.angle);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const prevPos = useRef({ x: player.x, y: player.y });

  const bodyColor = "#F5DEB3";
  const earInner = "#FFCBA4";
  const shirtBase = "#2E8B57";
  const shirtPattern = "#FF8C00";
  const shortsColor = "#4A90D9";
  const eyeColor = "#1a1a1a";
  const mouthColor = "#8B4513";

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    const tx = player.x * S;
    const tz = player.y * S;
    const posFactor = 1 - Math.exp(-18 * dt);
    const rotFactor = 1 - Math.exp(-14 * dt);
    smoothPos.current.x += (tx - smoothPos.current.x) * posFactor;
    smoothPos.current.z += (tz - smoothPos.current.z) * posFactor;
    if (Math.abs(tx - smoothPos.current.x) < 0.0005) smoothPos.current.x = tx;
    if (Math.abs(tz - smoothPos.current.z) < 0.0005) smoothPos.current.z = tz;
    const speed = Math.hypot(player.x - prevPos.current.x, player.y - prevPos.current.y);
    const moving = speed > 0.001;
    prevPos.current = { x: player.x, y: player.y };
    ref.current.position.set(smoothPos.current.x, 0, smoothPos.current.z);
    if (moving) ref.current.position.y = Math.abs(Math.sin(Date.now() * 0.015)) * 0.025;
    else ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.008;
    let diff = player.angle - smoothAngle.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    smoothAngle.current += diff * rotFactor;
    ref.current.rotation.y = smoothAngle.current;
    const swing = moving ? Math.sin(Date.now() * 0.016) * 0.5 : 0;
    const dampFactor = 1 - Math.exp(-8 * dt);
    if (leftLeg.current) leftLeg.current.rotation.x += ((moving ? swing : 0) - leftLeg.current.rotation.x) * dampFactor;
    if (rightLeg.current) rightLeg.current.rotation.x += ((moving ? -swing : 0) - rightLeg.current.rotation.x) * dampFactor;
    if (leftArm.current) leftArm.current.rotation.x += ((moving ? -swing * 0.5 : 0) - leftArm.current.rotation.x) * dampFactor;
    if (rightArm.current) rightArm.current.rotation.x += ((moving ? swing * 0.5 : 0) - rightArm.current.rotation.x) * dampFactor;
  });

  return (
    <group ref={ref}>
      <mesh position={[-0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh ref={leftLeg} position={[-0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color={shortsColor} /></mesh>
      <mesh ref={rightLeg} position={[0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color={shortsColor} /></mesh>
      <mesh position={[0, 0.27, 0]} castShadow><boxGeometry args={[0.26, 0.24, 0.15]} /><meshStandardMaterial color={shirtBase} /></mesh>
      {[[-0.06, 0.30, 0.076], [0.04, 0.24, 0.076], [-0.02, 0.20, 0.076], [0.08, 0.32, 0.076], [-0.08, 0.22, 0.076], [0.06, 0.26, 0.076]].map((pos, i) => (
        <mesh key={`pat${i}`} position={pos as [number, number, number]}><boxGeometry args={[0.04, 0.04, 0.005]} /><meshStandardMaterial color={i % 2 === 0 ? shirtPattern : "#FFD700"} /></mesh>
      ))}
      <mesh ref={leftArm} position={[-0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color={bodyColor} /></mesh>
      <mesh ref={rightArm} position={[0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color={bodyColor} /></mesh>
      <mesh position={[-0.165, 0.15, 0]}><boxGeometry args={[0.05, 0.05, 0.06]} /><meshStandardMaterial color={bodyColor} /></mesh>
      <mesh position={[0.165, 0.15, 0]}><boxGeometry args={[0.05, 0.05, 0.06]} /><meshStandardMaterial color={bodyColor} /></mesh>
      <mesh position={[0, 0.48, 0]} castShadow><boxGeometry args={[0.24, 0.22, 0.2]} /><meshStandardMaterial color={bodyColor} /></mesh>
      {/* Ears */}
      <mesh position={[-0.08, 0.72, 0]}><boxGeometry args={[0.06, 0.28, 0.05]} /><meshStandardMaterial color={bodyColor} /></mesh>
      <mesh position={[-0.08, 0.74, 0]}><boxGeometry args={[0.03, 0.22, 0.03]} /><meshStandardMaterial color={earInner} /></mesh>
      <mesh position={[0.08, 0.72, 0]}><boxGeometry args={[0.06, 0.28, 0.05]} /><meshStandardMaterial color={bodyColor} /></mesh>
      <mesh position={[0.08, 0.74, 0]}><boxGeometry args={[0.03, 0.22, 0.03]} /><meshStandardMaterial color={earInner} /></mesh>
      {/* Eyes */}
      <mesh position={[-0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[-0.055, 0.495, 0.106]}><boxGeometry args={[0.03, 0.035, 0.005]} /><meshStandardMaterial color={eyeColor} /></mesh>
      <mesh position={[0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[0.055, 0.495, 0.106]}><boxGeometry args={[0.03, 0.035, 0.005]} /><meshStandardMaterial color={eyeColor} /></mesh>
      {/* Brows */}
      <mesh position={[-0.055, 0.535, 0.105]} rotation={[0, 0, 0.3]}><boxGeometry args={[0.06, 0.015, 0.01]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      <mesh position={[0.055, 0.535, 0.105]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.06, 0.015, 0.01]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      {/* Mouth */}
      <mesh position={[0, 0.44, 0.101]}><boxGeometry args={[0.08, 0.015, 0.01]} /><meshStandardMaterial color={mouthColor} /></mesh>
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.16, 16]} /><meshBasicMaterial color="#000" transparent opacity={0.18} /></mesh>
      <Html position={[0, 0.95, 0]} center><span className="text-sm select-none pointer-events-none">👑</span></Html>
      <Html position={[0, 1.05, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none select-none" style={{ backgroundColor: shirtBase }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-[9px] text-white font-bold">{player.name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Camera target ──
function CameraTarget({ player, controlsRef }: { player: Player; controlsRef: React.RefObject<any> }) {
  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const factor = 1 - Math.exp(-8 * dt);
    const px = player.x * S;
    const pz = player.y * S;
    const target = controlsRef.current.target;
    target.x += (px - target.x) * factor;
    target.z += (pz - target.z) * factor;
    target.y += (0 - target.y) * factor;
  });
  return null;
}

function ControlsUpdater({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  useFrame(() => { controlsRef.current?.update(); });
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

export function OfficeScene({
  agents, player, rooms, furniture, playerConfig, selectedAgentId, onAgentClick,
  editMode, selectedFurnitureId, hoveredFurnitureId, onFurnitureClick, onFurnitureHover, onMapClick,
}: OfficeSceneProps) {
  const controlsRef = useRef<any>(null);
  const dn = useDayNight();

  // Compute building center
  const buildingCenter = useMemo(() => {
    const pad = 1.5;
    const minX = Math.min(...rooms.map(r => r.x)) - pad;
    const minY = Math.min(...rooms.map(r => r.y)) - pad;
    const maxX = Math.max(...rooms.map(r => r.x + r.w)) + pad;
    const maxY = Math.max(...rooms.map(r => r.y + r.h)) + pad;
    return { x: ((minX + maxX) / 2) * S, z: ((minY + maxY) / 2) * S };
  }, [rooms]);

  // Distant skyline buildings with more variety
  const skylineBuildings = useMemo(() => {
    const cx = buildingCenter.x;
    const cz = buildingCenter.z;
    const far = 28;
    return [
      // North
      { pos: [cx - 12, 0, cz - far] as [number, number, number], w: 2.5, h: 5, color: "#3A3A4A" },
      { pos: [cx - 7, 0, cz - far - 2] as [number, number, number], w: 1.8, h: 3.5, color: "#4A4A5A" },
      { pos: [cx - 2, 0, cz - far] as [number, number, number], w: 3, h: 6, color: "#3A4A5A" },
      { pos: [cx + 4, 0, cz - far - 1] as [number, number, number], w: 2, h: 4, color: "#4A5A6A" },
      { pos: [cx + 10, 0, cz - far] as [number, number, number], w: 2.2, h: 5.5, color: "#3A3A5A" },
      { pos: [cx + 15, 0, cz - far - 2] as [number, number, number], w: 1.5, h: 3, color: "#5A4A5A" },
      // East
      { pos: [cx + far, 0, cz - 10] as [number, number, number], w: 2, h: 4, color: "#4A4A5A" },
      { pos: [cx + far + 2, 0, cz - 3] as [number, number, number], w: 2.5, h: 5.5, color: "#3A4A4A" },
      { pos: [cx + far, 0, cz + 4] as [number, number, number], w: 1.8, h: 3.5, color: "#5A4A4A" },
      { pos: [cx + far + 1, 0, cz + 10] as [number, number, number], w: 2, h: 4.5, color: "#4A5A5A" },
      // South
      { pos: [cx - 10, 0, cz + far] as [number, number, number], w: 2.2, h: 4, color: "#4A5A4A" },
      { pos: [cx - 3, 0, cz + far + 2] as [number, number, number], w: 3, h: 5, color: "#3A5A5A" },
      { pos: [cx + 5, 0, cz + far] as [number, number, number], w: 1.8, h: 3.5, color: "#5A5A4A" },
      { pos: [cx + 12, 0, cz + far + 1] as [number, number, number], w: 2.5, h: 6, color: "#4A4A5A" },
      // West
      { pos: [cx - far, 0, cz - 8] as [number, number, number], w: 2, h: 3.5, color: "#4A4A4A" },
      { pos: [cx - far - 2, 0, cz] as [number, number, number], w: 2.5, h: 5, color: "#3A5A4A" },
      { pos: [cx - far, 0, cz + 8] as [number, number, number], w: 1.8, h: 4, color: "#5A5A5A" },
    ];
  }, [buildingCenter]);

  // Street lamp positions around the building
  const streetLamps = useMemo(() => {
    const cx = buildingCenter.x;
    const cz = buildingCenter.z;
    return [
      [cx - 8, 0, cz - 8], [cx + 8, 0, cz - 8],
      [cx - 8, 0, cz + 8], [cx + 8, 0, cz + 8],
      [cx - 14, 0, cz], [cx + 14, 0, cz],
      [cx, 0, cz - 14], [cx, 0, cz + 14],
    ] as [number, number, number][];
  }, [buildingCenter]);

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        style={{ touchAction: "none" }}
        camera={{ position: [14, 12, 14], fov: 35, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = dn.exposure;
        }}
      >
        <color attach="background" args={[dn.bgColor]} />
        <fog attach="fog" args={[dn.fogColor, dn.fogNear, dn.fogFar]} />

        <ambientLight intensity={dn.ambientIntensity} color={dn.ambientColor} />
        <directionalLight position={dn.sunPosition} intensity={dn.sunIntensity} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-far={60} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} color={dn.sunColor} />
        <directionalLight position={[-8, 15, -6]} intensity={0.15} color="#8899CC" />
        <hemisphereLight args={[dn.skyColor, dn.groundColor, dn.hemiIntensity]} />

        {dn.showStars && <Stars />}

        <OrbitControls
          ref={controlsRef}
          enableDamping dampingFactor={0.08}
          enablePan enableZoom enableRotate
          minDistance={3} maxDistance={30}
          minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.6}
          minAzimuthAngle={-Math.PI} maxAzimuthAngle={Math.PI}
          zoomSpeed={0.9} rotateSpeed={0.7} panSpeed={0.75}
          mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
          target={[player.x * S, 0, player.y * S]}
        />
        <ControlsUpdater controlsRef={controlsRef} />
        <CameraTarget player={player} controlsRef={controlsRef} />

        {/* ── Ground around building ── */}
        <ExteriorGround cx={buildingCenter.x} cz={buildingCenter.z} />

        {/* ── User's Building ── */}
        <BuildingExterior rooms={rooms} clickEnabled={!editMode} onFloorClick={(x, y) => onMapClick?.(x, y)} />

        {/* ── Distant Skyline ── */}
        {skylineBuildings.map((b, i) => (
          <SkylineBuilding key={`sky-${i}`} position={b.pos} width={b.w} height={b.h} color={b.color} />
        ))}

        {/* ── Street Lamps ── */}
        {streetLamps.map((pos, i) => (
          <StreetLamp key={`lamp-${i}`} position={pos} />
        ))}

        {/* ── Interior objects at building height ── */}
        <group position={[0, 0.35, 0]}>
          {rooms.map((room) => (
            <Room3D key={room.id} room={room} clickEnabled={!editMode} onFloorClick={(x, y) => onMapClick?.(x, y)} />
          ))}
          {furniture.map(f => (
            <FurnitureModel
              key={f.id} type={f.type} position={[f.x * S, 0, f.y * S]}
              editMode={editMode} selected={selectedFurnitureId === f.id} hovered={hoveredFurnitureId === f.id}
              onClick={() => onFurnitureClick?.(f.id)} onPointerOver={() => onFurnitureHover?.(f.id)} onPointerOut={() => onFurnitureHover?.(null)}
            />
          ))}
          {agents.map(agent => (
            <Agent3D key={agent.id} agent={agent} selected={agent.id === selectedAgentId} onClick={() => onAgentClick(agent)} />
          ))}
          <Player3D player={player} config={playerConfig} />
          <WalkingDust player={player} />
        </group>
      </Canvas>
    </div>
  );
}
