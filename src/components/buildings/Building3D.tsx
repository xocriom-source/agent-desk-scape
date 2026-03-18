import { useRef, useState, memo, useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { CityBuilding } from "@/types/building";
import { BuildingProps, useBuildingProps } from "./VoxelProps";
import { GLBBuildingModel, GLBDetailModel } from "./GLBBuildingModel";

interface Building3DProps {
  building: CityBuilding;
  onClick?: () => void;
  highlighted?: boolean;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

// ── Voxel pixel-art style configs per building style ──
const VOXEL_STYLES: Record<string, {
  baseWidth: number;
  baseDepth: number;
  floorHeight: number;
  roofType: "flat" | "peaked" | "terrace" | "dome" | "antenna";
  hasAwning: boolean;
  hasBalcony: boolean;
  awningColor: string;
  windowStyle: "grid" | "wide" | "circle" | "shutter";
  accentPieces: number;
  facadePattern: "brick" | "smooth" | "panel" | "stripe";
}> = {
  corporate: { baseWidth: 2.8, baseDepth: 2.4, floorHeight: 1.2, roofType: "flat", hasAwning: false, hasBalcony: true, awningColor: "#2a4a7f", windowStyle: "grid", accentPieces: 2, facadePattern: "smooth" },
  creative: { baseWidth: 2.6, baseDepth: 2.2, floorHeight: 1.4, roofType: "peaked", hasAwning: true, hasBalcony: true, awningColor: "#c94040", windowStyle: "wide", accentPieces: 3, facadePattern: "brick" },
  startup: { baseWidth: 2.2, baseDepth: 2.0, floorHeight: 1.0, roofType: "antenna", hasAwning: true, hasBalcony: false, awningColor: "#40a060", windowStyle: "wide", accentPieces: 1, facadePattern: "panel" },
  tech: { baseWidth: 2.4, baseDepth: 2.4, floorHeight: 1.1, roofType: "dome", hasAwning: false, hasBalcony: true, awningColor: "#3a7acc", windowStyle: "circle", accentPieces: 2, facadePattern: "stripe" },
  agency: { baseWidth: 2.6, baseDepth: 2.6, floorHeight: 1.3, roofType: "terrace", hasAwning: true, hasBalcony: true, awningColor: "#d4a030", windowStyle: "shutter", accentPieces: 2, facadePattern: "brick" },
  minimal: { baseWidth: 2.0, baseDepth: 2.0, floorHeight: 1.2, roofType: "flat", hasAwning: false, hasBalcony: false, awningColor: "#888", windowStyle: "wide", accentPieces: 0, facadePattern: "smooth" },
  futuristic: { baseWidth: 2.2, baseDepth: 2.2, floorHeight: 1.0, roofType: "dome", hasAwning: false, hasBalcony: true, awningColor: "#6040c0", windowStyle: "circle", accentPieces: 3, facadePattern: "panel" },
  industrial: { baseWidth: 3.0, baseDepth: 2.8, floorHeight: 1.5, roofType: "flat", hasAwning: true, hasBalcony: false, awningColor: "#705030", windowStyle: "grid", accentPieces: 1, facadePattern: "stripe" },
};

const BLACK = new THREE.Color(0x000000);

// ── Facade texture pattern (brick/panel/stripe) ──
function FacadeDetail({ w, d, h, pattern, color }: { w: number; d: number; h: number; pattern: string; color: THREE.Color }) {
  const darkColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.85), [color]);
  const lightColor = useMemo(() => new THREE.Color(color).multiplyScalar(1.1), [color]);

  if (pattern === "brick") {
    const rows = Math.floor(h / 0.15);
    return (
      <group>
        {Array.from({ length: Math.min(rows, 12) }).map((_, r) => (
          <mesh key={r} position={[0, 0.8 + r * (h - 0.8) / rows, d / 2 + 0.005]}>
            <boxGeometry args={[w + 0.01, 0.01, 0.01]} />
            <meshStandardMaterial color={darkColor} />
          </mesh>
        ))}
      </group>
    );
  }
  if (pattern === "panel") {
    return (
      <group>
        {/* Vertical panel lines */}
        {Array.from({ length: 4 }).map((_, i) => {
          const x = -w / 2 + (i + 1) * (w / 5);
          return (
            <mesh key={i} position={[x, 0.8 + (h - 0.8) / 2, d / 2 + 0.005]}>
              <boxGeometry args={[0.02, h - 0.8, 0.01]} />
              <meshStandardMaterial color={darkColor} />
            </mesh>
          );
        })}
      </group>
    );
  }
  if (pattern === "stripe") {
    return (
      <group>
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={i} position={[0, 0.8 + (i + 1) * (h - 0.8) / 4, d / 2 + 0.005]}>
            <boxGeometry args={[w + 0.01, 0.06, 0.01]} />
            <meshStandardMaterial color={lightColor} />
          </mesh>
        ))}
      </group>
    );
  }
  return null;
}

