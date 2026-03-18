import { memo, useMemo } from "react";
import * as THREE from "three";

/**
 * MagicaVoxel-style 3D pixel art buildings for the city scene.
 * Inspired by https://www.behance.net/gallery/58526505/3D-Pixel-Art-01
 * Each building is procedurally generated based on a seed index.
 */

// ── Building type configs ──
interface VoxelBuildingConfig {
  name: string;
  wallColor: string;
  trimColor: string;
  awningColor: string;
  awningStripe: string;
  signColor: string;
  signEmissive: string;
  roofColor: string;
  roofType: "flat" | "peaked" | "terrace" | "water_tower" | "ac_units";
  hasAwning: boolean;
  hasBalcony: boolean;
  hasSignboard: boolean;
  hasSideDecor: boolean;
  windowGlow: string;
  groundFloorType: "cafe" | "shop" | "garage" | "office" | "bar";
}

const BUILDING_CONFIGS: VoxelBuildingConfig[] = [
  {
    name: "Cafe", wallColor: "#8B4533", trimColor: "#5A2D1A", awningColor: "#D4A030", awningStripe: "#FFFFFF",
    signColor: "#FFD060", signEmissive: "#FFD060", roofColor: "#4A3528", roofType: "terrace",
    hasAwning: true, hasBalcony: true, hasSignboard: true, hasSideDecor: true,
    windowGlow: "#FFE4A8", groundFloorType: "cafe",
  },
  {
    name: "Books", wallColor: "#6B5A4A", trimColor: "#4A3A2A", awningColor: "#C94040", awningStripe: "#FFE8E8",
    signColor: "#FF6060", signEmissive: "#FF4040", roofColor: "#3A3A3A", roofType: "flat",
    hasAwning: true, hasBalcony: false, hasSignboard: true, hasSideDecor: false,
    windowGlow: "#AADDFF", groundFloorType: "shop",
  },
  {
    name: "Studio", wallColor: "#5A6A7A", trimColor: "#3A4A5A", awningColor: "#40A060", awningStripe: "#DDFFDD",
    signColor: "#60FF90", signEmissive: "#40D070", roofColor: "#2A3A2A", roofType: "peaked",
    hasAwning: false, hasBalcony: true, hasSignboard: true, hasSideDecor: true,
    windowGlow: "#BBFFBB", groundFloorType: "office",
  },
  {
    name: "Bar", wallColor: "#4A3040", trimColor: "#2A1A28", awningColor: "#8040A0", awningStripe: "#E0C0FF",
    signColor: "#D060FF", signEmissive: "#A040D0", roofColor: "#2A2030", roofType: "water_tower",
    hasAwning: true, hasBalcony: false, hasSignboard: true, hasSideDecor: true,
    windowGlow: "#FFB0D0", groundFloorType: "bar",
  },
  {
    name: "Ramen", wallColor: "#7A5030", trimColor: "#5A3A20", awningColor: "#E0E0E0", awningStripe: "#4040A0",
    signColor: "#FF8040", signEmissive: "#FF6020", roofColor: "#4A4030", roofType: "ac_units",
    hasAwning: true, hasBalcony: true, hasSignboard: true, hasSideDecor: false,
    windowGlow: "#FFD4A0", groundFloorType: "cafe",
  },
  {
    name: "Tech", wallColor: "#3A4A5A", trimColor: "#2A3040", awningColor: "#30A0D0", awningStripe: "#FFFFFF",
    signColor: "#40D0FF", signEmissive: "#20B0E0", roofColor: "#2A2A3A", roofType: "flat",
    hasAwning: false, hasBalcony: true, hasSignboard: true, hasSideDecor: true,
    windowGlow: "#80D0FF", groundFloorType: "office",
  },
  {
    name: "Bakery", wallColor: "#9A7A5A", trimColor: "#7A5A3A", awningColor: "#FF8080", awningStripe: "#FFFFFF",
    signColor: "#FFAA60", signEmissive: "#FF8840", roofColor: "#5A4A3A", roofType: "peaked",
    hasAwning: true, hasBalcony: false, hasSignboard: true, hasSideDecor: false,
    windowGlow: "#FFE0B0", groundFloorType: "shop",
  },
  {
    name: "Music", wallColor: "#3A3A4A", trimColor: "#2A2A3A", awningColor: "#FF4080", awningStripe: "#FFD0E0",
    signColor: "#FF40FF", signEmissive: "#D020D0", roofColor: "#1A1A2A", roofType: "terrace",
    hasAwning: true, hasBalcony: true, hasSignboard: true, hasSideDecor: true,
    windowGlow: "#FF80FF", groundFloorType: "bar",
  },
];

