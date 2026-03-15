import * as THREE from "three";
import type { FurnitureItem } from "@/types/agent";

interface Furniture3DProps {
  item: FurnitureItem;
}

export function Furniture3D({ item }: Furniture3DProps) {
  const { x, z } = item.position;
  const rot = item.rotation || 0;

  switch (item.type) {
    case "desk":
      return <Desk position={[x, 0, z]} rotation={rot} />;
    case "chair":
      return <Chair position={[x, 0, z]} rotation={rot} />;
    case "plant":
      return <Plant position={[x, 0, z]} />;
    case "bookshelf":
      return <Bookshelf position={[x, 0, z]} />;
    case "coffee":
      return <CoffeeMachine position={[x, 0, z]} />;
    case "monitor":
      return <Monitor position={[x, 0, z]} />;
    case "sofa":
      return <Sofa position={[x, 0, z]} rotation={rot} />;
    case "whiteboard":
      return <Whiteboard position={[x, 0, z]} />;
    case "server":
      return <ServerRack position={[x, 0, z]} />;
    default:
      return null;
  }
}

function Desk({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      {/* Table top */}
      <mesh position-y={0.45} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.06, 0.8]} />
        <meshStandardMaterial color="#8B6F47" roughness={0.6} />
      </mesh>
      {/* Legs */}
      {[[-0.7, 0, -0.3], [0.7, 0, -0.3], [-0.7, 0, 0.3], [0.7, 0, 0.3]].map((pos, i) => (
        <mesh key={i} position={[pos[0], 0.22, pos[2]]} castShadow>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color="#6B5335" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Chair({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      {/* Seat */}
      <mesh position-y={0.32} castShadow>
        <boxGeometry args={[0.45, 0.05, 0.45]} />
        <meshStandardMaterial color="#374151" roughness={0.5} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.55, -0.2]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.05]} />
        <meshStandardMaterial color="#4B5563" roughness={0.5} />
      </mesh>
      {/* Base */}
      <mesh position-y={0.15}>
        <cylinderGeometry args={[0.05, 0.05, 0.3]} />
        <meshStandardMaterial color="#1F2937" metalness={0.5} />
      </mesh>
      {/* Wheels base */}
      <mesh position-y={0.02}>
        <cylinderGeometry args={[0.2, 0.2, 0.04]} />
        <meshStandardMaterial color="#1F2937" metalness={0.5} />
      </mesh>
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position-y={0.15} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.3, 8]} />
        <meshStandardMaterial color="#B45309" roughness={0.8} />
      </mesh>
      {/* Soil */}
      <mesh position-y={0.3}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 8]} />
        <meshStandardMaterial color="#3E2723" roughness={0.9} />
      </mesh>
      {/* Leaves */}
      {[0, 1.2, 2.4, 3.6, 4.8].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(angle) * 0.1,
            0.45 + i * 0.06,
            Math.cos(angle) * 0.1,
          ]}
          rotation-z={Math.sin(angle) * 0.3}
          castShadow
        >
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#22C55E" : "#16A34A"} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Bookshelf({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh position-y={0.6} castShadow>
        <boxGeometry args={[0.6, 1.2, 0.3]} />
        <meshStandardMaterial color="#92400E" roughness={0.7} />
      </mesh>
      {/* Books */}
      {[0.3, 0.6, 0.9].map((y, i) => (
        <mesh key={i} position={[0, y, 0.05]} castShadow>
          <boxGeometry args={[0.5, 0.15, 0.2]} />
          <meshStandardMaterial
            color={["#3B82F6", "#EF4444", "#8B5CF6"][i]}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeMachine({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position-y={0.25} castShadow>
        <boxGeometry args={[0.35, 0.5, 0.3]} />
        <meshStandardMaterial color="#1F2937" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Indicator */}
      <mesh position={[0, 0.4, 0.16]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#10B981" />
      </mesh>
    </group>
  );
}

function Monitor({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Screen */}
      <mesh position-y={0.65} castShadow>
        <boxGeometry args={[0.5, 0.35, 0.03]} />
        <meshStandardMaterial color="#1E293B" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* Screen glow */}
      <mesh position={[0, 0.65, 0.02]}>
        <planeGeometry args={[0.44, 0.28]} />
        <meshBasicMaterial color="#6366F1" transparent opacity={0.3} />
      </mesh>
      {/* Stand */}
      <mesh position-y={0.52}>
        <boxGeometry args={[0.05, 0.1, 0.05]} />
        <meshStandardMaterial color="#374151" metalness={0.5} />
      </mesh>
    </group>
  );
}

function Sofa({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      {/* Seat */}
      <mesh position-y={0.2} castShadow>
        <boxGeometry args={[0.8, 0.25, 1.5]} />
        <meshStandardMaterial color="#6366F1" roughness={0.8} />
      </mesh>
      {/* Back */}
      <mesh position={[-0.35, 0.45, 0]} castShadow>
        <boxGeometry args={[0.12, 0.4, 1.5]} />
        <meshStandardMaterial color="#4F46E5" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Whiteboard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Board */}
      <mesh position-y={0.9} castShadow>
        <boxGeometry args={[2, 1, 0.05]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
      </mesh>
      {/* Frame */}
      <mesh position-y={0.9}>
        <boxGeometry args={[2.1, 1.1, 0.03]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.4} />
      </mesh>
      {/* Legs */}
      {[-0.8, 0.8].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0.4, 0]} castShadow>
          <boxGeometry args={[0.05, 0.8, 0.05]} />
          <meshStandardMaterial color="#64748B" metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function ServerRack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Rack body */}
      <mesh position-y={0.6} castShadow>
        <boxGeometry args={[0.5, 1.2, 0.4]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* LEDs */}
      {[0.3, 0.5, 0.7, 0.9].map((y, i) => (
        <mesh key={i} position={[0.15, y, 0.21]}>
          <circleGeometry args={[0.02, 6]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#10B981" : "#3B82F6"} />
        </mesh>
      ))}
    </group>
  );
}
