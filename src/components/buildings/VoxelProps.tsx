import { memo, useMemo } from "react";
import * as THREE from "three";

/**
 * Deterministic hash for variety
 */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ── Potted Plant ──
export function PottedPlant({ position, scale = 1, variant = 0 }: { position: [number, number, number]; scale?: number; variant?: number }) {
  const colors = ["#2d7a3a", "#1B6B2A", "#3A8B3A", "#1A5A2A"];
  const potColors = ["#8B5E3C", "#A0522D", "#6B4226", "#C97A4A"];
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.18, 0.16, 0.18]} />
        <meshStandardMaterial color={potColors[variant % potColors.length]} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.22, 0.18, 0.22]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={0.85} />
      </mesh>
      {variant % 3 === 0 && (
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.14, 0.1, 0.14]} />
          <meshStandardMaterial color={colors[(variant + 1) % colors.length]} roughness={0.85} />
        </mesh>
      )}
    </group>
  );
}

// ── Street Bench ──
export function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Legs */}
      {[[-0.25, 0], [0.25, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.12, z]}>
          <boxGeometry args={[0.04, 0.24, 0.22]} />
          <meshStandardMaterial color="#333" metalness={0.6} />
        </mesh>
      ))}
      {/* Seat */}
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[0.6, 0.04, 0.22]} />
        <meshStandardMaterial color="#6B4226" roughness={0.85} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.38, -0.09]}>
        <boxGeometry args={[0.6, 0.2, 0.04]} />
        <meshStandardMaterial color="#6B4226" roughness={0.85} />
      </mesh>
    </group>
  );
}

// ── Trash Can ──
export function TrashCan({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.14, 0.24, 0.14]} />
        <meshStandardMaterial color="#4A4A4A" metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[0.16, 0.04, 0.16]} />
        <meshStandardMaterial color="#555" metalness={0.5} />
      </mesh>
    </group>
  );
}

// ── Fire Hydrant ──
export function Hydrant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.12, 0.04, 0.12]} />
        <meshStandardMaterial color="#CC2222" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.08, 0.18, 0.08]} />
        <meshStandardMaterial color="#DD3333" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.1, 0.06, 0.1]} />
        <meshStandardMaterial color="#CC2222" roughness={0.7} />
      </mesh>
      {/* Side nozzles */}
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * 0.07, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.04, 0.04]} />
          <meshStandardMaterial color="#AA2222" metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ── Newspaper Box ──
export function NewspaperBox({ position, color = "#2255AA" }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.18, 0.32, 0.14]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Window */}
      <mesh position={[0, 0.22, 0.072]}>
        <boxGeometry args={[0.12, 0.1, 0.01]} />
        <meshStandardMaterial color="#88CCFF" emissive="#88CCFF" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// ── Parked Car (voxel style) ──
export function VoxelCar({ position, rotation = 0, color = "#3366CC" }: { position: [number, number, number]; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body bottom */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.7, 0.14, 0.32]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.02, 0.24, 0]}>
        <boxGeometry args={[0.4, 0.12, 0.28]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Windows */}
      {[-1, 1].map(s => (
        <mesh key={s} position={[0.02, 0.25, s * 0.145]}>
          <boxGeometry args={[0.34, 0.08, 0.01]} />
          <meshStandardMaterial color="#88BBDD" emissive="#88BBDD" emissiveIntensity={0.15} />
        </mesh>
      ))}
      {/* Windshield */}
      <mesh position={[0.21, 0.25, 0]}>
        <boxGeometry args={[0.01, 0.08, 0.24]} />
        <meshStandardMaterial color="#88BBDD" emissive="#88BBDD" emissiveIntensity={0.15} />
      </mesh>
      {/* Wheels */}
      {[[-0.22, -1], [-0.22, 1], [0.22, -1], [0.22, 1]].map(([x, s], i) => (
        <mesh key={i} position={[x, 0.04, (s as number) * 0.17]}>
          <boxGeometry args={[0.1, 0.08, 0.04]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      ))}
      {/* Headlights */}
      {[-1, 1].map(s => (
        <mesh key={`hl-${s}`} position={[0.36, 0.14, s * 0.12]}>
          <boxGeometry args={[0.02, 0.04, 0.06]} />
          <meshStandardMaterial color="#FFDD44" emissive="#FFDD44" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* Taillights */}
      {[-1, 1].map(s => (
        <mesh key={`tl-${s}`} position={[-0.36, 0.14, s * 0.12]}>
          <boxGeometry args={[0.02, 0.04, 0.06]} />
          <meshStandardMaterial color="#FF3333" emissive="#FF3333" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ── Sidewalk Section ──
export function Sidewalk({ position, width = 2, depth = 0.6 }: { position: [number, number, number]; width?: number; depth?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[width, 0.04, depth]} />
        <meshStandardMaterial color="hsl(220, 12%, 28%)" roughness={0.95} />
      </mesh>
      {/* Curb */}
      <mesh position={[0, 0.04, depth / 2]}>
        <boxGeometry args={[width, 0.06, 0.06]} />
        <meshStandardMaterial color="hsl(220, 10%, 32%)" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Street Lamp (enhanced) ──
export function StreetLamp({ position, lightIntensity = 0 }: { position: [number, number, number]; lightIntensity?: number }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.12, 0.08, 0.12]} />
        <meshStandardMaterial color="#2A2A2A" metalness={0.7} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.04, 2.0, 0.04]} />
        <meshStandardMaterial color="#2A2A2A" metalness={0.7} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.15, 2.05, 0]}>
        <boxGeometry args={[0.3, 0.04, 0.04]} />
        <meshStandardMaterial color="#2A2A2A" metalness={0.7} />
      </mesh>
      {/* Lamp */}
      <mesh position={[0.28, 2.0, 0]}>
        <boxGeometry args={[0.1, 0.06, 0.1]} />
        <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={2.0} />
      </mesh>
      {lightIntensity > 0 && (
        <pointLight position={[0.28, 1.9, 0]} color="#FFD060" intensity={lightIntensity} distance={8} decay={2} />
      )}
    </group>
  );
}