// ── Sub-components ──

function VoxelWindows({ y, w, d, glowColor, count = 3 }: {
  y: number; w: number; d: number; glowColor: string; count?: number;
}) {
  const winW = w * 0.18;
  const winH = 0.28;
  const spacing = w / (count + 1);

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const xOff = -w / 2 + spacing * (i + 1);
        return (
          <group key={i}>
            {/* Frame */}
            <mesh position={[xOff, y, d / 2 + 0.01]}>
              <boxGeometry args={[winW + 0.04, winH + 0.04, 0.02]} />
              <meshStandardMaterial color="#1a1a2e" />
            </mesh>
            {/* Glass */}
            <mesh position={[xOff, y, d / 2 + 0.02]}>
              <boxGeometry args={[winW, winH, 0.02]} />
              <meshStandardMaterial color="#0a0a15" emissive={glowColor} emissiveIntensity={0.8} />
            </mesh>
            {/* Cross divider */}
            <mesh position={[xOff, y, d / 2 + 0.025]}>
              <boxGeometry args={[0.015, winH, 0.01]} />
              <meshStandardMaterial color="#2a2a3e" />
            </mesh>
            <mesh position={[xOff, y, d / 2 + 0.025]}>
              <boxGeometry args={[winW, 0.015, 0.01]} />
              <meshStandardMaterial color="#2a2a3e" />
            </mesh>
            {/* Back window (simpler) */}
            <mesh position={[xOff, y, -d / 2 - 0.01]}>
              <boxGeometry args={[winW, winH, 0.02]} />
              <meshStandardMaterial color="#0a0a15" emissive={glowColor} emissiveIntensity={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function VoxelAwning({ w, d, color, stripe }: { w: number; d: number; color: string; stripe: string }) {
  return (
    <group position={[0, 0.85, d / 2 + 0.2]}>
      {/* Main canopy - stepped for voxel look */}
      <mesh>
        <boxGeometry args={[w * 0.92, 0.05, 0.45]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.05, 0.06]}>
        <boxGeometry args={[w * 0.92, 0.05, 0.32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Stripes */}
      {[-2, -1, 0, 1, 2].map(i => (
        <mesh key={i} position={[i * w * 0.15, 0.026, 0]}>
          <boxGeometry args={[w * 0.08, 0.008, 0.47]} />
          <meshStandardMaterial color={stripe} transparent opacity={0.6} />
        </mesh>
      ))}
      {/* Valance (hanging edge) */}
      <mesh position={[0, -0.08, 0.2]}>
        <boxGeometry args={[w * 0.92, 0.06, 0.02]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Scalloped edge */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`sc-${i}`} position={[-w * 0.38 + i * w * 0.15, -0.12, 0.2]}>
          <boxGeometry args={[w * 0.08, 0.04, 0.02]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      {/* Support brackets */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * w * 0.42, -0.15, 0.1]}>
          <boxGeometry args={[0.03, 0.25, 0.03]} />
          <meshStandardMaterial color="#333" metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function VoxelSignboard({ w, d, name, color, emissive }: {
  w: number; d: number; name: string; color: string; emissive: string;
}) {
  return (
    <group position={[0, 0.55, d / 2 + 0.01]}>
      {/* Sign backing */}
      <mesh>
        <boxGeometry args={[w * 0.7, 0.22, 0.04]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Sign border */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[w * 0.72, 0.24, 0.01]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} />
      </mesh>
      {/* Inner sign face */}
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[w * 0.65, 0.16, 0.01]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function VoxelStorefront({ w, d, type, trimColor }: {
  w: number; d: number; type: string; trimColor: string;
}) {
  const doorColor = type === "bar" ? "#2A1A2A" : "#3A2A1A";
  const windowEmissive = type === "bar" ? "#FF80A0" : type === "cafe" ? "#FFCC80" : "#AADDFF";

  return (
    <group>
      {/* Large storefront window */}
      <mesh position={[-w * 0.15, 0.42, d / 2 + 0.01]}>
        <boxGeometry args={[w * 0.5, 0.55, 0.02]} />
        <meshStandardMaterial color="#0a0a15" emissive={windowEmissive} emissiveIntensity={0.6} />
      </mesh>
      {/* Window frame */}
      <mesh position={[-w * 0.15, 0.42, d / 2 + 0.015]}>
        <boxGeometry args={[w * 0.52, 0.57, 0.01]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>
      {/* Window mullions */}
      <mesh position={[-w * 0.15, 0.42, d / 2 + 0.02]}>
        <boxGeometry args={[0.02, 0.55, 0.01]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>
      {/* Door */}
      <mesh position={[w * 0.28, 0.32, d / 2 + 0.02]}>
        <boxGeometry args={[0.28, 0.58, 0.03]} />
        <meshStandardMaterial color={doorColor} />
      </mesh>
      {/* Door frame */}
      <mesh position={[w * 0.28, 0.32, d / 2 + 0.025]}>
        <boxGeometry args={[0.32, 0.62, 0.01]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>
      {/* Door handle */}
      <mesh position={[w * 0.23, 0.32, d / 2 + 0.04]}>
        <boxGeometry args={[0.03, 0.04, 0.03]} />
        <meshStandardMaterial color="#D4A030" metalness={0.8} />
      </mesh>
      {/* Step */}
      <mesh position={[w * 0.28, 0.02, d / 2 + 0.12]}>
        <boxGeometry args={[0.4, 0.04, 0.1]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Doormat */}
      <mesh position={[w * 0.28, 0.04, d / 2 + 0.16]}>
        <boxGeometry args={[0.25, 0.01, 0.06]} />
        <meshStandardMaterial color="#5A4A30" />
      </mesh>
    </group>
  );
}

function VoxelBalcony({ w, d, y }: { w: number; d: number; y: number }) {
  return (
    <group position={[0, y, d / 2 + 0.12]}>
      {/* Platform */}
      <mesh>
        <boxGeometry args={[w * 0.45, 0.04, 0.24]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Railings */}
      {[-2, -1, 0, 1, 2].map(i => (
        <mesh key={i} position={[i * w * 0.08, 0.1, 0.1]}>
          <boxGeometry args={[0.03, 0.16, 0.03]} />
          <meshStandardMaterial color="#444" metalness={0.5} />
        </mesh>
      ))}
      {/* Top rail */}
      <mesh position={[0, 0.18, 0.1]}>
        <boxGeometry args={[w * 0.45, 0.03, 0.03]} />
        <meshStandardMaterial color="#444" metalness={0.5} />
      </mesh>
      {/* Plant pot */}
      <mesh position={[0, 0.07, 0.02]}>
        <boxGeometry args={[0.12, 0.08, 0.1]} />
        <meshStandardMaterial color="#8B5E3C" />
      </mesh>
      <mesh position={[0, 0.14, 0.02]}>
        <boxGeometry args={[0.15, 0.08, 0.12]} />
        <meshStandardMaterial color="#2D7A3A" />
      </mesh>
    </group>
  );
}

function VoxelRoof({ type, w, d, h, color }: {
  type: string; w: number; d: number; h: number; color: string;
}) {
  switch (type) {
    case "peaked":
      return (
        <group position={[0, h, 0]}>
          {[0, 1, 2, 3].map(step => (
            <mesh key={step} position={[0, step * 0.1 + 0.06, 0]}>
              <boxGeometry args={[w - step * 0.3, 0.1, d - step * 0.3]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
          ))}
        </group>
      );
    case "terrace":
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[w + 0.15, 0.1, d + 0.15]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {/* Terrace fence */}
          {[-1, 1].map(side => (
            <mesh key={`f${side}`} position={[side * w * 0.45, 0.2, 0]}>
              <boxGeometry args={[0.04, 0.25, d * 0.8]} />
              <meshStandardMaterial color="#555" />
            </mesh>
          ))}
          {/* Plants */}
          {[[-0.3, 0.22, -0.2], [0.2, 0.2, 0.3]].map(([x, y, z], i) => (
            <group key={i}>
              <mesh position={[x, y, z]}>
                <boxGeometry args={[0.15, 0.12, 0.15]} />
                <meshStandardMaterial color="#6A4A30" />
              </mesh>
              <mesh position={[x, y + 0.12, z]}>
                <boxGeometry args={[0.2, 0.15, 0.2]} />
                <meshStandardMaterial color="#2D7A3A" />
              </mesh>
            </group>
          ))}
          {/* String lights */}
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={`sl-${i}`} position={[-w * 0.35 + i * w * 0.18, 0.3, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.04]} />
              <meshStandardMaterial color="#FFE060" emissive="#FFD040" emissiveIntensity={1.5} />
            </mesh>
          ))}
        </group>
      );
    case "water_tower":
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[w + 0.1, 0.1, d + 0.1]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Water tower legs */}
          {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.3, z]}>
              <boxGeometry args={[0.04, 0.4, 0.04]} />
              <meshStandardMaterial color="#5A4A3A" />
            </mesh>
          ))}
          {/* Tank */}
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.5, 0.3, 0.5]} />
            <meshStandardMaterial color="#6A6A6A" metalness={0.3} />
          </mesh>
          {/* Cone top */}
          <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[0.35, 0.1, 0.35]} />
            <meshStandardMaterial color="#5A5A5A" />
          </mesh>
          <mesh position={[0, 0.82, 0]}>
            <boxGeometry args={[0.2, 0.06, 0.2]} />
            <meshStandardMaterial color="#4A4A4A" />
          </mesh>
        </group>
      );
    case "ac_units":
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[w + 0.1, 0.1, d + 0.1]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {/* AC units */}
          {[[-0.4, -0.2], [0.3, 0.2]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.2, z]}>
              <boxGeometry args={[0.3, 0.2, 0.25]} />
              <meshStandardMaterial color="#888" />
            </mesh>
          ))}
          {/* Antenna */}
          <mesh position={[0.4, 0.5, -0.3]}>
            <boxGeometry args={[0.04, 0.8, 0.04]} />
            <meshStandardMaterial color="#555" metalness={0.6} />
          </mesh>
          <mesh position={[0.4, 0.92, -0.3]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#FF3030" emissive="#FF3030" emissiveIntensity={1.5} />
          </mesh>
        </group>
      );
    default: // flat
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[w + 0.12, 0.08, d + 0.12]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {/* Edge trim */}
          {[
            [0, 0.1, d / 2 + 0.04, w + 0.12, 0.06, 0.04],
            [0, 0.1, -d / 2 - 0.04, w + 0.12, 0.06, 0.04],
            [w / 2 + 0.04, 0.1, 0, 0.04, 0.06, d],
            [-w / 2 - 0.04, 0.1, 0, 0.04, 0.06, d],
          ].map(([x, y, z, bw, bh, bd], i) => (
            <mesh key={i} position={[x, y, z]}>
              <boxGeometry args={[bw, bh, bd]} />
              <meshStandardMaterial color="#444" />
            </mesh>
          ))}
        </group>
      );
  }
}

