import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Agent, Player } from "@/types/agent";
import type { RoomDef, FurnitureItem } from "@/data/officeMap";
import { FurnitureModel } from "./FurnitureModels";

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981", idle: "#F59E0B", thinking: "#6366F1", busy: "#EF4444",
};

// ── Building exterior ──
function BuildingExterior({ rooms }: { rooms: RoomDef[] }) {
  // Calculate building bounds from rooms
  const minX = Math.min(...rooms.map(r => r.x)) - 2;
  const minY = Math.min(...rooms.map(r => r.y)) - 2;
  const maxX = Math.max(...rooms.map(r => r.x + r.w)) + 2;
  const maxY = Math.max(...rooms.map(r => r.y + r.h)) + 2;
  const bw = (maxX - minX) * 0.5;
  const bh = (maxY - minY) * 0.5;
  const cx = (minX + maxX) / 2 * 0.5;
  const cz = (minY + maxY) / 2 * 0.5;

  return (
    <group>
      {/* Main building floor - concrete/tile */}
      <mesh position={[cx, 0.002, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[bw + 1, bh + 1]} />
        <meshStandardMaterial color="#C8C0B0" />
      </mesh>

      {/* Building border/baseboard */}
      {/* Front wall */}
      <mesh position={[cx, 0.15, cz + bh / 2 + 0.5]} castShadow>
        <boxGeometry args={[bw + 1, 0.3, 0.15]} />
        <meshStandardMaterial color="#6B7280" />
      </mesh>
      {/* Back wall */}
      <mesh position={[cx, 0.4, cz - bh / 2 - 0.5]} castShadow>
        <boxGeometry args={[bw + 1, 0.8, 0.15]} />
        <meshStandardMaterial color="#4B5563" />
      </mesh>
      {/* Left wall */}
      <mesh position={[cx - bw / 2 - 0.5, 0.4, cz]} castShadow>
        <boxGeometry args={[0.15, 0.8, bh + 1]} />
        <meshStandardMaterial color="#4B5563" />
      </mesh>
      {/* Right wall */}
      <mesh position={[cx + bw / 2 + 0.5, 0.4, cz]} castShadow>
        <boxGeometry args={[0.15, 0.8, bh + 1]} />
        <meshStandardMaterial color="#4B5563" />
      </mesh>

      {/* Parking lot / sidewalk around building */}
      <mesh position={[cx, 0.001, cz + bh / 2 + 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[bw + 6, 3]} />
        <meshStandardMaterial color="#9CA3AF" />
      </mesh>
      {/* Sidewalk lines */}
      {[-2, 0, 2].map((offset, i) => (
        <mesh key={i} position={[cx + offset * 2, 0.003, cz + bh / 2 + 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 2]} />
          <meshStandardMaterial color="#D1D5DB" />
        </mesh>
      ))}

      {/* Trees around the building */}
      {[
        [cx - bw / 2 - 2, cz - bh / 2 - 2],
        [cx + bw / 2 + 2, cz - bh / 2 - 2],
        [cx - bw / 2 - 2, cz + bh / 2 + 1],
        [cx + bw / 2 + 2, cz + bh / 2 + 1],
        [cx - bw / 2 - 3, cz],
        [cx + bw / 2 + 3, cz],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          {/* Trunk */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.6, 8]} />
            <meshStandardMaterial color="#8B6914" />
          </mesh>
          {/* Canopy */}
          <mesh position={[0, 0.7, 0]}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshStandardMaterial color="#2D6A2E" />
          </mesh>
          <mesh position={[0.1, 0.85, 0.1]}>
            <sphereGeometry args={[0.2, 10, 10]} />
            <meshStandardMaterial color="#3A8B3B" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Hallway floor rendering ──
function HallwayFloors() {
  // Main horizontal hallway
  return (
    <group>
      <mesh position={[10, 0.003, 6.25]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 0.5]} />
        <meshStandardMaterial color="#D4CFC5" />
      </mesh>
      {/* Vertical hallway left */}
      <mesh position={[6.25, 0.003, 8.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.5, 16]} />
        <meshStandardMaterial color="#D4CFC5" />
      </mesh>
      {/* Vertical hallway center */}
      <mesh position={[13.75, 0.003, 8.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.5, 16]} />
        <meshStandardMaterial color="#D4CFC5" />
      </mesh>
    </group>
  );
}

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
        <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w - 0.4, h - 0.4]} />
          <meshStandardMaterial color={room.carpetColor} />
        </mesh>
      )}
      {/* Walls - thicker, taller, more solid */}
      {/* Back wall */}
      <mesh position={[0, 0.35, -h / 2]} castShadow>
        <boxGeometry args={[w + 0.12, 0.7, 0.12]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-w / 2, 0.35, 0]} castShadow>
        <boxGeometry args={[0.12, 0.7, h + 0.12]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Right wall */}
      <mesh position={[w / 2, 0.35, 0]} castShadow>
        <boxGeometry args={[0.12, 0.7, h + 0.12]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Front wall (partial - door opening) */}
      <mesh position={[-w / 4 - 0.15, 0.35, h / 2]} castShadow>
        <boxGeometry args={[w / 2 - 0.2, 0.7, 0.12]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      <mesh position={[w / 4 + 0.15, 0.35, h / 2]} castShadow>
        <boxGeometry args={[w / 2 - 0.2, 0.7, 0.12]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Wall top trim */}
      <mesh position={[0, 0.7, -h / 2]}>
        <boxGeometry args={[w + 0.2, 0.04, 0.16]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Room label */}
      <Html position={[0, 0.9, 0]} center>
        <div className="px-2 py-0.5 bg-card/90 backdrop-blur-sm rounded-md border border-border text-[10px] font-display font-bold text-foreground whitespace-nowrap pointer-events-none select-none">
          {room.name}
        </div>
      </Html>
    </group>
  );
}

