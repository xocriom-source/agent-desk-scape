import { memo, useMemo } from "react";
import * as THREE from "three";

/**
 * Diorama-style 3D voxel buildings for the city.
 * Each building is procedurally unique via a hash-based seed system.
 * Modular blocks: base, walls, windows, doors, awnings, signs, roofs, decor.
 */

// ── Deterministic hash from seed ──
function hash(seed: number, offset = 0): number {
  let h = ((seed + offset) * 2654435761) >>> 0;
  h = ((h ^ (h >> 16)) * 0x45d9f3b) >>> 0;
  h = ((h ^ (h >> 16))) >>> 0;
  return h;
}
function hashF(seed: number, offset = 0): number {
  return (hash(seed, offset) % 10000) / 10000;
}
function hashPick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[hash(seed, offset) % arr.length];
}

// ── Color palettes (warm, vibrant, diorama-like) ──
const WALL_PALETTES = [
  // Warm brick/terracotta
  ["#B85C38", "#A0522D", "#CD853F", "#8B4513"],
  // Cream/beige
  ["#D4C5A9", "#C4B08B", "#BFA980", "#E8DCC8"],
  // Pastel townhouse
  ["#E8B4B8", "#B4D4E8", "#B8E8B4", "#E8D4B4"],
  // Urban gray-blue
  ["#6B7B8D", "#5A6A7D", "#7A8A9D", "#4A5A6D"],
  // Deep burgundy/brown
  ["#6B3A3A", "#5A2A2A", "#7A4A4A", "#4A2020"],
  // Warm yellow/ochre
  ["#D4A040", "#C49030", "#E4B050", "#B48020"],
  // Teal/green
  ["#3A7A6A", "#2A6A5A", "#4A8A7A", "#1A5A4A"],
  // Dusty rose
  ["#C4828A", "#B47280", "#D49298", "#A46270"],
];

const TRIM_COLORS = ["#2A1A10", "#3A2A1A", "#1A1A2A", "#2A2A2A", "#4A3A2A", "#1A2A1A"];
const DOOR_COLORS = ["#3A2A1A", "#2A3A1A", "#4A2A2A", "#2A2A3A", "#5A3A2A", "#1A1A2A"];
const AWNING_COLORS = ["#D4A030", "#C94040", "#40A060", "#8040A0", "#E07030", "#3080C0", "#D06080", "#40B0B0"];
const SIGN_GLOW_COLORS = ["#FFD060", "#FF6060", "#60FF90", "#D060FF", "#FF8040", "#40D0FF", "#FF40A0", "#60FFD0"];
const WINDOW_GLOWS = ["#FFE4A8", "#AADDFF", "#FFD4A0", "#FFB0D0", "#BBFFBB", "#80D0FF", "#FFE0B0", "#FF80FF"];

// ── Shape archetypes (determines silhouette) ──
type ShapeType = "box" | "tower" | "wide" | "L_shape" | "stepped" | "wedge";
const SHAPE_TYPES: ShapeType[] = ["box", "box", "tower", "wide", "L_shape", "stepped", "wedge"];

// ── Roof types ──
type RoofStyle = "flat" | "peaked" | "terrace" | "water_tower" | "dome" | "antenna" | "garden";
const ROOF_STYLES: RoofStyle[] = ["flat", "peaked", "terrace", "water_tower", "dome", "antenna", "garden"];

// ── Ground floor types ──
type GroundType = "cafe" | "shop" | "office" | "bar" | "garage" | "gallery";
const GROUND_TYPES: GroundType[] = ["cafe", "shop", "office", "bar", "garage", "gallery"];

// ── Business names for signs ──
const BUSINESS_NAMES = [
  "CAFÉ", "BOOKS", "TECH", "RAMEN", "ART", "MUSIC", "BAKERY", "BAR",
  "STUDIO", "SHOP", "HUB", "LAB", "DELI", "GYM", "SPA", "PIZZA",
  "TACOS", "TEA", "VINYL", "ARCADE", "PHOTO", "PRINT", "BREW", "SUSHI",
];

