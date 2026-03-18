import { memo, useMemo } from "react";
import * as THREE from "three";

/**
 * Diorama-Quality Voxel Buildings
 * 
 * Design philosophy: Monument Valley / Townscaper level craft.
 * Every surface has INTENTION — micro-bevels, depth, material variation.
 * Cinematic warm/cold lighting contrast built into geometry.
 */

// ── Deterministic hash ──
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

// ═══════════════════════════════════════════════════════════
// MATERIAL SYSTEM — simulated surfaces, NOT flat colors
// ═══════════════════════════════════════════════════════════

interface Palette {
  wall: string;          // Main wall color
  wallShadow: string;    // Darker face (sides, AO fake)
  wallHighlight: string; // Lighter face (top surfaces)
  trim: string;          // Window frames, door frames
  wood: string;          // Warm wood accents
  glass: string;         // Window glass (dark)
  glowWarm: string;      // Interior warm glow
  glowAccent: string;    // Sign/accent glow
  roof: string;          // Roof main
  roofEdge: string;      // Roof trim/edge
  metal: string;         // Railings, hardware
  ground: string;        // Sidewalk/base
}

const PALETTES: Palette[] = [
  // Warm Terracotta Café
  { wall: "#C27348", wallShadow: "#8A4A2E", wallHighlight: "#D4956A", trim: "#1A1008", wood: "#7A5030", glass: "#0A0A14", glowWarm: "#FFD080", glowAccent: "#FFB040", roof: "#6B3225", roofEdge: "#4A2018", metal: "#3A3A42", ground: "#484440" },
  // Dusty Blue Bookshop
  { wall: "#6888A0", wallShadow: "#3E5568", wallHighlight: "#8AA8C0", trim: "#0A1420", wood: "#6A4A30", glass: "#060810", glowWarm: "#FFE8B0", glowAccent: "#FFE080", roof: "#384858", roofEdge: "#283848", metal: "#4A4A55", ground: "#3E3E40" },
  // Cream Patisserie
  { wall: "#E0D4B8", wallShadow: "#B8A88A", wallHighlight: "#F0E8D4", trim: "#2A1A10", wood: "#8A6A3A", glass: "#08080E", glowWarm: "#FFD4A0", glowAccent: "#FF8090", roof: "#8A6848", roofEdge: "#6A4A30", metal: "#484848", ground: "#4A4844" },
  // Sage Green Studio
  { wall: "#6A9878", wallShadow: "#3E6A48", wallHighlight: "#8AB898", trim: "#0A1808", wood: "#6A4828", glass: "#060A08", glowWarm: "#FFE0A0", glowAccent: "#FFD860", roof: "#3A5838", roofEdge: "#2A4028", metal: "#3E4240", ground: "#3A3E38" },
  // Deep Plum Wine Bar
  { wall: "#7A485A", wallShadow: "#4A2838", wallHighlight: "#9A6878", trim: "#0A0610", wood: "#5A3828", glass: "#080610", glowWarm: "#FFB0D0", glowAccent: "#FF60A0", roof: "#3E2830", roofEdge: "#2E1820", metal: "#444048", ground: "#403840" },
  // Ochre Workshop
  { wall: "#C0943A", wallShadow: "#886828", wallHighlight: "#D8B060", trim: "#1A1008", wood: "#5A3818", glass: "#0A0808", glowWarm: "#FFE0B0", glowAccent: "#FF8040", roof: "#5A3818", roofEdge: "#402810", metal: "#4A4840", ground: "#484438" },
  // Slate Tech
  { wall: "#586878", wallShadow: "#2E3E4E", wallHighlight: "#788898", trim: "#060810", wood: "#4A3828", glass: "#040610", glowWarm: "#80D0FF", glowAccent: "#40D0FF", roof: "#283040", roofEdge: "#182030", metal: "#505560", ground: "#383840" },
  // Rose Boutique
  { wall: "#C0808A", wallShadow: "#8A5A62", wallHighlight: "#D8A0A8", trim: "#180810", wood: "#7A5038", glass: "#080608", glowWarm: "#FFE4C8", glowAccent: "#FFD060", roof: "#6A3E48", roofEdge: "#502E38", metal: "#484048", ground: "#424040" },
];

type BuildingClass = "cafe" | "shop" | "office" | "tech_tower" | "creative_studio";
const BUILDING_CLASSES: BuildingClass[] = ["cafe", "shop", "office", "tech_tower", "creative_studio"];

// ═══════════════════════════════════════════════════════════
// MICRO-DETAIL PRIMITIVES — the soul of the diorama
// ═══════════════════════════════════════════════════════════

