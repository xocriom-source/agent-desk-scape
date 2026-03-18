import { useRef, useState, useMemo, memo, useCallback } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { Agent, Player } from "@/types/agent";
import type { RoomDef, FurnitureItem } from "@/data/officeMap";
import { FurnitureModel } from "./FurnitureModels";
import { useDayNight } from "@/hooks/useDayNight";

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981", idle: "#F59E0B", thinking: "#6366F1", busy: "#EF4444",
};

const S = 0.5;

// ── Distant skyline building (simplified - no individual windows) ──
const SkylineBuilding = memo(function SkylineBuilding({ position, width, height, color }: { position: [number, number, number]; width: number; height: number; color: string }) {
  return (
    <group>
      <mesh position={[position[0], height / 2, position[2]]}>
        <boxGeometry args={[width, height, width * 0.6]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Rooftop */}
      <mesh position={[position[0], height + 0.03, position[2]]}>
        <boxGeometry args={[width + 0.06, 0.06, width * 0.6 + 0.06]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Single glowing window strip instead of individual windows */}
      <mesh position={[position[0], height * 0.4, position[2] + width * 0.3 + 0.01]}>
        <planeGeometry args={[width * 0.8, height * 0.6]} />
        <meshStandardMaterial color="#FFE4A8" emissive="#FFD060" emissiveIntensity={0.3} transparent opacity={0.4} />
      </mesh>
    </group>
  );
});

// ── Exterior Ground (simplified - fewer road meshes) ──
const ExteriorGround = memo(function ExteriorGround({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <mesh position={[cx, -0.02, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#141820" />
      </mesh>
      {/* Simplified roads - just 2 cross roads */}
      <mesh position={[cx, -0.015, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 0.8]} />
        <meshStandardMaterial color="#1E222A" />
      </mesh>
      <mesh position={[cx, -0.015, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 70]} />
        <meshStandardMaterial color="#1E222A" />
      </mesh>
    </group>
  );
});

// ── Street lamp (NO pointLight - emissive only) ──
const StreetLamp = memo(function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 1.6, 4]} />
        <meshStandardMaterial color="#333" metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={2.5} />
      </mesh>
    </group>
  );
});

