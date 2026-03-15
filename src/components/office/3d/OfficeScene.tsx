import { useRef, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { Agent, Player } from "@/types/agent";
import type { RoomDef, FurnitureItem } from "@/data/officeMap";
import { FurnitureModel } from "./FurnitureModels";

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981", idle: "#F59E0B", thinking: "#6366F1", busy: "#EF4444",
};

// ── Room 3D component ──
function Room3D({ room }: { room: RoomDef }) {
  const w = room.w * 0.5;
  const h = room.h * 0.5;
  const x = room.x * 0.5 + w / 2;
  const z = room.y * 0.5 + h / 2;

  return (
    <group position={[x, 0, z]}>
      {/* Floor */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={room.floorColor} />
      </mesh>
      {/* Carpet */}
      {room.carpetColor && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w - 0.4, h - 0.4]} />
          <meshStandardMaterial color={room.carpetColor} />
        </mesh>
      )}
      {/* Walls */}
      {/* Back wall */}
      <mesh position={[0, 0.3, -h / 2]} castShadow>
        <boxGeometry args={[w, 0.6, 0.08]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-w / 2, 0.3, 0]} castShadow>
        <boxGeometry args={[0.08, 0.6, h]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Right wall */}
      <mesh position={[w / 2, 0.3, 0]} castShadow>
        <boxGeometry args={[0.08, 0.6, h]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Front wall (partial - leave opening for door) */}
      <mesh position={[-w / 4 - 0.1, 0.3, h / 2]} castShadow>
        <boxGeometry args={[w / 2 - 0.3, 0.6, 0.08]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      <mesh position={[w / 4 + 0.1, 0.3, h / 2]} castShadow>
        <boxGeometry args={[w / 2 - 0.3, 0.6, 0.08]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Room label */}
      <Html position={[0, 0.8, 0]} center>
        <div className="px-2 py-0.5 bg-card/90 backdrop-blur-sm rounded-md border border-border text-[10px] font-display font-bold text-foreground whitespace-nowrap pointer-events-none select-none">
          {room.name}
        </div>
      </Html>
    </group>
  );
}