/** Bevel-edged wall panel — NOT a flat box. Has subtle depth variation. */
function BevelWall({ w, h, d, color, shadowColor, highlightColor, position }: {
  w: number; h: number; d: number; color: string; shadowColor: string; highlightColor: string;
  position: [number, number, number];
}) {
  const bevel = 0.015;
  return (
    <group position={position}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      {/* Top bevel highlight — catches light */}
      <mesh position={[0, h / 2 - bevel / 2, 0]}>
        <boxGeometry args={[w + 0.004, bevel, d + 0.004]} />
        <meshStandardMaterial color={highlightColor} roughness={0.6} />
      </mesh>
      {/* Bottom shadow line — fake AO */}
      <mesh position={[0, -h / 2 + bevel / 2, 0]}>
        <boxGeometry args={[w + 0.006, bevel, d + 0.006]} />
        <meshStandardMaterial color={shadowColor} roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Deep-set window with frame, sill, and interior glow */
function DeepWindow({ x, y, z, winW, winH, pal, glowIntensity = 1.0 }: {
  x: number; y: number; z: number; winW: number; winH: number; pal: Palette; glowIntensity?: number;
}) {
  const depth = 0.04; // Window recess depth
  const frameT = 0.012; // Frame thickness
  return (
    <group position={[x, y, z]}>
      {/* Recess/cavity — dark shadow to create depth */}
      <mesh position={[0, 0, -depth / 2]}>
        <boxGeometry args={[winW + frameT * 2, winH + frameT * 2, depth]} />
        <meshStandardMaterial color={pal.trim} roughness={0.9} />
      </mesh>
      {/* Glass pane — at back of recess */}
      <mesh position={[0, 0, -depth + 0.005]}>
        <boxGeometry args={[winW, winH, 0.006]} />
        <meshStandardMaterial 
          color={pal.glass} 
          emissive={pal.glowWarm} 
          emissiveIntensity={1.4 * glowIntensity} 
          roughness={0.1}
          metalness={0.05}
        />
      </mesh>
      {/* Top frame (lintel) */}
      <mesh position={[0, winH / 2 + frameT / 2, 0.003]}>
        <boxGeometry args={[winW + frameT * 3, frameT, 0.02]} />
        <meshStandardMaterial color={pal.trim} roughness={0.7} />
      </mesh>
      {/* Sill — projects outward with slight overhang */}
      <mesh position={[0, -winH / 2 - 0.008, 0.018]}>
        <boxGeometry args={[winW + frameT * 3, 0.016, 0.035]} />
        <meshStandardMaterial color={pal.metal} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Side frames */}
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * (winW / 2 + frameT / 2), 0, 0.002]}>
          <boxGeometry args={[frameT, winH + frameT, 0.016]} />
          <meshStandardMaterial color={pal.trim} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** Window row with deep-set windows */
function WindowRow({ y, w, d, pal, count, winH = 0.22 }: {
  y: number; w: number; d: number; pal: Palette; count: number; winH?: number;
}) {
  const winW = w * 0.12;
  const spacing = w / (count + 1);
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const xOff = -w / 2 + spacing * (i + 1);
        return (
          <DeepWindow
            key={i}
            x={xOff} y={y} z={d / 2 + 0.001}
            winW={winW} winH={winH}
            pal={pal}
            glowIntensity={0.8 + (i % 2) * 0.4}
          />
        );
      })}
    </group>
  );
}

/** Cinematic illuminated sign — the building's focal point */
function GlowSign({ w, d, pal, yPos = 0.62 }: {
  w: number; d: number; pal: Palette; yPos?: number;
}) {
  return (
    <group position={[0, yPos, d / 2 + 0.005]}>
      {/* Sign board with micro-bevel */}
      <mesh>
        <boxGeometry args={[w * 0.5, 0.14, 0.03]} />
        <meshStandardMaterial color="#080808" roughness={0.4} />
      </mesh>
      {/* Top edge highlight */}
      <mesh position={[0, 0.075, 0]}>
        <boxGeometry args={[w * 0.52, 0.008, 0.032]} />
        <meshStandardMaterial color={pal.metal} roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Glowing text area */}
      <mesh position={[0, 0, 0.017]}>
        <boxGeometry args={[w * 0.42, 0.09, 0.005]} />
        <meshStandardMaterial color={pal.glowAccent} emissive={pal.glowAccent} emissiveIntensity={2.2} />
      </mesh>
      {/* Bloom halo (subtle) */}
      <mesh position={[0, 0, 0.022]}>
        <boxGeometry args={[w * 0.54, 0.18, 0.003]} />
        <meshStandardMaterial color={pal.glowAccent} emissive={pal.glowAccent} emissiveIntensity={0.4} transparent opacity={0.18} />
      </mesh>
      {/* Bracket arms */}
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * w * 0.22, 0.09, -0.01]}>
          <boxGeometry args={[0.02, 0.04, 0.04]} />
          <meshStandardMaterial color={pal.metal} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** Detailed awning with stepped voxel canopy + fringe */