// ── Building Exterior ──
const BuildingExterior = memo(function BuildingExterior({
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
  const brickColor = "#5A5A64";
  const brickDark = "#48484F";
  const trimColor = "#6E6E78";

  const downRef = useRef<{ x: number; y: number; t: number; button: number } | null>(null);

  const handleFloorDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    downRef.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, t: performance.now(), button: e.nativeEvent.button };
  }, [clickEnabled]);

  const handleFloorUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    const down = downRef.current;
    downRef.current = null;
    if (!down || down.button !== 0) return;
    if (Math.hypot(e.nativeEvent.clientX - down.x, e.nativeEvent.clientY - down.y) > 6) return;
    if (performance.now() - down.t > 450) return;
    const tx = Math.floor(e.point.x / S + 0.5);
    const ty = Math.floor(e.point.z / S + 0.5);
    onFloorClick?.(tx, ty);
  }, [clickEnabled, onFloorClick]);

  const northZ = cz - bh / 2;
  const southZ = cz + bh / 2;
  const westX = cx - bw / 2;
  const eastX = cx + bw / 2;

  // Simplified windows - use strips instead of individual meshes
  const winY = foundH + wallH * 0.5;

  // Ceiling lights: emissive bulbs only, NO pointLights in the grid
  const ceilingLights = useMemo(() => {
    const cols = Math.max(2, Math.floor(bw / 2));
    const rows = Math.max(2, Math.floor(bh / 2.5));
    const lights: JSX.Element[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lx = cx - bw * 0.42 + c * (bw * 0.84 / Math.max(1, cols - 1));
        const lz = cz - bh * 0.40 + r * (bh * 0.80 / Math.max(1, rows - 1));
        const ly = foundH + wallH;
        lights.push(
          <group key={`ceil-${r}-${c}`}>
            <mesh position={[lx, ly - 0.06, lz]}>
              <cylinderGeometry args={[0.003, 0.003, 0.12, 3]} />
              <meshBasicMaterial color="#555" />
            </mesh>
            <mesh position={[lx, ly - 0.14, lz]}>
              <cylinderGeometry args={[0.015, 0.055, 0.04, 6]} />
              <meshStandardMaterial color="#2A2A30" metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[lx, ly - 0.18, lz]}>
              <sphereGeometry args={[0.02, 6, 6]} />
              <meshStandardMaterial color="#FFFAE0" emissive="#FFE090" emissiveIntensity={4.0} />
            </mesh>
          </group>
        );
      }
    }
    return lights;
  }, [bw, bh, cx, cz, foundH, wallH]);

  return (
    <group>
      {/* Sidewalk */}
      <mesh position={[cx, -0.008, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bw + 4, bh + 4]} />
        <meshStandardMaterial color="#555560" />
      </mesh>

      {/* Foundation */}
      <mesh position={[cx, foundH / 2, cz]}>
        <boxGeometry args={[bw + wallT * 2 + 0.1, foundH, bh + wallT * 2 + 0.1]} />
        <meshStandardMaterial color="#3A3A42" roughness={0.95} />
      </mesh>

      {/* Interior floor */}
      <mesh position={[cx, foundH + 0.001, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerDown={handleFloorDown} onPointerUp={handleFloorUp}>
        <planeGeometry args={[bw, bh]} />
        <meshStandardMaterial color="#E8DDD0" roughness={0.9} />
      </mesh>

      {/* Walls (simplified - removed some redundant meshes) */}
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

      {/* Window strips instead of individual windows */}
      <mesh position={[cx, winY, northZ - wallT - 0.001]}>
        <planeGeometry args={[bw * 0.85, 0.32]} />
        <meshStandardMaterial color="#FFE4A8" emissive="#FFD060" emissiveIntensity={0.3} transparent opacity={0.5} />
      </mesh>
      <mesh position={[westX - wallT - 0.001, winY, cz]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[bh * 0.85, 0.32]} />
        <meshStandardMaterial color="#FFE4A8" emissive="#FFD060" emissiveIntensity={0.3} transparent opacity={0.5} />
      </mesh>

      {/* Ceiling lights (emissive only, no pointLights) */}
      {ceilingLights}

      {/* Only 1 central fill pointLight for the interior */}
      <pointLight position={[cx, foundH + wallH - 0.1, cz]} intensity={1.2} distance={Math.max(bw, bh) * 1.2} color="#FFF5E8" decay={2} />

      {/* Floor lamps - emissive only, no pointLights */}
      {[
        [cx - bw * 0.42, foundH, cz - bh * 0.42],
        [cx + bw * 0.42, foundH, cz - bh * 0.42],
        [cx - bw * 0.42, foundH, cz + bh * 0.42],
        [cx + bw * 0.42, foundH, cz + bh * 0.42],
      ].map((pos, i) => (
        <group key={`flamp-${i}`}>
          <mesh position={[pos[0], pos[1] + 0.02, pos[2]]}>
            <cylinderGeometry args={[0.04, 0.05, 0.04, 6]} />
            <meshStandardMaterial color="#333" metalness={0.6} />
          </mesh>
          <mesh position={[pos[0], pos[1] + 0.45, pos[2]]}>
            <cylinderGeometry args={[0.012, 0.012, 0.85, 4]} />
            <meshStandardMaterial color="#444" metalness={0.5} />
          </mesh>
          <mesh position={[pos[0], pos[1] + 0.88, pos[2]]}>
            <cylinderGeometry args={[0.04, 0.08, 0.08, 6]} />
            <meshStandardMaterial color="#E8DDD0" />
          </mesh>
          <mesh position={[pos[0], pos[1] + 0.86, pos[2]]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color="#FFFAE0" emissive="#FFD060" emissiveIntensity={2.0} />
          </mesh>
        </group>
      ))}

      {/* Wall screens */}
      {[
        [cx - bw * 0.3, foundH + wallH * 0.45, northZ + wallT * 0.6],
        [cx + bw * 0.3, foundH + wallH * 0.45, northZ + wallT * 0.6],
      ].map((pos, i) => (
        <group key={`wallscreen-${i}`}>
          <mesh position={pos as [number, number, number]}>
            <boxGeometry args={[0.5, 0.3, 0.02]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[pos[0], pos[1], pos[2] + 0.011]}>
            <boxGeometry args={[0.44, 0.26, 0.005]} />
            <meshStandardMaterial color="#1A3A5A" emissive="#2A5A8A" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}

      {/* Neon sign */}
      <mesh position={[cx, foundH + wallH * 0.7, northZ + wallT * 0.6]}>
        <boxGeometry args={[1.4, 0.35, 0.02]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>
      <mesh position={[cx, foundH + wallH * 0.7, northZ + wallT * 0.62]}>
        <boxGeometry args={[1.3, 0.28, 0.01]} />
        <meshStandardMaterial color="#00CED1" emissive="#00CED1" emissiveIntensity={1.5} transparent opacity={0.9} />
      </mesh>

      {/* Building label */}
      <Html position={[cx, foundH + wallH + 0.3, cz]} center>
        <div className="px-3 py-1 text-[10px] font-bold whitespace-nowrap pointer-events-none select-none rounded-lg bg-primary/80 text-white border border-primary/50">
          👑 Meu Prédio
        </div>
      </Html>
    </group>
  );
});

// ── Room 3D (memoized) ──
const Room3D = memo(function Room3D({ room, onFloorClick, clickEnabled }: { room: RoomDef; onFloorClick?: (x: number, y: number) => void; clickEnabled?: boolean }) {
  const w = room.w * S;
  const h = room.h * S;
  const x = room.x * S + w / 2;
  const z = room.y * S + h / 2;
  const wallH = 0.18;
  const wallT = 0.04;
  const baseH = 0.03;

  const downRef = useRef<{ x: number; y: number; t: number; button: number } | null>(null);
  const handleDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    downRef.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, t: performance.now(), button: e.nativeEvent.button };
  }, [clickEnabled]);
  const handleUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    const down = downRef.current;
    downRef.current = null;
    if (!down || down.button !== 0) return;
    if (Math.hypot(e.nativeEvent.clientX - down.x, e.nativeEvent.clientY - down.y) > 6) return;
    if (performance.now() - down.t > 450) return;
    const tx = Math.floor(e.point.x / S + 0.5);
    const ty = Math.floor(e.point.z / S + 0.5);
    onFloorClick?.(tx, ty);
  }, [clickEnabled, onFloorClick]);

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
      {/* Simplified walls - just baseboards + low walls */}
      <mesh position={[0, baseH / 2, -h / 2 + wallT / 2]}><boxGeometry args={[w, baseH, wallT]} /><meshStandardMaterial color={room.wallColor} /></mesh>
      <mesh position={[-w / 2 + wallT / 2, baseH / 2, 0]}><boxGeometry args={[wallT, baseH, h]} /><meshStandardMaterial color={room.wallColor} /></mesh>
      <mesh position={[0, wallH * 0.5, -h / 2]}><boxGeometry args={[w + wallT, wallH, wallT]} /><meshStandardMaterial color={room.wallColor} transparent opacity={0.6} /></mesh>
      <mesh position={[-w / 2, wallH * 0.5, 0]}><boxGeometry args={[wallT, wallH, h + wallT]} /><meshStandardMaterial color={room.wallColor} transparent opacity={0.6} /></mesh>
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
});