// ═══════════════════════════════════════
// MODULAR BUILDING BLOCKS
// ═══════════════════════════════════════

// ── Windows Module ──
function WindowRow({ y, w, d, glow, count, style }: {
  y: number; w: number; d: number; glow: string; count: number; style: number;
}) {
  const winW = style === 0 ? w * 0.16 : w * 0.22;
  const winH = style === 0 ? 0.22 : 0.3;
  const spacing = w / (count + 1);

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const xOff = -w / 2 + spacing * (i + 1);
        return (
          <group key={i}>
            {/* Frame */}
            <mesh position={[xOff, y, d / 2 + 0.01]}>
              <boxGeometry args={[winW + 0.03, winH + 0.03, 0.015]} />
              <meshStandardMaterial color="#1a1a28" />
            </mesh>
            {/* Glass with warm glow */}
            <mesh position={[xOff, y, d / 2 + 0.018]}>
              <boxGeometry args={[winW, winH, 0.01]} />
              <meshStandardMaterial color="#0a0a12" emissive={glow} emissiveIntensity={0.9} />
            </mesh>
            {/* Dividers */}
            {style === 0 && (
              <>
                <mesh position={[xOff, y, d / 2 + 0.022]}>
                  <boxGeometry args={[0.012, winH, 0.005]} />
                  <meshStandardMaterial color="#2a2a38" />
                </mesh>
                <mesh position={[xOff, y, d / 2 + 0.022]}>
                  <boxGeometry args={[winW, 0.012, 0.005]} />
                  <meshStandardMaterial color="#2a2a38" />
                </mesh>
              </>
            )}
            {/* Window sill */}
            <mesh position={[xOff, y - winH / 2 - 0.02, d / 2 + 0.025]}>
              <boxGeometry args={[winW + 0.06, 0.025, 0.03]} />
              <meshStandardMaterial color="#3a3a3a" />
            </mesh>
            {/* Back window (simpler) */}
            <mesh position={[xOff, y, -d / 2 - 0.01]}>
              <boxGeometry args={[winW * 0.8, winH * 0.8, 0.01]} />
              <meshStandardMaterial color="#0a0a12" emissive={glow} emissiveIntensity={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Awning Module ──
function Awning({ w, d, color, hasStripes }: { w: number; d: number; color: string; hasStripes: boolean }) {
  const stripeColor = new THREE.Color(color).lerp(new THREE.Color("#FFFFFF"), 0.7).getStyle();
  return (
    <group position={[0, 0.82, d / 2 + 0.18]}>
      {/* Canopy layers (stepped voxel) */}
      <mesh><boxGeometry args={[w * 0.88, 0.04, 0.4]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, -0.04, 0.05]}>
        <boxGeometry args={[w * 0.88, 0.04, 0.28]} /><meshStandardMaterial color={color} />
      </mesh>
      {/* Stripes */}
      {hasStripes && [-2, -1, 0, 1, 2].map(i => (
        <mesh key={i} position={[i * w * 0.14, 0.022, 0]}>
          <boxGeometry args={[w * 0.065, 0.005, 0.42]} />
          <meshStandardMaterial color={stripeColor} transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Scalloped edge */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`sc-${i}`} position={[-w * 0.32 + i * w * 0.16, -0.1, 0.16]}>
          <boxGeometry args={[w * 0.07, 0.035, 0.015]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      {/* Brackets */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * w * 0.4, -0.12, 0.08]}>
          <boxGeometry args={[0.025, 0.2, 0.025]} />
          <meshStandardMaterial color="#333" metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── Signboard Module ──
function Signboard({ w, d, glowColor, style }: {
  w: number; d: number; glowColor: string; style: number;
}) {
  if (style === 0) {
    // Flat sign above door
    return (
      <group position={[0, 0.55, d / 2 + 0.01]}>
        <mesh><boxGeometry args={[w * 0.65, 0.18, 0.03]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, 0, 0.018]}>
          <boxGeometry args={[w * 0.6, 0.13, 0.008]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.0} />
        </mesh>
      </group>
    );
  }
  // Hanging sign (perpendicular)
  return (
    <group position={[w / 2 + 0.08, 0.7, 0]}>
      {/* Bracket */}
      <mesh position={[-0.04, 0.06, 0]}>
        <boxGeometry args={[0.08, 0.03, 0.03]} /><meshStandardMaterial color="#333" metalness={0.6} />
      </mesh>
      {/* Sign board */}
      <mesh position={[0.08, 0, 0]}>
        <boxGeometry args={[0.03, 0.2, 0.16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.095, 0, 0]}>
        <boxGeometry args={[0.008, 0.15, 0.12]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ── Storefront Module ──
function Storefront({ w, d, type, trimColor, doorColor }: {
  w: number; d: number; type: GroundType; trimColor: string; doorColor: string;
}) {
  const winEmissive = type === "bar" ? "#FF80A0" : type === "cafe" ? "#FFCC80" : type === "gallery" ? "#E0E0FF" : "#AADDFF";
  const hasDoubleDoor = type === "shop" || type === "gallery";

  return (
    <group>
      {/* Storefront window */}
      <mesh position={[hasDoubleDoor ? 0 : -w * 0.12, 0.42, d / 2 + 0.01]}>
        <boxGeometry args={[hasDoubleDoor ? w * 0.4 : w * 0.48, 0.5, 0.015]} />
        <meshStandardMaterial color="#0a0a12" emissive={winEmissive} emissiveIntensity={0.55} />
      </mesh>
      {/* Window frame */}
      <mesh position={[hasDoubleDoor ? 0 : -w * 0.12, 0.42, d / 2 + 0.013]}>
        <boxGeometry args={[(hasDoubleDoor ? w * 0.42 : w * 0.5), 0.52, 0.008]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>
      {/* Door */}
      <mesh position={[hasDoubleDoor ? w * 0.3 : w * 0.25, 0.3, d / 2 + 0.018]}>
        <boxGeometry args={[hasDoubleDoor ? 0.35 : 0.26, 0.54, 0.02]} />
        <meshStandardMaterial color={doorColor} />
      </mesh>
      {/* Door frame */}
      <mesh position={[hasDoubleDoor ? w * 0.3 : w * 0.25, 0.3, d / 2 + 0.02]}>
        <boxGeometry args={[hasDoubleDoor ? 0.38 : 0.29, 0.57, 0.008]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>
      {/* Handle */}
      <mesh position={[(hasDoubleDoor ? w * 0.25 : w * 0.21), 0.3, d / 2 + 0.035]}>
        <boxGeometry args={[0.025, 0.035, 0.025]} />
        <meshStandardMaterial color="#D4A030" metalness={0.8} />
      </mesh>
      {/* Step */}
      <mesh position={[(hasDoubleDoor ? w * 0.3 : w * 0.25), 0.02, d / 2 + 0.1]}>
        <boxGeometry args={[0.35, 0.04, 0.08]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Interior glow hint (floor visible through window) */}
      {type === "cafe" && (
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[w * 0.8, 0.01, d * 0.8]} />
          <meshStandardMaterial color="#3A2A1A" emissive="#FFD080" emissiveIntensity={0.15} />
        </mesh>
      )}
    </group>
  );
}

// ── Balcony Module ──
function Balcony({ w, d, y }: { w: number; d: number; y: number }) {
  return (
    <group position={[0, y, d / 2 + 0.1]}>
      <mesh><boxGeometry args={[w * 0.42, 0.035, 0.2]} /><meshStandardMaterial color="#555" /></mesh>
      {[-2, -1, 0, 1, 2].map(i => (
        <mesh key={i} position={[i * w * 0.075, 0.09, 0.08]}>
          <boxGeometry args={[0.025, 0.14, 0.025]} /><meshStandardMaterial color="#444" metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.16, 0.08]}>
        <boxGeometry args={[w * 0.42, 0.025, 0.025]} /><meshStandardMaterial color="#444" metalness={0.5} />
      </mesh>
      {/* Plant */}
      <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.1, 0.06, 0.08]} /><meshStandardMaterial color="#7A5A3A" /></mesh>
      <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.13, 0.07, 0.1]} /><meshStandardMaterial color="#2D7A3A" /></mesh>
    </group>
  );
}

// ── Roof Modules ──
function Roof({ style, w, d, h, color, seed }: {
  style: RoofStyle; w: number; d: number; h: number; color: string; seed: number;
}) {
  const roofCol = new THREE.Color(color).multiplyScalar(0.6).getStyle();

  switch (style) {
    case "peaked":
      return (
        <group position={[0, h, 0]}>
          {[0, 1, 2, 3].map(step => (
            <mesh key={step} position={[0, step * 0.09 + 0.05, 0]}>
              <boxGeometry args={[w - step * 0.28, 0.09, d - step * 0.28]} />
              <meshStandardMaterial color={roofCol} roughness={0.7} />
            </mesh>
          ))}
        </group>
      );
    case "terrace":
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[w + 0.12, 0.08, d + 0.12]} /><meshStandardMaterial color={roofCol} roughness={0.5} />
          </mesh>
          {[-1, 1].map(s => (
            <mesh key={s} position={[s * w * 0.42, 0.18, 0]}>
              <boxGeometry args={[0.03, 0.22, d * 0.75]} /><meshStandardMaterial color="#555" />
            </mesh>
          ))}
          {/* String lights */}
          {Array.from({ length: 4 }).map((_, i) => (
            <mesh key={i} position={[-w * 0.3 + i * w * 0.2, 0.26, 0]}>
              <boxGeometry args={[0.035, 0.035, 0.035]} />
              <meshStandardMaterial color="#FFE060" emissive="#FFD040" emissiveIntensity={1.8} />
            </mesh>
          ))}
        </group>
      );
    case "water_tower":
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[w + 0.08, 0.08, d + 0.08]} /><meshStandardMaterial color={roofCol} />
          </mesh>
          {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.28, z]}>
              <boxGeometry args={[0.035, 0.38, 0.035]} /><meshStandardMaterial color="#5A4A3A" />
            </mesh>
          ))}
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[0.45, 0.26, 0.45]} /><meshStandardMaterial color="#6A6A6A" metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.68, 0]}>
            <boxGeometry args={[0.3, 0.08, 0.3]} /><meshStandardMaterial color="#5A5A5A" />
          </mesh>
        </group>
      );
    case "dome":
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[w + 0.08, 0.08, d + 0.08]} /><meshStandardMaterial color={roofCol} />
          </mesh>
          {[0, 1, 2].map(step => (
            <mesh key={step} position={[0, 0.12 + step * 0.1, 0]}>
              <boxGeometry args={[0.6 - step * 0.18, 0.1, 0.6 - step * 0.18]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} />
            </mesh>
          ))}
        </group>
      );
    case "antenna":
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[w + 0.08, 0.08, d + 0.08]} /><meshStandardMaterial color={roofCol} />
          </mesh>
          <mesh position={[0.3, 0.45, 0]}>
            <boxGeometry args={[0.04, 0.7, 0.04]} /><meshStandardMaterial color="#555" metalness={0.6} />
          </mesh>
          <mesh position={[0.3, 0.82, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#FF3030" emissive="#FF3030" emissiveIntensity={1.5} />
          </mesh>
          {/* Satellite dish */}
          <mesh position={[-0.25, 0.3, 0.2]}>
            <boxGeometry args={[0.22, 0.18, 0.04]} /><meshStandardMaterial color="#aaa" metalness={0.5} />
          </mesh>
        </group>
      );
    case "garden":
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[w + 0.08, 0.08, d + 0.08]} /><meshStandardMaterial color={roofCol} />
          </mesh>
          {/* Garden bed */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[w * 0.7, 0.04, d * 0.7]} /><meshStandardMaterial color="#3A2818" />
          </mesh>
          {/* Plants */}
          {[[-0.25, -0.15], [0.2, 0.2], [-0.1, 0.25]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.2, z]}>
              <boxGeometry args={[0.16, 0.14, 0.16]} /><meshStandardMaterial color={["#2D7A3A", "#1A6A2A", "#3A8A3A"][i]} />
            </mesh>
          ))}
        </group>
      );
    default: // flat
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.035, 0]}>
            <boxGeometry args={[w + 0.1, 0.07, d + 0.1]} /><meshStandardMaterial color={roofCol} roughness={0.5} />
          </mesh>
          {/* Edge trim */}
          {[
            [0, 0.08, d / 2 + 0.03, w + 0.1, 0.05, 0.03],
            [0, 0.08, -d / 2 - 0.03, w + 0.1, 0.05, 0.03],
          ].map(([x, y, z, bw, bh, bd], i) => (
            <mesh key={i} position={[x, y, z]}>
              <boxGeometry args={[bw, bh, bd]} /><meshStandardMaterial color="#444" />
            </mesh>
          ))}
          {/* AC unit */}
          {hashF(seed, 99) > 0.4 && (
            <mesh position={[-0.3, 0.15, -0.2]}>
              <boxGeometry args={[0.25, 0.16, 0.2]} /><meshStandardMaterial color="#888" />
            </mesh>
          )}
        </group>
      );
  }
}