function DetailedAwning({ w, d, color, shadowColor }: {
  w: number; d: number; color: string; shadowColor: string;
}) {
  const aw = w * 0.82;
  const stripe = new THREE.Color(color).lerp(new THREE.Color("#FFFFFF"), 0.55).getStyle();
  return (
    <group position={[0, 0.78, d / 2 + 0.14]}>
      {/* 3-step canopy for voxel depth */}
      {[0, 1, 2].map(step => (
        <mesh key={step} position={[0, -step * 0.02, -step * 0.05]}>
          <boxGeometry args={[aw, 0.022, 0.32 - step * 0.08]} />
          <meshStandardMaterial color={step === 0 ? color : step === 1 ? shadowColor : color} roughness={0.7} />
        </mesh>
      ))}
      {/* Stripe details on top */}
      {[-3, -2, -1, 0, 1, 2, 3].map(i => (
        <mesh key={`s${i}`} position={[i * aw * 0.1, 0.013, 0]}>
          <boxGeometry args={[aw * 0.035, 0.004, 0.34]} />
          <meshStandardMaterial color={stripe} transparent opacity={0.4} />
        </mesh>
      ))}
      {/* Scalloped fringe */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`f${i}`} position={[-aw * 0.38 + i * aw * 0.11, -0.055, 0.13]}>
          <boxGeometry args={[aw * 0.04, 0.025, 0.01]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      {/* Shadow strip underneath */}
      <mesh position={[0, -0.065, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[aw, 0.25]} />
        <meshBasicMaterial color="#000" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

/** Ground-floor storefront with depth, shelving hints, and interior */
function RichStorefront({ w, d, pal, hasDoor = true }: {
  w: number; d: number; pal: Palette; hasDoor?: boolean;
}) {
  return (
    <group>
      {/* Large display window — recessed for depth */}
      <group position={[hasDoor ? -w * 0.08 : 0, 0.38, d / 2]}>
        {/* Window cavity */}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[w * 0.52, 0.48, 0.045]} />
          <meshStandardMaterial color={pal.trim} roughness={0.85} />
        </mesh>
        {/* Glass — warm interior */}
        <mesh position={[0, 0, -0.035]}>
          <boxGeometry args={[w * 0.48, 0.44, 0.008]} />
          <meshStandardMaterial 
            color={pal.glass} 
            emissive={pal.glowWarm} 
            emissiveIntensity={0.9}
            roughness={0.08}
          />
        </mesh>
        {/* Interior shelf silhouettes */}
        {[-0.12, 0, 0.12].map((ox, i) => (
          <mesh key={i} position={[ox, -0.1, -0.04]}>
            <boxGeometry args={[0.08, 0.06, 0.008]} />
            <meshStandardMaterial color={pal.glass} emissive={pal.glowWarm} emissiveIntensity={0.3} />
          </mesh>
        ))}
        {/* Mullion (center divider) */}
        <mesh position={[0, 0, 0.002]}>
          <boxGeometry args={[0.01, 0.46, 0.015]} />
          <meshStandardMaterial color={pal.trim} />
        </mesh>
      </group>

      {/* Door — recessed with handle and step */}
      {hasDoor && (
        <group position={[w * 0.28, 0, d / 2]}>
          {/* Door recess */}
          <mesh position={[0, 0.3, -0.015]}>
            <boxGeometry args={[0.28, 0.55, 0.035]} />
            <meshStandardMaterial color={pal.trim} roughness={0.8} />
          </mesh>
          {/* Door panel */}
          <mesh position={[0, 0.3, -0.025]}>
            <boxGeometry args={[0.24, 0.5, 0.015]} />
            <meshStandardMaterial color={pal.wood} roughness={0.75} />
          </mesh>
          {/* Door window (upper) */}
          <mesh position={[0, 0.42, -0.018]}>
            <boxGeometry args={[0.16, 0.14, 0.008]} />
            <meshStandardMaterial color={pal.glass} emissive={pal.glowWarm} emissiveIntensity={0.6} />
          </mesh>
          {/* Handle */}
          <mesh position={[-0.08, 0.3, 0.004]}>
            <boxGeometry args={[0.015, 0.04, 0.025]} />
            <meshStandardMaterial color="#C4983A" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Step */}
          <mesh position={[0, 0.015, 0.04]}>
            <boxGeometry args={[0.32, 0.03, 0.08]} />
            <meshStandardMaterial color={pal.ground} roughness={0.8} />
          </mesh>
          {/* Interior glow spill through door */}
          <mesh position={[0, 0.2, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.3, 0.12]} />
            <meshBasicMaterial color={pal.glowWarm} transparent opacity={0.08} />
          </mesh>
        </group>
      )}

      {/* Interior floor glow (visible through windows) */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[w * 0.8, 0.008, d * 0.8]} />
        <meshStandardMaterial color="#1A1008" emissive={pal.glowWarm} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

/** Wall with texture — subtle per-face color variation */
function TexturedWall({ w, h, d, pal, seed }: {
  w: number; h: number; d: number; pal: Palette; seed: number;
}) {
  // Subdivide into horizontal bands for material variety
  const bands = Math.max(2, Math.floor(h / 0.4));
  const bandH = h / bands;
  return (
    <group>
      {Array.from({ length: bands }).map((_, i) => {
        const variation = hashF(seed, i * 10);
        const baseColor = new THREE.Color(pal.wall);
        // Subtle warmth/cool shift per band
        baseColor.offsetHSL(0, 0, (variation - 0.5) * 0.04);
        return (
          <mesh key={i} position={[0, bandH / 2 + i * bandH, 0]} castShadow>
            <boxGeometry args={[w, bandH + 0.002, d]} />
            <meshStandardMaterial color={baseColor} roughness={0.68 + variation * 0.1} />
          </mesh>
        );
      })}
      {/* Horizontal mortar lines between bands */}
      {Array.from({ length: bands - 1 }).map((_, i) => (
        <mesh key={`m${i}`} position={[0, (i + 1) * bandH, d / 2 + 0.002]}>
          <boxGeometry args={[w + 0.003, 0.008, 0.005]} />
          <meshStandardMaterial color={pal.wallShadow} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/** Detailed foundation with bevel and shadow */
function Foundation({ w, d, pal }: { w: number; d: number; pal: Palette }) {
  return (
    <group>
      {/* Base plate */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[w + 0.06, 0.05, d + 0.06]} />
        <meshStandardMaterial color={pal.ground} roughness={0.85} />
      </mesh>
      {/* Step up */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[w + 0.03, 0.02, d + 0.03]} />
        <meshStandardMaterial color={pal.wallShadow} roughness={0.8} />
      </mesh>
      {/* Shadow contact line */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w + 0.12, d + 0.12]} />
        <meshBasicMaterial color="#000" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// DIORAMA PROPS — street context elements
// ═══════════════════════════════════════════════════════════

/** Detailed outdoor table+chairs set */
function OutdoorSeating({ x, z, pal }: { x: number; z: number; pal: Palette }) {
  return (
    <group position={[x, 0, z]}>
      {/* Table top — with beveled edge */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.2, 0.018, 0.2]} />
        <meshStandardMaterial color={pal.wood} roughness={0.7} />
      </mesh>
      {/* Table edge bevel */}
      <mesh position={[0, 0.128, 0]}>
        <boxGeometry args={[0.22, 0.006, 0.22]} />
        <meshStandardMaterial color={new THREE.Color(pal.wood).multiplyScalar(0.8).getStyle()} roughness={0.75} />
      </mesh>
      {/* Leg (center) */}
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[0.025, 0.13, 0.025]} />
        <meshStandardMaterial color={pal.metal} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Foot plate */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.1, 0.01, 0.1]} />
        <meshStandardMaterial color={pal.metal} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Chair 1 */}
      <group position={[0.15, 0, 0]}>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.1, 0.015, 0.1]} /><meshStandardMaterial color={pal.wood} roughness={0.75} /></mesh>
        {/* Chair back */}
        <mesh position={[0.04, 0.17, 0]}><boxGeometry args={[0.015, 0.12, 0.1]} /><meshStandardMaterial color={pal.wood} roughness={0.75} /></mesh>
        {/* Legs */}
        {[[-0.035, -0.035], [-0.035, 0.035], [0.035, -0.035], [0.035, 0.035]].map(([lx, lz], li) => (
          <mesh key={li} position={[lx, 0.05, lz]}><boxGeometry args={[0.015, 0.09, 0.015]} /><meshStandardMaterial color={pal.metal} metalness={0.3} /></mesh>
        ))}
      </group>
      {/* Chair 2 (opposite) */}
      <group position={[-0.15, 0, 0]}>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.1, 0.015, 0.1]} /><meshStandardMaterial color={pal.wood} roughness={0.75} /></mesh>
        <mesh position={[-0.04, 0.17, 0]}><boxGeometry args={[0.015, 0.12, 0.1]} /><meshStandardMaterial color={pal.wood} roughness={0.75} /></mesh>
        {[[-0.035, -0.035], [-0.035, 0.035], [0.035, -0.035], [0.035, 0.035]].map(([lx, lz], li) => (
          <mesh key={li} position={[lx, 0.05, lz]}><boxGeometry args={[0.015, 0.09, 0.015]} /><meshStandardMaterial color={pal.metal} metalness={0.3} /></mesh>
        ))}
      </group>
    </group>
  );
}

/** Potted plant with volumetric foliage */
function PottedPlant({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  const s = scale;
  return (
    <group position={[x, 0, z]}>
      {/* Pot — tapered */}
      <mesh position={[0, 0.05 * s, 0]}>
        <boxGeometry args={[0.1 * s, 0.08 * s, 0.1 * s]} />
        <meshStandardMaterial color="#7A5838" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.095 * s, 0]}>
        <boxGeometry args={[0.11 * s, 0.015 * s, 0.11 * s]} />
        <meshStandardMaterial color="#6A4828" roughness={0.8} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.085 * s, 0]}>
        <boxGeometry args={[0.08 * s, 0.01 * s, 0.08 * s]} />
        <meshStandardMaterial color="#3A2818" roughness={0.95} />
      </mesh>
      {/* Foliage spheres (multi-layer) */}
      <mesh position={[0, 0.16 * s, 0]}>
        <sphereGeometry args={[0.08 * s, 6, 5]} />
        <meshStandardMaterial color="#2A7A38" roughness={0.8} />
      </mesh>
      <mesh position={[0.03 * s, 0.14 * s, 0.02 * s]}>
        <sphereGeometry args={[0.055 * s, 5, 4]} />
        <meshStandardMaterial color="#1A6A28" roughness={0.82} />
      </mesh>
    </group>
  );
}