// ── Pixel-art window row (all 4 sides) ──
function VoxelWindows({ floor, floorH, w, d, style, seed }: { floor: number; floorH: number; w: number; d: number; style: string; seed: number }) {
  const y = floor * floorH + floorH * 0.55;
  const vs = VOXEL_STYLES[style] || VOXEL_STYLES.corporate;
  const winW = vs.windowStyle === "wide" ? w * 0.35 : w * 0.2;
  const winH = vs.windowStyle === "wide" ? floorH * 0.45 : floorH * 0.35;
  const count = vs.windowStyle === "grid" ? 3 : 2;
  const spacing = w / (count + 1);
  const sideCount = Math.max(1, count - 1);
  const sideSpacing = d / (sideCount + 1);

  // Vary glow intensity per window (some lit, some dark)
  const litPattern = useMemo(() => {
    const pattern: boolean[] = [];
    for (let i = 0; i < 20; i++) {
      pattern.push(((seed + i * 7 + floor * 13) % 5) !== 0);
    }
    return pattern;
  }, [seed, floor]);

  return (
    <group>
      {/* Front windows */}
      {Array.from({ length: count }).map((_, i) => {
        const xOff = -w / 2 + spacing * (i + 1);
        const isLit = litPattern[i];
        const glowColor = isLit ? "#FFD866" : "#334455";
        const intensity = isLit ? 0.9 : 0.1;
        return (
          <group key={`fw-${i}`}>
            <mesh position={[xOff, y, d / 2 + 0.01]}>
              <boxGeometry args={[winW + 0.06, winH + 0.06, 0.02]} />
              <meshStandardMaterial color="#1a1a2e" />
            </mesh>
            <mesh position={[xOff, y, d / 2 + 0.02]}>
              <boxGeometry args={[winW, winH, 0.02]} />
              <meshStandardMaterial color="#0a0a15" emissive={glowColor} emissiveIntensity={intensity} />
            </mesh>
            <mesh position={[xOff, y, d / 2 + 0.03]}>
              <boxGeometry args={[0.02, winH, 0.01]} />
              <meshStandardMaterial color="#2a2a3e" />
            </mesh>
            <mesh position={[xOff, y, d / 2 + 0.03]}>
              <boxGeometry args={[winW, 0.02, 0.01]} />
              <meshStandardMaterial color="#2a2a3e" />
            </mesh>
            {/* Window sill */}
            <mesh position={[xOff, y - winH / 2 - 0.02, d / 2 + 0.04]}>
              <boxGeometry args={[winW + 0.08, 0.03, 0.06]} />
              <meshStandardMaterial color="#555" />
            </mesh>
          </group>
        );
      })}
      {/* Back windows */}
      {Array.from({ length: count }).map((_, i) => {
        const xOff = -w / 2 + spacing * (i + 1);
        const isLit = litPattern[count + i];
        return (
          <mesh key={`bw-${i}`} position={[xOff, y, -d / 2 - 0.01]}>
            <boxGeometry args={[winW, winH, 0.02]} />
            <meshStandardMaterial color="#0a0a15" emissive={isLit ? "#FFD866" : "#223344"} emissiveIntensity={isLit ? 0.6 : 0.05} />
          </mesh>
        );
      })}
      {/* Side windows (left) */}
      {Array.from({ length: sideCount }).map((_, i) => {
        const zOff = -d / 2 + sideSpacing * (i + 1);
        const isLit = litPattern[count * 2 + i];
        return (
          <group key={`lw-${i}`}>
            <mesh position={[-w / 2 - 0.01, y, zOff]}>
              <boxGeometry args={[0.02, winH + 0.06, winW + 0.06]} />
              <meshStandardMaterial color="#1a1a2e" />
            </mesh>
            <mesh position={[-w / 2 - 0.02, y, zOff]}>
              <boxGeometry args={[0.02, winH, winW]} />
              <meshStandardMaterial color="#0a0a15" emissive={isLit ? "#FFD866" : "#223344"} emissiveIntensity={isLit ? 0.7 : 0.05} />
            </mesh>
          </group>
        );
      })}
      {/* Side windows (right) */}
      {Array.from({ length: sideCount }).map((_, i) => {
        const zOff = -d / 2 + sideSpacing * (i + 1);
        const isLit = litPattern[count * 2 + sideCount + i];
        return (
          <group key={`rw-${i}`}>
            <mesh position={[w / 2 + 0.01, y, zOff]}>
              <boxGeometry args={[0.02, winH + 0.06, winW + 0.06]} />
              <meshStandardMaterial color="#1a1a2e" />
            </mesh>
            <mesh position={[w / 2 + 0.02, y, zOff]}>
              <boxGeometry args={[0.02, winH, winW]} />
              <meshStandardMaterial color="#0a0a15" emissive={isLit ? "#FFD866" : "#223344"} emissiveIntensity={isLit ? 0.7 : 0.05} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Awning / Marquee ──
function VoxelAwning({ w, d, color, seed }: { w: number; d: number; color: string; seed: number }) {
  const stripeColor = seed % 2 === 0 ? "white" : "#FFE8CC";
  return (
    <group position={[0, 0.9, d / 2 + 0.25]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w * 0.9, 0.06, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.06, 0.08]}>
        <boxGeometry args={[w * 0.9, 0.06, 0.35]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {[-2, -1, 0, 1, 2].map(i => (
        <mesh key={i} position={[i * w * 0.15, 0.031, 0]}>
          <boxGeometry args={[w * 0.08, 0.01, 0.52]} />
          <meshStandardMaterial color={stripeColor} transparent opacity={0.3} />
        </mesh>
      ))}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * w * 0.4, -0.35, 0.2]}>
          <boxGeometry args={[0.04, 0.6, 0.04]} />
          <meshStandardMaterial color="#333" metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── Balcony ──
function VoxelBalcony({ w, d, floor, floorH }: { w: number; d: number; floor: number; floorH: number }) {
  const y = floor * floorH + floorH * 0.15;
  return (
    <group position={[0, y, d / 2 + 0.15]}>
      <mesh>
        <boxGeometry args={[w * 0.5, 0.06, 0.3]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {[-2, -1, 0, 1, 2].map(i => (
        <mesh key={i} position={[i * w * 0.1, 0.12, 0.12]}>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <meshStandardMaterial color="#666" metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.22, 0.12]}>
        <boxGeometry args={[w * 0.5, 0.04, 0.04]} />
        <meshStandardMaterial color="#666" metalness={0.4} />
      </mesh>
    </group>
  );
}

// ── Roof variations ──
function VoxelRoof({ type, w, d, h, color, secColor, seed }: { type: string; w: number; d: number; h: number; color: THREE.Color; secColor: THREE.Color; seed: number }) {
  const hasWaterTank = seed % 4 === 0;
  const hasSatellite = seed % 5 === 0;

  const baseRoof = (() => {
    switch (type) {
      case "peaked":
        return (
          <group position={[0, h, 0]}>
            {[0, 1, 2, 3].map(step => (
              <mesh key={step} position={[0, step * 0.12 + 0.06, 0]}>
                <boxGeometry args={[w - step * 0.35, 0.12, d - step * 0.35]} />
                <meshStandardMaterial color={secColor} roughness={0.7} />
              </mesh>
            ))}
            {/* Chimney */}
            {seed % 3 === 0 && (
              <group position={[w * 0.25, 0.55, -d * 0.2]}>
                <mesh><boxGeometry args={[0.15, 0.3, 0.15]} /><meshStandardMaterial color="#8B4513" roughness={0.9} /></mesh>
                <mesh position={[0, 0.18, 0]}><boxGeometry args={[0.18, 0.05, 0.18]} /><meshStandardMaterial color="#6B3410" /></mesh>
              </group>
            )}
          </group>
        );
      case "terrace":
        return (
          <group position={[0, h, 0]}>
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[w + 0.2, 0.15, d + 0.2]} />
              <meshStandardMaterial color={secColor} roughness={0.5} />
            </mesh>
            {/* Terrace garden with varied plants */}
            {[[-0.5, 0.25, -0.3], [0.4, 0.25, 0.3], [-0.2, 0.22, 0.5], [0.3, 0.2, -0.4]].map(([x, y, z], i) => (
              <mesh key={i} position={[x, y, z]}>
                <boxGeometry args={[0.2 + (i % 2) * 0.08, 0.15 + (i % 3) * 0.05, 0.2 + (i % 2) * 0.08]} />
                <meshStandardMaterial color={["#2d7a3a", "#1B6B2A", "#3A8B3A", "#4A9B4A"][i % 4]} />
              </mesh>
            ))}
            {/* Terrace railing */}
            {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dz], i) => (
              <mesh key={`rail-${i}`} position={[dx * (w / 2 + 0.08), 0.25, dz * (d / 2 + 0.08)]}>
                <boxGeometry args={[dx === 0 ? w + 0.2 : 0.04, 0.18, dz === 0 ? d + 0.2 : 0.04]} />
                <meshStandardMaterial color="#555" metalness={0.3} />
              </mesh>
            ))}
          </group>
        );
      case "dome":
        return (
          <group position={[0, h, 0]}>
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[w + 0.1, 0.15, d + 0.1]} />
              <meshStandardMaterial color={secColor} />
            </mesh>
            {[0, 1, 2, 3, 4].map(step => (
              <mesh key={step} position={[0, 0.2 + step * 0.1, 0]}>
                <boxGeometry args={[0.9 - step * 0.18, 0.1, 0.9 - step * 0.18]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1 + step * 0.05} />
              </mesh>
            ))}
          </group>
        );
      case "antenna":
        return (
          <group position={[0, h, 0]}>
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[w + 0.1, 0.15, d + 0.1]} />
              <meshStandardMaterial color={secColor} />
            </mesh>
            <mesh position={[0.3, 0.6, 0]}>
              <boxGeometry args={[0.06, 1.0, 0.06]} />
              <meshStandardMaterial color="#555" metalness={0.7} />
            </mesh>
            <mesh position={[0.3, 1.15, 0]}>
              <boxGeometry args={[0.12, 0.12, 0.12]} />
              <meshStandardMaterial color="#FF4040" emissive="#FF4040" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[-0.3, 0.4, 0.3]}>
              <boxGeometry args={[0.3, 0.25, 0.06]} />
              <meshStandardMaterial color="#aaa" metalness={0.6} />
            </mesh>
            {/* Extra cables */}
            <mesh position={[0.3, 0.3, 0.15]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[0.02, 0.5, 0.02]} />
              <meshStandardMaterial color="#444" />
            </mesh>
          </group>
        );
      default: // flat
        return (
          <group position={[0, h, 0]}>
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[w + 0.15, 0.08, d + 0.15]} />
              <meshStandardMaterial color={secColor} roughness={0.5} />
            </mesh>
            {/* Edge parapet */}
            {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dz], i) => (
              <mesh key={`par-${i}`} position={[dx * (w / 2 + 0.06), 0.14, dz * (d / 2 + 0.06)]}>
                <boxGeometry args={[dx === 0 ? w + 0.15 : 0.04, 0.12, dz === 0 ? d + 0.15 : 0.04]} />
                <meshStandardMaterial color={secColor} roughness={0.6} />
              </mesh>
            ))}
            {/* AC units */}
            <mesh position={[-0.5, 0.2, -0.3]}>
              <boxGeometry args={[0.35, 0.25, 0.25]} />
              <meshStandardMaterial color="#888" />
            </mesh>
            <mesh position={[0.4, 0.15, 0.4]}>
              <boxGeometry args={[0.25, 0.2, 0.25]} />
              <meshStandardMaterial color="#777" />
            </mesh>
          </group>
        );
    }
  })();

  return (
    <group>
      {baseRoof}
      {/* Extra satellite dish on some roofs */}
      {hasSatellite && (
        <group position={[-w * 0.3, h + 0.2, d * 0.25]}>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.04, 0.16, 0.04]} />
            <meshStandardMaterial color="#555" metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[0.5, 0, 0]}>
            <boxGeometry args={[0.2, 0.02, 0.2]} />
            <meshStandardMaterial color="#CCC" metalness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Ground-floor storefront (enriched) ──