// ── Side decoration module ──
function SideDecor({ w, d, h, seed }: { w: number; d: number; h: number; seed: number }) {
  const hasPipe = hashF(seed, 50) > 0.4;
  const hasVent = hashF(seed, 51) > 0.5;
  const hasLadder = hashF(seed, 52) > 0.7;

  return (
    <group>
      {hasPipe && (
        <>
          <mesh position={[-w / 2 - 0.025, h * 0.4, -d * 0.12]}>
            <boxGeometry args={[0.04, h * 0.7, 0.04]} /><meshStandardMaterial color="#555" metalness={0.5} />
          </mesh>
          {[0.3, 0.6].map(f => (
            <mesh key={f} position={[-w / 2 - 0.01, h * f, -d * 0.12]}>
              <boxGeometry args={[0.06, 0.025, 0.06]} /><meshStandardMaterial color="#444" />
            </mesh>
          ))}
        </>
      )}
      {hasVent && (
        <mesh position={[w / 2 + 0.015, h * 0.5, 0]}>
          <boxGeometry args={[0.025, 0.18, 0.25]} /><meshStandardMaterial color="#3A3A3A" />
        </mesh>
      )}
      {hasLadder && (
        <group position={[-w / 2 - 0.06, 0, d * 0.25]}>
          {Array.from({ length: Math.min(Math.floor(h / 0.35), 6) }).map((_, i) => (
            <mesh key={i} position={[0, i * 0.35 + 0.25, 0]}>
              <boxGeometry args={[0.03, 0.03, 0.15]} /><meshStandardMaterial color="#666" metalness={0.4} />
            </mesh>
          ))}
          {[-1, 1].map(s => (
            <mesh key={s} position={[0, h * 0.35, s * 0.065]}>
              <boxGeometry args={[0.03, h * 0.6, 0.03]} /><meshStandardMaterial color="#666" metalness={0.4} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// ── Street-level props module ──
function StreetProps({ w, d, seed }: { w: number; d: number; seed: number }) {
  const side = hashF(seed, 60) > 0.5 ? 1 : -1;
  const hasTrashCan = hashF(seed, 61) > 0.3;
  const hasSign = hashF(seed, 62) > 0.5;
  const hasPot = hashF(seed, 63) > 0.4;
  const hasBike = hashF(seed, 64) > 0.7;

  return (
    <group>
      {hasTrashCan && (
        <mesh position={[side * (w / 2 + 0.2), 0.08, d / 2 - 0.15]}>
          <boxGeometry args={[0.1, 0.16, 0.1]} /><meshStandardMaterial color="#4A4A4A" />
        </mesh>
      )}
      {hasSign && (
        <group position={[-side * (w / 2 + 0.35), 0, d / 2 + 0.2]}>
          <mesh position={[0, 0.13, 0]}>
            <boxGeometry args={[0.16, 0.25, 0.03]} /><meshStandardMaterial color="#2A2A2A" />
          </mesh>
          <mesh position={[0, 0.13, 0.008]}>
            <boxGeometry args={[0.12, 0.18, 0.015]} /><meshStandardMaterial color="#E8D8B0" />
          </mesh>
        </group>
      )}
      {hasPot && (
        <group position={[side * (w / 2 + 0.25), 0, d / 2 + 0.15]}>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.12, 0.12, 0.12]} /><meshStandardMaterial color="#7A5A3A" />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.14, 0.1, 0.14]} /><meshStandardMaterial color="#2D7A3A" />
          </mesh>
        </group>
      )}
      {hasBike && (
        <group position={[-side * (w / 2 + 0.3), 0.06, -d / 2 + 0.15]}>
          {/* Simplified pixel bike */}
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.2, 0.04, 0.06]} /><meshStandardMaterial color="#555" metalness={0.5} />
          </mesh>
          <mesh position={[-0.06, 0, 0]}>
            <boxGeometry args={[0.06, 0.08, 0.02]} /><meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0.06, 0, 0]}>
            <boxGeometry args={[0.06, 0.08, 0.02]} /><meshStandardMaterial color="#333" />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ═══════════════════════════════════════
// MAIN BUILDING GENERATOR
// ═══════════════════════════════════════

interface VoxelCityBuildingProps {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  seed: number;
  occluded?: boolean;
  /** For user buildings – show their name on the sign */
  ownerName?: string;
}

export const VoxelCityBuilding = memo(function VoxelCityBuilding({
  x, z, w, d, h, color, seed, occluded, ownerName,
}: VoxelCityBuildingProps) {

  // ── Procedural config from seed ──
  const config = useMemo(() => {
    const palette = hashPick(WALL_PALETTES, seed, 0);
    const wallColor = hashPick(palette, seed, 1);
    const trimColor = hashPick(TRIM_COLORS, seed, 2);
    const doorColor = hashPick(DOOR_COLORS, seed, 3);
    const awningColor = hashPick(AWNING_COLORS, seed, 4);
    const signGlow = hashPick(SIGN_GLOW_COLORS, seed, 5);
    const windowGlow = hashPick(WINDOW_GLOWS, seed, 6);
    const roofStyle = hashPick(ROOF_STYLES, seed, 7);
    const groundType = hashPick(GROUND_TYPES, seed, 8);
    const hasAwning = hashF(seed, 10) > 0.35;
    const hasBalcony = hashF(seed, 11) > 0.5;
    const hasSignboard = hashF(seed, 12) > 0.25;
    const signStyle = hash(seed, 13) % 2;
    const windowStyle = hash(seed, 14) % 2;
    const windowCount = 2 + (hash(seed, 15) % 2);
    const hasStripes = hashF(seed, 16) > 0.4;

    // Blend building's original color hint with procedural palette
    const blendedWall = new THREE.Color(wallColor).lerp(new THREE.Color(color), 0.15);

    return {
      wallColor: blendedWall,
      darkerWall: new THREE.Color(blendedWall).multiplyScalar(0.65),
      trimColor, doorColor, awningColor, signGlow, windowGlow,
      roofStyle, groundType: groundType as GroundType,
      hasAwning, hasBalcony, hasSignboard,
      signStyle, windowStyle, windowCount, hasStripes,
    };
  }, [seed, color]);

  const floors = Math.max(Math.floor(h / 0.6), 2);
  const floorH = (h - 0.75) / floors;

  if (occluded) {
    return (
      <group position={[x, 0, z]}>
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={config.wallColor} transparent opacity={0.1} roughness={0.85} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[x, 0, z]}>
      {/* ── Ground floor (darker base) ── */}
      <mesh position={[0, 0.375, 0]}>
        <boxGeometry args={[w, 0.75, d]} />
        <meshStandardMaterial color={config.darkerWall} roughness={0.8} />
      </mesh>

      {/* ── Storefront ── */}
      <Storefront w={w} d={d} type={config.groundType} trimColor={config.trimColor} doorColor={config.doorColor} />

      {/* ── Upper floors body ── */}
      <mesh position={[0, 0.75 + (h - 0.75) / 2, 0]} castShadow>
        <boxGeometry args={[w, h - 0.75, d]} />
        <meshStandardMaterial color={config.wallColor} roughness={0.72} metalness={0.06} />
      </mesh>

      {/* ── Floor separator bands ── */}
      {Array.from({ length: Math.min(floors, 6) }).map((_, i) => (
        <mesh key={`sep-${i}`} position={[0, 0.75 + (i + 1) * floorH, d / 2 + 0.004]}>
          <boxGeometry args={[w + 0.02, 0.025, 0.01]} />
          <meshStandardMaterial color={config.trimColor} />
        </mesh>
      ))}

      {/* ── Windows per floor ── */}
      {Array.from({ length: Math.min(floors, 4) }).map((_, floor) => (
        <WindowRow
          key={floor}
          y={0.75 + floor * floorH + floorH * 0.55}
          w={w} d={d}
          glow={config.windowGlow}
          count={config.windowCount}
          style={config.windowStyle}
        />
      ))}

      {/* ── Awning ── */}
      {config.hasAwning && <Awning w={w} d={d} color={config.awningColor} hasStripes={config.hasStripes} />}

      {/* ── Signboard ── */}
      {config.hasSignboard && (
        <Signboard w={w} d={d} glowColor={config.signGlow} style={config.signStyle} />
      )}

      {/* ── Balcony ── */}
      {config.hasBalcony && floors >= 2 && (
        <Balcony w={w} d={d} y={0.75 + floorH * 1.1} />
      )}

      {/* ── Roof ── */}
      <Roof style={config.roofStyle} w={w} d={d} h={h} color={color} seed={seed} />

      {/* ── Side details ── */}
      <SideDecor w={w} d={d} h={h} seed={seed} />

      {/* ── Street props ── */}
      <StreetProps w={w} d={d} seed={seed} />

      {/* ── Owner name sign (for user buildings) ── */}
      {ownerName && (
        <group position={[0, h * 0.7, d / 2 + 0.04]}>
          <mesh position={[0, 0, -0.015]}>
            <boxGeometry args={[w * 0.75, 0.28, 0.03]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0, 0, 0.005]}>
            <boxGeometry args={[w * 0.7, 0.22, 0.01]} />
            <meshStandardMaterial
              color={config.signGlow}
              emissive={config.signGlow}
              emissiveIntensity={1.0}
            />
          </mesh>
        </group>
      )}
    </group>
  );
});

// ═══════════════════════════════════════
// MULTI-LEVEL LOD SYSTEM (LOD 0–4)
// ═══════════════════════════════════════

/** LOD 1 — Simplified building: walls + windows as emissive strips + roof cap */
const VoxelBuildingLod1 = memo(function VoxelBuildingLod1({
  x, z, w, d, h, color, seed,
}: VoxelCityBuildingProps) {
  const cfg = useMemo(() => {
    const palette = hashPick(WALL_PALETTES, seed, 0);
    const wallColor = new THREE.Color(hashPick(palette, seed, 1)).lerp(new THREE.Color(color), 0.15);
    const roofColor = new THREE.Color(wallColor).multiplyScalar(0.6);
    const windowGlow = hashPick(WINDOW_GLOWS, seed, 6);
    return { wallColor, roofColor, windowGlow };
  }, [seed, color]);

  const floors = Math.max(Math.floor(h / 0.6), 2);

  return (
    <group position={[x, 0, z]}>
      {/* Main body */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={cfg.wallColor} roughness={0.75} />
      </mesh>
      {/* Window strips (emissive bands instead of individual windows) */}
      {Array.from({ length: Math.min(floors, 4) }).map((_, i) => (
        <mesh key={i} position={[0, 0.75 + i * (h / floors) + 0.3, d / 2 + 0.01]}>
          <boxGeometry args={[w * 0.7, 0.15, 0.01]} />
          <meshStandardMaterial color="#0a0a12" emissive={cfg.windowGlow} emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* Simple roof cap */}
      <mesh position={[0, h + 0.04, 0]}>
        <boxGeometry args={[w + 0.1, 0.08, d + 0.1]} />
        <meshStandardMaterial color={cfg.roofColor} roughness={0.6} />
      </mesh>
    </group>
  );
});

/** LOD 2 — Low poly: single box with color, no windows */
const VoxelBuildingLod2 = memo(function VoxelBuildingLod2({
  x, z, w, d, h, color, seed,
}: VoxelCityBuildingProps) {
  const wallColor = useMemo(() => {
    const palette = hashPick(WALL_PALETTES, seed, 0);
    return new THREE.Color(hashPick(palette, seed, 1)).lerp(new THREE.Color(color), 0.15);
  }, [seed, color]);

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>
    </group>
  );
});

/** LOD 3 — Flat colored block with reduced geometry */
const VoxelBuildingLod3 = memo(function VoxelBuildingLod3({
  x, z, w, d, h, color,
}: VoxelCityBuildingProps) {
  const c = useMemo(() => new THREE.Color(color).multiplyScalar(0.5), [color]);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={c} roughness={0.95} />
      </mesh>
    </group>
  );
});

/** LOD 4 — Minimal: tiny flat rectangle on ground (map-like representation) */
const VoxelBuildingLod4 = memo(function VoxelBuildingLod4({
  x, z, w, d, color,
}: VoxelCityBuildingProps) {
  const c = useMemo(() => new THREE.Color(color).multiplyScalar(0.35), [color]);
  return (
    <mesh position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial color={c} />
    </mesh>
  );
});

/** Multi-level LoD wrapper — renders the appropriate level based on `lod` prop */
export const VoxelBuildingMultiLoD = memo(function VoxelBuildingMultiLoD(
  props: VoxelCityBuildingProps & { lod: number }
) {
  const { lod, ...buildingProps } = props;

  switch (lod) {
    case 0:
      return <VoxelCityBuilding {...buildingProps} />;
    case 1:
      return <VoxelBuildingLod1 {...buildingProps} />;
    case 2:
      return <VoxelBuildingLod2 {...buildingProps} />;
    case 3:
      return <VoxelBuildingLod3 {...buildingProps} />;
    case 4:
      return <VoxelBuildingLod4 {...buildingProps} />;
    default:
      return null;
  }
});

// Keep legacy LoD wrapper for backward compatibility
export const VoxelBuildingLoD = memo(function VoxelBuildingLoD(
  props: VoxelCityBuildingProps & { playerX: number; playerZ: number }
) {
  const { playerX, playerZ, ...buildingProps } = props;
  const dist = Math.hypot(props.x - playerX, props.z - playerZ);

  let lod = 0;
  if (dist > 90) lod = 4;
  else if (dist > 60) lod = 3;
  else if (dist > 35) lod = 2;
  else if (dist > 18) lod = 1;

  return <VoxelBuildingMultiLoD {...buildingProps} lod={lod} />;
});