// ── Walk animation hook (reused by agents + player) ──
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
  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    const factor = 1 - Math.exp(-lerpSpeed * 60 * dt);
    smoothPos.current.x += (targetX - smoothPos.current.x) * factor;
    smoothPos.current.z += (targetZ - smoothPos.current.z) * factor;
    const dx = Math.abs(targetX - smoothPos.current.x);
    const dz = Math.abs(targetZ - smoothPos.current.z);
    const moving = dx > 0.005 || dz > 0.005;
    const t = Date.now();
    ref.current.position.set(smoothPos.current.x, moving ? 0.01 + Math.abs(Math.sin(t * 0.015)) * 0.025 : 0.01 + Math.abs(Math.sin(t * 0.003)) * 0.008, smoothPos.current.z);
    const swing = moving ? Math.sin(t * 0.016) * 0.5 : 0;
    const dampFactor = 1 - Math.exp(-8 * dt);
    if (leftLeg.current) leftLeg.current.rotation.x += ((moving ? swing : 0) - leftLeg.current.rotation.x) * dampFactor;
    if (rightLeg.current) rightLeg.current.rotation.x += ((moving ? -swing : 0) - rightLeg.current.rotation.x) * dampFactor;
    if (leftArm.current) leftArm.current.rotation.x += ((moving ? -swing * 0.5 : 0) - leftArm.current.rotation.x) * dampFactor;
    if (rightArm.current) rightArm.current.rotation.x += ((moving ? swing * 0.5 : 0) - rightArm.current.rotation.x) * dampFactor;
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