// ── Agent 3D with walking animation ──
function Agent3D({ agent, selected, onClick }: { agent: Agent; selected?: boolean; onClick: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const smoothPos = useRef(new THREE.Vector3(agent.x * 0.5, 0, agent.y * 0.5));
  const prevPos = useRef({ x: agent.x, y: agent.y });
  const isMoving = useRef(false);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    
    const targetX = agent.x * 0.5;
    const targetZ = agent.y * 0.5;
    
    // Smooth interpolation
    smoothPos.current.x += (targetX - smoothPos.current.x) * 0.1;
    smoothPos.current.z += (targetZ - smoothPos.current.z) * 0.1;
    
    const dx = Math.abs(targetX - smoothPos.current.x);
    const dz = Math.abs(targetZ - smoothPos.current.z);
    isMoving.current = dx > 0.01 || dz > 0.01;
    
    ref.current.position.set(smoothPos.current.x, 0, smoothPos.current.z);
    
    // Idle bob
    if (!isMoving.current) {
      ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.015;
    }
    
    // Walking leg animation
    if (leftLegRef.current && rightLegRef.current) {
      if (isMoving.current) {
        const swing = Math.sin(Date.now() * 0.012) * 0.3;
        leftLegRef.current.rotation.x = swing;
        rightLegRef.current.rotation.x = -swing;
      } else {
        leftLegRef.current.rotation.x *= 0.9;
        rightLegRef.current.rotation.x *= 0.9;
      }
    }
    
    // Face movement direction
    if (agent.x !== prevPos.current.x || agent.y !== prevPos.current.y) {
      const dirX = agent.x - prevPos.current.x;
      const dirY = agent.y - prevPos.current.y;
      if (dirX !== 0 || dirY !== 0) {
        const angle = Math.atan2(dirX, dirY);
        ref.current.rotation.y += (angle - ref.current.rotation.y) * 0.15;
      }
      prevPos.current = { x: agent.x, y: agent.y };
    }
  });

  return (
    <group
      ref={ref}
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
      {/* Left Leg (animated) */}
      <mesh ref={leftLegRef} position={[-0.06, 0.06, 0]}>
        <boxGeometry args={[0.08, 0.12, 0.1]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Right Leg (animated) */}
      <mesh ref={rightLegRef} position={[0.06, 0.06, 0]}>
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
      {/* Shadow blob */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.15} />
      </mesh>
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

// ── Player 3D with smooth walking ──
function Player3D({ player, config }: { player: Player; config?: { color: string; skinTone?: string; hairStyle?: string; outfitStyle?: string } }) {
  const ref = useRef<THREE.Group>(null);
  const smoothPos = useRef(new THREE.Vector3(player.x * 0.5, 0, player.y * 0.5));
  const prevPos = useRef({ x: player.x, y: player.y });
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const isMoving = useRef(false);
  
  const color = config?.color || "#4F46E5";
  const skin = config?.skinTone === "light" ? "#FDDCB5" : config?.skinTone === "dark" ? "#8D5B3E" : config?.skinTone === "tan" ? "#C8956C" : "#E8B88A";

  useFrame(() => {
    if (!ref.current) return;
    
    const targetX = player.x * 0.5;
    const targetZ = player.y * 0.5;
    
    // Smooth interpolation - responsive but not instant
    smoothPos.current.x += (targetX - smoothPos.current.x) * 0.18;
    smoothPos.current.z += (targetZ - smoothPos.current.z) * 0.18;
    
    const dx = Math.abs(targetX - smoothPos.current.x);
    const dz = Math.abs(targetZ - smoothPos.current.z);
    isMoving.current = dx > 0.005 || dz > 0.005;
    
    ref.current.position.set(smoothPos.current.x, 0, smoothPos.current.z);
    
    // Subtle idle bob
    if (!isMoving.current) {
      ref.current.position.y = Math.sin(Date.now() * 0.004) * 0.008;
    } else {
      // Walking bounce
      ref.current.position.y = Math.abs(Math.sin(Date.now() * 0.012)) * 0.02;
    }
    
    // Walking animation - legs and arms
    const swing = isMoving.current ? Math.sin(Date.now() * 0.014) * 0.4 : 0;
    if (leftLegRef.current) leftLegRef.current.rotation.x = isMoving.current ? swing : leftLegRef.current.rotation.x * 0.9;
    if (rightLegRef.current) rightLegRef.current.rotation.x = isMoving.current ? -swing : rightLegRef.current.rotation.x * 0.9;
    if (leftArmRef.current) leftArmRef.current.rotation.x = isMoving.current ? -swing * 0.6 : leftArmRef.current.rotation.x * 0.9;
    if (rightArmRef.current) rightArmRef.current.rotation.x = isMoving.current ? swing * 0.6 : rightArmRef.current.rotation.x * 0.9;
    
    // Face direction of movement
    if (player.x !== prevPos.current.x || player.y !== prevPos.current.y) {
      const dirX = player.x - prevPos.current.x;
      const dirY = player.y - prevPos.current.y;
      if (dirX !== 0 || dirY !== 0) {
        const angle = Math.atan2(dirX, dirY);
        ref.current.rotation.y += (angle - ref.current.rotation.y) * 0.2;
      }
      prevPos.current = { x: player.x, y: player.y };
    }
  });

  return (
    <group ref={ref}>
      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.05, 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.08]} />
        <meshStandardMaterial color="#2D3748" />
      </mesh>
      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.05, 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.08]} />
        <meshStandardMaterial color="#2D3748" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.25, 0.25, 0.14]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-0.16, 0.24, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[0.16, 0.24, 0]}>
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
      {/* Shadow blob */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.2} />
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