function VoxelStorefront({ w, d, color, seed }: { w: number; d: number; color: THREE.Color; seed: number }) {
  const doorSide = seed % 2 === 0 ? 1 : -1;
  const hasSideDisplay = seed % 3 === 0;
  return (
    <group>
      {/* Darker ground-floor base */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[w, 0.8, d]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.6)} roughness={0.8} />
      </mesh>
      {/* Base trim */}
      <mesh position={[0, 0.01, d / 2 + 0.01]}>
        <boxGeometry args={[w + 0.04, 0.02, 0.02]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Storefront window (large, glowing) */}
      <mesh position={[doorSide * -0.2, 0.45, d / 2 + 0.01]}>
        <boxGeometry args={[w * 0.55, 0.5, 0.02]} />
        <meshStandardMaterial color="#0a0a15" emissive="#AADDFF" emissiveIntensity={0.5} />
      </mesh>
      {/* Window frame */}
      <mesh position={[doorSide * -0.2, 0.45, d / 2 + 0.005]}>
        <boxGeometry args={[w * 0.58, 0.53, 0.01]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Door */}
      <mesh position={[doorSide * w * 0.33, 0.3, d / 2 + 0.02]}>
        <boxGeometry args={[0.3, 0.55, 0.02]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.85} />
      </mesh>
      {/* Door frame */}
      <mesh position={[doorSide * w * 0.33, 0.3, d / 2 + 0.015]}>
        <boxGeometry args={[0.36, 0.6, 0.01]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>
      {/* Door handle */}
      <mesh position={[doorSide * (w * 0.33 - 0.08), 0.3, d / 2 + 0.04]}>
        <boxGeometry args={[0.04, 0.06, 0.04]} />
        <meshStandardMaterial color="#d4a030" metalness={0.8} />
      </mesh>
      {/* Step */}
      <mesh position={[doorSide * w * 0.33, 0.02, d / 2 + 0.18]}>
        <boxGeometry args={[0.4, 0.04, 0.15]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Side display window */}
      {hasSideDisplay && (
        <mesh position={[-w / 2 - 0.01, 0.45, 0]}>
          <boxGeometry args={[0.02, 0.4, d * 0.4]} />
          <meshStandardMaterial color="#0a0a15" emissive="#FFDD88" emissiveIntensity={0.3} />
        </mesh>
      )}
      {/* Address number */}
      <mesh position={[doorSide * (w * 0.33 + 0.2), 0.65, d / 2 + 0.02]}>
        <boxGeometry args={[0.1, 0.1, 0.02]} />
        <meshStandardMaterial color="#FFD866" emissive="#FFD866" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ── Side pipes / details (enriched) ──
function VoxelSideDetails({ w, d, h, pieces, seed }: { w: number; d: number; h: number; pieces: number; seed: number }) {
  if (pieces === 0) return null;
  return (
    <group>
      {pieces >= 1 && (
        <group>
          <mesh position={[-w / 2 - 0.04, h * 0.5, -d * 0.2]}>
            <boxGeometry args={[0.06, h * 0.8, 0.06]} />
            <meshStandardMaterial color="#555" metalness={0.5} />
          </mesh>
          {/* Pipe brackets */}
          {Array.from({ length: Math.min(3, Math.floor(h / 2)) }).map((_, i) => (
            <mesh key={`pb-${i}`} position={[-w / 2 - 0.02, 0.5 + i * 1.5, -d * 0.2]}>
              <boxGeometry args={[0.04, 0.04, 0.08]} />
              <meshStandardMaterial color="#444" metalness={0.4} />
            </mesh>
          ))}
        </group>
      )}
      {pieces >= 2 && (
        <group>
          <mesh position={[w / 2 + 0.02, h * 0.6, 0]}>
            <boxGeometry args={[0.04, 0.3, 0.4]} />
            <meshStandardMaterial color="#444" />
          </mesh>
          {/* Vent grille */}
          <mesh position={[w / 2 + 0.03, h * 0.6, 0]}>
            <boxGeometry args={[0.01, 0.25, 0.35]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
      )}
      {pieces >= 3 && (
        <group position={[-w / 2 - 0.08, 0, d * 0.3]}>
          {Array.from({ length: Math.min(Math.floor(h / 0.4), 8) }).map((_, i) => (
            <mesh key={i} position={[0, i * 0.4 + 0.3, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.2]} />
              <meshStandardMaterial color="#666" metalness={0.4} />
            </mesh>
          ))}
          {[-1, 1].map(s => (
            <mesh key={s} position={[0, h * 0.4, s * 0.09]}>
              <boxGeometry args={[0.04, h * 0.7, 0.04]} />
              <meshStandardMaterial color="#666" metalness={0.4} />
            </mesh>
          ))}
        </group>
      )}
      {/* Electrical box */}
      {seed % 4 === 0 && (
        <group position={[w / 2 + 0.04, 1.2, -d * 0.3]}>
          <mesh>
            <boxGeometry args={[0.06, 0.2, 0.15]} />
            <meshStandardMaterial color="#555" metalness={0.3} />
          </mesh>
          <mesh position={[0.035, 0, 0]}>
            <boxGeometry args={[0.01, 0.15, 0.1]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        </group>
      )}
      {/* Downspout */}
      {seed % 3 === 1 && (
        <mesh position={[w / 2 + 0.04, h * 0.45, d * 0.35]}>
          <boxGeometry args={[0.04, h * 0.85, 0.04]} />
          <meshStandardMaterial color="#4A4A4A" metalness={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ── Corner pilasters ──
function CornerDetails({ w, d, h, color }: { w: number; d: number; h: number; color: THREE.Color }) {
  const pilasterColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.9), [color]);
  return (
    <group>
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w / 2 - 0.04), 0.8 + (h - 0.8) / 2, sz * (d / 2 - 0.04)]}>
          <boxGeometry args={[0.1, h - 0.8, 0.1]} />
          <meshStandardMaterial color={pilasterColor} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export const Building3D = memo(function Building3D({ building, onClick, highlighted = false }: Building3DProps) {
  const [hovered, setHovered] = useState(false);
  const seed = useMemo(() => hash(building.id), [building.id]);

  const vs = VOXEL_STYLES[building.style] || VOXEL_STYLES.corporate;
  const h = building.height;
  const w = vs.baseWidth;
  const d = vs.baseDepth;
  const color = useMemo(() => new THREE.Color(building.primaryColor), [building.primaryColor]);
  const secColor = useMemo(() => new THREE.Color(building.secondaryColor), [building.secondaryColor]);
  const upperFloors = Math.max(building.floors - 1, 1);
  const upperH = h - 0.8;

  const buildingProps = useBuildingProps(building.id, w, d, h);

  return (
    <group
      position={[building.coordinates.x, 0, building.coordinates.z]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* ── GLB Building Model (primary) ── */}
      <GLBBuildingModel
        buildingId={building.id}
        height={h}
        primaryColor={building.primaryColor}
        isSkyscraper={h > 7}
      />

      {/* ── GLB Detail props (awnings, parasols) ── */}
      {seed % 3 === 0 && (
        <GLBDetailModel seed={seed} position={[0, 0, d / 2 + 0.3]} scale={h * 0.15} />
      )}
      {seed % 5 === 0 && (
        <GLBDetailModel seed={seed + 3} position={[w / 2 + 0.5, 0, 0]} scale={0.8} />
      )}

      {/* ── Awning ── */}
      {vs.hasAwning && <VoxelAwning w={w} d={d} color={vs.awningColor} seed={seed} />}

      {/* ── Balconies on multiple floors ── */}
      {vs.hasBalcony && upperFloors >= 2 && (
        <>
          <VoxelBalcony w={w} d={d} floor={2} floorH={vs.floorHeight} />
          {upperFloors >= 4 && <VoxelBalcony w={w} d={d} floor={4} floorH={vs.floorHeight} />}
        </>
      )}

      {/* ── Roof ── */}
      <VoxelRoof type={vs.roofType} w={w} d={d} h={h} color={color} secColor={secColor} seed={seed} />

      {/* ── Side details ── */}
      <VoxelSideDetails w={w} d={d} h={h} pieces={vs.accentPieces} seed={seed} />

      {/* ── Neon Sign ── */}
      {building.customizations.neonSign && (
        <group position={[0, h * 0.7, d / 2 + 0.06]}>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[w * 0.8, 0.35, 0.04]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {/* Glow backlight */}
          <mesh position={[0, 0, -0.04]}>
            <boxGeometry args={[w * 0.85, 0.4, 0.01]} />
            <meshStandardMaterial color={building.primaryColor} emissive={building.primaryColor} emissiveIntensity={0.3} transparent opacity={0.4} />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.22}
            color={building.primaryColor}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="black"
            maxWidth={w * 0.75}
          >
            {building.name}
          </Text>
        </group>
      )}

      {/* ── Garden ── */}
      {building.customizations.garden && (
        <group>
          {[[-w / 2 - 0.4, 0], [w / 2 + 0.4, 0]].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.25, 0.2, 0.25]} />
                <meshStandardMaterial color="#8B5E3C" />
              </mesh>
              <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[0.3, 0.25, 0.3]} />
                <meshStandardMaterial color={["#2d7a3a", "#1B6B2A"][i % 2]} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* ── Hologram ── */}
      {building.customizations.hologram && (
        <group position={[0, h + 0.8, 0]}>
          <mesh>
            <boxGeometry args={[0.35, 0.35, 0.35]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.5} wireframe />
          </mesh>
        </group>
      )}

      {/* ── Rooftop antenna ── */}
      {building.customizations.rooftop && (
        <group position={[0.5, h + 0.1, -0.3]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.06, 0.8, 0.06]} />
            <meshStandardMaterial color="#555" metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#FF3030" emissive="#FF3030" emissiveIntensity={1.5} />
          </mesh>
        </group>
      )}

      {/* ── Building props (benches, plants, signs, etc.) ── */}
      <BuildingProps props={buildingProps} />

      {/* ── Hover label ── */}
      {hovered && (
        <group position={[0, h + 1.5, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[2.5, 0.8, 0.05]} />
            <meshStandardMaterial color="#111" transparent opacity={0.85} />
          </mesh>
          <Text fontSize={0.35} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">
            {building.name}
          </Text>
          <Text position={[0, -0.35, 0]} fontSize={0.2} color="#9ca3af" anchorX="center" anchorY="middle">
            {building.claimed ? `👤 ${building.ownerName}` : "🏷️ Available"}
          </Text>
        </group>
      )}

      {/* ── Highlighted ring ── */}
      {highlighted && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[w * 0.7, w * 0.7 + 0.4, 4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
});
