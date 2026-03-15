import { useRef, useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface FurnitureProps {
  type: string;
  position: [number, number, number];
  editMode?: boolean;
  selected?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

// Color palettes for furniture
const WOOD = "#A0805A";
const WOOD_DARK = "#705838";
const WOOD_LIGHT = "#C8A878";
const METAL = "#546E7A";
const METAL_DARK = "#37474F";
const SCREEN_OFF = "#1a1a2e";
const SCREEN_ON = "#4FC3F7";
const FABRIC_BLUE = "#5C6BC0";
const FABRIC_PURPLE = "#7B68AE";
const PLANT_GREEN = "#43A047";
const PLANT_DARK = "#2E7D32";

export function FurnitureModel({ type, position, editMode, selected, hovered, onClick, onPointerOver, onPointerOut }: FurnitureProps) {
  const groupRef = useRef<THREE.Group>(null);

  const interactiveProps = editMode ? {
    onClick: (e: any) => { e.stopPropagation(); onClick?.(); },
    onPointerOver: (e: any) => { e.stopPropagation(); onPointerOver?.(); document.body.style.cursor = "pointer"; },
    onPointerOut: (e: any) => { onPointerOut?.(); document.body.style.cursor = "default"; },
  } : {};

  const outlineColor = selected ? "#FFD700" : hovered ? "#90CAF9" : null;

  return (
    <group ref={groupRef} position={position} {...interactiveProps}>
      {outlineColor && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.55, 32]} />
          <meshBasicMaterial color={outlineColor} transparent opacity={0.8} />
        </mesh>
      )}
      <FurnitureGeometry type={type} />
    </group>
  );
}

function FurnitureGeometry({ type }: { type: string }) {
  switch (type) {
    case "desk":
    case "desk_large":
      return <Desk large={type === "desk_large"} />;
    case "chair":
      return <Chair />;
    case "server":
      return <ServerRack />;
    case "sofa":
      return <Sofa />;
    case "plant":
    case "plant_large":
      return <Plant large={type === "plant_large"} />;
    case "bookshelf":
      return <Bookshelf />;
    case "whiteboard":
      return <Whiteboard />;
    case "screen":
    case "tv":
      return <Screen />;
    case "coffee":
      return <CoffeeMachine />;
    case "vending":
      return <VendingMachine />;
    case "table":
      return <SimpleTable />;
    case "monitor":
      return <MonitorStand />;
    case "printer":
      return <Printer />;
    case "water":
      return <WaterCooler />;
    case "trash":
      return <TrashBin />;
    case "door":
      return <Door />;
    case "stairs_up":
    case "stairs_down":
      return <Stairs />;
    case "divider":
      return <Divider />;
    case "window":
      return <WindowFrame />;
    case "laptop":
      return <Laptop />;
    case "phone":
      return <Phone />;
    case "beanbag":
      return <Beanbag />;
    case "painting":
      return <Painting />;
    case "lamp":
      return <FloorLamp />;
    case "clock":
      return <WallClock />;
    case "trophy":
      return <Trophy />;
    case "fridge":
      return <Fridge />;
    case "microwave":
      return <Microwave />;
    case "arcade":
      return <ArcadeMachine />;
    case "foosball":
      return <Foosball />;
    case "pingpong":
      return <PingPong />;
    case "dartboard":
      return <Dartboard />;
    case "rug":
      return <Rug />;
    default:
      return <GenericBox />;
  }
}

// ── FURNITURE COMPONENTS ──