/** Hanging perpendicular sign (for shops) */
function HangingSign({ w, d, pal }: { w: number; d: number; pal: Palette }) {
  return (
    <group position={[w / 2 + 0.04, 0.72, 0]}>
      {/* Bracket arm */}
      <mesh position={[0.03, 0.08, 0]}>
        <boxGeometry args={[0.06, 0.018, 0.018]} />
        <meshStandardMaterial color={pal.metal} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Sign board */}
      <mesh position={[0.08, 0, 0]}>
        <boxGeometry args={[0.022, 0.2, 0.15]} />
        <meshStandardMaterial color="#0A0A0A" roughness={0.4} />
      </mesh>
      {/* Glow face */}
      <mesh position={[0.095, 0, 0]}>
        <boxGeometry args={[0.005, 0.16, 0.11]} />
        <meshStandardMaterial color={pal.glowAccent} emissive={pal.glowAccent} emissiveIntensity={1.8} />
      </mesh>
      {/* Edge trim */}
      <mesh position={[0.08, 0.105, 0]}>
        <boxGeometry args={[0.024, 0.008, 0.155]} />
        <meshStandardMaterial color={pal.metal} metalness={0.5} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// BUILDING CLASS RENDERERS — full diorama compositions
// ═══════════════════════════════════════════════════════════

function CafeBuilding({ w, d, h, pal, seed }: { w: number; d: number; h: number; pal: Palette; seed: number }) {
  const floors = Math.max(2, Math.floor(h / 0.65));
  const bodyH = h - 0.75;

  return (
    <group>
      <Foundation w={w} d={d} pal={pal} />

      {/* Ground floor — warm inviting */}
      <BevelWall w={w} h={0.7} d={d} color={pal.wallShadow} shadowColor={pal.trim} highlightColor={pal.wall} position={[0, 0.42, 0]} />
      <RichStorefront w={w} d={d} pal={pal} />
      <DetailedAwning w={w} d={d} color={pal.glowAccent} shadowColor={pal.wallShadow} />
      <GlowSign w={w} d={d} pal={pal} />

      {/* Upper body — textured wall */}
      <group position={[0, 0.75, 0]}>
        <TexturedWall w={w} h={bodyH} d={d} pal={pal} seed={seed} />
      </group>

      {/* Windows with deep recesses */}
      {Array.from({ length: Math.min(floors - 1, 3) }).map((_, i) => (
        <WindowRow key={i} y={0.95 + i * 0.55} w={w} d={d} pal={pal} count={3} />
      ))}

      {/* Cornice/molding between floors */}
      {Array.from({ length: Math.min(floors, 3) }).map((_, i) => (
        <group key={`c${i}`}>
          <mesh position={[0, 0.73 + (i + 1) * (bodyH / floors), d / 2 + 0.006]}>
            <boxGeometry args={[w + 0.02, 0.025, 0.012]} />
            <meshStandardMaterial color={pal.wallHighlight} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.73 + (i + 1) * (bodyH / floors) - 0.014, d / 2 + 0.004]}>
            <boxGeometry args={[w + 0.015, 0.008, 0.008]} />
            <meshStandardMaterial color={pal.wallShadow} roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Peaked roof — stepped voxel pyramid with edge details */}
      <group position={[0, h, 0]}>
        {[0, 1, 2, 3].map(step => (
          <group key={step}>
            <mesh position={[0, step * 0.075 + 0.04, 0]}>
              <boxGeometry args={[w - step * 0.22, 0.075, d - step * 0.22]} />
              <meshStandardMaterial color={step % 2 === 0 ? pal.roof : pal.roofEdge} roughness={0.6} />
            </mesh>
            {/* Edge cap on each step */}
            {step < 3 && (
              <mesh position={[0, step * 0.075 + 0.08, (d - step * 0.22) / 2 + 0.003]}>
                <boxGeometry args={[w - step * 0.22, 0.01, 0.008]} />
                <meshStandardMaterial color={pal.roofEdge} roughness={0.7} />
              </mesh>
            )}
          </group>
        ))}
        {/* Chimney with cap */}
        <group position={[w * 0.25, 0.42, -d * 0.15]}>
          <mesh><boxGeometry args={[0.1, 0.24, 0.1]} /><meshStandardMaterial color={pal.roof} roughness={0.7} /></mesh>
          <mesh position={[0, 0.14, 0]}><boxGeometry args={[0.13, 0.03, 0.13]} /><meshStandardMaterial color={pal.roofEdge} /></mesh>
          {/* Smoke wisps (tiny blocks) */}
          <mesh position={[0.02, 0.2, 0]}><boxGeometry args={[0.025, 0.025, 0.025]} /><meshStandardMaterial color="#AAA" transparent opacity={0.2} /></mesh>
        </group>
      </group>

      {/* DIORAMA CONTEXT — outdoor seating */}
      <OutdoorSeating x={-0.3} z={d / 2 + 0.45} pal={pal} />
      <OutdoorSeating x={0.2} z={d / 2 + 0.48} pal={pal} />
      <PottedPlant x={-w / 2 - 0.12} z={d / 2 + 0.06} />
      <PottedPlant x={w / 2 + 0.12} z={d / 2 + 0.06} scale={0.8} />
    </group>
  );
}

function ShopBuilding({ w, d, h, pal, seed }: { w: number; d: number; h: number; pal: Palette; seed: number }) {
  const floors = Math.max(2, Math.floor(h / 0.65));
  const bodyH = h - 0.75;

  return (
    <group>
      <Foundation w={w} d={d} pal={pal} />

      {/* Ground floor */}
      <BevelWall w={w} h={0.7} d={d} color={pal.wallShadow} shadowColor={pal.trim} highlightColor={pal.wall} position={[0, 0.42, 0]} />
      <RichStorefront w={w} d={d} pal={pal} />
      <DetailedAwning w={w} d={d} color={pal.glowAccent} shadowColor={pal.wallShadow} />

      {/* Hanging sign — shop signature */}
      <HangingSign w={w} d={d} pal={pal} />

      {/* Upper body */}
      <group position={[0, 0.75, 0]}>
        <TexturedWall w={w} h={bodyH} d={d} pal={pal} seed={seed} />
      </group>

      <WindowRow y={0.95} w={w} d={d} pal={pal} count={3} />
      {floors > 2 && <WindowRow y={1.5} w={w} d={d} pal={pal} count={3} />}

      {/* Cornice */}
      {Array.from({ length: Math.min(floors, 3) }).map((_, i) => (
        <mesh key={`co${i}`} position={[0, 0.73 + (i + 1) * (bodyH / floors), d / 2 + 0.005]}>
          <boxGeometry args={[w + 0.02, 0.02, 0.01]} />
          <meshStandardMaterial color={pal.wallHighlight} roughness={0.6} />
        </mesh>
      ))}

      {/* Flat roof with parapet */}
      <group position={[0, h, 0]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[w + 0.08, 0.06, d + 0.08]} />
          <meshStandardMaterial color={pal.roof} roughness={0.55} />
        </mesh>
        {/* Parapet walls */}
        {[[0, d / 2 + 0.02, w + 0.08, 0.08, 0.025], [0, -d / 2 - 0.02, w + 0.08, 0.08, 0.025]].map(([px, pz, bw, bh, bd], i) => (
          <mesh key={i} position={[px, 0.1, pz]}>
            <boxGeometry args={[bw, bh, bd]} />
            <meshStandardMaterial color={pal.roofEdge} roughness={0.65} />
          </mesh>
        ))}
        {/* Parapet cap (top bevel) */}
        <mesh position={[0, 0.145, d / 2 + 0.02]}>
          <boxGeometry args={[w + 0.1, 0.01, 0.03]} />
          <meshStandardMaterial color={pal.wallHighlight} roughness={0.5} />
        </mesh>
      </group>

      {/* A-frame sign on sidewalk */}
      <group position={[w / 2 + 0.25, 0, d / 2 + 0.18]}>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.13, 0.2, 0.022]} /><meshStandardMaterial color="#1A1A1A" roughness={0.5} /></mesh>
        <mesh position={[0, 0.12, 0.008]}><boxGeometry args={[0.1, 0.15, 0.008]} /><meshStandardMaterial color="#E8D8B0" roughness={0.7} /></mesh>
        {/* Legs */}
        {[-0.05, 0.05].map((lx, i) => (
          <mesh key={i} position={[lx, 0.005, 0]}><boxGeometry args={[0.015, 0.01, 0.06]} /><meshStandardMaterial color="#333" /></mesh>
        ))}
      </group>

      <PottedPlant x={-w / 2 - 0.1} z={d / 2 + 0.05} scale={0.85} />
    </group>
  );
}

