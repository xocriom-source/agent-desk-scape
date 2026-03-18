import { memo, useMemo } from "react";
import * as THREE from "three";

/**
 * Art-Directed Diorama Buildings
 * 
 * Philosophy: Each building is a hand-crafted miniature.
 * 5 building classes with curated designs, not random assembly.
 * Strong silhouette → focal point → controlled detail → cinematic light.
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
// ART-DIRECTED PALETTES — curated, harmonious, limited
// Each palette: [wall, wallAccent, trim, warm/glow]
// ═══════════════════════════════════════════════════════════

interface BuildingPalette {
  wall: string;
  wallDark: string;
  trim: string;
  accent: string;
  glow: string;
  windowGlow: string;
  roofMain: string;
  roofAccent: string;
}

const PALETTES: BuildingPalette[] = [
  // Warm Terracotta Café
  { wall: "#C4734B", wallDark: "#8B4A30", trim: "#2A1A10", accent: "#D4A030", glow: "#FFD060", windowGlow: "#FFE4A8", roofMain: "#6B3A2A", roofAccent: "#8B5A3A" },
  // Dusty Blue Bookshop
  { wall: "#6A8BA0", wallDark: "#4A6578", trim: "#1A2A3A", accent: "#E8C870", glow: "#FFE080", windowGlow: "#AADDFF", roofMain: "#3A4A5A", roofAccent: "#5A6A7A" },
  // Cream Patisserie
  { wall: "#E8DCC0", wallDark: "#C4B898", trim: "#3A2A18", accent: "#C94050", glow: "#FF8090", windowGlow: "#FFD4C0", roofMain: "#8A6A4A", roofAccent: "#A08060" },
  // Sage Green Studio
  { wall: "#6A9A78", wallDark: "#4A7A58", trim: "#1A2A1A", accent: "#E8B040", glow: "#FFD860", windowGlow: "#BBFFBB", roofMain: "#3A5A3A", roofAccent: "#4A6A4A" },
  // Deep Plum Bar
  { wall: "#7A4A5A", wallDark: "#5A2A3A", trim: "#1A0A1A", accent: "#D06080", glow: "#FF60A0", windowGlow: "#FFB0D0", roofMain: "#4A2A3A", roofAccent: "#6A3A4A" },
  // Warm Ochre Workshop
  { wall: "#C4983A", wallDark: "#9A7828", trim: "#2A1A08", accent: "#E07030", glow: "#FF8040", windowGlow: "#FFE0B0", roofMain: "#6A4A1A", roofAccent: "#8A6A2A" },
  // Slate Tech Office
  { wall: "#5A6A78", wallDark: "#3A4A58", trim: "#0A0A1A", accent: "#40D0FF", glow: "#40D0FF", windowGlow: "#80D0FF", roofMain: "#2A3A4A", roofAccent: "#4A5A6A" },
  // Rose Boutique
  { wall: "#C4828A", wallDark: "#A46270", trim: "#2A1018", accent: "#FFD060", glow: "#FFD060", windowGlow: "#FFE4C8", roofMain: "#7A4A50", roofAccent: "#9A5A60" },
];

// ═══════════════════════════════════════════════════════════
// BUILDING CLASSES — art-directed templates
// ═══════════════════════════════════════════════════════════

type BuildingClass = "cafe" | "shop" | "office" | "tech_tower" | "creative_studio";
const BUILDING_CLASSES: BuildingClass[] = ["cafe", "shop", "office", "tech_tower", "creative_studio"];

// ═══════════════════════════════════════════════════════════
// MICRO-COMPONENTS — curated building details
// ═══════════════════════════════════════════════════════════

/** Art-directed window grid — clean, intentional placement */
function ArtWindows({ y, w, d, glow, count, h: winH = 0.22 }: {
  y: number; w: number; d: number; glow: string; count: number; h?: number;
}) {
  const winW = w * 0.14;
  const spacing = w / (count + 1);
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const xOff = -w / 2 + spacing * (i + 1);
        return (
          <group key={i}>
            {/* Frame — dark, thin */}
            <mesh position={[xOff, y, d / 2 + 0.008]}>
              <boxGeometry args={[winW + 0.025, winH + 0.025, 0.012]} />
              <meshStandardMaterial color="#0A0A14" />
            </mesh>
            {/* Glass — warm interior glow */}
            <mesh position={[xOff, y, d / 2 + 0.016]}>
              <boxGeometry args={[winW, winH, 0.008]} />
              <meshStandardMaterial color="#050508" emissive={glow} emissiveIntensity={1.2} />
            </mesh>
            {/* Sill */}
            <mesh position={[xOff, y - winH / 2 - 0.015, d / 2 + 0.022]}>
              <boxGeometry args={[winW + 0.04, 0.018, 0.025]} />
              <meshStandardMaterial color="#3A3A3A" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Cinematic sign — the focal point of ground floor */
function CinematicSign({ w, d, glowColor, label }: {
  w: number; d: number; glowColor: string; label: string;
}) {
  return (
    <group position={[0, 0.6, d / 2 + 0.005]}>
      {/* Sign backing — dark */}
      <mesh>
        <boxGeometry args={[w * 0.55, 0.16, 0.025]} />
        <meshStandardMaterial color="#0A0A0A" />
      </mesh>
      {/* Glowing text panel */}
      <mesh position={[0, 0, 0.016]}>
        <boxGeometry args={[w * 0.48, 0.11, 0.006]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.6} />
      </mesh>
      {/* Subtle glow halo (bloom fake) */}
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[w * 0.56, 0.18, 0.003]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.3} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

/** Curated awning — striped, with depth */
function CuratedAwning({ w, d, color }: { w: number; d: number; color: string }) {
  const stripe = new THREE.Color(color).lerp(new THREE.Color("#FFFFFF"), 0.6).getStyle();
  return (
    <group position={[0, 0.78, d / 2 + 0.16]}>
      {/* Main canopy — layered for stepped voxel look */}
      <mesh><boxGeometry args={[w * 0.85, 0.035, 0.36]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, -0.035, 0.04]}>
        <boxGeometry args={[w * 0.85, 0.035, 0.26]} /><meshStandardMaterial color={color} />
      </mesh>
      {/* Stripes */}
      {[-2, -1, 0, 1, 2].map(i => (
        <mesh key={i} position={[i * w * 0.13, 0.019, 0]}>
          <boxGeometry args={[w * 0.05, 0.004, 0.38]} />
          <meshStandardMaterial color={stripe} transparent opacity={0.45} />
        </mesh>
      ))}
      {/* Scalloped edge */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`sc-${i}`} position={[-w * 0.34 + i * w * 0.135, -0.085, 0.14]}>
          <boxGeometry args={[w * 0.055, 0.028, 0.012]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

/** Ground floor storefront — large window, warm interior */
function ArtStorefront({ w, d, pal, type }: {
  w: number; d: number; pal: BuildingPalette; type: BuildingClass;
}) {
  const interiorGlow = type === "cafe" ? "#FFD080" : type === "shop" ? "#FFCC80" : "#AADDFF";
  const doorW = type === "shop" ? 0.32 : 0.24;
  const doorSide = type === "cafe" ? 0.28 : 0.22;
  return (
    <group>
      {/* Large storefront window — focal point */}
      <mesh position={[-w * 0.1, 0.38, d / 2 + 0.008]}>
        <boxGeometry args={[w * 0.5, 0.46, 0.012]} />
        <meshStandardMaterial color="#050508" emissive={interiorGlow} emissiveIntensity={0.7} />
      </mesh>
      {/* Window frame */}
      <mesh position={[-w * 0.1, 0.38, d / 2 + 0.012]}>
        <boxGeometry args={[w * 0.52, 0.48, 0.006]} />
        <meshStandardMaterial color={pal.trim} />
      </mesh>
      {/* Door */}
      <mesh position={[w * doorSide, 0.28, d / 2 + 0.015]}>
        <boxGeometry args={[doorW, 0.5, 0.018]} />
        <meshStandardMaterial color={pal.trim} />
      </mesh>
      {/* Door handle */}
      <mesh position={[w * doorSide - 0.05, 0.28, d / 2 + 0.03]}>
        <boxGeometry args={[0.02, 0.03, 0.02]} />
        <meshStandardMaterial color="#C4983A" metalness={0.8} />
      </mesh>
      {/* Step */}
      <mesh position={[w * doorSide, 0.015, d / 2 + 0.08]}>
        <boxGeometry args={[doorW + 0.08, 0.03, 0.06]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Interior floor glow */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[w * 0.85, 0.01, d * 0.85]} />
        <meshStandardMaterial color="#2A1A08" emissive={interiorGlow} emissiveIntensity={0.12} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// BUILDING CLASS RENDERERS — art-directed full compositions
// ═══════════════════════════════════════════════════════════

/** CAFÉ — warm, inviting, low building with peaked roof and outdoor seating */
function CafeBuilding({ w, d, h, pal, seed }: { w: number; d: number; h: number; pal: BuildingPalette; seed: number }) {
  const floors = Math.max(2, Math.floor(h / 0.65));
  const bodyH = h - 0.7;
  const variant = hash(seed, 100) % 3;

  return (
    <group>
      {/* ── BASE: dark stone foundation ── */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[w + 0.04, 0.1, d + 0.04]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.9} />
      </mesh>

      {/* ── GROUND FLOOR: warm, inviting ── */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[w, 0.7, d]} />
        <meshStandardMaterial color={pal.wallDark} roughness={0.75} />
      </mesh>
      <ArtStorefront w={w} d={d} pal={pal} type="cafe" />
      <CuratedAwning w={w} d={d} color={pal.accent} />
      <CinematicSign w={w} d={d} glowColor={pal.glow} label="CAFÉ" />

      {/* ── UPPER: main wall body ── */}
      <mesh position={[0, 0.7 + bodyH / 2, 0]} castShadow>
        <boxGeometry args={[w, bodyH, d]} />
        <meshStandardMaterial color={pal.wall} roughness={0.7} />
      </mesh>

      {/* ── WINDOWS: clean rows ── */}
      {Array.from({ length: Math.min(floors - 1, 3) }).map((_, i) => (
        <ArtWindows key={i} y={0.9 + i * 0.55} w={w} d={d} glow={pal.windowGlow} count={3} />
      ))}

      {/* ── FLOOR BANDS ── */}
      {Array.from({ length: Math.min(floors, 3) }).map((_, i) => (
        <mesh key={`band-${i}`} position={[0, 0.7 + (i + 1) * (bodyH / floors), d / 2 + 0.003]}>
          <boxGeometry args={[w + 0.015, 0.02, 0.008]} />
          <meshStandardMaterial color={pal.trim} />
        </mesh>
      ))}

      {/* ── ROOF: peaked (stepped voxel pyramid) ── */}
      <group position={[0, h, 0]}>
        {[0, 1, 2, 3].map(step => (
          <mesh key={step} position={[0, step * 0.08 + 0.04, 0]}>
            <boxGeometry args={[w - step * 0.25, 0.08, d - step * 0.25]} />
            <meshStandardMaterial color={pal.roofMain} roughness={0.65} />
          </mesh>
        ))}
        {/* Chimney */}
        {variant === 0 && (
          <group position={[w * 0.25, 0.45, -d * 0.15]}>
            <mesh><boxGeometry args={[0.12, 0.25, 0.12]} /><meshStandardMaterial color={pal.roofAccent} /></mesh>
            <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.15, 0.04, 0.15]} /><meshStandardMaterial color={pal.trim} /></mesh>
          </group>
        )}
      </group>

      {/* ── FOCAL: outdoor seating ── */}
      {[[-0.35, 0.06, d / 2 + 0.5], [0.15, 0.06, d / 2 + 0.5]].map(([tx, ty, tz], i) => (
        <group key={`seat-${i}`} position={[tx, ty, tz]}>
          {/* Table */}
          <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.18, 0.02, 0.18]} /><meshStandardMaterial color="#8B6B3A" /></mesh>
          <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.03, 0.12, 0.03]} /><meshStandardMaterial color="#5A4A3A" /></mesh>
          {/* Chair */}
          <mesh position={[0.14, 0.08, 0]}><boxGeometry args={[0.1, 0.02, 0.1]} /><meshStandardMaterial color="#4A3A2A" /></mesh>
          <mesh position={[0.14, 0.14, -0.04]}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshStandardMaterial color="#4A3A2A" /></mesh>
        </group>
      ))}

      {/* ── CONTEXT: potted plant at entrance ── */}
      <group position={[-w / 2 - 0.15, 0, d / 2 + 0.08]}>
        <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.1, 0.12, 0.1]} /><meshStandardMaterial color="#7A5A3A" /></mesh>
        <mesh position={[0, 0.16, 0]}><boxGeometry args={[0.13, 0.1, 0.13]} /><meshStandardMaterial color="#2D7A3A" /></mesh>
      </group>
    </group>
  );
}