// ── Agent 3D ──
function Agent3D({ agent, selected, onClick }: { agent: Agent; selected?: boolean; onClick: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const x = agent.x * 0.5;
  const z = agent.y * 0.5;

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.position.y = 0 + Math.sin(Date.now() * 0.003) * 0.02;
    }
  });

  return (
    <group
      ref={ref}
      position={[x, 0, z]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.25, 0.3, 0.15]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.18]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 0.48, 0.091]}>
        <boxGeometry args={[0.16, 0.1, 0.01]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.04, 0.49, 0.1]}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
        <meshStandardMaterial color={agent.status === "thinking" ? "#6366F1" : "#00FF88"} emissive={agent.status === "thinking" ? "#6366F1" : "#00FF88"} emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.04, 0.49, 0.1]}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
        <meshStandardMaterial color={agent.status === "thinking" ? "#6366F1" : "#00FF88"} emissive={agent.status === "thinking" ? "#6366F1" : "#00FF88"} emissiveIntensity={1} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 0.63, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Status LED */}
      <mesh position={[0, 0.69, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial
          color={STATUS_COLORS[agent.status]}
          emissive={STATUS_COLORS[agent.status]}
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.06, 0.06, 0]}>
        <boxGeometry args={[0.08, 0.12, 0.1]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      <mesh position={[0.06, 0.06, 0]}>
        <boxGeometry args={[0.08, 0.12, 0.1]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Selection ring */}
      {(selected || hovered) && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.28, 32]} />
          <meshBasicMaterial color={selected ? "#6366F1" : "#90CAF9"} transparent opacity={0.7} />
        </mesh>
      )}
      {/* Name tag */}
      <Html position={[0, 0.85, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(20,20,30,0.9)] rounded-full whitespace-nowrap pointer-events-none select-none">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[agent.status] }} />
          <span className="text-[9px] text-white font-bold">{agent.name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Player 3D ──
function Player3D({ player, config }: { player: Player; config?: { color: string; skinTone?: string; hairStyle?: string; outfitStyle?: string } }) {
  const ref = useRef<THREE.Group>(null);
  const smoothPos = useRef(new THREE.Vector3(player.x * 0.5, 0, player.y * 0.5));
  const color = config?.color || "#4F46E5";
  const skin = config?.skinTone === "light" ? "#FDDCB5" : config?.skinTone === "dark" ? "#8D5B3E" : config?.skinTone === "tan" ? "#C8956C" : "#E8B88A";

  useFrame(() => {
    if (ref.current) {
      const targetX = player.x * 0.5;
      const targetZ = player.y * 0.5;
      smoothPos.current.x += (targetX - smoothPos.current.x) * 0.15;
      smoothPos.current.z += (targetZ - smoothPos.current.z) * 0.15;
      ref.current.position.set(smoothPos.current.x, 0, smoothPos.current.z);
      ref.current.position.y = Math.sin(Date.now() * 0.004) * 0.01;
    }
  });

  return (
    <group ref={ref}>
      {/* Legs */}
      <mesh position={[-0.05, 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.08]} />
        <meshStandardMaterial color="#2D3748" />
      </mesh>
      <mesh position={[0.05, 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.08]} />
        <meshStandardMaterial color="#2D3748" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.25, 0.25, 0.14]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.16, 0.24, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.16, 0.24, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.16, 0.13, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0.16, 0.13, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.18]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.04, 0.46, 0.091]}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.04, 0.46, 0.091]}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.04, 0.46, 0.095]}>
        <boxGeometry args={[0.02, 0.02, 0.01]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.04, 0.46, 0.095]}>
        <boxGeometry args={[0.02, 0.02, 0.01]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Crown */}
      <Html position={[0, 0.7, 0]} center>
        <span className="text-base select-none pointer-events-none">👑</span>
      </Html>
      {/* Name tag */}
      <Html position={[0, 0.82, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none select-none" style={{ backgroundColor: color }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-[9px] text-white font-bold">{player.name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Camera follower ──
function CameraFollower({ player }: { player: Player }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame(() => {
    const px = player.x * 0.5;
    const pz = player.y * 0.5;
    target.current.set(px, 0, pz);
    target.current.lerp(new THREE.Vector3(px, 0, pz), 0.05);
    camera.position.set(target.current.x + 8, 10, target.current.z + 8);
    camera.lookAt(target.current);
  });

  return null;
}

// ── Ground plane ──
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#7CB868" />
    </mesh>
  );
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
  onGroundClick?: (x: number, z: number) => void;
}

export function OfficeScene({
  agents, player, rooms, furniture, playerConfig, selectedAgentId, onAgentClick,
  editMode, selectedFurnitureId, hoveredFurnitureId, onFurnitureClick, onFurnitureHover, onGroundClick,
}: OfficeSceneProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ position: [12, 10, 12], fov: 45 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <color attach="background" args={["#87CEEB"]} />
        <fog attach="fog" args={["#87CEEB", 20, 40]} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 15, 8]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <hemisphereLight args={["#87CEEB", "#7CB868", 0.3]} />

        <CameraFollower player={player} />

        <Ground />

        {/* Rooms */}
        {rooms.map(room => (
          <Room3D key={room.id} room={room} />
        ))}

        {/* Furniture */}
        {furniture.map(f => (
          <FurnitureModel
            key={f.id}
            type={f.type}
            position={[f.x * 0.5, 0, f.y * 0.5]}
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

        {/* Edit mode controls */}
        {editMode && <OrbitControls enablePan enableZoom maxPolarAngle={Math.PI / 2.5} minDistance={3} maxDistance={25} />}
      </Canvas>
    </div>
  );
}