// ── Shared geometries (pixel-art humanoid style) ──
const SHARED_GEO = {
  // Head
  head: new THREE.BoxGeometry(0.20, 0.20, 0.18),
  // Hair block (top of head)
  hair: new THREE.BoxGeometry(0.22, 0.08, 0.20),
  hairFringe: new THREE.BoxGeometry(0.22, 0.06, 0.04),
  // Body / torso (shirt)
  torso: new THREE.BoxGeometry(0.22, 0.20, 0.14),
  // Arms
  arm: new THREE.BoxGeometry(0.06, 0.18, 0.08),
  hand: new THREE.BoxGeometry(0.05, 0.05, 0.06),
  // Legs
  leg: new THREE.BoxGeometry(0.08, 0.14, 0.09),
  shoe: new THREE.BoxGeometry(0.08, 0.04, 0.11),
  // Face features
  eyeWhite: new THREE.BoxGeometry(0.05, 0.045, 0.01),
  eyePupil: new THREE.BoxGeometry(0.025, 0.03, 0.005),
  mouth: new THREE.BoxGeometry(0.06, 0.015, 0.01),
  // Misc
  shadow: new THREE.CircleGeometry(0.16, 8),
  ring: new THREE.RingGeometry(0.22, 0.28, 16),
};

// Agent appearance palettes - deterministic per agent index
const AGENT_SKINS = ["#8D5524", "#C68642", "#F1C27D", "#FFDBAC", "#E0AC69", "#D4A574", "#6B4423", "#F5DEB3"];
const AGENT_HAIR_COLORS = ["#1a1a2e", "#2C1810", "#8B4513", "#D4A017", "#CC5500", "#4A0E0E", "#2E2E2E", "#654321"];
const AGENT_SHIRT_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];
const AGENT_PANTS_COLORS = ["#1E3A5F", "#374151", "#1F2937", "#3F3F46", "#312E81", "#1E293B", "#18181B", "#292524"];
const AGENT_SHOE_COLORS = ["#1a1a1a", "#333", "#4A3728", "#222", "#2D2D2D", "#1a1a1a", "#333", "#2A2A2A"];

const SHADOW_MAT = new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.12 });