function OfficeBuilding({ w, d, h, pal, seed }: { w: number; d: number; h: number; pal: Palette; seed: number }) {
  const floors = Math.max(3, Math.floor(h / 0.5));
  const floorH = h / floors;

  return (
    <group>
      <Foundation w={w} d={d} pal={pal} />

      {/* Ground floor — glass lobby */}
      <BevelWall w={w} h={0.62} d={d} color={pal.wallShadow} shadowColor={pal.trim} highlightColor={pal.wall} position={[0, 0.38, 0]} />
      
      {/* Full-width lobby glass */}
      <group position={[0, 0.38, d / 2]}>
        <mesh position={[0, 0, -0.015]}>
          <boxGeometry args={[w * 0.65, 0.5, 0.035]} />
          <meshStandardMaterial color={pal.trim} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, -0.025]}>
          <boxGeometry args={[w * 0.6, 0.46, 0.01]} />
          <meshStandardMaterial color={pal.glass} emissive={pal.glowWarm} emissiveIntensity={0.6} roughness={0.08} />
        </mesh>
        {/* Vertical mullions */}
        {[-0.12, 0, 0.12].map((mx, i) => (
          <mesh key={i} position={[mx, 0, 0.002]}>
            <boxGeometry args={[0.008, 0.48, 0.012]} />
            <meshStandardMaterial color={pal.metal} metalness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Revolving doors hint */}
      {[-0.08, 0.08].map((dx, i) => (
        <mesh key={i} position={[dx, 0.3, d / 2 + 0.01]}>
          <boxGeometry args={[0.13, 0.5, 0.012]} />
          <meshStandardMaterial color={pal.metal} metalness={0.3} roughness={0.4} />
        </mesh>
      ))}

      <GlowSign w={w} d={d} pal={pal} yPos={0.6} />

      {/* Upper tower — stepped inset */}
      <group position={[0, 0.69, 0]}>
        <TexturedWall w={w - 0.04} h={h - 0.69} d={d - 0.04} pal={pal} seed={seed} />
      </group>

      {/* Window grid */}
      {Array.from({ length: Math.min(floors - 1, 5) }).map((_, i) => (
        <WindowRow key={i} y={0.88 + i * floorH} w={w - 0.04} d={d - 0.04} pal={pal} count={4} winH={0.17} />
      ))}

      {/* Floor bands */}
      {Array.from({ length: Math.min(floors, 5) }).map((_, i) => (
        <mesh key={`b${i}`} position={[0, 0.69 + (i + 1) * floorH, (d - 0.04) / 2 + 0.006]}>
          <boxGeometry args={[w - 0.02, 0.018, 0.008]} />
          <meshStandardMaterial color={pal.wallHighlight} roughness={0.55} />
        </mesh>
      ))}

      {/* Flat roof with antenna */}
      <group position={[0, h, 0]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[w, 0.06, d]} />
          <meshStandardMaterial color={pal.roof} roughness={0.5} />
        </mesh>
        {/* Antenna mast */}
        <mesh position={[w * 0.22, 0.4, 0]}>
          <boxGeometry args={[0.03, 0.7, 0.03]} />
          <meshStandardMaterial color={pal.metal} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Beacon */}
        <mesh position={[w * 0.22, 0.78, 0]}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshStandardMaterial color="#FF3030" emissive="#FF3030" emissiveIntensity={2.5} />
        </mesh>
        {/* AC unit with vent detail */}
        <group position={[-w * 0.18, 0.08, -d * 0.15]}>
          <mesh><boxGeometry args={[0.2, 0.12, 0.16]} /><meshStandardMaterial color="#888" roughness={0.4} metalness={0.2} /></mesh>
          {/* Vent lines */}
          {[-0.04, 0, 0.04].map((vz, vi) => (
            <mesh key={vi} position={[0, 0.02, 0.082 + vz * 0.3]}>
              <boxGeometry args={[0.18, 0.006, 0.006]} />
              <meshStandardMaterial color="#666" />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

function TechTowerBuilding({ w, d, h, pal, seed }: { w: number; d: number; h: number; pal: Palette; seed: number }) {
  const floors = Math.max(4, Math.floor(h / 0.45));
  const floorH = h / floors;
  const setbackH = h * 0.6;

  return (
    <group>
      <Foundation w={w} d={d} pal={pal} />

      {/* Ground — dark tech lobby */}
      <BevelWall w={w} h={0.62} d={d} color={pal.wallShadow} shadowColor={pal.trim} highlightColor={pal.wall} position={[0, 0.38, 0]} />
      
      {/* Full glass front */}
      <mesh position={[0, 0.38, d / 2 + 0.006]}>
        <boxGeometry args={[w * 0.8, 0.5, 0.01]} />
        <meshStandardMaterial color={pal.glass} emissive={pal.glowAccent} emissiveIntensity={0.5} roughness={0.05} />
      </mesh>
      {/* LED accent strip at base */}
      <mesh position={[0, 0.025, d / 2 + 0.008]}>
        <boxGeometry args={[w * 0.88, 0.02, 0.006]} />
        <meshStandardMaterial color={pal.glowAccent} emissive={pal.glowAccent} emissiveIntensity={3.0} />
      </mesh>

      <GlowSign w={w} d={d} pal={pal} />

      {/* Main tower body */}
      <group position={[0, 0.69, 0]}>
        <TexturedWall w={w - 0.06} h={h - 0.69} d={d - 0.06} pal={pal} seed={seed} />
      </group>

      {/* Stepped setback at 60% — unique silhouette */}
      <mesh position={[0, setbackH + (h - setbackH) / 2, 0]}>
        <boxGeometry args={[w - 0.18, h - setbackH, d - 0.18]} />
        <meshStandardMaterial color={pal.wall} roughness={0.5} metalness={0.08} />
      </mesh>

      {/* Horizontal window bands (modern) */}
      {Array.from({ length: Math.min(floors, 6) }).map((_, i) => {
        const inSetback = (0.75 + i * floorH) > setbackH;
        const bw = inSetback ? w - 0.2 : w - 0.06;
        return (
          <mesh key={i} position={[0, 0.78 + i * floorH, (d - 0.06) / 2 + 0.005]}>
            <boxGeometry args={[bw * 0.82, 0.1, 0.008]} />
            <meshStandardMaterial color={pal.glass} emissive={pal.glowWarm} emissiveIntensity={0.9} roughness={0.08} />
          </mesh>
        );
      })}

      {/* Vertical LED corner accents */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], ci) => (
        <mesh key={ci} position={[sx * (w / 2 - 0.04), h / 2, sz * (d / 2 - 0.04)]}>
          <boxGeometry args={[0.012, h * 0.65, 0.012]} />
          <meshStandardMaterial color={pal.glowAccent} emissive={pal.glowAccent} emissiveIntensity={0.8} />
        </mesh>
      ))}

      {/* Roof — spire */}
      <group position={[0, h, 0]}>
        <mesh position={[0, 0.025, 0]}>
          <boxGeometry args={[w - 0.06, 0.05, d - 0.06]} />
          <meshStandardMaterial color={pal.roof} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.05, 0.85, 0.05]} />
          <meshStandardMaterial color={pal.metal} metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.96, 0]}>
          <boxGeometry args={[0.065, 0.065, 0.065]} />
          <meshStandardMaterial color={pal.glowAccent} emissive={pal.glowAccent} emissiveIntensity={2.5} />
        </mesh>
        {/* Dish */}
        <mesh position={[-w * 0.18, 0.18, d * 0.15]}>
          <boxGeometry args={[0.16, 0.12, 0.025]} />
          <meshStandardMaterial color="#AAA" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function CreativeStudioBuilding({ w, d, h, pal, seed }: { w: number; d: number; h: number; pal: Palette; seed: number }) {
  const floors = Math.max(2, Math.floor(h / 0.6));
  const bodyH = h - 0.75;
  const variant = hash(seed, 200) % 2;

  return (
    <group>
      <Foundation w={w} d={d} pal={pal} />

      {/* Ground floor */}
      <BevelWall w={w} h={0.7} d={d} color={pal.wallShadow} shadowColor={pal.trim} highlightColor={pal.wall} position={[0, 0.42, 0]} />
      <RichStorefront w={w} d={d} pal={pal} />
      <DetailedAwning w={w} d={d} color={pal.glowAccent} shadowColor={pal.wallShadow} />
      <GlowSign w={w} d={d} pal={pal} />

      {/* Upper body with textured wall */}
      <group position={[0, 0.75, 0]}>
        <TexturedWall w={w} h={bodyH} d={d} pal={pal} seed={seed} />
      </group>

      {/* Accent mural band */}
      <mesh position={[0, h * 0.5, d / 2 + 0.005]}>
        <boxGeometry args={[w * 0.75, 0.16, 0.01]} />
        <meshStandardMaterial color={pal.glowAccent} emissive={pal.glowAccent} emissiveIntensity={0.25} />
      </mesh>

      {/* Large art windows */}
      {Array.from({ length: Math.min(floors - 1, 3) }).map((_, i) => (
        <WindowRow key={i} y={0.95 + i * 0.55} w={w} d={d} pal={pal} count={2} winH={0.3} />
      ))}

      {/* FOCAL: Balcony with railing detail */}
      <group position={[0, 1.25, d / 2 + 0.1]}>
        {/* Floor slab */}
        <mesh><boxGeometry args={[w * 0.38, 0.025, 0.16]} /><meshStandardMaterial color={pal.ground} roughness={0.7} /></mesh>
        {/* Bottom bracket */}
        <mesh position={[0, -0.02, -0.06]}>
          <boxGeometry args={[w * 0.3, 0.01, 0.04]} />
          <meshStandardMaterial color={pal.wallShadow} />
        </mesh>
        {/* Railing posts */}
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[-w * 0.15 + i * w * 0.05, 0.07, 0.06]}>
            <boxGeometry args={[0.012, 0.12, 0.012]} />
            <meshStandardMaterial color={pal.metal} metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
        {/* Top rail */}
        <mesh position={[0, 0.135, 0.06]}>
          <boxGeometry args={[w * 0.38, 0.014, 0.014]} />
          <meshStandardMaterial color={pal.metal} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Balcony plant */}
        <PottedPlant x={0} z={0.02} scale={0.6} />
      </group>

      {/* Roof: garden terrace */}
      <group position={[0, h, 0]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[w + 0.06, 0.06, d + 0.06]} />
          <meshStandardMaterial color={pal.roof} roughness={0.55} />
        </mesh>
        {/* Garden bed */}
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[w * 0.6, 0.025, d * 0.6]} />
          <meshStandardMaterial color="#2A1810" roughness={0.9} />
        </mesh>
        {/* Rooftop plants */}
        {[[-0.18, -0.1], [0.14, 0.16], [-0.06, 0.2], [0.2, -0.08]].map(([px, pz], i) => (
          <mesh key={i} position={[px, 0.13, pz]}>
            <sphereGeometry args={[0.08, 5, 4]} />
            <meshStandardMaterial color={["#2A7A38", "#1A6A28", "#3A8A38", "#1B5A20"][i]} roughness={0.82} />
          </mesh>
        ))}
        {/* String lights posts */}
        {variant === 0 && (
          <>
            {[-1, 1].map(s => (
              <mesh key={s} position={[s * w * 0.36, 0.16, 0]}>
                <boxGeometry args={[0.02, 0.2, d * 0.65]} />
                <meshStandardMaterial color={pal.metal} metalness={0.4} />
              </mesh>
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <mesh key={`l${i}`} position={[-w * 0.26 + i * w * 0.13, 0.25, 0]}>
                <boxGeometry args={[0.025, 0.025, 0.025]} />
                <meshStandardMaterial color="#FFE060" emissive="#FFD040" emissiveIntensity={2.8} />
              </mesh>
            ))}
          </>
        )}
      </group>

      {/* Street easel */}
      <group position={[w / 2 + 0.18, 0, -d / 2 + 0.12]}>
        <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.11, 0.24, 0.018]} /><meshStandardMaterial color="#E8DCC0" roughness={0.7} /></mesh>
        <mesh position={[0, 0.15, -0.012]}><boxGeometry args={[0.025, 0.28, 0.02]} /><meshStandardMaterial color={pal.wood} roughness={0.8} /></mesh>
      </group>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN BUILDING GENERATOR
