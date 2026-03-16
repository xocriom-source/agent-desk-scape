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

// Friendly labels for furniture types
const FURNITURE_LABELS: Record<string, string> = {
  desk: "Mesa de trabalho",
  desk_large: "Mesa grande",
  chair: "Cadeira",
  server: "Rack de servidores",
  sofa: "Sofá",
  plant: "Planta",
  plant_large: "Planta grande",
  bookshelf: "Estante",
  whiteboard: "Quadro branco",
  screen: "Tela",
  tv: "TV",
  coffee: "Café",
  vending: "Máquina de vendas",
  table: "Mesa",
  monitor: "Monitor",
  printer: "Impressora",
  water: "Bebedouro",
  trash: "Lixeira",
  door: "Porta",
  laptop: "Laptop",
  phone: "Telefone",
  beanbag: "Pufe",
  painting: "Quadro",
  lamp: "Luminária",
  clock: "Relógio",
  trophy: "Troféu",
  fridge: "Geladeira",
  microwave: "Micro-ondas",
  arcade: "Fliperama",
  foosball: "Pebolim",
  pingpong: "Ping Pong",
  dartboard: "Dardos",
  rug: "Tapete",
  // New items
  round_table: "Mesa redonda",
  reception_desk: "Recepção",
  coffee_bar: "Bar de café",
  treadmill: "Esteira",
  dumbbell_rack: "Halteres",
  punching_bag: "Saco de pancada",
  yoga_mat: "Tapete de yoga",
  kanban_board: "Kanban",
  neon_sign: "Letreiro neon",
  aquarium: "Aquário",
  standing_desk: "Mesa em pé",
  couch_l: "Sofá L",
  meeting_chair: "Cadeira reunião",
};

// Color palettes for furniture
const WOOD = "#8B7355";
const WOOD_DARK = "#5C4A32";
const WOOD_LIGHT = "#A89070";
const METAL = "#4A5A68";
const METAL_DARK = "#2A3540";
const SCREEN_OFF = "#0A0A14";
const SCREEN_ON = "#4FC3F7";
const FABRIC_BLUE = "#3A4F7A";
const FABRIC_PURPLE = "#4A4A6A";
const PLANT_GREEN = "#3A8A40";
const PLANT_DARK = "#2A6A2A";

export function FurnitureModel({ type, position, editMode, selected, hovered, onClick, onPointerOver, onPointerOut }: FurnitureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [localHovered, setLocalHovered] = useState(false);

  const interactiveProps = {
    onClick: (e: any) => { e.stopPropagation(); onClick?.(); },
    onPointerOver: (e: any) => {
      e.stopPropagation();
      setLocalHovered(true);
      onPointerOver?.();
      document.body.style.cursor = "pointer";
    },
    onPointerOut: (e: any) => {
      setLocalHovered(false);
      onPointerOut?.();
      document.body.style.cursor = "default";
    },
  };

  const outlineColor = selected ? "#FFD700" : (hovered || (!editMode && localHovered)) ? "#90CAF9" : null;
  const label = FURNITURE_LABELS[type] || type;

  const INTERACT_HINTS: Record<string, string> = {
    chair: "🪑 Sentar", sofa: "🛋️ Sentar", beanbag: "🫧 Sentar", meeting_chair: "💺 Sentar",
    couch_l: "🛋️ Sentar", coffee: "☕ Usar", coffee_bar: "🍵 Pedir café",
    vending: "🥤 Comprar", water: "💧 Beber", arcade: "🕹️ Jogar",
    treadmill: "🏃 Correr", punching_bag: "🥊 Treinar", screen: "📺 Assistir",
    tv: "📺 Assistir", monitor: "🖥️ Usar", laptop: "💻 Usar",
    desk: "🖥️ Trabalhar", standing_desk: "🧍 Trabalhar", aquarium: "🐟 Observar",
  };
  const hint = INTERACT_HINTS[type];

  return (
    <group ref={groupRef} position={position} {...interactiveProps}>
      {outlineColor && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.42, 24]} />
          <meshBasicMaterial color={outlineColor} transparent opacity={0.7} />
        </mesh>
      )}
      {/* Hover tooltip with interaction hint */}
      {localHovered && !editMode && (
        <Html position={[0, 1, 0]} center>
          <div className="px-2 py-1 bg-[rgba(20,20,30,0.92)] rounded-md whitespace-nowrap pointer-events-none select-none border border-[rgba(255,255,255,0.12)] flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-white font-medium">{label}</span>
            {hint && <span className="text-[9px] text-[#00CED1] font-bold">{hint}</span>}
          </div>
        </Html>
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
    case "round_table":
      return <RoundTable />;
    case "reception_desk":
      return <ReceptionDesk />;
    case "coffee_bar":
      return <CoffeeBar />;
    case "treadmill":
      return <Treadmill />;
    case "dumbbell_rack":
      return <DumbbellRack />;
    case "punching_bag":
      return <PunchingBag />;
    case "yoga_mat":
      return <YogaMat />;
    case "kanban_board":
      return <KanbanBoard />;
    case "neon_sign":
      return <NeonSign />;
    case "aquarium":
      return <Aquarium />;
    case "standing_desk":
      return <StandingDesk />;
    case "couch_l":
      return <CouchL />;
    case "meeting_chair":
      return <MeetingChair />;
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
        <meshStandardMaterial color={SCREEN_ON} emissive={SCREEN_ON} emissiveIntensity={0.5} />
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
        <mesh key={i} position={[-0.1 + (i % 3) * 0.1, 0.7 - Math.floor(i / 3) * 0.15, 0.185]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.06, 8]} />
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
      <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.03, 24]} />
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
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 24]} />
        <meshStandardMaterial color="#C62828" />
      </mesh>
      <mesh position={[0, 0.6, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.01, 24]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 0.6, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.01, 24]} />
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