// ── Camera controller (isometric follow with zoom) ──
function CameraController({ player, editMode }: { player: Player; editMode?: boolean }) {
  const { camera, gl } = useThree();
  const target = useRef(new THREE.Vector3(player.x * 0.5, 0, player.y * 0.5));
  const zoom = useRef(1);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const cameraOffset = useRef(new THREE.Vector3(6, 8, 6));

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom.current = Math.max(0.5, Math.min(2.5, zoom.current - e.deltaY * 0.001));
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2) { // Middle or right click
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current && editMode) {
        const dx = (e.clientX - lastMouse.current.x) * 0.02;
        const dy = (e.clientY - lastMouse.current.y) * 0.02;
        cameraOffset.current.x -= dx;
        cameraOffset.current.z -= dy;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handleMouseUp = () => { isDragging.current = false; };
    const handleContextMenu = (e: Event) => { if (editMode) e.preventDefault(); };

    const domElement = gl.domElement;
    domElement.addEventListener("wheel", handleWheel, { passive: false });
    domElement.addEventListener("mousedown", handleMouseDown);
    domElement.addEventListener("mousemove", handleMouseMove);
    domElement.addEventListener("mouseup", handleMouseUp);
    domElement.addEventListener("contextmenu", handleContextMenu);

    return () => {
      domElement.removeEventListener("wheel", handleWheel);
      domElement.removeEventListener("mousedown", handleMouseDown);
      domElement.removeEventListener("mousemove", handleMouseMove);
      domElement.removeEventListener("mouseup", handleMouseUp);
      domElement.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [gl, editMode]);

  useFrame(() => {
    const px = player.x * 0.5;
    const pz = player.y * 0.5;
    
    // Smooth follow
    target.current.x += (px - target.current.x) * 0.08;
    target.current.z += (pz - target.current.z) * 0.08;
    
    const z = zoom.current;
    const off = cameraOffset.current;
    
    camera.position.set(
      target.current.x + off.x / z,
      off.y / z,
      target.current.z + off.z / z
    );
    camera.lookAt(target.current.x, 0, target.current.z);
  });

  return null;
}

// ── Ground with texture pattern ──
function Ground() {
  return (
    <group>
      {/* Grass base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#5A8F4A" />
      </mesh>
      {/* Lighter grass patches */}
      {[[-8, -5], [15, -8], [-12, 20], [25, 18]].map(([x, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.015, z]}>
          <circleGeometry args={[3, 16]} />
          <meshStandardMaterial color="#6BA85A" />
        </mesh>
      ))}
      {/* Path to building entrance */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, -0.01, 17]} receiveShadow>
        <planeGeometry args={[2, 6]} />
        <meshStandardMaterial color="#B0A898" />
      </mesh>
    </group>
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
}

export function OfficeScene({
  agents, player, rooms, furniture, playerConfig, selectedAgentId, onAgentClick,
  editMode, selectedFurnitureId, hoveredFurnitureId, onFurnitureClick, onFurnitureHover,
}: OfficeSceneProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ position: [12, 10, 12], fov: 40 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        <color attach="background" args={["#78B4D0"]} />
        <fog attach="fog" args={["#78B4D0", 25, 50]} />

        {/* Lighting */}
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[12, 18, 10]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={60}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />
        <hemisphereLight args={["#87CEEB", "#5A8F4A", 0.35]} />

        <CameraController player={player} editMode={editMode} />

        <Ground />
        <BuildingExterior rooms={rooms} />
        <HallwayFloors />

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
      </Canvas>
    </div>
  );
}
