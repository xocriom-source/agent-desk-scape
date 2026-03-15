import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { TransportType } from "@/types/building";
import { TRANSPORT_INFO } from "@/types/building";

interface VehicleProps {
  type: TransportType;
  position: [number, number, number];
  color?: string;
  isActive?: boolean;
  ownerName?: string;
  onClick?: () => void;
}

// ── Car ──
function CarModel({ color = "#4A90D9" }: { color?: string }) {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.8, 0.2, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.05, 0.32, 0]} castShadow>
        <boxGeometry args={[0.45, 0.16, 0.35]} />
        <meshStandardMaterial color="#333" metalness={0.4} roughness={0.2} />
      </mesh>
      {/* Windows */}
      <mesh position={[0.05, 0.32, 0.176]}>
        <boxGeometry args={[0.4, 0.12, 0.01]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.6} metalness={0.8} />
      </mesh>
      <mesh position={[0.05, 0.32, -0.176]}>
        <boxGeometry args={[0.4, 0.12, 0.01]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.6} metalness={0.8} />
      </mesh>
      {/* Wheels */}
      {[[-0.25, -0.2], [-0.25, 0.2], [0.25, -0.2], [0.25, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.05, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[0.41, 0.15, 0.12]}>
        <boxGeometry args={[0.02, 0.04, 0.06]} />
        <meshStandardMaterial color="#FFE" emissive="#FFD" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.41, 0.15, -0.12]}>
        <boxGeometry args={[0.02, 0.04, 0.06]} />
        <meshStandardMaterial color="#FFE" emissive="#FFD" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ── Motorcycle ──
function MotorcycleModel({ color = "#E53E3E" }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.5, 0.12, 0.15]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.1, 0.25, 0]}>
        <boxGeometry args={[0.15, 0.1, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {[[-0.2, 0], [0.2, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.06, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.03, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  );
}

// ── Bicycle ──
function BicycleModel({ color = "#48BB78" }: { color?: string }) {
  return (
    <group scale={0.8}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.35, 0.03, 0.03]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.08, 0.2, 0]}>
        <boxGeometry args={[0.03, 0.12, 0.03]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {[[-0.15, 0], [0.15, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.06, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 12]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
    </group>
  );
}

// ── Helicopter ──
function HelicopterModel({ color = "#718096" }: { color?: string }) {
  const rotorRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (rotorRef.current) rotorRef.current.rotation.y += delta * 8;
  });
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.6, 0.25, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Cockpit */}
      <mesh position={[0.25, 0.22, 0]}>
        <sphereGeometry args={[0.15, 8, 8, 0, Math.PI]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} metalness={0.7} />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.45, 0.22, 0]}>
        <boxGeometry args={[0.4, 0.08, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Tail rotor */}
      <mesh position={[-0.65, 0.25, 0.04]}>
        <boxGeometry args={[0.02, 0.15, 0.02]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Main rotor */}
      <mesh ref={rotorRef} position={[0, 0.38, 0]}>
        <boxGeometry args={[0.8, 0.01, 0.06]} />
        <meshStandardMaterial color="#444" metalness={0.6} />
      </mesh>
      {/* Rotor mast */}
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.08, 6]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Skids */}
      {[-0.12, 0.12].map((z, i) => (
        <mesh key={i} position={[0, 0.03, z]}>
          <boxGeometry args={[0.5, 0.02, 0.02]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
    </group>
  );
}

// ── Drone ──
function DroneModel({ color = "#9F7AEA" }: { color?: string }) {
  const ref = useRef<THREE.Group>(null);
  const propRefs = useRef<THREE.Mesh[]>([]);
  
  useFrame((_, delta) => {
    if (ref.current) ref.current.position.y = 0.3 + Math.sin(Date.now() * 0.003) * 0.05;
    propRefs.current.forEach(p => { if (p) p.rotation.y += delta * 15; });
  });

  return (
    <group ref={ref} position={[0, 0.3, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.2, 0.06, 0.2]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Arms + propellers */}
      {[[-0.15, -0.15], [-0.15, 0.15], [0.15, -0.15], [0.15, 0.15]].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x * 0.7, 0, z * 0.7]}>
            <boxGeometry args={[0.15, 0.015, 0.02]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh
            ref={(el) => { if (el) propRefs.current[i] = el; }}
            position={[x, 0.02, z]}
          >
            <boxGeometry args={[0.12, 0.005, 0.02]} />
            <meshStandardMaterial color="#666" />
          </mesh>
        </group>
      ))}
      {/* LED */}
      <pointLight position={[0, -0.05, 0]} intensity={0.3} distance={1.5} color={color} />
    </group>
  );
}