// ── Mailbox ──
export function Mailbox({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.06, 0.24, 0.06]} />
        <meshStandardMaterial color="#444" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.14, 0.1, 0.1]} />
        <meshStandardMaterial color="#2244AA" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ── Parking Meter ──
export function ParkingMeter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.04, 0.4, 0.04]} />
        <meshStandardMaterial color="#555" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.08, 0.08, 0.06]} />
        <meshStandardMaterial color="#666" metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.44, 0.035]}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
        <meshStandardMaterial color="#44AA44" emissive="#44AA44" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ── AC Unit (wall-mounted) ──
export function ACUnit({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.28, 0.18, 0.12]} />
        <meshStandardMaterial color="#CCCCCC" roughness={0.7} />
      </mesh>
      {/* Vent slats */}
      {[-0.04, 0, 0.04].map((y, i) => (
        <mesh key={i} position={[0, y, 0.065]}>
          <boxGeometry args={[0.22, 0.02, 0.01]} />
          <meshStandardMaterial color="#999" />
        </mesh>
      ))}
    </group>
  );
}

// ── Water Tank (rooftop) ──
export function WaterTank({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Legs */}
      {[[-0.08, -0.06], [-0.08, 0.06], [0.08, -0.06], [0.08, 0.06]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.06, z]}>
          <boxGeometry args={[0.03, 0.12, 0.03]} />
          <meshStandardMaterial color="#555" metalness={0.4} />
        </mesh>
      ))}
      {/* Tank body */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.16]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.22, 0.03, 0.18]} />
        <meshStandardMaterial color="#6B5B45" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Solar Panel (rooftop) ──
export function SolarPanel({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0.3, rotation, 0]}>
      <mesh>
        <boxGeometry args={[0.4, 0.02, 0.3]} />
        <meshStandardMaterial color="#223355" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Grid lines */}
      {[-0.1, 0, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.012, 0]}>
          <boxGeometry args={[0.01, 0.01, 0.28]} />
          <meshStandardMaterial color="#334466" />
        </mesh>
      ))}
    </group>
  );
}

// ── Sign/Billboard (wall-mounted) ──
export function WallSign({ position, text, color = "#FF6633", bgColor = "#1A1A1A" }: { position: [number, number, number]; text: string; color?: string; bgColor?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[0.6, 0.2, 0.04]} />
        <meshStandardMaterial color={bgColor} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.5, 0.12, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

// ── Flower Box (window decoration) ──
export function FlowerBox({ position, variant = 0 }: { position: [number, number, number]; variant?: number }) {
  const flowerColors = ["#FF6699", "#FFCC33", "#FF4444", "#CC66FF", "#FF8844"];
  return (
    <group position={position}>
      {/* Box */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.06, 0.08]} />
        <meshStandardMaterial color="#6B4226" roughness={0.9} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.26, 0.02, 0.06]} />
        <meshStandardMaterial color="#3A2A1A" />
      </mesh>
      {/* Flowers */}
      {[-0.08, 0, 0.08].map((x, i) => (
        <mesh key={i} position={[x, 0.08, 0]}>
          <boxGeometry args={[0.05, 0.06, 0.05]} />
          <meshStandardMaterial color={flowerColors[(variant + i) % flowerColors.length]} />
        </mesh>
      ))}
    </group>
  );
}

// ── Cafe Table ──
export function CafeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table leg */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.04, 0.28, 0.04]} />
        <meshStandardMaterial color="#444" metalness={0.5} />
      </mesh>
      {/* Table top */}
      <mesh position={[0, 0.29, 0]}>
        <boxGeometry args={[0.3, 0.03, 0.3]} />
        <meshStandardMaterial color="#DDD" roughness={0.6} />
      </mesh>
      {/* Chairs */}
      {[-1, 1].map(s => (
        <group key={s} position={[s * 0.22, 0, 0]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.04, 0.2, 0.04]} />
            <meshStandardMaterial color="#555" metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.15, 0.03, 0.15]} />
            <meshStandardMaterial color="#555" metalness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Dumpster ──