function VoxelSideDetails({ w, d, h }: { w: number; d: number; h: number }) {
  return (
    <group>
      {/* Pipe */}
      <mesh position={[-w / 2 - 0.03, h * 0.45, -d * 0.15]}>
        <boxGeometry args={[0.05, h * 0.75, 0.05]} />
        <meshStandardMaterial color="#555" metalness={0.5} />
      </mesh>
      {/* Pipe brackets */}
      {[0.3, 0.6].map(frac => (
        <mesh key={frac} position={[-w / 2 - 0.01, h * frac, -d * 0.15]}>
          <boxGeometry args={[0.08, 0.03, 0.08]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      ))}
      {/* Side vent */}
      <mesh position={[w / 2 + 0.02, h * 0.55, 0]}>
        <boxGeometry args={[0.03, 0.2, 0.3]} />
        <meshStandardMaterial color="#3A3A3A" />
      </mesh>
      {/* Side sign/poster */}
      <mesh position={[w / 2 + 0.02, h * 0.35, d * 0.2]}>
        <boxGeometry args={[0.02, 0.2, 0.15]} />
        <meshStandardMaterial color="#6A5A40" />
      </mesh>
    </group>
  );
}

function VoxelStreetDecor({ w, d, side }: { w: number; d: number; side: number }) {
  return (
    <group>
      {/* Trash can */}
      <mesh position={[side * (w / 2 + 0.25), 0.1, d / 2 - 0.2]}>
        <boxGeometry args={[0.12, 0.2, 0.12]} />
        <meshStandardMaterial color="#4A4A4A" />
      </mesh>
      {/* A-frame sign */}
      {side > 0 && (
        <group position={[w / 2 + 0.4, 0, d / 2 + 0.3]}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.2, 0.3, 0.04]} />
            <meshStandardMaterial color="#2A2A2A" />
          </mesh>
          <mesh position={[0, 0.15, 0.01]}>
            <boxGeometry args={[0.16, 0.22, 0.02]} />
            <meshStandardMaterial color="#E8D8B0" />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Main component ──
interface VoxelCityBuildingProps {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  seed: number;
  occluded?: boolean;
}

export const VoxelCityBuilding = memo(function VoxelCityBuilding({
  x, z, w, d, h, color, seed, occluded,
}: VoxelCityBuildingProps) {
  const config = BUILDING_CONFIGS[seed % BUILDING_CONFIGS.length];
  const floors = Math.max(Math.floor(h / 0.65), 2);
  const floorH = (h - 0.8) / floors; // ground floor takes 0.8

  const wallColor = useMemo(() => {
    // Blend the building's original color hint with the config's wall color
    const c = new THREE.Color(config.wallColor);
    c.lerp(new THREE.Color(color), 0.2);
    return c;
  }, [config.wallColor, color]);

  const darkerWall = useMemo(() => new THREE.Color(wallColor).multiplyScalar(0.7), [wallColor]);

  if (occluded) {
    return (
      <group position={[x, 0, z]}>
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={wallColor} transparent opacity={0.12} roughness={0.85} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[x, 0, z]}>
      {/* ── Ground floor (darker base) ── */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[w, 0.8, d]} />
        <meshStandardMaterial color={darkerWall} roughness={0.8} />
      </mesh>

      {/* ── Storefront ── */}
      <VoxelStorefront w={w} d={d} type={config.groundFloorType} trimColor={config.trimColor} />

      {/* ── Upper floors body ── */}
      <mesh position={[0, 0.8 + (h - 0.8) / 2, 0]} castShadow>
        <boxGeometry args={[w, h - 0.8, d]} />
        <meshStandardMaterial color={wallColor} roughness={0.75} metalness={0.08} />
      </mesh>

      {/* ── Floor separator bands ── */}
      {Array.from({ length: floors }).map((_, i) => (
        <mesh key={`sep-${i}`} position={[0, 0.8 + (i + 1) * floorH, d / 2 + 0.005]}>
          <boxGeometry args={[w + 0.03, 0.03, 0.015]} />
          <meshStandardMaterial color={config.trimColor} />
        </mesh>
      ))}

      {/* ── Windows per floor ── */}
      {Array.from({ length: Math.min(floors, 4) }).map((_, floor) => (
        <VoxelWindows
          key={floor}
          y={0.8 + floor * floorH + floorH * 0.55}
          w={w}
          d={d}
          glowColor={config.windowGlow}
          count={Math.max(2, Math.floor(w / 0.8))}
        />
      ))}

      {/* ── Awning ── */}
      {config.hasAwning && (
        <VoxelAwning w={w} d={d} color={config.awningColor} stripe={config.awningStripe} />
      )}

      {/* ── Signboard ── */}
      {config.hasSignboard && (
        <VoxelSignboard
          w={w}
          d={d}
          name={config.name}
          color={config.signColor}
          emissive={config.signEmissive}
        />
      )}

      {/* ── Balcony on upper floor ── */}
      {config.hasBalcony && floors >= 2 && (
        <VoxelBalcony w={w} d={d} y={0.8 + floorH * 1.15} />
      )}

      {/* ── Roof ── */}
      <VoxelRoof type={config.roofType} w={w} d={d} h={h} color={config.roofColor} />

      {/* ── Side details ── */}
      {config.hasSideDecor && <VoxelSideDetails w={w} d={d} h={h} />}

      {/* ── Street-level decoration ── */}
      <VoxelStreetDecor w={w} d={d} side={seed % 2 === 0 ? 1 : -1} />
    </group>
  );
});