// ── Jet ──
function JetModel({ color = "#E2E8F0" }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[1, 0.15, 0.2]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Nose */}
      <mesh position={[0.55, 0.15, 0]}>
        <boxGeometry args={[0.15, 0.1, 0.12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Wings */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.6} />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.45, 0.25, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.03]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Tail wings */}
      <mesh position={[-0.45, 0.18, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Cockpit */}
      <mesh position={[0.4, 0.22, 0]}>
        <boxGeometry args={[0.12, 0.06, 0.1]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} />
      </mesh>
      {/* Engines */}
      {[-0.15, 0.15].map((z, i) => (
        <mesh key={i} position={[-0.35, 0.12, z]}>
          <cylinderGeometry args={[0.04, 0.05, 0.15, 6]} />
          <meshStandardMaterial color="#555" metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ── Boat ──
function BoatModel({ color = "#2B6CB0" }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.7, 0.1, 0.25]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.1, 0.16, 0]}>
        <boxGeometry args={[0.25, 0.08, 0.2]} />
        <meshStandardMaterial color="#FFF" />
      </mesh>
      <mesh position={[0.3, 0.08, 0]}>
        <boxGeometry args={[0.1, 0.05, 0.15]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

// ── Futuristic Car ──
function FuturisticCarModel({ color = "#6366F1" }: { color?: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.position.y = 0.08 + Math.sin(Date.now() * 0.002) * 0.01;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.9, 0.12, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[0.05, 0.22, 0]}>
        <boxGeometry args={[0.4, 0.1, 0.35]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.6} roughness={0.1} />
      </mesh>
      {/* Neon underglow */}
      <pointLight position={[0, 0.02, 0]} intensity={0.5} distance={1.5} color={color} />
      {/* Light strips */}
      <mesh position={[0.46, 0.12, 0]}>
        <boxGeometry args={[0.02, 0.03, 0.35]} />
        <meshStandardMaterial color="#FFF" emissive="#FFF" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.46, 0.12, 0]}>
        <boxGeometry args={[0.02, 0.03, 0.3]} />
        <meshStandardMaterial color="#F44" emissive="#F44" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

const MODEL_MAP: Record<TransportType, React.FC<{ color?: string }>> = {
  car: CarModel,
  motorcycle: MotorcycleModel,
  bicycle: BicycleModel,
  helicopter: HelicopterModel,
  jet: JetModel,
  drone: DroneModel,
  boat: BoatModel,
  yacht: BoatModel, // reuse boat with scale
  futuristic_car: FuturisticCarModel,
  none: () => null,
};

export function Vehicle3D({ type, position, color, isActive, ownerName, onClick }: VehicleProps) {
  const [hovered, setHovered] = useState(false);
  const ModelComponent = MODEL_MAP[type] || MODEL_MAP.car;

  if (type === "none") return null;

  return (
    <group
      position={position}
      scale={type === "yacht" ? 1.4 : 1}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <ModelComponent color={color} />
      {/* Hover label */}
      {hovered && ownerName && (
        <Html position={[0, 0.8, 0]} center>
          <div className="px-2 py-1 text-[8px] font-bold whitespace-nowrap pointer-events-none select-none rounded-md bg-black/80 text-white border border-gray-600"
            style={{ fontFamily: "monospace" }}
          >
            {TRANSPORT_INFO[type]?.emoji} {ownerName}
          </div>
        </Html>
      )}
      {/* Active glow */}
      {isActive && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 16]} />
          <meshBasicMaterial color={color || "#4AF"} transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
}

// Need this import at the top for useState
import { useState } from "react";
import { TRANSPORT_INFO } from "@/types/building";