export function Dumpster({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.4, 0.28, 0.24]} />
        <meshStandardMaterial color="#2A5A2A" roughness={0.8} />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.42, 0.03, 0.26]} />
        <meshStandardMaterial color="#1A4A1A" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Generate deterministic props around a building based on its ID
 */
export function useBuildingProps(buildingId: string, w: number, d: number, h: number) {
  return useMemo(() => {
    const seed = hash(buildingId);
    const props: Array<{ type: string; position: [number, number, number]; rotation?: number; variant?: number; color?: string }> = [];

    // Always add sidewalk props
    if (seed % 3 === 0) props.push({ type: "bench", position: [w / 2 + 0.6, 0, d / 2 + 0.4], rotation: Math.PI / 2 });
    if (seed % 5 !== 0) props.push({ type: "plant", position: [-w / 2 - 0.3, 0, d / 2 + 0.2], variant: seed % 4 });
    if (seed % 7 === 0) props.push({ type: "hydrant", position: [w / 2 + 0.4, 0, -d / 2 - 0.3] });
    if (seed % 4 === 0) props.push({ type: "trash", position: [-w / 2 - 0.4, 0, -d / 2 - 0.2] });
    if (seed % 6 === 0) props.push({ type: "newspaper", position: [w / 2 + 0.3, 0, 0], color: ["#2255AA", "#CC2222", "#228822"][seed % 3] });
    if (seed % 3 !== 2) props.push({ type: "plant", position: [w / 2 + 0.3, 0, d / 2 + 0.2], variant: (seed + 1) % 4 });

    // Wall-mounted details
    if (seed % 2 === 0) props.push({ type: "ac", position: [-w / 2 - 0.07, h * 0.4, 0] });
    if (seed % 3 === 1) props.push({ type: "ac", position: [w / 2 + 0.07, h * 0.6, -d * 0.2] });

    // Flower boxes on windows
    if (seed % 4 < 2) props.push({ type: "flowerbox", position: [0, 0.8 + 1.2, d / 2 + 0.06], variant: seed % 5 });
    if (seed % 5 < 2) props.push({ type: "flowerbox", position: [-w * 0.25, 0.8 + 2.4, d / 2 + 0.06], variant: (seed + 2) % 5 });

    // Rooftop additions
    if (seed % 5 === 0) props.push({ type: "watertank", position: [-w * 0.25, h + 0.15, d * 0.2] });
    if (seed % 7 < 2) props.push({ type: "solar", position: [w * 0.15, h + 0.1, -d * 0.15], rotation: (seed % 4) * Math.PI / 4 });

    // Side alley props
    if (seed % 4 === 0) props.push({ type: "dumpster", position: [-w / 2 - 0.5, 0, -d * 0.3], rotation: (seed % 2) * 0.3 });
    if (seed % 8 === 0) props.push({ type: "mailbox", position: [w / 2 + 0.3, 0, d / 2 + 0.5] });
    if (seed % 6 < 2) props.push({ type: "meter", position: [w / 2 + 0.5, 0, 0.3] });

    // Cafe table for commercial buildings
    if (seed % 5 === 1) props.push({ type: "cafe", position: [0, 0, d / 2 + 0.6] });

    // Wall sign
    if (seed % 3 === 0) props.push({ type: "sign", position: [0, h * 0.45, d / 2 + 0.03], color: ["#FF6633", "#33CCFF", "#FFCC00", "#FF33CC"][seed % 4] });

    return props;
  }, [buildingId, w, d, h]);
}

/**
 * Render all props for a building
 */
export const BuildingProps = memo(function BuildingProps({ props }: { props: ReturnType<typeof useBuildingProps> }) {
  return (
    <group>
      {props.map((p, i) => {
        switch (p.type) {
          case "plant": return <PottedPlant key={i} position={p.position} variant={p.variant} />;
          case "bench": return <Bench key={i} position={p.position} rotation={p.rotation} />;
          case "trash": return <TrashCan key={i} position={p.position} />;
          case "hydrant": return <Hydrant key={i} position={p.position} />;
          case "newspaper": return <NewspaperBox key={i} position={p.position} color={p.color} />;
          case "ac": return <ACUnit key={i} position={p.position} />;
          case "flowerbox": return <FlowerBox key={i} position={p.position} variant={p.variant} />;
          case "watertank": return <WaterTank key={i} position={p.position} />;
          case "solar": return <SolarPanel key={i} position={p.position} rotation={p.rotation} />;
          case "dumpster": return <Dumpster key={i} position={p.position} rotation={p.rotation} />;
          case "mailbox": return <Mailbox key={i} position={p.position} />;
          case "meter": return <ParkingMeter key={i} position={p.position} />;
          case "cafe": return <CafeTable key={i} position={p.position} />;
          case "sign": return <WallSign key={i} position={p.position} text="" color={p.color} />;
          default: return null;
        }
      })}
    </group>
  );
});