// ── NEW DETAILED FURNITURE ──

function RoundTable() {
  return (
    <group>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.04, 24]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.34, 8]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.02, 16]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
    </group>
  );
}

function ReceptionDesk() {
  return (
    <group>
      {/* Main counter */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.4, 0.08, 0.5]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {/* Front panel */}
      <mesh position={[0, 0.25, -0.22]}>
        <boxGeometry args={[1.4, 0.5, 0.06]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      {/* Side panels */}
      <mesh position={[-0.67, 0.25, 0]}>
        <boxGeometry args={[0.06, 0.5, 0.5]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      <mesh position={[0.67, 0.25, 0]}>
        <boxGeometry args={[0.06, 0.5, 0.5]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      {/* Monitor on desk */}
      <mesh position={[0.3, 0.7, -0.05]}>
        <boxGeometry args={[0.3, 0.2, 0.02]} />
        <meshStandardMaterial color={SCREEN_OFF} />
      </mesh>
      <mesh position={[0.3, 0.7, -0.04]}>
        <boxGeometry args={[0.26, 0.17, 0.01]} />
        <meshStandardMaterial color={SCREEN_ON} emissive={SCREEN_ON} emissiveIntensity={0.4} />
      </mesh>
      {/* Sign on front */}
      <mesh position={[0, 0.35, -0.26]}>
        <boxGeometry args={[0.5, 0.12, 0.01]} />
        <meshStandardMaterial color="#00CED1" emissive="#00CED1" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function CoffeeBar() {
  return (
    <group>
      {/* Counter */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.45]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      {/* Base cabinet */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.2, 0.4, 0.45]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>
      {/* Coffee machine */}
      <mesh position={[-0.35, 0.6, 0]}>
        <boxGeometry args={[0.2, 0.28, 0.18]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
      <mesh position={[-0.35, 0.5, 0.05]}>
        <cylinderGeometry args={[0.03, 0.025, 0.06, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Cups row */}
      {[0, 0.08, 0.16].map((ox, i) => (
        <mesh key={i} position={[0.1 + ox, 0.52, 0.05]}>
          <cylinderGeometry args={[0.025, 0.02, 0.06, 8]} />
          <meshStandardMaterial color={["white", "#FFE0B2", "#BBDEFB"][i]} />
        </mesh>
      ))}
      {/* Menu board above */}
      <mesh position={[0, 0.85, -0.18]}>
        <boxGeometry args={[0.6, 0.25, 0.02]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>
      <mesh position={[0, 0.85, -0.17]}>
        <boxGeometry args={[0.54, 0.2, 0.01]} />
        <meshStandardMaterial color="#FFC107" emissive="#FFC107" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function Treadmill() {
  return (
    <group>
      {/* Base/belt */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.35, 0.08, 0.9]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Uprights */}
      <mesh position={[-0.14, 0.5, -0.35]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0.14, 0.5, -0.35]}>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      {/* Display */}
      <mesh position={[0, 0.88, -0.35]}>
        <boxGeometry args={[0.18, 0.1, 0.03]} />
        <meshStandardMaterial color={SCREEN_OFF} />
      </mesh>
      <mesh position={[0, 0.88, -0.34]}>
        <boxGeometry args={[0.14, 0.07, 0.01]} />
        <meshStandardMaterial color="#4CAF50" emissive="#4CAF50" emissiveIntensity={0.5} />
      </mesh>
      {/* Handles */}
      <mesh position={[-0.14, 0.9, -0.3]}>
        <boxGeometry args={[0.02, 0.02, 0.12]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0.14, 0.9, -0.3]}>
        <boxGeometry args={[0.02, 0.02, 0.12]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
    </group>
  );
}

function DumbbellRack() {
  return (
    <group>
      {/* Rack frame */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.6, 0.7, 0.2]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      {/* Shelves */}
      {[0.15, 0.35, 0.55].map((y, row) => (
        <group key={row}>
          <mesh position={[0, y, 0.05]}>
            <boxGeometry args={[0.55, 0.02, 0.18]} />
            <meshStandardMaterial color={METAL} />
          </mesh>
          {/* Dumbbells */}
          {[-0.15, 0, 0.15].map((ox, i) => (
            <mesh key={i} position={[ox, y + 0.05, 0.05]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
              <meshStandardMaterial color={["#F44336", "#2196F3", "#FF9800"][row]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function PunchingBag() {
  return (
    <group>
      {/* Chain */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.2, 4]} />
        <meshStandardMaterial color={METAL} metalness={0.8} />
      </mesh>
      {/* Bag */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.6, 12]} />
        <meshStandardMaterial color="#C62828" roughness={0.8} />
      </mesh>
      {/* Bottom cap */}
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#B71C1C" roughness={0.8} />
      </mesh>
    </group>
  );
}

function YogaMat() {
  return (
    <group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.4, 1.0]} />
        <meshStandardMaterial color="#7B1FA2" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.36, 0.96]} />
        <meshStandardMaterial color="#9C27B0" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function KanbanBoard() {
  return (
    <group>
      {/* Board */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.0, 0.6, 0.03]} />
        <meshStandardMaterial color="#263238" />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 0.7, -0.02]}>
        <boxGeometry args={[1.04, 0.64, 0.02]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      {/* Column dividers */}
      {[-0.33, 0.33].map((ox, i) => (
        <mesh key={i} position={[ox, 0.7, 0.016]}>
          <boxGeometry args={[0.005, 0.55, 0.005]} />
          <meshStandardMaterial color="#546E7A" />
        </mesh>
      ))}
      {/* Header labels */}
      {[
        { x: -0.5, color: "#F44336" },
        { x: 0, color: "#FFC107" },
        { x: 0.5, color: "#4CAF50" },
      ].map((col, i) => (
        <mesh key={i} position={[col.x, 0.95, 0.02]}>
          <boxGeometry args={[0.28, 0.06, 0.005]} />
          <meshStandardMaterial color={col.color} emissive={col.color} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Sticky notes */}
      {[
        [-0.5, 0.82], [-0.5, 0.7], [-0.5, 0.58],
        [0, 0.82], [0, 0.7],
        [0.5, 0.82],
      ].map(([x, y], i) => (
        <mesh key={`note-${i}`} position={[x, y, 0.018]}>
          <boxGeometry args={[0.12, 0.08, 0.003]} />
          <meshStandardMaterial color={["#FFEB3B", "#81D4FA", "#A5D6A7", "#FFCC80", "#CE93D8", "#EF9A9A"][i]} />
        </mesh>
      ))}
      {/* Stand legs */}
      <mesh position={[-0.4, 0.35, 0]}>
        <boxGeometry args={[0.03, 0.7, 0.03]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0.4, 0.35, 0]}>
        <boxGeometry args={[0.03, 0.7, 0.03]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
    </group>
  );
}

function NeonSign() {
  return (
    <group>
      {/* Backing plate */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.6, 0.2, 0.02]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>
      {/* Neon tube */}
      <mesh position={[0, 0.7, 0.015]}>
        <boxGeometry args={[0.5, 0.12, 0.01]} />
        <meshStandardMaterial color="#FF1493" emissive="#FF1493" emissiveIntensity={2.0} transparent opacity={0.9} />
      </mesh>
      <pointLight position={[0, 0.7, 0.1]} intensity={0.4} distance={3} color="#FF1493" />
    </group>
  );
}

function Aquarium() {
  return (
    <group>
      {/* Stand */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.3]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      {/* Tank (glass) */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.56, 0.3, 0.26]} />
        <meshStandardMaterial color="#81D4FA" transparent opacity={0.35} />
      </mesh>
      {/* Water */}
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[0.52, 0.22, 0.22]} />
        <meshStandardMaterial color="#29B6F6" transparent opacity={0.4} />
      </mesh>
      {/* Sand */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.52, 0.03, 0.22]} />
        <meshStandardMaterial color="#FFE082" />
      </mesh>
      {/* Plant */}
      <mesh position={[0.15, 0.52, 0]}>
        <boxGeometry args={[0.04, 0.15, 0.04]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      {/* Fish-ish blobs */}
      <mesh position={[-0.1, 0.55, 0.02]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#FF5722" emissive="#FF5722" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.05, 0.58, -0.04]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshStandardMaterial color="#FFD600" emissive="#FFD600" emissiveIntensity={0.4} />
      </mesh>
      {/* Light on top */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.5, 0.03, 0.24]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
      <pointLight position={[0, 0.7, 0]} intensity={0.2} distance={2} color="#81D4FA" />
    </group>
  );
}

function StandingDesk() {
  return (
    <group>
      {/* Desktop */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.8, 0.03, 0.5]} />
        <meshStandardMaterial color={WOOD_LIGHT} />
      </mesh>
      {/* Legs (telescopic) */}
      {[[-0.35, 0], [0.35, 0]].map(([lx, lz], i) => (
        <group key={i}>
          <mesh position={[lx, 0.33, lz - 0.18]}>
            <boxGeometry args={[0.04, 0.66, 0.04]} />
            <meshStandardMaterial color={METAL} />
          </mesh>
          <mesh position={[lx, 0.33, lz + 0.18]}>
            <boxGeometry args={[0.04, 0.66, 0.04]} />
            <meshStandardMaterial color={METAL} />
          </mesh>
        </group>
      ))}
      {/* Monitor */}
      <mesh position={[0, 0.85, -0.12]}>
        <boxGeometry args={[0.35, 0.22, 0.02]} />
        <meshStandardMaterial color={SCREEN_OFF} />
      </mesh>
      <mesh position={[0, 0.85, -0.11]}>
        <boxGeometry args={[0.3, 0.18, 0.01]} />
        <meshStandardMaterial color={SCREEN_ON} emissive={SCREEN_ON} emissiveIntensity={0.4} />
      </mesh>
      {/* Keyboard */}
      <mesh position={[0, 0.67, 0.08]}>
        <boxGeometry args={[0.22, 0.008, 0.07]} />
        <meshStandardMaterial color={METAL_DARK} />
      </mesh>
    </group>
  );
}

function CouchL() {
  return (
    <group>
      {/* Long section */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.0, 0.2, 0.45]} />
        <meshStandardMaterial color={FABRIC_BLUE} />
      </mesh>
      <mesh position={[0, 0.35, -0.18]}>
        <boxGeometry args={[1.0, 0.25, 0.1]} />
        <meshStandardMaterial color={FABRIC_BLUE} />
      </mesh>
      {/* L extension */}
      <mesh position={[0.55, 0.15, 0.3]}>
        <boxGeometry args={[0.4, 0.2, 0.45]} />
        <meshStandardMaterial color={FABRIC_BLUE} />
      </mesh>
      <mesh position={[0.72, 0.35, 0.3]}>
        <boxGeometry args={[0.08, 0.25, 0.45]} />
        <meshStandardMaterial color={FABRIC_BLUE} />
      </mesh>
      {/* Cushions */}
      {[-0.25, 0.1, 0.45].map((ox, i) => (
        <mesh key={i} position={[ox, 0.27, 0.03]}>
          <boxGeometry args={[0.28, 0.05, 0.32]} />
          <meshStandardMaterial color="#5C6BC0" />
        </mesh>
      ))}
      {/* Throw pillows */}
      <mesh position={[-0.38, 0.32, -0.1]}>
        <boxGeometry args={[0.12, 0.12, 0.08]} />
        <meshStandardMaterial color="#FF7043" />
      </mesh>
      <mesh position={[0.55, 0.32, 0.45]}>
        <boxGeometry args={[0.1, 0.1, 0.08]} />
        <meshStandardMaterial color="#66BB6A" />
      </mesh>
    </group>
  );
}

function MeetingChair() {
  return (
    <group>
      {/* Seat - padded */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.22, 0.04, 0.22]} />
        <meshStandardMaterial color={FABRIC_BLUE} />
      </mesh>
      {/* Backrest - padded */}
      <mesh position={[0, 0.45, -0.1]}>
        <boxGeometry args={[0.22, 0.28, 0.03]} />
        <meshStandardMaterial color={FABRIC_BLUE} />
      </mesh>
      {/* Chrome legs */}
      {[[-0.08, -0.12], [0.08, -0.12], [-0.08, 0.08], [0.08, 0.08]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.13, lz]}>
          <cylinderGeometry args={[0.01, 0.01, 0.26, 6]} />
          <meshStandardMaterial color="#B0BEC5" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
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