/** SHOP — wide front, display window, hanging sign */
function ShopBuilding({ w, d, h, pal, seed }: { w: number; d: number; h: number; pal: BuildingPalette; seed: number }) {
  const floors = Math.max(2, Math.floor(h / 0.65));
  const bodyH = h - 0.7;

  return (
    <group>
      {/* Foundation */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[w + 0.04, 0.1, d + 0.04]} />
        <meshStandardMaterial color="#2A2A28" roughness={0.9} />
      </mesh>

      {/* Ground floor */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[w, 0.7, d]} />
        <meshStandardMaterial color={pal.wallDark} roughness={0.75} />
      </mesh>

      {/* Wide display window — focal point */}
      <mesh position={[0, 0.4, d / 2 + 0.008]}>
        <boxGeometry args={[w * 0.7, 0.5, 0.012]} />
        <meshStandardMaterial color="#050508" emissive={pal.windowGlow} emissiveIntensity={0.65} />
      </mesh>
      <mesh position={[0, 0.4, d / 2 + 0.012]}>
        <boxGeometry args={[w * 0.72, 0.52, 0.006]} />
        <meshStandardMaterial color={pal.trim} />
      </mesh>
      {/* Door (offset right) */}
      <mesh position={[w * 0.3, 0.28, d / 2 + 0.016]}>
        <boxGeometry args={[0.28, 0.5, 0.016]} />
        <meshStandardMaterial color={pal.trim} />
      </mesh>

      <CuratedAwning w={w} d={d} color={pal.accent} />

      {/* FOCAL: Hanging perpendicular sign */}
      <group position={[w / 2 + 0.06, 0.75, 0]}>
        <mesh position={[-0.03, 0.06, 0]}>
          <boxGeometry args={[0.06, 0.025, 0.025]} /><meshStandardMaterial color="#333" metalness={0.6} />
        </mesh>
        <mesh position={[0.06, 0, 0]}>
          <boxGeometry args={[0.025, 0.22, 0.16]} />
          <meshStandardMaterial color="#0A0A0A" />
        </mesh>
        <mesh position={[0.076, 0, 0]}>
          <boxGeometry args={[0.006, 0.17, 0.12]} />
          <meshStandardMaterial color={pal.glow} emissive={pal.glow} emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Upper body */}
      <mesh position={[0, 0.7 + bodyH / 2, 0]} castShadow>
        <boxGeometry args={[w, bodyH, d]} />
        <meshStandardMaterial color={pal.wall} roughness={0.7} />
      </mesh>

      {/* Windows */}
      {Array.from({ length: Math.min(floors - 1, 3) }).map((_, i) => (
        <ArtWindows key={i} y={0.9 + i * 0.55} w={w} d={d} glow={pal.windowGlow} count={3} />
      ))}

      {/* Roof: flat with parapet edge */}
      <group position={[0, h, 0]}>
        <mesh position={[0, 0.035, 0]}>
          <boxGeometry args={[w + 0.08, 0.07, d + 0.08]} /><meshStandardMaterial color={pal.roofMain} roughness={0.55} />
        </mesh>
        {/* Parapet */}
        {[
          [0, 0.1, d / 2 + 0.02, w + 0.08, 0.06, 0.025],
          [0, 0.1, -d / 2 - 0.02, w + 0.08, 0.06, 0.025],
        ].map(([px, py, pz, bw, bh, bd], i) => (
          <mesh key={i} position={[px, py, pz]}>
            <boxGeometry args={[bw, bh, bd]} /><meshStandardMaterial color={pal.roofAccent} />
          </mesh>
        ))}
      </group>

      {/* Context: A-frame board on sidewalk */}
      <group position={[w / 2 + 0.25, 0, d / 2 + 0.2]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.14, 0.22, 0.025]} /><meshStandardMaterial color="#2A2A2A" />
        </mesh>
        <mesh position={[0, 0.12, 0.006]}>
          <boxGeometry args={[0.1, 0.16, 0.012]} /><meshStandardMaterial color="#E8D8B0" />
        </mesh>
      </group>
    </group>
  );
}