function Desk({ large }: { large?: boolean }) {
  const w = large ? 1.4 : 1;
  return (
    <group>
      {/* Desktop */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[w, 0.04, 0.6]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {/* Legs */}
      {[[-w/2+0.05, 0.22, -0.25], [w/2-0.05, 0.22, -0.25], [-w/2+0.05, 0.22, 0.25], [w/2-0.05, 0.22, 0.25]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.04, 0.44, 0.04]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {/* Monitor */}
      <mesh position={[0, 0.65, -0.15]}>
        <boxGeometry args={[0.35, 0.25, 0.02]} />
        <meshStandardMaterial color={SCREEN_OFF} />
      </mesh>
      <mesh position={[0, 0.65, -0.14]}>
        <boxGeometry args={[0.3, 0.2, 0.01]} />
        <meshEmissiveMaterial emissive={SCREEN_ON} emissiveIntensity={0.5} />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, 0.5, -0.15]}>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      {/* Keyboard */}
      <mesh position={[0, 0.47, 0.05]}>
        <boxGeometry args={[0.25, 0.01, 0.08]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      {/* Mouse */}
      <mesh position={[0.2, 0.47, 0.05]}>
        <boxGeometry args={[0.04, 0.01, 0.06]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
    </group>
  );
}

function Chair() {
  return (
    <group>
      {/* Seat */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 16]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.5, -0.15]}>
        <boxGeometry args={[0.35, 0.35, 0.04]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      {/* Base star */}
      {[0, 72, 144, 216, 288].map(deg => {
        const r = (deg * Math.PI) / 180;
        return (
          <mesh key={deg} position={[Math.cos(r) * 0.15, 0.02, Math.sin(r) * 0.15]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>
        );
      })}
    </group>
  );
}

function ServerRack() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 1, 0.4]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      {/* Panels */}
      {[0.2, 0.5, 0.8].map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, 0.21]}>
            <boxGeometry args={[0.4, 0.15, 0.01]} />
            <meshStandardMaterial color="#263238" />
          </mesh>
          {/* LEDs */}
          {[0, 1, 2].map(j => (
            <mesh key={j} position={[-0.12 + j * 0.06, y, 0.22]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial color={j === 0 ? "#4CAF50" : j === 1 ? "#FF9800" : "#F44336"} emissive={j === 0 ? "#4CAF50" : j === 1 ? "#FF9800" : "#F44336"} emissiveIntensity={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Sofa() {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.9, 0.2, 0.45]} />
        <meshStandardMaterial color={FABRIC_PURPLE} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.35, -0.18]}>
        <boxGeometry args={[0.9, 0.25, 0.1]} />
        <meshStandardMaterial color={FABRIC_PURPLE} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.42, 0.25, 0]}>
        <boxGeometry args={[0.08, 0.2, 0.45]} />
        <meshStandardMaterial color={FABRIC_PURPLE} />
      </mesh>
      <mesh position={[0.42, 0.25, 0]}>
        <boxGeometry args={[0.08, 0.2, 0.45]} />
        <meshStandardMaterial color={FABRIC_PURPLE} />
      </mesh>
      {/* Cushions */}
      <mesh position={[-0.18, 0.27, 0.02]}>
        <boxGeometry args={[0.35, 0.06, 0.35]} />
        <meshStandardMaterial color="#8878B8" />
      </mesh>
      <mesh position={[0.18, 0.27, 0.02]}>
        <boxGeometry args={[0.35, 0.06, 0.35]} />
        <meshStandardMaterial color="#8878B8" />
      </mesh>
    </group>
  );
}