// ═══════════════════════════════════════════════════════════

interface VoxelCityBuildingProps {
  x: number; z: number; w: number; d: number; h: number;
  color: string; seed: number; occluded?: boolean; ownerName?: string;
  mirror?: boolean; rotation?: number; forceClass?: BuildingClass;
}

export const VoxelCityBuilding = memo(function VoxelCityBuilding({
  x, z, w, d, h, color, seed, occluded, ownerName, mirror, rotation = 0, forceClass,
}: VoxelCityBuildingProps) {

  const config = useMemo(() => {
    const buildingClass = forceClass || hashPick(BUILDING_CLASSES, seed, 0);
    const basePal = hashPick(PALETTES, seed, 1);
    const hintColor = new THREE.Color(color);
    // More aggressive color blending based on seed for variety
    const blendStrength = 0.08 + hashF(seed, 50) * 0.12; // 0.08-0.20
    const wall = new THREE.Color(basePal.wall).lerp(hintColor, blendStrength).getStyle();
    const wallShadow = new THREE.Color(basePal.wallShadow).lerp(hintColor, blendStrength * 0.7).getStyle();
    const wallHighlight = new THREE.Color(basePal.wallHighlight).lerp(hintColor, blendStrength * 0.5).getStyle();
    // Vary glow warmth per building
    const glowShift = hashF(seed, 60) * 0.15;
    const glowWarm = new THREE.Color(basePal.glowWarm).offsetHSL(glowShift - 0.075, 0, 0).getStyle();
    return { buildingClass, pal: { ...basePal, wall, wallShadow, wallHighlight, glowWarm } };
  }, [seed, color, forceClass]);

  if (occluded) {
    return (
      <group position={[x, 0, z]}>
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={config.pal.wall} transparent opacity={0.06} roughness={0.85} />
        </mesh>
      </group>
    );
  }

  // Apply height micro-variation from seed (±8%)
  const hVar = h * (0.96 + hashF(seed, 70) * 0.08);
  // Apply width micro-variation (±5%)
  const wVar = w * (0.97 + hashF(seed, 71) * 0.06);
  const dVar = d * (0.97 + hashF(seed, 72) * 0.06);

  const classProps = { w: wVar, d: dVar, h: hVar, pal: config.pal, seed };
  const mirrorScale = mirror ? -1 : 1;

  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]} scale={[mirrorScale, 1, 1]}>
      {config.buildingClass === "cafe" && <CafeBuilding {...classProps} />}
      {config.buildingClass === "shop" && <ShopBuilding {...classProps} />}
      {config.buildingClass === "office" && <OfficeBuilding {...classProps} />}
      {config.buildingClass === "tech_tower" && <TechTowerBuilding {...classProps} />}
      {config.buildingClass === "creative_studio" && <CreativeStudioBuilding {...classProps} />}

      {ownerName && (
        <group position={[0, hVar * 0.72, dVar / 2 + 0.04]}>
          <mesh position={[0, 0, -0.015]}>
            <boxGeometry args={[wVar * 0.68, 0.22, 0.03]} />
            <meshStandardMaterial color="#080808" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.004]}>
            <boxGeometry args={[wVar * 0.6, 0.16, 0.006]} />
            <meshStandardMaterial color={config.pal.glowAccent} emissive={config.pal.glowAccent} emissiveIntensity={1.8} />
          </mesh>
        </group>
      )}
    </group>
  );
});