function getAgentAppearance(agentColor: string) {
  // Derive a stable index from the agent color
  let hash = 0;
  for (let i = 0; i < agentColor.length; i++) hash = ((hash << 5) - hash + agentColor.charCodeAt(i)) | 0;
  const idx = Math.abs(hash);
  return {
    skin: AGENT_SKINS[idx % AGENT_SKINS.length],
    hair: AGENT_HAIR_COLORS[(idx >> 3) % AGENT_HAIR_COLORS.length],
    shirt: agentColor, // Use the agent's assigned color as shirt
    pants: AGENT_PANTS_COLORS[(idx >> 6) % AGENT_PANTS_COLORS.length],
    shoes: AGENT_SHOE_COLORS[(idx >> 9) % AGENT_SHOE_COLORS.length],
  };
}

// ── Agent 3D — pixel-art humanoid style (like Gather.town / reference) ──
const Agent3D = memo(function Agent3D({ agent, selected, onClick }: { agent: Agent; selected?: boolean; onClick: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const smoothPos = useRef(new THREE.Vector3(agent.x * S, 0, agent.y * S));
  const prevPos = useRef({ x: agent.x * S, z: agent.y * S });
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  useWalkAnimation(ref, leftLeg, rightLeg, leftArm, rightArm, agent.x * S, agent.y * S, smoothPos, prevPos, 0.1);

  const statusColor = STATUS_COLORS[agent.status] || "#999";
  const look = useMemo(() => getAgentAppearance(agent.color), [agent.color]);

  // Cache materials
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: look.skin }), [look.skin]);
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ color: look.hair }), [look.hair]);
  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: look.shirt }), [look.shirt]);
  const pantsMat = useMemo(() => new THREE.MeshStandardMaterial({ color: look.pants }), [look.pants]);
  const shoeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: look.shoes }), [look.shoes]);
  const eyeWhiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFFFFF" }), []);
  const eyePupilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a1a2e" }), []);
  const mouthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8B4513" }), []);
  const statusDotMat = useMemo(() => new THREE.MeshStandardMaterial({ color: statusColor, emissive: statusColor, emissiveIntensity: 1.5 }), [statusColor]);

  return (
    <group ref={ref} onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }} onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}>
      {/* Shoes */}
      <mesh position={[-0.055, 0.02, 0.01]} geometry={SHARED_GEO.shoe} material={shoeMat} />
      <mesh position={[0.055, 0.02, 0.01]} geometry={SHARED_GEO.shoe} material={shoeMat} />
      {/* Legs / pants */}
      <mesh ref={leftLeg} position={[-0.055, 0.11, 0]} geometry={SHARED_GEO.leg} material={pantsMat} />
      <mesh ref={rightLeg} position={[0.055, 0.11, 0]} geometry={SHARED_GEO.leg} material={pantsMat} />
      {/* Torso / shirt */}
      <mesh position={[0, 0.28, 0]} castShadow geometry={SHARED_GEO.torso} material={shirtMat} />
      {/* Arms */}
      <mesh ref={leftArm} position={[-0.14, 0.27, 0]} geometry={SHARED_GEO.arm} material={shirtMat} />
      <mesh ref={rightArm} position={[0.14, 0.27, 0]} geometry={SHARED_GEO.arm} material={shirtMat} />
      {/* Hands */}
      <mesh position={[-0.14, 0.155, 0]} geometry={SHARED_GEO.hand} material={skinMat} />
      <mesh position={[0.14, 0.155, 0]} geometry={SHARED_GEO.hand} material={skinMat} />
      {/* Head */}
      <mesh position={[0, 0.48, 0]} castShadow geometry={SHARED_GEO.head} material={skinMat} />
      {/* Hair - top */}
      <mesh position={[0, 0.62, 0]} geometry={SHARED_GEO.hair} material={hairMat} />
      {/* Hair - fringe */}
      <mesh position={[0, 0.56, 0.08]} geometry={SHARED_GEO.hairFringe} material={hairMat} />
      {/* Eyes */}
      <mesh position={[-0.05, 0.50, 0.091]} geometry={SHARED_GEO.eyeWhite} material={eyeWhiteMat} />
      <mesh position={[-0.05, 0.495, 0.096]} geometry={SHARED_GEO.eyePupil} material={eyePupilMat} />
      <mesh position={[0.05, 0.50, 0.091]} geometry={SHARED_GEO.eyeWhite} material={eyeWhiteMat} />
      <mesh position={[0.05, 0.495, 0.096]} geometry={SHARED_GEO.eyePupil} material={eyePupilMat} />
      {/* Mouth */}
      <mesh position={[0, 0.435, 0.091]} geometry={SHARED_GEO.mouth} material={mouthMat} />
      {/* Status dot on head */}
      <mesh position={[0.1, 0.62, 0.05]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <primitive object={statusDotMat} attach="material" />
      </mesh>
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={SHARED_GEO.shadow} material={SHADOW_MAT} />
      {/* Hover/select feedback */}
      {(selected || hovered) && (
        <>
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={SHARED_GEO.ring}>
            <meshBasicMaterial color={selected ? "#6366F1" : "#90CAF9"} transparent opacity={0.7} />
          </mesh>
          <Html position={[0, 0.82, 0]} center>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(20,20,30,0.9)] rounded-full whitespace-nowrap pointer-events-none select-none">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
              <span className="text-[9px] text-white font-bold">{agent.name}</span>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}, (prev, next) => {
  return prev.agent.x === next.agent.x && prev.agent.y === next.agent.y && prev.agent.status === next.agent.status && prev.agent.color === next.agent.color && prev.selected === next.selected;
});

