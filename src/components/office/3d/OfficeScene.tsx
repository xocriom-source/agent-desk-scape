import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Agent, Player } from "@/types/agent";
import type { RoomDef, FurnitureItem } from "@/data/officeMap";
import { FurnitureModel } from "./FurnitureModels";

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981", idle: "#F59E0B", thinking: "#6366F1", busy: "#EF4444",
};

const S = 0.5; // tile to world scale

// ── Interior building shell ──
function BuildingInterior({ rooms }: { rooms: RoomDef[] }) {
  const minX = Math.min(...rooms.map(r => r.x)) - 1;
  const minY = Math.min(...rooms.map(r => r.y)) - 1;
  const maxX = Math.max(...rooms.map(r => r.x + r.w)) + 1;
  const maxY = Math.max(...rooms.map(r => r.y + r.h)) + 1;
  const bw = (maxX - minX) * S;
  const bh = (maxY - minY) * S;
  const cx = ((minX + maxX) / 2) * S;
  const cz = ((minY + maxY) / 2) * S;
  const wallH = 0.9;

  return (
    <group>
      {/* ── Main building floor (tile look) ── */}
      <mesh position={[cx, 0.001, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[bw, bh]} />
        <meshStandardMaterial color="#D5CFC5" />
      </mesh>
      {/* Tile grid lines on floor */}
      {Array.from({ length: Math.ceil(bw) + 1 }).map((_, i) => (
        <mesh key={`vl${i}`} position={[cx - bw / 2 + i, 0.002, cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.01, bh]} />
          <meshBasicMaterial color="#C0B8A8" />
        </mesh>
      ))}
      {Array.from({ length: Math.ceil(bh) + 1 }).map((_, i) => (
        <mesh key={`hl${i}`} position={[cx, 0.002, cz - bh / 2 + i]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[bw, 0.01]} />
          <meshBasicMaterial color="#C0B8A8" />
        </mesh>
      ))}

      {/* ── Exterior walls (thick, tall) ── */}
      {/* North */}
      <mesh position={[cx, wallH / 2, cz - bh / 2 - 0.1]}>
        <boxGeometry args={[bw + 0.4, wallH, 0.2]} />
        <meshStandardMaterial color="#8B8D94" />
      </mesh>
      {/* South */}
      <mesh position={[cx, wallH / 2, cz + bh / 2 + 0.1]}>
        <boxGeometry args={[bw + 0.4, wallH, 0.2]} />
        <meshStandardMaterial color="#8B8D94" />
      </mesh>
      {/* West */}
      <mesh position={[cx - bw / 2 - 0.1, wallH / 2, cz]}>
        <boxGeometry args={[0.2, wallH, bh + 0.4]} />
        <meshStandardMaterial color="#7D7F86" />
      </mesh>
      {/* East */}
      <mesh position={[cx + bw / 2 + 0.1, wallH / 2, cz]}>
        <boxGeometry args={[0.2, wallH, bh + 0.4]} />
        <meshStandardMaterial color="#7D7F86" />
      </mesh>

      {/* ── Baseboard trim ── */}
      <mesh position={[cx, 0.03, cz - bh / 2 + 0.01]}>
        <boxGeometry args={[bw, 0.06, 0.04]} />
        <meshStandardMaterial color="#5C5E64" />
      </mesh>
      <mesh position={[cx, 0.03, cz + bh / 2 - 0.01]}>
        <boxGeometry args={[bw, 0.06, 0.04]} />
        <meshStandardMaterial color="#5C5E64" />
      </mesh>

      {/* ── Ceiling lights (fluorescent strips) ── */}
      {Array.from({ length: 6 }).map((_, i) => (
        <group key={`light-${i}`}>
          <mesh position={[cx - bw / 3 + (i % 3) * (bw / 3), wallH - 0.02, cz - bh / 4 + Math.floor(i / 3) * (bh / 2)]}>
            <boxGeometry args={[0.8, 0.03, 0.15]} />
            <meshStandardMaterial color="#FFF8E1" emissive="#FFF8E1" emissiveIntensity={0.3} />
          </mesh>
          <pointLight
            position={[cx - bw / 3 + (i % 3) * (bw / 3), wallH - 0.1, cz - bh / 4 + Math.floor(i / 3) * (bh / 2)]}
            intensity={0.15}
            distance={5}
            color="#FFF5DC"
          />
        </group>
      ))}
    </group>
  );
}

// ── Room 3D ──
function Room3D({ room }: { room: RoomDef }) {
  const w = room.w * S;
  const h = room.h * S;
  const x = room.x * S + w / 2;
  const z = room.y * S + h / 2;
  const wallH = 0.75;
  const wallT = 0.08;

  return (
    <group position={[x, 0, z]}>
      {/* Room floor */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={room.floorColor} />
      </mesh>
      {room.carpetColor && (
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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

// ── Player 3D ──
function Player3D({ player, config }: { player: Player; config?: { color: string; skinTone?: string } }) {
  const ref = useRef<THREE.Group>(null);
  const smoothPos = useRef(new THREE.Vector3(player.x * S, 0, player.y * S));
  const prevPos = useRef({ x: player.x * S, z: player.y * S });
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);

  const color = config?.color || "#4F46E5";
  const skin = config?.skinTone === "light" ? "#FDDCB5" : config?.skinTone === "dark" ? "#8D5B3E" : config?.skinTone === "tan" ? "#C8956C" : "#E8B88A";

  useWalkAnimation(ref, leftLeg, rightLeg, leftArm, rightArm, player.x * S, player.y * S, smoothPos, prevPos, 0.18);

  return (
    <group ref={ref}>
      {/* Legs */}
      <mesh ref={leftLeg} position={[-0.05, 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.08]} />
        <meshStandardMaterial color="#2D3748" />
      </mesh>
      <mesh ref={rightLeg} position={[0.05, 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.08]} />
        <meshStandardMaterial color="#2D3748" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.24, 0.24, 0.13]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Arms */}
      <mesh ref={leftArm} position={[-0.155, 0.24, 0]}>
        <boxGeometry args={[0.05, 0.19, 0.07]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh ref={rightArm} position={[0.155, 0.24, 0]}>
        <boxGeometry args={[0.05, 0.19, 0.07]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.155, 0.13, 0]}>
        <boxGeometry args={[0.045, 0.045, 0.045]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0.155, 0.13, 0]}>
        <boxGeometry args={[0.045, 0.045, 0.045]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.19, 0.19, 0.17]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      {/* Eyes */}
      {[-0.04, 0.04].map((ox, i) => (
        <group key={i}>
          <mesh position={[ox, 0.46, 0.086]}>
            <boxGeometry args={[0.04, 0.04, 0.01]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[ox, 0.46, 0.09]}>
            <boxGeometry args={[0.02, 0.02, 0.01]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>
        </group>
      ))}
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.14, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} />
      </mesh>
      {/* Crown */}
      <Html position={[0, 0.68, 0]} center>
        <span className="text-sm select-none pointer-events-none">👑</span>
      </Html>
      {/* Name tag */}
      <Html position={[0, 0.8, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none select-none" style={{ backgroundColor: color }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-[9px] text-white font-bold">{player.name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Camera target tracker ──
function CameraTarget({ player, controlsRef }: { player: Player; controlsRef: React.RefObject<any> }) {
  const targetPos = useRef(new THREE.Vector3(player.x * S, 0, player.y * S));

  useFrame(() => {
    const px = player.x * S;
    const pz = player.y * S;
    targetPos.current.x += (px - targetPos.current.x) * 0.08;
    targetPos.current.z += (pz - targetPos.current.z) * 0.08;

    if (controlsRef.current) {
      controlsRef.current.target.copy(targetPos.current);
      controlsRef.current.update();
    }
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
}

export function OfficeScene({
  agents, player, rooms, furniture, playerConfig, selectedAgentId, onAgentClick,
  editMode, selectedFurnitureId, hoveredFurnitureId, onFurnitureClick, onFurnitureHover,
}: OfficeSceneProps) {
  const controlsRef = useRef<any>(null);

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ position: [14, 12, 14], fov: 35, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        {/* Indoor background color - muted ceiling tone */}
        <color attach="background" args={["#C8C4BC"]} />

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

        {/* Camera controls - orbit around player */}
        <OrbitControls
          ref={controlsRef}
          enablePan={editMode || false}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={18}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.8}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
          zoomSpeed={0.8}
          rotateSpeed={0.5}
          target={[player.x * S, 0, player.y * S]}
        />
        <CameraTarget player={player} controlsRef={controlsRef} />

        {/* Building interior */}
        <BuildingInterior rooms={rooms} />

        {/* Rooms */}
        {rooms.map(room => (
          <Room3D key={room.id} room={room} />
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
      </Canvas>
    </div>
  );
}