/** OFFICE — taller, clean lines, glass facade, antenna */
function OfficeBuilding({ w, d, h, pal, seed }: { w: number; d: number; h: number; pal: BuildingPalette; seed: number }) {
  const floors = Math.max(3, Math.floor(h / 0.5));
  const floorH = h / floors;

  return (
    <group>
      {/* Foundation */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[w + 0.05, 0.08, d + 0.05]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.9} />
      </mesh>

      {/* Ground floor — lobby */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[w, 0.62, d]} />
        <meshStandardMaterial color={pal.wallDark} roughness={0.6} />
      </mesh>
      {/* Glass lobby entrance */}
      <mesh position={[0, 0.35, d / 2 + 0.008]}>
        <boxGeometry args={[w * 0.6, 0.48, 0.01]} />
        <meshStandardMaterial color="#0A0A14" emissive={pal.windowGlow} emissiveIntensity={0.5} />
      </mesh>
      {/* Double doors */}
      {[-0.09, 0.09].map((dx, i) => (
        <mesh key={i} position={[dx, 0.28, d / 2 + 0.016]}>
          <boxGeometry args={[0.14, 0.46, 0.014]} />
          <meshStandardMaterial color={pal.trim} />
        </mesh>
      ))}

      {/* Sign — subtle, corporate */}
      <CinematicSign w={w} d={d} glowColor={pal.glow} label="OFFICE" />

      {/* Upper floors — stepped inset for silhouette */}
      <mesh position={[0, 0.66 + (h - 0.66) / 2, 0]} castShadow>
        <boxGeometry args={[w - 0.04, h - 0.66, d - 0.04]} />
        <meshStandardMaterial color={pal.wall} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Window grid — clean, corporate */}
      {Array.from({ length: Math.min(floors - 1, 5) }).map((_, i) => (
        <ArtWindows key={i} y={0.85 + i * floorH} w={w - 0.04} d={d - 0.04} glow={pal.windowGlow} count={4} h={0.18} />
      ))}

      {/* Horizontal bands per floor */}
      {Array.from({ length: Math.min(floors, 5) }).map((_, i) => (
        <mesh key={`b-${i}`} position={[0, 0.66 + (i + 1) * floorH, (d - 0.04) / 2 + 0.003]}>
          <boxGeometry args={[w - 0.02, 0.015, 0.006]} />
          <meshStandardMaterial color={pal.trim} />
        </mesh>
      ))}

      {/* Roof — flat with antenna */}
      <group position={[0, h, 0]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[w, 0.06, d]} /><meshStandardMaterial color={pal.roofMain} />
        </mesh>
        {/* Antenna — focal silhouette element */}
        <mesh position={[w * 0.25, 0.4, 0]}>
          <boxGeometry args={[0.035, 0.7, 0.035]} /><meshStandardMaterial color="#555" metalness={0.6} />
        </mesh>
        <mesh position={[w * 0.25, 0.78, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshStandardMaterial color="#FF3030" emissive="#FF3030" emissiveIntensity={2.0} />
        </mesh>
        {/* AC unit */}
        <mesh position={[-w * 0.2, 0.12, -d * 0.15]}>
          <boxGeometry args={[0.22, 0.14, 0.18]} /><meshStandardMaterial color="#888" />
        </mesh>
      </group>
    </group>
  );
}

/** TECH TOWER — tallest, sleek, glass-heavy, LED accents */
function TechTowerBuilding({ w, d, h, pal, seed }: { w: number; d: number; h: number; pal: BuildingPalette; seed: number }) {
  const floors = Math.max(4, Math.floor(h / 0.45));
  const floorH = h / floors;

  return (
    <group>
      {/* Foundation — wider base plate */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[w + 0.1, 0.06, d + 0.1]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>

      {/* Ground floor — glass lobby with LED accent */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[w, 0.62, d]} />
        <meshStandardMaterial color={pal.wallDark} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Full glass front */}
      <mesh position={[0, 0.38, d / 2 + 0.006]}>
        <boxGeometry args={[w * 0.8, 0.5, 0.01]} />
        <meshStandardMaterial color="#050510" emissive={pal.glow} emissiveIntensity={0.45} />
      </mesh>
      {/* LED accent strip at base — focal */}
      <mesh position={[0, 0.025, d / 2 + 0.01]}>
        <boxGeometry args={[w * 0.9, 0.025, 0.008]} />
        <meshStandardMaterial color={pal.glow} emissive={pal.glow} emissiveIntensity={2.5} />
      </mesh>

      <CinematicSign w={w} d={d} glowColor={pal.glow} label="TECH" />

      {/* Main tower — slight inset for silhouette depth */}
      <mesh position={[0, 0.66 + (h - 0.66) / 2, 0]} castShadow>
        <boxGeometry args={[w - 0.06, h - 0.66, d - 0.06]} />
        <meshStandardMaterial color={pal.wall} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Stepped setback at 60% height for unique silhouette */}
      <mesh position={[0, h * 0.6 + (h * 0.4) / 2, 0]}>
        <boxGeometry args={[w - 0.2, h * 0.4, d - 0.2]} />
        <meshStandardMaterial color={pal.wall} roughness={0.5} metalness={0.12} />
      </mesh>

      {/* Window strips — horizontal bands (modern look) */}
      {Array.from({ length: Math.min(floors, 6) }).map((_, i) => (
        <mesh key={i} position={[0, 0.75 + i * floorH, (d - 0.06) / 2 + 0.005]}>
          <boxGeometry args={[(i > floors * 0.6 ? w - 0.2 : w - 0.06) * 0.85, 0.12, 0.008]} />
          <meshStandardMaterial color="#050510" emissive={pal.windowGlow} emissiveIntensity={0.8} />
        </mesh>
      ))}

      {/* Vertical LED accent lines on corners */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], ci) => (
        <mesh key={ci} position={[sx * (w / 2 - 0.04), h / 2, sz * (d / 2 - 0.04)]}>
          <boxGeometry args={[0.015, h * 0.7, 0.015]} />
          <meshStandardMaterial color={pal.glow} emissive={pal.glow} emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* Roof — antenna cluster */}
      <group position={[0, h, 0]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[w - 0.06, 0.06, d - 0.06]} /><meshStandardMaterial color={pal.roofMain} />
        </mesh>
        {/* Spire */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.06, 0.8, 0.06]} /><meshStandardMaterial color="#666" metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.94, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color={pal.glow} emissive={pal.glow} emissiveIntensity={2.0} />
        </mesh>
        {/* Satellite dish */}
        <mesh position={[-w * 0.2, 0.2, d * 0.15]}>
          <boxGeometry args={[0.18, 0.14, 0.03]} /><meshStandardMaterial color="#aaa" metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** CREATIVE STUDIO — eclectic, colorful accent, rooftop garden, balconies */