function Plant({ large }: { large?: boolean }) {
  const s = large ? 1.3 : 1;
  return (
    <group scale={[s, s, s]}>
      {/* Pot */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.2, 16]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.11, 0.12, 0.02, 16]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={PLANT_GREEN} />
      </mesh>
      <mesh position={[-0.08, 0.5, 0.05]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color={PLANT_DARK} />
      </mesh>
      <mesh position={[0.08, 0.52, -0.05]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color="#66BB6A" />
      </mesh>
    </group>
  );
}

function Bookshelf() {
  const bookColors = ["#C62828", "#1565C0", "#2E7D32", "#EF6C00", "#6A1B9A", "#00838F"];
  return (
    <group>
      {/* Frame */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.6, 1, 0.25]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      {/* Shelves + books */}
      {[0.2, 0.5, 0.8].map((y, row) => (
        <group key={row}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[0.56, 0.02, 0.24]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
          {bookColors.slice(0, 4).map((c, b) => (
            <mesh key={b} position={[-0.18 + b * 0.12, y + 0.08, 0]}>
              <boxGeometry args={[0.08, 0.14, 0.18]} />
              <meshStandardMaterial color={bookColors[(row * 4 + b) % bookColors.length]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Whiteboard() {
  return (
    <group>
      {/* Board */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.8, 0.5, 0.03]} />
        <meshStandardMaterial color="#ECEFF1" />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 0.6, -0.02]}>
        <boxGeometry args={[0.84, 0.54, 0.02]} />
        <meshStandardMaterial color="#90A4AE" />
      </mesh>
      {/* Stand legs */}
      <mesh position={[-0.3, 0.3, 0]}>
        <boxGeometry args={[0.03, 0.6, 0.03]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0.3, 0.3, 0]}>
        <boxGeometry args={[0.03, 0.6, 0.03]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
    </group>
  );
}

function Screen() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.7, 0.4, 0.03]} />
        <meshStandardMaterial color={SCREEN_OFF} />
      </mesh>
      <mesh position={[0, 0.45, 0.016]}>
        <boxGeometry args={[0.6, 0.33, 0.01]} />
        <meshStandardMaterial color="#1A237E" emissive="#1A237E" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.04, 0.12, 0.04]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.15]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
    </group>
  );
}

function CoffeeMachine() {
  return (
    <group>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.25, 0.4, 0.2]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      <mesh position={[0, 0.05, 0.05]}>
        <cylinderGeometry args={[0.04, 0.035, 0.08, 12]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
}

function VendingMachine() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 1, 0.35]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      <mesh position={[0, 0.6, 0.18]}>
        <boxGeometry args={[0.4, 0.5, 0.01]} />
        <meshStandardMaterial color="#263238" />
      </mesh>
      {["#F44336", "#4CAF50", "#FF9800", "#2196F3", "#E91E63", "#FFC107"].map((c, i) => (
        <mesh key={i} position={[-0.1 + (i % 3) * 0.1, 0.7 - Math.floor(i / 3) * 0.15, 0.185]}>
          <cylinderGeometry args={[0.025, 0.025, 0.06, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
    </group>
  );
}

function SimpleTable() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.7, 0.04, 0.5]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {[[-0.3, 0.17, -0.2], [0.3, 0.17, -0.2], [-0.3, 0.17, 0.2], [0.3, 0.17, 0.2]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.04, 0.34, 0.04]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
    </group>
  );
}

function MonitorStand() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.35, 0.25, 0.02]} />
        <meshStandardMaterial color={SCREEN_OFF} />
      </mesh>
      <mesh position={[0, 0.35, 0.01]}>
        <boxGeometry args={[0.3, 0.2, 0.01]} />
        <meshStandardMaterial color={SCREEN_ON} emissive={SCREEN_ON} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.03, 0.12, 0.03]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.15, 0.02, 0.1]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
    </group>
  );
}

function Printer() {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.4, 0.2, 0.3]} />
        <meshStandardMaterial color="#ECEFF1" />
      </mesh>
      <mesh position={[0, 0.26, -0.05]}>
        <boxGeometry args={[0.35, 0.02, 0.15]} />
        <meshStandardMaterial color="#B0BEC5" />
      </mesh>
    </group>
  );
}

function WaterCooler() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color="#B0BEC5" />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
        <meshStandardMaterial color="#B3E5FC" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function TrashBin() {
  return (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.24, 12]} />
        <meshStandardMaterial color="#78909C" />
      </mesh>
    </group>
  );
}

function Door() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 1, 0.06]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
      <mesh position={[0.15, 0.5, 0.04]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#FFC107" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Stairs() {
  return (
    <group>
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[0, i * 0.12 + 0.06, -i * 0.15]}>
          <boxGeometry args={[0.6, 0.1, 0.15]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#78909C" : "#90A4AE"} />
        </mesh>
      ))}
      <mesh position={[-0.32, 0.3, -0.22]}>
        <boxGeometry args={[0.03, 0.6, 0.7]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0.32, 0.3, -0.22]}>
        <boxGeometry args={[0.03, 0.6, 0.7]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
    </group>
  );
}

function Divider() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.05, 1, 0.6]} />
        <meshStandardMaterial color="#90A4AE" />
      </mesh>
    </group>
  );
}

function WindowFrame() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.6, 0.5, 0.04]} />
        <meshStandardMaterial color="#B3E5FC" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.64, 0.54, 0.02]} />
        <meshStandardMaterial color="#90A4AE" wireframe />
      </mesh>
    </group>
  );
}