// ── Walking dust (instanced - already optimized) ──
function WalkingDust({ player }: { player: Player }) {
  const particles = useRef<THREE.InstancedMesh>(null);
  const dataRef = useRef<{ positions: Float32Array; velocities: Float32Array; lifetimes: Float32Array; spawnTimer: number }>({
    positions: new Float32Array(20 * 3), velocities: new Float32Array(20 * 3), lifetimes: new Float32Array(20).fill(-1), spawnTimer: 0,
  });
  const prevPos = useRef({ x: player.x, y: player.y });
  const dummy = useRef(new THREE.Object3D());
  const color = useRef(new THREE.Color("#C8B898"));
  const COUNT = 20;

  useFrame((_, delta) => {
    if (!particles.current) return;
    const d = dataRef.current;
    const dt = Math.min(delta, 0.05);
    const speed = Math.hypot(player.x - prevPos.current.x, player.y - prevPos.current.y);
    prevPos.current = { x: player.x, y: player.y };
    if (speed > 0.01) {
      d.spawnTimer += dt;
      if (d.spawnTimer > 0.08) {
        d.spawnTimer = 0;
        for (let i = 0; i < COUNT; i++) {
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
    for (let i = 0; i < COUNT; i++) {
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
    <instancedMesh ref={particles} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
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
    const t = Date.now();
    ref.current.position.set(smoothPos.current.x, moving ? 0.01 + Math.abs(Math.sin(t * 0.015)) * 0.025 : 0.01 + Math.abs(Math.sin(t * 0.003)) * 0.008, smoothPos.current.z);
    let diff = player.angle - smoothAngle.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    smoothAngle.current += diff * rotFactor;
    ref.current.rotation.y = smoothAngle.current;
    const swing = moving ? Math.sin(t * 0.016) * 0.5 : 0;
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
      {[[-0.06, 0.30, 0.076], [0.04, 0.24, 0.076], [-0.02, 0.20, 0.076]].map((pos, i) => (
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
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.16, 8]} /><meshBasicMaterial color="#000" transparent opacity={0.18} /></mesh>
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

  const buildingCenter = useMemo(() => {
    const pad = 1.5;
    const minX = Math.min(...rooms.map(r => r.x)) - pad;
    const minY = Math.min(...rooms.map(r => r.y)) - pad;
    const maxX = Math.max(...rooms.map(r => r.x + r.w)) + pad;
    const maxY = Math.max(...rooms.map(r => r.y + r.h)) + pad;
    return { x: ((minX + maxX) / 2) * S, z: ((minY + maxY) / 2) * S };
  }, [rooms]);

  const skylineBuildings = useMemo(() => {
    const cx = buildingCenter.x;
    const cz = buildingCenter.z;
    const far = 28;
    return [
      { pos: [cx - 12, 0, cz - far] as [number, number, number], w: 2.5, h: 5, color: "#3A3A4A" },
      { pos: [cx - 2, 0, cz - far] as [number, number, number], w: 3, h: 6, color: "#3A4A5A" },
      { pos: [cx + 10, 0, cz - far] as [number, number, number], w: 2.2, h: 5.5, color: "#3A3A5A" },
      { pos: [cx + far, 0, cz - 3] as [number, number, number], w: 2.5, h: 5.5, color: "#3A4A4A" },
      { pos: [cx + far, 0, cz + 4] as [number, number, number], w: 1.8, h: 3.5, color: "#5A4A4A" },
      { pos: [cx - 3, 0, cz + far] as [number, number, number], w: 3, h: 5, color: "#3A5A5A" },
      { pos: [cx + 12, 0, cz + far] as [number, number, number], w: 2.5, h: 6, color: "#4A4A5A" },
      { pos: [cx - far, 0, cz] as [number, number, number], w: 2.5, h: 5, color: "#3A5A4A" },
    ];
  }, [buildingCenter]);

  const streetLamps = useMemo(() => {
    const cx = buildingCenter.x;
    const cz = buildingCenter.z;
    return [
      [cx - 8, 0, cz - 8], [cx + 8, 0, cz - 8],
      [cx - 8, 0, cz + 8], [cx + 8, 0, cz + 8],
    ] as [number, number, number][];
  }, [buildingCenter]);

  const handleMapClick = useCallback((x: number, y: number) => onMapClick?.(x, y), [onMapClick]);

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        style={{ touchAction: "none" }}
        camera={{ position: [14, 12, 14], fov: 35, near: 0.5, far: 120 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.4;
          gl.shadowMap.type = THREE.BasicShadowMap; // Cheaper shadow type
        }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={[dn.bgColor]} />
        <fog attach="fog" args={[dn.fogColor, 20, 80]} />

        {/* Fixed bright ambient */}
        <ambientLight intensity={0.9} color="#FFF8F0" />
        {/* Single directional with small shadow map */}
        <directionalLight position={[5, 20, 8]} intensity={1.2} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} shadow-camera-far={40} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} color="#FFF5E8" />
        <directionalLight position={[-8, 15, -6]} intensity={0.4} color="#E8F0FF" castShadow={false} />
        <hemisphereLight args={["#C8DEFF", "#8B7355", 0.4]} />

        {dn.showStars && <Stars count={500} radius={60} />}

        <OrbitControls
          ref={controlsRef}
          enableDamping dampingFactor={0.08}
          enablePan enableZoom enableRotate
          minDistance={3} maxDistance={25}
          minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.6}
          zoomSpeed={0.9} rotateSpeed={0.7} panSpeed={0.75}
          mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
          target={[player.x * S, 0, player.y * S]}
        />
        <ControlsUpdater controlsRef={controlsRef} />
        <CameraTarget player={player} controlsRef={controlsRef} />

        <ExteriorGround cx={buildingCenter.x} cz={buildingCenter.z} />
        <BuildingExterior rooms={rooms} clickEnabled={!editMode} onFloorClick={handleMapClick} />

        {skylineBuildings.map((b, i) => (
          <SkylineBuilding key={`sky-${i}`} position={b.pos} width={b.w} height={b.h} color={b.color} />
        ))}

        {streetLamps.map((pos, i) => (
          <StreetLamp key={`lamp-${i}`} position={pos} />
        ))}

        <group position={[0, 0.35, 0]}>
          {rooms.map((room) => (
            <Room3D key={room.id} room={room} clickEnabled={!editMode} onFloorClick={handleMapClick} />
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