function CreativeStudioBuilding({ w, d, h, pal, seed }: { w: number; d: number; h: number; pal: BuildingPalette; seed: number }) {
  const floors = Math.max(2, Math.floor(h / 0.6));
  const bodyH = h - 0.7;
  const variant = hash(seed, 200) % 2;

  return (
    <group>
      {/* Foundation */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[w + 0.04, 0.1, d + 0.04]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.9} />
      </mesh>

      {/* Ground floor */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[w, 0.7, d]} />
        <meshStandardMaterial color={pal.wallDark} roughness={0.75} />
      </mesh>
      <ArtStorefront w={w} d={d} pal={pal} type="creative_studio" />
      <CuratedAwning w={w} d={d} color={pal.accent} />
      <CinematicSign w={w} d={d} glowColor={pal.glow} label="STUDIO" />

      {/* Upper body — with accent color band */}
      <mesh position={[0, 0.7 + bodyH / 2, 0]} castShadow>
        <boxGeometry args={[w, bodyH, d]} />
        <meshStandardMaterial color={pal.wall} roughness={0.7} />
      </mesh>
      {/* Accent color band (mural hint) */}
      <mesh position={[0, h * 0.5, d / 2 + 0.004]}>
        <boxGeometry args={[w * 0.8, 0.18, 0.008]} />
        <meshStandardMaterial color={pal.accent} emissive={pal.accent} emissiveIntensity={0.2} />
      </mesh>

      {/* Windows */}
      {Array.from({ length: Math.min(floors - 1, 3) }).map((_, i) => (
        <ArtWindows key={i} y={0.9 + i * 0.55} w={w} d={d} glow={pal.windowGlow} count={2} h={0.28} />
      ))}

      {/* FOCAL: Balcony on second floor */}
      <group position={[0, 1.2, d / 2 + 0.1]}>
        <mesh><boxGeometry args={[w * 0.4, 0.03, 0.18]} /><meshStandardMaterial color="#555" /></mesh>
        {[-2, -1, 0, 1, 2].map(i => (
          <mesh key={i} position={[i * w * 0.07, 0.08, 0.07]}>
            <boxGeometry args={[0.02, 0.12, 0.02]} /><meshStandardMaterial color="#444" metalness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0.14, 0.07]}>
          <boxGeometry args={[w * 0.4, 0.02, 0.02]} /><meshStandardMaterial color="#444" metalness={0.5} />
        </mesh>
        {/* Balcony plant */}
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.1, 0.05, 0.08]} /><meshStandardMaterial color="#7A5A3A" /></mesh>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.12, 0.06, 0.1]} /><meshStandardMaterial color="#2D7A3A" /></mesh>
      </group>

      {/* Roof: garden terrace — signature studio element */}
      <group position={[0, h, 0]}>
        <mesh position={[0, 0.035, 0]}>
          <boxGeometry args={[w + 0.06, 0.07, d + 0.06]} /><meshStandardMaterial color={pal.roofMain} />
        </mesh>
        {/* Garden bed */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[w * 0.65, 0.03, d * 0.65]} /><meshStandardMaterial color="#3A2818" />
        </mesh>
        {/* Plants */}
        {[[-0.2, -0.12], [0.15, 0.18], [-0.08, 0.22], [0.22, -0.1]].map(([px, pz], i) => (
          <mesh key={i} position={[px, 0.15, pz]}>
            <boxGeometry args={[0.12, 0.1, 0.12]} />
            <meshStandardMaterial color={["#2D7A3A", "#1A6A2A", "#3A8A3A", "#1B5A20"][i]} />
          </mesh>
        ))}
        {/* String lights */}
        {variant === 0 && (
          <>
            {[-1, 1].map(s => (
              <mesh key={s} position={[s * w * 0.38, 0.18, 0]}>
                <boxGeometry args={[0.025, 0.22, d * 0.7]} /><meshStandardMaterial color="#555" />
              </mesh>
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <mesh key={`l-${i}`} position={[-w * 0.28 + i * w * 0.14, 0.28, 0]}>
                <boxGeometry args={[0.03, 0.03, 0.03]} />
                <meshStandardMaterial color="#FFE060" emissive="#FFD040" emissiveIntensity={2.2} />
              </mesh>
            ))}
          </>
        )}
      </group>

      {/* Context: Street art easel */}
      <group position={[w / 2 + 0.2, 0, -d / 2 + 0.15]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.12, 0.26, 0.02]} /><meshStandardMaterial color="#E8DCC0" />
        </mesh>
        <mesh position={[0, 0.15, -0.015]}>
          <boxGeometry args={[0.03, 0.3, 0.03]} /><meshStandardMaterial color="#5A4A3A" />
        </mesh>
      </group>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN BUILDING GENERATOR — class-based dispatch
