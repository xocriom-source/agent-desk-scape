import { useRef, useState, memo, useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { CityBuilding } from "@/types/building";

interface Building3DProps {
  building: CityBuilding;
  onClick?: () => void;
  highlighted?: boolean;
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
}> = {
  corporate: { baseWidth: 2.8, baseDepth: 2.4, floorHeight: 1.2, roofType: "flat", hasAwning: false, hasBalcony: true, awningColor: "#2a4a7f", windowStyle: "grid", accentPieces: 2 },
  creative: { baseWidth: 2.6, baseDepth: 2.2, floorHeight: 1.4, roofType: "peaked", hasAwning: true, hasBalcony: true, awningColor: "#c94040", windowStyle: "wide", accentPieces: 3 },
  startup: { baseWidth: 2.2, baseDepth: 2.0, floorHeight: 1.0, roofType: "antenna", hasAwning: true, hasBalcony: false, awningColor: "#40a060", windowStyle: "wide", accentPieces: 1 },
  tech: { baseWidth: 2.4, baseDepth: 2.4, floorHeight: 1.1, roofType: "dome", hasAwning: false, hasBalcony: true, awningColor: "#3a7acc", windowStyle: "circle", accentPieces: 2 },
  agency: { baseWidth: 2.6, baseDepth: 2.6, floorHeight: 1.3, roofType: "terrace", hasAwning: true, hasBalcony: true, awningColor: "#d4a030", windowStyle: "shutter", accentPieces: 2 },
  minimal: { baseWidth: 2.0, baseDepth: 2.0, floorHeight: 1.2, roofType: "flat", hasAwning: false, hasBalcony: false, awningColor: "#888", windowStyle: "wide", accentPieces: 0 },
  futuristic: { baseWidth: 2.2, baseDepth: 2.2, floorHeight: 1.0, roofType: "dome", hasAwning: false, hasBalcony: true, awningColor: "#6040c0", windowStyle: "circle", accentPieces: 3 },
  industrial: { baseWidth: 3.0, baseDepth: 2.8, floorHeight: 1.5, roofType: "flat", hasAwning: true, hasBalcony: false, awningColor: "#705030", windowStyle: "grid", accentPieces: 1 },
};

const BLACK = new THREE.Color(0x000000);

// ── Pixel-art window row (2 sides) ──
function VoxelWindows({ floor, floorH, w, d, style }: { floor: number; floorH: number; w: number; d: number; style: string }) {
  const y = floor * floorH + floorH * 0.55;
  const vs = VOXEL_STYLES[style] || VOXEL_STYLES.corporate;
  const winW = vs.windowStyle === "wide" ? w * 0.35 : w * 0.2;
  const winH = vs.windowStyle === "wide" ? floorH * 0.45 : floorH * 0.35;
  const count = vs.windowStyle === "grid" ? 3 : 2;
  const spacing = w / (count + 1);

  return (
    <group>
      {/* Front windows */}
      {Array.from({ length: count }).map((_, i) => {
        const xOff = -w / 2 + spacing * (i + 1);
        return (
          <group key={`fw-${i}`}>
            {/* Window frame (dark) */}
            <mesh position={[xOff, y, d / 2 + 0.01]}>
              <boxGeometry args={[winW + 0.06, winH + 0.06, 0.02]} />
              <meshStandardMaterial color="#1a1a2e" />
            </mesh>
            {/* Window glass (glowing) */}
            <mesh position={[xOff, y, d / 2 + 0.02]}>
              <boxGeometry args={[winW, winH, 0.02]} />
              <meshStandardMaterial
                color="#0a0a15"
                emissive="#FFD866"
                emissiveIntensity={0.9}
              />
            </mesh>
            {/* Window divider cross */}
            <mesh position={[xOff, y, d / 2 + 0.03]}>
              <boxGeometry args={[0.02, winH, 0.01]} />
              <meshStandardMaterial color="#2a2a3e" />
            </mesh>
            <mesh position={[xOff, y, d / 2 + 0.03]}>
              <boxGeometry args={[winW, 0.02, 0.01]} />
              <meshStandardMaterial color="#2a2a3e" />
            </mesh>
          </group>
        );
      })}
      {/* Back windows (simpler) */}
      {Array.from({ length: count }).map((_, i) => {
        const xOff = -w / 2 + spacing * (i + 1);
        return (
          <mesh key={`bw-${i}`} position={[xOff, y, -d / 2 - 0.01]}>
            <boxGeometry args={[winW, winH, 0.02]} />
            <meshStandardMaterial color="#0a0a15" emissive="#FFD866" emissiveIntensity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Awning / Marquee ──
function VoxelAwning({ w, d, color }: { w: number; d: number; color: string }) {
  return (
    <group position={[0, 0.9, d / 2 + 0.25]}>
      {/* Awning canopy - stepped voxel look */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w * 0.9, 0.06, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.06, 0.08]}>
        <boxGeometry args={[w * 0.9, 0.06, 0.35]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Striped pattern overlay */}
      {[-1, 0, 1].map(i => (
        <mesh key={i} position={[i * w * 0.25, 0.031, 0]}>
          <boxGeometry args={[w * 0.12, 0.01, 0.52]} />
          <meshStandardMaterial color="white" transparent opacity={0.3} />
        </mesh>
      ))}
      {/* Support poles */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * w * 0.4, -0.35, 0.2]}>
          <boxGeometry args={[0.04, 0.6, 0.04]} />
          <meshStandardMaterial color="#333" metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── Voxel Balcony ──
function VoxelBalcony({ w, d, floor, floorH }: { w: number; d: number; floor: number; floorH: number }) {
  const y = floor * floorH + floorH * 0.15;
  return (
    <group position={[0, y, d / 2 + 0.15]}>
      {/* Platform */}
      <mesh>
        <boxGeometry args={[w * 0.5, 0.06, 0.3]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Railing - pixelated bars */}
      {[-2, -1, 0, 1, 2].map(i => (
        <mesh key={i} position={[i * w * 0.1, 0.12, 0.12]}>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <meshStandardMaterial color="#666" metalness={0.4} />
        </mesh>
      ))}
      {/* Top rail */}
      <mesh position={[0, 0.22, 0.12]}>
        <boxGeometry args={[w * 0.5, 0.04, 0.04]} />
        <meshStandardMaterial color="#666" metalness={0.4} />
      </mesh>
    </group>
  );
}

// ── Roof variations ──
function VoxelRoof({ type, w, d, h, color, secColor }: { type: string; w: number; d: number; h: number; color: THREE.Color; secColor: THREE.Color }) {
  switch (type) {
    case "peaked":
      return (
        <group position={[0, h, 0]}>
          {/* Stepped pyramid roof (voxel style) */}
          {[0, 1, 2].map(step => (
            <mesh key={step} position={[0, step * 0.15 + 0.08, 0]}>
              <boxGeometry args={[w - step * 0.4, 0.15, d - step * 0.4]} />
              <meshStandardMaterial color={secColor} roughness={0.7} />
            </mesh>
          ))}
        </group>
      );
    case "terrace":
      return (
        <group position={[0, h, 0]}>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[w + 0.2, 0.15, d + 0.2]} />
            <meshStandardMaterial color={secColor} roughness={0.5} />
          </mesh>
          {/* Terrace garden pixel bushes */}
          {[[-0.5, 0.3, -0.3], [0.4, 0.3, 0.3], [-0.2, 0.25, 0.5]].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]}>
              <boxGeometry args={[0.25, 0.2, 0.25]} />
              <meshStandardMaterial color="#2d7a3a" />
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
          {/* Pixel dome = stacked shrinking cubes */}
          {[0, 1, 2, 3].map(step => (
            <mesh key={step} position={[0, 0.2 + step * 0.12, 0]}>
              <boxGeometry args={[0.8 - step * 0.2, 0.12, 0.8 - step * 0.2]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} />
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
          {/* Pixel antenna */}
          <mesh position={[0.3, 0.6, 0]}>
            <boxGeometry args={[0.06, 1.0, 0.06]} />
            <meshStandardMaterial color="#555" metalness={0.7} />
          </mesh>
          <mesh position={[0.3, 1.15, 0]}>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshStandardMaterial color="#FF4040" emissive="#FF4040" emissiveIntensity={1.2} />
          </mesh>
          {/* Satellite dish (pixel) */}
          <mesh position={[-0.3, 0.4, 0.3]}>
            <boxGeometry args={[0.3, 0.25, 0.06]} />
            <meshStandardMaterial color="#aaa" metalness={0.6} />
          </mesh>
        </group>
      );
    default: // flat
      return (
        <group position={[0, h, 0]}>
          {/* Flat roof with edge trim */}
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[w + 0.15, 0.08, d + 0.15]} />
            <meshStandardMaterial color={secColor} roughness={0.5} />
          </mesh>
          {/* AC units (pixel boxes) */}
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
}

// ── Ground-floor storefront ──
function VoxelStorefront({ w, d, color }: { w: number; d: number; color: THREE.Color }) {
  return (
    <group>
      {/* Darker ground-floor base */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[w, 0.8, d]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.65)} roughness={0.8} />
      </mesh>
      {/* Storefront window (large, glowing) */}
      <mesh position={[0, 0.45, d / 2 + 0.01]}>
        <boxGeometry args={[w * 0.7, 0.5, 0.02]} />
        <meshStandardMaterial color="#0a0a15" emissive="#AADDFF" emissiveIntensity={0.5} />
      </mesh>
      {/* Door */}
      <mesh position={[w * 0.3, 0.3, d / 2 + 0.02]}>
        <boxGeometry args={[0.3, 0.55, 0.02]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      {/* Door handle */}
      <mesh position={[w * 0.25, 0.3, d / 2 + 0.04]}>
        <boxGeometry args={[0.04, 0.06, 0.04]} />
        <meshStandardMaterial color="#d4a030" metalness={0.8} />
      </mesh>
      {/* Step */}
      <mesh position={[0, 0.02, d / 2 + 0.15]}>
        <boxGeometry args={[w * 0.5, 0.04, 0.12]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  );
}

// ── Side pipes / details ──
function VoxelSideDetails({ w, d, h, pieces }: { w: number; d: number; h: number; pieces: number }) {
  if (pieces === 0) return null;
  return (
    <group>
      {/* Vertical pipe */}
      {pieces >= 1 && (
        <mesh position={[-w / 2 - 0.04, h * 0.5, -d * 0.2]}>
          <boxGeometry args={[0.06, h * 0.8, 0.06]} />
          <meshStandardMaterial color="#555" metalness={0.5} />
        </mesh>
      )}
      {/* Side vent */}
      {pieces >= 2 && (
        <mesh position={[w / 2 + 0.02, h * 0.6, 0]}>
          <boxGeometry args={[0.04, 0.3, 0.4]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      )}
      {/* External ladder */}
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
    </group>
  );
}

export const Building3D = memo(function Building3D({ building, onClick, highlighted = false }: Building3DProps) {
  const [hovered, setHovered] = useState(false);

  const vs = VOXEL_STYLES[building.style] || VOXEL_STYLES.corporate;
  const h = building.height;
  const w = vs.baseWidth;
  const d = vs.baseDepth;
  const color = useMemo(() => new THREE.Color(building.primaryColor), [building.primaryColor]);
  const secColor = useMemo(() => new THREE.Color(building.secondaryColor), [building.secondaryColor]);
  const upperFloors = Math.max(building.floors - 1, 1);
  const upperH = h - 0.8; // subtract ground floor

  return (
    <group
      position={[building.coordinates.x, 0, building.coordinates.z]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* ── Ground floor / Storefront ── */}
      <VoxelStorefront w={w} d={d} color={color} />

      {/* ── Upper floors body ── */}
      <mesh position={[0, 0.8 + upperH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, upperH, d]} />
        <meshStandardMaterial
          color={color}
          emissive={highlighted || hovered ? color : BLACK}
          emissiveIntensity={highlighted ? 0.25 : hovered ? 0.12 : 0}
          roughness={0.75}
          metalness={0.1}
        />
      </mesh>

      {/* ── Floor separator lines (pixel-art look) ── */}
      {Array.from({ length: upperFloors }).map((_, i) => (
        <mesh key={`sep-${i}`} position={[0, 0.8 + (i + 1) * vs.floorHeight, d / 2 + 0.01]}>
          <boxGeometry args={[w + 0.04, 0.04, 0.02]} />
          <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.8)} />
        </mesh>
      ))}

      {/* ── Windows per floor ── */}
      {Array.from({ length: Math.min(upperFloors, 5) }).map((_, floor) => (
        <VoxelWindows key={floor} floor={floor + 1} floorH={vs.floorHeight} w={w} d={d} style={building.style} />
      ))}

      {/* ── Awning / Marquee ── */}
      {vs.hasAwning && <VoxelAwning w={w} d={d} color={vs.awningColor} />}

      {/* ── Balconies ── */}
      {vs.hasBalcony && upperFloors >= 2 && (
        <VoxelBalcony w={w} d={d} floor={2} floorH={vs.floorHeight} />
      )}

      {/* ── Roof ── */}
      <VoxelRoof type={vs.roofType} w={w} d={d} h={h} color={color} secColor={secColor} />

      {/* ── Side details (pipes, vents, ladder) ── */}
      <VoxelSideDetails w={w} d={d} h={h} pieces={vs.accentPieces} />

      {/* ── Neon Sign ── */}
      {building.customizations.neonSign && (
        <group position={[0, h * 0.7, d / 2 + 0.06]}>
          {/* Sign backing plate */}
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[w * 0.8, 0.35, 0.04]} />
            <meshStandardMaterial color="#1a1a1a" />
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

      {/* ── Garden (pixel bushes + pot plants) ── */}
      {building.customizations.garden && (
        <group>
          {[[-w / 2 - 0.4, 0], [w / 2 + 0.4, 0]].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              {/* Pot */}
              <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.25, 0.2, 0.25]} />
                <meshStandardMaterial color="#8B5E3C" />
              </mesh>
              {/* Plant */}
              <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[0.3, 0.25, 0.3]} />
                <meshStandardMaterial color="#2d7a3a" />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* ── Hologram (pixel floating cube) ── */}
      {building.customizations.hologram && (
        <group position={[0, h + 0.8, 0]}>
          <mesh>
            <boxGeometry args={[0.35, 0.35, 0.35]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
              transparent
              opacity={0.5}
              wireframe
            />
          </mesh>
        </group>
      )}

      {/* ── Rooftop antenna (custom) ── */}
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

      {/* ── Hover label ── */}
      {hovered && (
        <group position={[0, h + 1.5, 0]}>
          {/* Pixel-style name tag background */}
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[2.5, 0.8, 0.05]} />
            <meshStandardMaterial color="#111" transparent opacity={0.85} />
          </mesh>
          <Text
            fontSize={0.35}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="black"
          >
            {building.name}
          </Text>
          <Text
            position={[0, -0.35, 0]}
            fontSize={0.2}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
          >
            {building.claimed ? `👤 ${building.ownerName}` : "🏷️ Available"}
          </Text>
        </group>
      )}

      {/* ── Highlighted ring ── */}
      {highlighted && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[w * 0.7, w * 0.7 + 0.4, 4]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}
    </group>
  );
});