// ═══════════════════════════════════════════════════════════
// MULTI-LEVEL LOD SYSTEM (LOD 0–4)
// ═══════════════════════════════════════════════════════════

/** LOD 1 — Simplified: walls + emissive window strips + roof cap */
const VoxelBuildingLod1 = memo(function VoxelBuildingLod1({
  x, z, w, d, h, color, seed,
}: VoxelCityBuildingProps) {
  const cfg = useMemo(() => {
    const pal = hashPick(PALETTES, seed, 1);
    const wallColor = new THREE.Color(pal.wall).lerp(new THREE.Color(color), 0.1);
    const wallDark = new THREE.Color(pal.wallShadow);
    const roofColor = new THREE.Color(pal.roof);
    return { wallColor, wallDark, roofColor, glow: pal.glowWarm, accent: pal.glowAccent };
  }, [seed, color]);

  const floors = Math.max(2, Math.floor(h / 0.6));

  return (
    <group position={[x, 0, z]}>
      {/* Foundation hint */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[w + 0.04, 0.05, d + 0.04]} />
        <meshStandardMaterial color={cfg.wallDark} roughness={0.85} />
      </mesh>
      {/* Main body */}
      <mesh position={[0, h / 2 + 0.05, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={cfg.wallColor} roughness={0.72} />
      </mesh>
      {/* Window strips */}
      {Array.from({ length: Math.min(floors, 4) }).map((_, i) => (
        <mesh key={i} position={[0, 0.7 + i * (h / floors) + 0.3, d / 2 + 0.006]}>
          <boxGeometry args={[w * 0.7, 0.1, 0.006]} />
          <meshStandardMaterial color="#0A0A14" emissive={cfg.glow} emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* Sign glow */}
      <mesh position={[0, 0.62, d / 2 + 0.008]}>
        <boxGeometry args={[w * 0.4, 0.08, 0.005]} />
        <meshStandardMaterial color={cfg.accent} emissive={cfg.accent} emissiveIntensity={1.5} />
      </mesh>
      {/* Roof cap */}
      <mesh position={[0, h + 0.035, 0]}>
        <boxGeometry args={[w + 0.06, 0.07, d + 0.06]} />
        <meshStandardMaterial color={cfg.roofColor} roughness={0.6} />
      </mesh>
    </group>
  );
});

/** LOD 2 — Low poly: body + colored roof */
const VoxelBuildingLod2 = memo(function VoxelBuildingLod2({
  x, z, w, d, h, color, seed,
}: VoxelCityBuildingProps) {
  const cfg = useMemo(() => {
    const pal = hashPick(PALETTES, seed, 1);
    return {
      wall: new THREE.Color(pal.wall).lerp(new THREE.Color(color), 0.1),
      roof: new THREE.Color(pal.roof),
    };
  }, [seed, color]);

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={cfg.wall} roughness={0.8} />
      </mesh>
      <mesh position={[0, h + 0.02, 0]}>
        <boxGeometry args={[w + 0.04, 0.04, d + 0.04]} />
        <meshStandardMaterial color={cfg.roof} roughness={0.65} />
      </mesh>
    </group>
  );
});

/** LOD 3 — Flat colored block */
const VoxelBuildingLod3 = memo(function VoxelBuildingLod3({
  x, z, w, d, h, color,
}: VoxelCityBuildingProps) {
  const c = useMemo(() => new THREE.Color(color).multiplyScalar(0.5), [color]);
  return (
    <mesh position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={c} roughness={0.95} />
    </mesh>
  );
});

/** LOD 4 — Map-like flat rectangle */
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

/** Multi-level LoD wrapper */
export const VoxelBuildingMultiLoD = memo(function VoxelBuildingMultiLoD(
  props: VoxelCityBuildingProps & { lod: number }
) {
  const { lod, ...buildingProps } = props;
  // Apply rotation to lower LoDs too for consistency
  const wrapperRotation = buildingProps.rotation || 0;
  const wrapperMirror = buildingProps.mirror ? -1 : 1;

  switch (lod) {
    case 0: return <VoxelCityBuilding {...buildingProps} />;
    case 1: return (
      <group rotation={[0, wrapperRotation, 0]} scale={[wrapperMirror, 1, 1]}>
        <VoxelBuildingLod1 {...buildingProps} />
      </group>
    );
    case 2: return <VoxelBuildingLod2 {...buildingProps} />;
    case 3: return <VoxelBuildingLod3 {...buildingProps} />;
    case 4: return <VoxelBuildingLod4 {...buildingProps} />;
    default: return null;
  }
});

/** Legacy LoD wrapper */
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