// ═══════════════════════════════════════════════════════════

interface VoxelCityBuildingProps {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  seed: number;
  occluded?: boolean;
  ownerName?: string;
}

export const VoxelCityBuilding = memo(function VoxelCityBuilding({
  x, z, w, d, h, color, seed, occluded, ownerName,
}: VoxelCityBuildingProps) {

  const config = useMemo(() => {
    // Pick building class based on seed (weighted for variety)
    const buildingClass = hashPick(BUILDING_CLASSES, seed, 0);
    // Pick palette — blend with input color hint
    const basePal = hashPick(PALETTES, seed, 1);
    const hintColor = new THREE.Color(color);
    const wall = new THREE.Color(basePal.wall).lerp(hintColor, 0.12).getStyle();
    const wallDark = new THREE.Color(basePal.wallDark).lerp(hintColor, 0.1).getStyle();

    return {
      buildingClass,
      pal: { ...basePal, wall, wallDark },
    };
  }, [seed, color]);

  if (occluded) {
    return (
      <group position={[x, 0, z]}>
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={config.pal.wall} transparent opacity={0.08} roughness={0.85} />
        </mesh>
      </group>
    );
  }

  const classProps = { w, d, h, pal: config.pal, seed };

  return (
    <group position={[x, 0, z]}>
      {/* Render by class */}
      {config.buildingClass === "cafe" && <CafeBuilding {...classProps} />}
      {config.buildingClass === "shop" && <ShopBuilding {...classProps} />}
      {config.buildingClass === "office" && <OfficeBuilding {...classProps} />}
      {config.buildingClass === "tech_tower" && <TechTowerBuilding {...classProps} />}
      {config.buildingClass === "creative_studio" && <CreativeStudioBuilding {...classProps} />}

      {/* Owner name sign (for user buildings) */}
      {ownerName && (
        <group position={[0, h * 0.72, d / 2 + 0.035]}>
          <mesh position={[0, 0, -0.012]}>
            <boxGeometry args={[w * 0.7, 0.24, 0.025]} />
            <meshStandardMaterial color="#0A0A0A" />
          </mesh>
          <mesh position={[0, 0, 0.004]}>
            <boxGeometry args={[w * 0.64, 0.18, 0.008]} />
            <meshStandardMaterial
              color={config.pal.glow}
              emissive={config.pal.glow}
              emissiveIntensity={1.4}
            />
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
    const wallColor = new THREE.Color(pal.wall).lerp(new THREE.Color(color), 0.12);
    const roofColor = new THREE.Color(pal.roofMain);
    return { wallColor, roofColor, glow: pal.windowGlow };
  }, [seed, color]);

  const floors = Math.max(2, Math.floor(h / 0.6));

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={cfg.wallColor} roughness={0.75} />
      </mesh>
      {Array.from({ length: Math.min(floors, 4) }).map((_, i) => (
        <mesh key={i} position={[0, 0.7 + i * (h / floors) + 0.3, d / 2 + 0.008]}>
          <boxGeometry args={[w * 0.7, 0.12, 0.008]} />
          <meshStandardMaterial color="#050508" emissive={cfg.glow} emissiveIntensity={0.7} />
        </mesh>
      ))}
      <mesh position={[0, h + 0.035, 0]}>
        <boxGeometry args={[w + 0.08, 0.07, d + 0.08]} />
        <meshStandardMaterial color={cfg.roofColor} roughness={0.6} />
      </mesh>
    </group>
  );
});

/** LOD 2 — Low poly: single box with color */
const VoxelBuildingLod2 = memo(function VoxelBuildingLod2({
  x, z, w, d, h, color, seed,
}: VoxelCityBuildingProps) {
  const wallColor = useMemo(() => {
    const pal = hashPick(PALETTES, seed, 1);
    return new THREE.Color(pal.wall).lerp(new THREE.Color(color), 0.12);
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

/** LOD 3 — Flat colored block */
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
  switch (lod) {
    case 0: return <VoxelCityBuilding {...buildingProps} />;
    case 1: return <VoxelBuildingLod1 {...buildingProps} />;
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