function Laptop() {
  return (
    <group>
      <mesh position={[0, 0.47, 0.05]}>
        <boxGeometry args={[0.25, 0.01, 0.18]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0, 0.55, -0.03]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.25, 0.17, 0.01]} />
        <meshStandardMaterial color={SCREEN_OFF} />
      </mesh>
      <mesh position={[0, 0.55, -0.025]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.21, 0.13, 0.005]} />
        <meshStandardMaterial color={SCREEN_ON} emissive={SCREEN_ON} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function Phone() {
  return (
    <group>
      <mesh position={[0, 0.47, 0]}>
        <boxGeometry args={[0.12, 0.03, 0.15]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      <mesh position={[-0.08, 0.5, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.04]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
    </group>
  );
}

function Beanbag() {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color="#E91E63" />
      </mesh>
      <mesh position={[0, 0.25, -0.1]}>
        <sphereGeometry args={[0.15, 12, 10]} />
        <meshStandardMaterial color="#F06292" />
      </mesh>
    </group>
  );
}

function Painting() {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.02]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      <mesh position={[0, 0.6, 0.011]}>
        <boxGeometry args={[0.34, 0.24, 0.01]} />
        <meshStandardMaterial color="#81D4FA" />
      </mesh>
      <mesh position={[0, 0.54, 0.015]}>
        <boxGeometry args={[0.34, 0.1, 0.005]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
    </group>
  );
}

function FloorLamp() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.03, 12]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.78, 8]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <coneGeometry args={[0.12, 0.15, 16, 1, true]} />
        <meshStandardMaterial color="#FFC107" side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 0.75, 0]} intensity={0.5} distance={3} color="#FFF3E0" />
    </group>
  );
}

function WallClock() {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.03, 24]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
}

function Trophy() {
  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.1, 0.04, 0.1]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.02, 0.04, 0.12, 8]} />
        <meshStandardMaterial color="#FFC107" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.06, 0.03, 0.08, 12]} />
        <meshStandardMaterial color="#FFC107" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Fridge() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.4, 0.9, 0.35]} />
        <meshStandardMaterial color="#CFD8DC" />
      </mesh>
      <mesh position={[0.15, 0.6, 0.18]}>
        <boxGeometry args={[0.02, 0.15, 0.02]} />
        <meshStandardMaterial color="#90A4AE" />
      </mesh>
    </group>
  );
}

function Microwave() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.3, 0.2, 0.22]} />
        <meshStandardMaterial color="#546E7A" />
      </mesh>
      <mesh position={[-0.03, 0.5, 0.112]}>
        <boxGeometry args={[0.18, 0.14, 0.01]} />
        <meshStandardMaterial color="#263238" />
      </mesh>
    </group>
  );
}

function ArcadeMachine() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.4, 1, 0.35]} />
        <meshStandardMaterial color="#1A237E" />
      </mesh>
      <mesh position={[0, 0.7, 0.18]}>
        <boxGeometry args={[0.3, 0.25, 0.01]} />
        <meshStandardMaterial color="#E91E63" emissive="#E91E63" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function Foosball() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.5]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      <mesh position={[0, 0.43, 0]}>
        <boxGeometry args={[0.74, 0.02, 0.44]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      {[[-0.35, 0.17, -0.2], [0.35, 0.17, -0.2], [-0.35, 0.17, 0.2], [0.35, 0.17, 0.2]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.04, 0.34, 0.04]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
    </group>
  );
}

function PingPong() {
  return (
    <group>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[1, 0.04, 0.6]} />
        <meshStandardMaterial color="#1B5E20" />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.02, 0.1, 0.65]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      {[[-0.45, 0.18, -0.25], [0.45, 0.18, -0.25], [-0.45, 0.18, 0.25], [0.45, 0.18, 0.25]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.04, 0.36, 0.04]} />
          <meshStandardMaterial color={METAL_DARK} />
        </mesh>
      ))}
    </group>
  );
}

function Dartboard() {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 24]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#C62828" />
      </mesh>
      <mesh position={[0, 0.6, 0.02]}>
        <cylinderGeometry args={[0.1, 0.1, 0.01, 24]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 0.6, 0.025]}>
        <cylinderGeometry args={[0.04, 0.04, 0.01, 24]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#C62828" />
      </mesh>
    </group>
  );
}

function Rug() {
  return (
    <group>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshStandardMaterial color="#9C27B0" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function GenericBox() {
  return (
    <mesh position={[0, 0.15, 0]}>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial color="#78909C" />
    </mesh>
  );
}

// Emissive helper material
function meshEmissiveMaterial({ emissive, emissiveIntensity }: { emissive: string; emissiveIntensity: number }) {
  return <meshStandardMaterial color={emissive} emissive={emissive} emissiveIntensity={emissiveIntensity} />;
}
