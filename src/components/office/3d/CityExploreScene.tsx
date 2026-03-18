import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useDayNight } from "@/hooks/useDayNight";
import { useCityBuildings } from "@/hooks/useCityBuildings";
import { Vehicle3D } from "@/components/city/Vehicle3D";
import { VoxelCityBuilding } from "@/components/city/VoxelCityBuilding";
import type { CityBuilding } from "@/types/building";
import { STYLE_TRANSPORT_MAP } from "@/types/building";

// ── District data ──
const DISTRICTS = [
  { name: "Praça Central", emoji: "🏛️", x: 0, z: 0, radius: 5, color: "#10B981" },
  { name: "Distrito Criativo", emoji: "🎨", x: -14, z: -8, radius: 4, color: "#F59E0B" },
  { name: "Distrito Inovação", emoji: "🔬", x: 14, z: -8, radius: 4, color: "#6366F1" },
  { name: "Distrito Comércio", emoji: "🛍️", x: -14, z: 10, radius: 4, color: "#EF4444" },
  { name: "Distrito Social", emoji: "☕", x: 14, z: 10, radius: 4, color: "#EC4899" },
];

// ── Static building defs ──
const CITY_BUILDINGS = [
  { x: -18, z: -12, w: 3.5, d: 3, h: 2.8, color: "#8B6B3A" },
  { x: -12, z: -12, w: 3, d: 2.5, h: 2.2, color: "#7A5A3A" },
  { x: -18, z: -6, w: 3, d: 3, h: 3, color: "#6B5A4A" },
  { x: -12, z: -6, w: 2.8, d: 2.8, h: 2.5, color: "#8A7A5A" },
  { x: 12, z: -12, w: 3.5, d: 3, h: 3.5, color: "#3A4A6A" },
  { x: 18, z: -12, w: 3, d: 2.5, h: 2.8, color: "#4A5A7A" },
  { x: 12, z: -6, w: 3, d: 3, h: 2.5, color: "#5A6A8A" },
  { x: 18, z: -6, w: 2.8, d: 2.8, h: 3.2, color: "#4A5A6A" },
  { x: -18, z: 8, w: 3.5, d: 3, h: 2.5, color: "#6A4A3A" },
  { x: -12, z: 8, w: 3, d: 2.5, h: 2.2, color: "#7A5A4A" },
  { x: -18, z: 14, w: 3, d: 3, h: 2.8, color: "#8A6A4A" },
  { x: -12, z: 14, w: 2.5, d: 2.5, h: 2, color: "#9A7A5A" },
  { x: 12, z: 8, w: 3.5, d: 3, h: 2.2, color: "#5A4A4A" },
  { x: 18, z: 8, w: 3, d: 2.5, h: 2.5, color: "#6A5A5A" },
  { x: 12, z: 14, w: 3, d: 3, h: 2.8, color: "#4A5A5A" },
  { x: 18, z: 14, w: 2.8, d: 2.8, h: 2, color: "#5A6A5A" },
  { x: -6, z: -14, w: 3, d: 2.5, h: 3, color: "#5A5A3A" },
  { x: 0, z: -14, w: 3.5, d: 3, h: 3.5, color: "#6A6A4A" },
  { x: 6, z: -14, w: 3, d: 2.5, h: 2.8, color: "#4A4A5A" },
  { x: -6, z: 18, w: 3, d: 2.5, h: 2.2, color: "#5A4A5A" },
  { x: 0, z: 18, w: 3.5, d: 3, h: 2.5, color: "#6A5A4A" },
  { x: 6, z: 18, w: 3, d: 2.5, h: 2, color: "#7A6A5A" },
];

// ── NPC data ──
const NPC_DATA = [
  { x: 2, z: 1, color: "#7A6B8A", name: "Kaori" },
  { x: -2, z: -1, color: "#8A7B6A", name: "Atlas" },
  { x: 0, z: 3, color: "#6B8A7A", name: "Nova" },
  { x: -10, z: -3, color: "#9A7A6A", name: "Corretor" },
  { x: 8, z: 5, color: "#6A9A8A", name: "Turista" },
  { x: 5, z: -5, color: "#6A8A9A", name: "Músico" },
];

// ── AABB collision system ──
interface AABB {
  minX: number; maxX: number;
  minZ: number; maxZ: number;
}

const COLLISION_MARGIN = 0.3;

function buildAABBs(staticBuildings: typeof CITY_BUILDINGS, dynamicBuildings: { coordinates: { x: number; z: number } }[]): AABB[] {
  const aabbs: AABB[] = [];
  for (const b of staticBuildings) {
    aabbs.push({
      minX: b.x - b.w / 2 - COLLISION_MARGIN,
      maxX: b.x + b.w / 2 + COLLISION_MARGIN,
      minZ: b.z - b.d / 2 - COLLISION_MARGIN,
      maxZ: b.z + b.d / 2 + COLLISION_MARGIN,
    });
  }
  for (const b of dynamicBuildings) {
    const hw = 1.4; // half-width of dynamic buildings
    aabbs.push({
      minX: b.coordinates.x - hw,
      maxX: b.coordinates.x + hw,
      minZ: b.coordinates.z - hw,
      maxZ: b.coordinates.z + hw,
    });
  }
  // Plaza fountain
  aabbs.push({ minX: -1.2, maxX: 1.2, minZ: -1.2, maxZ: 1.2 });
  return aabbs;
}

function collidesAABB(x: number, z: number, radius: number, aabbs: AABB[]): boolean {
  for (const b of aabbs) {
    if (x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ) {
      return true;
    }
  }
  return false;
}

// Slide collision: try full movement, then axis-separated
function moveWithCollision(
  curX: number, curZ: number, dx: number, dz: number, radius: number, aabbs: AABB[]
): [number, number] {
  // Try full move
  if (!collidesAABB(curX + dx, curZ + dz, radius, aabbs)) {
    return [curX + dx, curZ + dz];
  }
  // Try X only
  if (dx !== 0 && !collidesAABB(curX + dx, curZ, radius, aabbs)) {
    return [curX + dx, curZ];
  }
  // Try Z only
  if (dz !== 0 && !collidesAABB(curX, curZ + dz, radius, aabbs)) {
    return [curX, curZ + dz];
  }
  return [curX, curZ];
}

// ── Lightweight static building ──
function StaticBuilding({ x, z, w, d, h, color }: { x: number; z: number; w: number; d: number; h: number; color: string }) {
  const windowRows = Math.floor(h / 0.5);
  const windowCols = Math.max(1, Math.floor(w / 0.8));

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, h + 0.03, 0]}>
        <boxGeometry args={[w + 0.1, 0.06, d + 0.1]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>
      {Array.from({ length: Math.min(windowRows, 4) }).map((_, ri) =>
        Array.from({ length: Math.min(windowCols, 3) }).map((_, ci) => (
          <mesh key={`w${ri}-${ci}`} position={[
            -w / 2 + 0.35 + ci * (w / (windowCols + 0.5)),
            0.4 + ri * 0.5,
            d / 2 + 0.01
          ]}>
            <boxGeometry args={[0.2, 0.26, 0.01]} />
            <meshStandardMaterial color="#FFE4A8" emissive="#FFD060" emissiveIntensity={0.5} />
          </mesh>
        ))
      )}
      <mesh position={[0, 0.35, d / 2 + 0.01]}>
        <boxGeometry args={[0.4, 0.7, 0.02]} />
        <meshStandardMaterial color="#3A2A1A" />
      </mesh>
    </group>
  );
}

// ── Lightweight dynamic building with occlusion support ──
function LightBuilding3D({ building, highlighted, onClick, occluded }: {
  building: CityBuilding; highlighted?: boolean; onClick?: () => void; occluded?: boolean;
}) {
  const h = building.height;
  const w = 2.2;
  const color = building.primaryColor;
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={[building.coordinates.x, 0, building.coordinates.z]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial
          color={color}
          emissive={highlighted || hovered ? color : "#000000"}
          emissiveIntensity={highlighted ? 0.3 : hovered ? 0.15 : 0}
          roughness={0.6}
          metalness={0.2}
          transparent={occluded}
          opacity={occluded ? 0.15 : 1}
        />
      </mesh>
      <mesh position={[0, h + 0.15, 0]}>
        <boxGeometry args={[w + 0.3, 0.3, w + 0.3]} />
        <meshStandardMaterial
          color={building.secondaryColor}
          roughness={0.4}
          metalness={0.3}
          transparent={occluded}
          opacity={occluded ? 0.15 : 1}
        />
      </mesh>
      {!occluded && Array.from({ length: Math.min(building.floors, 5) }).map((_, floor) => (
        <group key={floor}>
          {[-0.4, 0.4].map((ox, i) => (
            <mesh key={i} position={[ox, 1 + floor * (h / building.floors), w / 2 + 0.01]}>
              <planeGeometry args={[0.3, 0.35]} />
              <meshStandardMaterial emissive="#FFD060" emissiveIntensity={0.6} color="black" />
            </mesh>
          ))}
        </group>
      ))}
      {(highlighted || hovered) && !occluded && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[w, w + 0.5, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={hovered ? 0.4 : 0.6} />
        </mesh>
      )}
      {hovered && !occluded && (
        <Html position={[0, h + 1, 0]} center>
          <div className="px-2 py-1 rounded-lg bg-gray-900/90 border border-gray-700 text-white text-[10px] whitespace-nowrap pointer-events-none backdrop-blur-sm">
            <span className="font-bold">{building.name}</span>
            <span className="text-gray-400 ml-1">• Visitar</span>
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Static building with occlusion ──
function StaticBuildingOccludable({ x, z, w, d, h, color, occluded }: {
  x: number; z: number; w: number; d: number; h: number; color: string; occluded?: boolean;
}) {
  if (occluded) {
    return (
      <group position={[x, 0, z]}>
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0.85} />
        </mesh>
      </group>
    );
  }
  return <StaticBuilding x={x} z={z} w={w} d={d} h={h} color={color} />;
}

// ── Simplified Plaza ──
function CityPlaza() {
  return (
    <group>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#B0A890" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.9, 1, 0.24, 12]} />
        <meshStandardMaterial color="#6B6B78" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.06, 12]} />
        <meshStandardMaterial color="#3A80B0" transparent opacity={0.55} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
        <meshStandardMaterial color="#8A8A98" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#C0A870" metalness={0.6} roughness={0.3} />
      </mesh>
      {[[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 1, 4]} />
            <meshStandardMaterial color="#5A3A20" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.5, 6, 6]} />
            <meshStandardMaterial color="#2D5A1E" />
          </mesh>
        </group>
      ))}
      {[[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]].map(([lx, lz], i) => (
        <group key={`l${i}`} position={[lx, 0, lz]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.025, 0.04, 1.8, 4]} />
            <meshStandardMaterial color="#333" metalness={0.6} />
          </mesh>
          <mesh position={[0, 1.82, 0]}>
            <sphereGeometry args={[0.04, 4, 4]} />
            <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── NPC ──
function CityNPC({ startX, startZ, color, aabbs }: { startX: number; startZ: number; color: string; aabbs: AABB[] }) {
  const ref = useRef<THREE.Group>(null);
  const posRef = useRef({ x: startX, z: startZ, targetX: startX, targetZ: startZ });
  const timerRef = useRef(Math.random() * 3);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    const p = posRef.current;
    const dx = p.targetX - p.x;
    const dz = p.targetZ - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.3) {
      timerRef.current += dt;
      if (timerRef.current > 4 + Math.random() * 5) {
        timerRef.current = 0;
        // Pick new target, prefer roads (near axis lines)
        const axis = Math.random() > 0.5;
        p.targetX = axis ? (Math.random() - 0.5) * 30 : startX + (Math.random() - 0.5) * 8;
        p.targetZ = axis ? startZ + (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 30;
      }
    } else {
      const speed = 0.8;
      const nx = p.x + (dx / dist) * speed * dt;
      const nz = p.z + (dz / dist) * speed * dt;
      if (!collidesAABB(nx, nz, 0.15, aabbs)) {
        p.x = nx;
        p.z = nz;
      } else {
        // Pick new target immediately
        timerRef.current = 99;
      }
      ref.current.rotation.y = Math.atan2(dx, dz);
    }
    ref.current.position.set(p.x, 0, p.z);
  });

  const darkColor = new THREE.Color(color).multiplyScalar(0.7).getStyle();

  return (
    <group ref={ref} position={[startX, 0, startZ]}>
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.18, 0.24, 0.12]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.14, 0.14, 0.14]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[-0.045, 0.05, 0]}><boxGeometry args={[0.06, 0.1, 0.07]} /><meshStandardMaterial color={darkColor} /></mesh>
      <mesh position={[0.045, 0.05, 0]}><boxGeometry args={[0.06, 0.1, 0.07]} /><meshStandardMaterial color={darkColor} /></mesh>
    </group>
  );
}

// ── Ground + Roads ──
function CityGround() {
  return (
    <group>
      {/* Inner city ground */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#1A1E24" />
      </mesh>
      {/* Infinite landscape rings - progressively darker/greener to simulate horizon */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[40, 80, 32]} />
        <meshStandardMaterial color="#151A14" roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[80, 160, 32]} />
        <meshStandardMaterial color="#111610" roughness={0.98} />
      </mesh>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[160, 400, 32]} />
        <meshStandardMaterial color="#0D120C" roughness={1} />
      </mesh>
      {/* Distant hills silhouette */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const dist = 60 + Math.sin(i * 2.7) * 15;
        const hh = 3 + Math.sin(i * 1.3) * 2;
        const ww = 20 + Math.sin(i * 0.7) * 8;
        return (
          <mesh key={`hill-${i}`} position={[Math.cos(angle) * dist, hh / 2 - 0.5, Math.sin(angle) * dist]}>
            <sphereGeometry args={[ww, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#0A0F0A" roughness={1} />
          </mesh>
        );
      })}
      {/* Scattered distant trees on outer ring */}
      {Array.from({ length: 40 }).map((_, i) => {
        const angle = (i / 40) * Math.PI * 2 + Math.sin(i * 3.1) * 0.15;
        const dist = 42 + Math.sin(i * 2.3) * 8;
        const sc = 0.6 + Math.sin(i * 1.7) * 0.3;
        return (
          <group key={`dtree-${i}`} position={[Math.cos(angle) * dist, 0, Math.sin(angle) * dist]}>
            <mesh position={[0, 0.4 * sc, 0]}>
              <cylinderGeometry args={[0.04 * sc, 0.06 * sc, 0.8 * sc, 4]} />
              <meshStandardMaterial color="#3A2A18" roughness={0.95} />
            </mesh>
            <mesh position={[0, (0.8 + 0.35) * sc, 0]}>
              <sphereGeometry args={[0.5 * sc, 5, 4]} />
              <meshStandardMaterial color={["#0D3D12", "#153D10", "#0A3A15", "#1A4A18"][i % 4]} roughness={0.9} />
            </mesh>
          </group>
        );
      })}
      {/* Main cross roads */}
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 60]} />
        <meshStandardMaterial color="#2A2A30" />
      </mesh>
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 2]} />
        <meshStandardMaterial color="#2A2A30" />
      </mesh>
      {/* Ring roads */}
      {[
        [0, -7, 20, 1.5], [0, 7, 20, 1.5], [-7, 0, 1.5, 20], [7, 0, 1.5, 20],
      ].map(([x, z, w, h], i) => (
        <mesh key={i} position={[x, -0.014, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#282830" />
        </mesh>
      ))}
      {/* Sidewalks along main roads */}
      {[
        [1.3, 0, 0.5, 60], [-1.3, 0, 0.5, 60],
        [0, 1.3, 60, 0.5], [0, -1.3, 60, 0.5],
      ].map(([x, z, w, h], i) => (
        <mesh key={`sw-${i}`} position={[x, -0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#252530" />
        </mesh>
      ))}
      {/* District ground indicators */}
      {DISTRICTS.slice(1).map((d, i) => (
        <mesh key={i} position={[d.x, -0.008, d.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[d.radius, 16]} />
          <meshStandardMaterial color={d.color} transparent opacity={0.06} />
        </mesh>
      ))}
    </group>
  );
}

// ── Street Lights with REAL point lights ──
function StreetLights() {
  const dn = useDayNight();
  const lightIntensityMultiplier = dn.isNight ? 1 : dn.isSunset ? 0.6 : dn.isSunrise ? 0.4 : 0;

  const positions = useMemo(() => {
    const pts: { x: number; z: number; type: "tall" | "short" | "double" }[] = [];
    for (let v = -28; v <= 28; v += 6) {
      if (Math.abs(v) < 5) continue;
      pts.push({ x: 1.8, z: v, type: "tall" });
      pts.push({ x: -1.8, z: v, type: "tall" });
      pts.push({ x: v, z: 1.8, type: "tall" });
      pts.push({ x: v, z: -1.8, type: "tall" });
    }
    for (let x = -24; x <= 24; x += 16) {
      for (let z = -24; z <= 24; z += 16) {
        if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
        pts.push({ x, z, type: "double" });
      }
    }
    for (let v = -8; v <= 8; v += 4) {
      pts.push({ x: v, z: -7.5, type: "short" });
      pts.push({ x: v, z: 7.5, type: "short" });
      pts.push({ x: -7.5, z: v, type: "short" });
      pts.push({ x: 7.5, z: v, type: "short" });
    }
    return pts;
  }, []);

  // Only add real pointLights on a subset to keep perf (every 3rd light)
  const litIndices = useMemo(() => {
    const s = new Set<number>();
    for (let i = 0; i < positions.length; i += 3) s.add(i);
    return s;
  }, [positions]);

  return (
    <group>
      {positions.map((p, i) => {
        const h = p.type === "tall" ? 2.2 : p.type === "double" ? 2.5 : 1.6;
        const glowSize = p.type === "double" ? 0.06 : 0.045;
        const emissiveI = p.type === "double" ? 3 : 2;
        const hasRealLight = litIndices.has(i) && lightIntensityMultiplier > 0;
        return (
          <group key={i} position={[p.x, 0, p.z]}>
            <mesh position={[0, h / 2, 0]}>
              <cylinderGeometry args={[0.02, 0.035, h, 4]} />
              <meshStandardMaterial color="#2A2A2A" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, h + 0.03, 0]}>
              <sphereGeometry args={[glowSize, 6, 6]} />
              <meshStandardMaterial
                color="#FFE8A0"
                emissive="#FFD060"
                emissiveIntensity={emissiveI + lightIntensityMultiplier * 2}
              />
            </mesh>
            {/* Real point light that illuminates surroundings */}
            {hasRealLight && (
              <pointLight
                position={[0, h + 0.1, 0]}
                color="#FFD060"
                intensity={lightIntensityMultiplier * 4}
                distance={8}
                decay={2}
              />
            )}
            {p.type === "double" && (
              <>
                <mesh position={[0.3, h - 0.1, 0]} rotation={[0, 0, Math.PI / 6]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.6, 3]} />
                  <meshStandardMaterial color="#2A2A2A" metalness={0.7} />
                </mesh>
                <mesh position={[0.5, h + 0.05, 0]}>
                  <sphereGeometry args={[0.04, 6, 6]} />
                  <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={2.5 + lightIntensityMultiplier * 2} />
                </mesh>
              </>
            )}
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.06, 0.07, 0.04, 6]} />
              <meshStandardMaterial color="#1A1A1A" metalness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Landscaping: Trees, Bushes, Flower Beds, Park Benches ──
function CityTree({ x, z, scale = 1, variant = 0 }: { x: number; z: number; scale?: number; variant?: number }) {
  const trunkH = 0.6 * scale;
  const crownColors = ["#1A6B2A", "#2D5A1E", "#1B7A30", "#3A7A2A"];
  const crownColor = crownColors[variant % crownColors.length];
  const crownSize = (0.5 + variant * 0.08) * scale;

  return (
    <group position={[x, 0, z]}>
      {/* Trunk */}
      <mesh position={[0, trunkH / 2, 0]}>
        <cylinderGeometry args={[0.04 * scale, 0.07 * scale, trunkH, 5]} />
        <meshStandardMaterial color="#5A3A20" roughness={0.9} />
      </mesh>
      {/* Crown layers */}
      <mesh position={[0, trunkH + crownSize * 0.4, 0]}>
        <sphereGeometry args={[crownSize, 6, 5]} />
        <meshStandardMaterial color={crownColor} roughness={0.85} />
      </mesh>
      {variant % 2 === 0 && (
        <mesh position={[crownSize * 0.3, trunkH + crownSize * 0.2, crownSize * 0.2]}>
          <sphereGeometry args={[crownSize * 0.6, 5, 4]} />
          <meshStandardMaterial color={crownColor} roughness={0.85} />
        </mesh>
      )}
      {/* Shadow circle */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[crownSize * 1.2, 6]} />
        <meshBasicMaterial color="#000" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

function Bush({ x, z, color = "#2A6A2A" }: { x: number; z: number; color?: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.18, 5, 4]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.1, 0.08]}>
        <sphereGeometry args={[0.12, 4, 3]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

function FlowerBed({ x, z, w = 1.5, d = 0.5 }: { x: number; z: number; w?: number; d?: number }) {
  const flowers = useMemo(() => {
    const f: { ox: number; oz: number; color: string }[] = [];
    const colors = ["#FF6B8A", "#FFB347", "#87CEEB", "#DDA0DD", "#FF69B4", "#FFA500"];
    for (let i = 0; i < 8; i++) {
      f.push({
        ox: (Math.random() - 0.5) * w * 0.8,
        oz: (Math.random() - 0.5) * d * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return f;
  }, [w, d]);

  return (
    <group position={[x, 0, z]}>
      {/* Soil bed */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[w, 0.06, d]} />
        <meshStandardMaterial color="#3A2A18" roughness={0.95} />
      </mesh>
      {/* Border */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[w + 0.06, 0.04, d + 0.06]} />
        <meshStandardMaterial color="#6B6B6B" roughness={0.8} />
      </mesh>
      {/* Flowers */}
      {flowers.map((f, i) => (
        <group key={i} position={[f.ox, 0.08, f.oz]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.06, 3]} />
            <meshStandardMaterial color="#3A6A2A" />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <sphereGeometry args={[0.025, 4, 3]} />
            <meshStandardMaterial color={f.color} emissive={f.color} emissiveIntensity={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ParkBench({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.6, 0.03, 0.22]} />
        <meshStandardMaterial color="#8B6B3A" roughness={0.85} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.35, -0.09]}>
        <boxGeometry args={[0.6, 0.2, 0.02]} />
        <meshStandardMaterial color="#8B6B3A" roughness={0.85} />
      </mesh>
      {/* Legs */}
      {[-0.25, 0.25].map((lx, i) => (
        <mesh key={i} position={[lx, 0.11, 0]}>
          <boxGeometry args={[0.03, 0.22, 0.18]} />
          <meshStandardMaterial color="#333" metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function CityLandscaping() {
  return (
    <group>
      {/* Trees along main roads */}
      {[-20, -14, -8, 8, 14, 20].map((v, i) => (
        <group key={`roadtrees-${i}`}>
          <CityTree x={2.5} z={v} scale={0.9} variant={i} />
          <CityTree x={-2.5} z={v} scale={0.85} variant={i + 1} />
          <CityTree x={v} z={2.5} scale={0.9} variant={i + 2} />
          <CityTree x={v} z={-2.5} scale={0.85} variant={i + 3} />
        </group>
      ))}

      {/* Park area near Praça Central */}
      <CityTree x={-5.5} z={-5.5} scale={1.1} variant={0} />
      <CityTree x={5.5} z={-5.5} scale={1.0} variant={1} />
      <CityTree x={-5.5} z={5.5} scale={1.0} variant={2} />
      <CityTree x={5.5} z={5.5} scale={1.1} variant={3} />

      {/* Bushes along sidewalks */}
      {[-16, -10, 10, 16].map((v, i) => (
        <group key={`bushes-${i}`}>
          <Bush x={2.2} z={v + 1} />
          <Bush x={-2.2} z={v - 1} color="#1A5A2A" />
          <Bush x={v + 1} z={2.2} color="#2A7A3A" />
          <Bush x={v - 1} z={-2.2} />
        </group>
      ))}

      {/* Flower beds at district entrances */}
      <FlowerBed x={-9} z={-7} w={1.2} d={0.4} />
      <FlowerBed x={9} z={-7} w={1.2} d={0.4} />
      <FlowerBed x={-9} z={7} w={1.2} d={0.4} />
      <FlowerBed x={9} z={7} w={1.2} d={0.4} />

      {/* Flower beds near plaza */}
      <FlowerBed x={-3} z={-6} w={2} d={0.5} />
      <FlowerBed x={3} z={6} w={2} d={0.5} />

      {/* Park benches */}
      <ParkBench x={-6} z={-4} rotation={Math.PI / 4} />
      <ParkBench x={6} z={-4} rotation={-Math.PI / 4} />
      <ParkBench x={-6} z={4} rotation={-Math.PI / 4} />
      <ParkBench x={6} z={4} rotation={Math.PI / 4} />
      <ParkBench x={3} z={-2.5} rotation={0} />
      <ParkBench x={-3} z={2.5} rotation={Math.PI} />

      {/* Green patches (grass areas) */}
      {[
        [-8, -10, 3, 2], [8, -10, 3, 2],
        [-8, 10, 3, 2], [8, 10, 3, 2],
        [-20, 2, 2, 3], [20, 2, 2, 3],
      ].map(([gx, gz, gw, gd], i) => (
        <mesh key={`grass-${i}`} position={[gx, 0.006, gz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[gw, gd]} />
          <meshStandardMaterial color="#1A4A1A" roughness={0.95} />
        </mesh>
      ))}

      {/* Large trees in green patches */}
      <CityTree x={-8} z={-10} scale={1.3} variant={0} />
      <CityTree x={8} z={-10} scale={1.2} variant={1} />
      <CityTree x={-8} z={10} scale={1.2} variant={2} />
      <CityTree x={8} z={10} scale={1.3} variant={3} />
      <CityTree x={-20} z={2} scale={1.1} variant={4} />
      <CityTree x={20} z={2} scale={1.1} variant={5} />

      {/* Hedge rows near buildings */}
      {[-15, -9, 9, 15].map((hx, i) => (
        <group key={`hedge-${i}`}>
          {Array.from({ length: 4 }).map((_, j) => (
            <Bush key={j} x={hx} z={-14 + j * 2.5} color="#1B5A20" />
          ))}
        </group>
      ))}
    </group>
  );
}

// ── Neon Signs on buildings ──
function BuildingNeonSigns() {
  const signs = useMemo(() => [
    { x: -18, z: -12, h: 2.8, text: "CAFÉ", color: "#FF6B9D" },
    { x: 12, z: -12, h: 3.5, text: "TECH", color: "#00D4FF" },
    { x: -18, z: 8, h: 2.5, text: "ART", color: "#FFD700" },
    { x: 12, z: 8, h: 2.2, text: "SHOP", color: "#00FF88" },
    { x: 0, z: -14, h: 3.5, text: "HUB", color: "#FF4444" },
    { x: 0, z: 18, h: 2.5, text: "SOCIAL", color: "#AA66FF" },
  ], []);

  return (
    <group>
      {signs.map((s, i) => (
        <group key={i} position={[s.x, s.h + 0.3, s.z]}>
          {/* Neon glow bar */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.8, 0.15, 0.02]} />
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={2.5}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Mounting bracket */}
          <mesh position={[0, 0.1, -0.02]}>
            <boxGeometry args={[0.06, 0.12, 0.04]} />
            <meshStandardMaterial color="#333" metalness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Player ──
function CityPlayer({ position, name, rotation }: { position: [number, number, number]; name: string; rotation: number }) {
  const ref = useRef<THREE.Group>(null);
  const smoothPos = useRef(new THREE.Vector3(...position));

  useFrame(() => {
    if (!ref.current) return;
    smoothPos.current.lerp(new THREE.Vector3(...position), 0.18);
    ref.current.position.copy(smoothPos.current);
    ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.008;
    // Smooth rotate towards movement direction
    const targetRot = rotation;
    let diff = targetRot - ref.current.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    ref.current.rotation.y += diff * 0.15;
  });

  return (
    <group ref={ref} position={position}>
      <mesh position={[-0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[-0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color="#4A90D9" /></mesh>
      <mesh position={[0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color="#4A90D9" /></mesh>
      <mesh position={[0, 0.27, 0]} castShadow><boxGeometry args={[0.26, 0.24, 0.15]} /><meshStandardMaterial color="#2E8B57" /></mesh>
      <mesh position={[-0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0, 0.48, 0]} castShadow><boxGeometry args={[0.24, 0.22, 0.2]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[-0.08, 0.72, 0]}><boxGeometry args={[0.06, 0.28, 0.05]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0.08, 0.72, 0]}><boxGeometry args={[0.06, 0.28, 0.05]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[-0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.16, 8]} /><meshBasicMaterial color="#000" transparent opacity={0.18} /></mesh>
      <Html position={[0, 1.05, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none select-none bg-emerald-700">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-white font-bold">{name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Click-to-move marker ──
function ClickMarker({ position }: { position: [number, number, number] | null }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current || !position) return;
    ref.current.rotation.y += 0.03;
    ref.current.scale.setScalar(0.8 + Math.sin(Date.now() * 0.005) * 0.2);
  });
  if (!position) return null;
  return (
    <mesh ref={ref} position={[position[0], 0.05, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 0.35, 6]} />
      <meshBasicMaterial color="#10B981" transparent opacity={0.6} />
    </mesh>
  );
}

// ── Camera occlusion system ──
function CameraOcclusion({
  playerPos,
  onOccludedBuildings,
}: {
  playerPos: [number, number, number];
  onOccludedBuildings: (ids: Set<string>) => void;
}) {
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 10 !== 0) return; // Check every 10 frames

    const playerVec = new THREE.Vector3(playerPos[0], 0.5, playerPos[2]);
    const camPos = camera.position.clone();
    const dir = playerVec.clone().sub(camPos).normalize();
    const dist = camPos.distanceTo(playerVec);

    raycaster.current.set(camPos, dir);
    raycaster.current.far = dist;

    // Check which buildings are between camera and player
    const occluded = new Set<string>();

    for (const b of CITY_BUILDINGS) {
      const bCenter = new THREE.Vector3(b.x, b.h / 2, b.z);
      const bDist = camPos.distanceTo(bCenter);
      if (bDist < dist && bDist > 2) {
        // Simple check: is building roughly between camera and player?
        const toB = bCenter.clone().sub(camPos).normalize();
        const dot = dir.dot(toB);
        if (dot > 0.7) {
          const cross = new THREE.Vector3().crossVectors(dir, toB);
          if (cross.length() < 0.3) {
            occluded.add(`static-${b.x}-${b.z}`);
          }
        }
      }
    }

    onOccludedBuildings(occluded);
  });

  return null;
}

// ── Flight mode camera controller ──
function FlightCamera({ active, playerPos }: { active: boolean; playerPos: [number, number, number] }) {
  const { camera, gl } = useThree();
  const flyState = useRef({
    yaw: 0,
    pitch: -0.3,
    x: 0, y: 15, z: 0,
    initialized: false,
  });
  const keysRef = useRef(new Set<string>());

  useEffect(() => {
    if (!active) return;
    const s = flyState.current;
    if (!s.initialized) {
      s.x = playerPos[0];
      s.y = 12;
      s.z = playerPos[2] + 10;
      s.yaw = Math.atan2(playerPos[0] - s.x, playerPos[2] - s.z);
      s.pitch = -0.3;
      s.initialized = true;
    }

    const onDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());

    let isPointerLocked = false;
    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked) return;
      s.yaw -= e.movementX * 0.002;
      s.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, s.pitch - e.movementY * 0.002));
    };

    const canvas = gl.domElement;
    const onClick = () => {
      if (active && !isPointerLocked) {
        canvas.requestPointerLock();
      }
    };
    const onLockChange = () => {
      isPointerLocked = document.pointerLockElement === canvas;
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    document.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLockChange);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      document.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLockChange);
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
      keysRef.current.clear();
    };
  }, [active, gl, playerPos]);

  useFrame((_, delta) => {
    if (!active) return;
    const dt = Math.min(delta, 0.05);
    const s = flyState.current;
    const keys = keysRef.current;

    const speed = keys.has("shift") ? 30 : 15;
    const forward = new THREE.Vector3(-Math.sin(s.yaw), 0, -Math.cos(s.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    if (keys.has("w") || keys.has("arrowup")) { s.x += forward.x * speed * dt; s.z += forward.z * speed * dt; }
    if (keys.has("s") || keys.has("arrowdown")) { s.x -= forward.x * speed * dt; s.z -= forward.z * speed * dt; }
    if (keys.has("a") || keys.has("arrowleft")) { s.x -= right.x * speed * dt; s.z -= right.z * speed * dt; }
    if (keys.has("d") || keys.has("arrowright")) { s.x += right.x * speed * dt; s.z += right.z * speed * dt; }
    if (keys.has(" ")) s.y += speed * dt;
    if (keys.has("control")) s.y = Math.max(1, s.y - speed * dt);

    // Clamp
    s.x = Math.max(-60, Math.min(60, s.x));
    s.z = Math.max(-60, Math.min(60, s.z));
    s.y = Math.max(1, Math.min(80, s.y));

    camera.position.set(s.x, s.y, s.z);
    const lookDir = new THREE.Vector3(
      -Math.sin(s.yaw) * Math.cos(s.pitch),
      Math.sin(s.pitch),
      -Math.cos(s.yaw) * Math.cos(s.pitch)
    );
    camera.lookAt(s.x + lookDir.x * 10, s.y + lookDir.y * 10, s.z + lookDir.z * 10);
  });

  return null;
}

// ── Camera Follow (ground mode) ──
function CameraFollow({ target, controlsRef, active }: {
  target: [number, number, number]; controlsRef: React.RefObject<any>; active: boolean;
}) {
  useFrame((_, delta) => {
    if (!active || !controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const factor = 1 - Math.exp(-6 * dt);
    const t = controlsRef.current.target;
    t.x += (target[0] - t.x) * factor;
    t.z += (target[2] - t.z) * factor;
    t.y += (0.5 - t.y) * factor;
    controlsRef.current.update();
  });
  return null;
}

// ── Main Export ──
interface CityExploreSceneProps {
  playerName: string;
  flyMode?: boolean;
  inVehicle?: boolean;
  vehicleType?: string;
  vehicleColor?: string;
  onVehicleToggle?: (val: boolean) => void;
  onReady?: () => void;
  onBuildingClick?: (buildingId: string) => void;
}

export function CityExploreScene({ playerName, flyMode, inVehicle, vehicleType, vehicleColor, onVehicleToggle, onReady, onBuildingClick }: CityExploreSceneProps) {
  const controlsRef = useRef<any>(null);
  const dn = useDayNight();

  const userId = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_user");
    return stored ? JSON.parse(stored).email || "" : "";
  }, []);

  const { visibleBuildings, userBuilding, updateCameraCenter } = useCityBuildings(userId);

  const startPos = useMemo<[number, number, number]>(() => {
    if (userBuilding) {
      const sx = Math.max(-35, Math.min(35, userBuilding.coordinates.x * 0.4));
      const sz = Math.max(-35, Math.min(35, userBuilding.coordinates.z * 0.4));
      return [sx + 2, 0, sz + 2];
    }
    return [0, 0, 5];
  }, [userBuilding]);

  const [playerPos, setPlayerPos] = useState<[number, number, number]>(startPos);
  const [playerRot, setPlayerRot] = useState(0);
  const [clickTarget, setClickTarget] = useState<[number, number, number] | null>(null);
  const [occludedBuildings, setOccludedBuildings] = useState<Set<string>>(new Set());
  const hasSpawned = useRef(false);

  useEffect(() => {
    if (!hasSpawned.current && userBuilding) {
      setPlayerPos(startPos);
      hasSpawned.current = true;
    }
  }, [startPos, userBuilding]);

  // Dynamic buildings mapped
  const dynamicBuildings = useMemo(() => {
    return visibleBuildings.slice(0, 20).map(b => ({
      ...b,
      coordinates: { ...b.coordinates, x: b.coordinates.x * 0.4, z: b.coordinates.z * 0.4 },
    }));
  }, [visibleBuildings]);

  // Build collision AABBs
  const aabbs = useMemo(() => buildAABBs(CITY_BUILDINGS, dynamicBuildings), [dynamicBuildings]);

  // Click-to-move: walk towards target
  useEffect(() => {
    if (!clickTarget || flyMode) return;
    const interval = setInterval(() => {
      setPlayerPos(prev => {
        const dx = clickTarget[0] - prev[0];
        const dz = clickTarget[2] - prev[2];
        const dist = Math.hypot(dx, dz);
        if (dist < 0.3) {
          setClickTarget(null);
          return prev;
        }
        const step = Math.min(0.25, dist);
        const mx = (dx / dist) * step;
        const mz = (dz / dist) * step;
        const [nx, nz] = moveWithCollision(prev[0], prev[2], mx, mz, 0.25, aabbs);
        if (nx === prev[0] && nz === prev[2]) {
          setClickTarget(null);
          return prev;
        }
        setPlayerRot(Math.atan2(dx, dz));
        updateCameraCenter(nx * 2.5, nz * 2.5);
        return [nx, 0, nz];
      });
    }, 33);
    return () => clearInterval(interval);
  }, [clickTarget, aabbs, flyMode, updateCameraCenter]);

  const handleFloorClick = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.button !== 0 || flyMode) return;
    const { x, z } = e.point;
    // Only allow clicking on walkable ground (not inside buildings)
    if (!collidesAABB(x, z, 0.1, aabbs)) {
      setClickTarget([x, 0, z]);
    }
  }, [aabbs, flyMode]);

  // Keyboard movement (ground mode)
  useEffect(() => {
    if (flyMode) return; // Flight mode has its own controls

    const keys = new Set<string>();
    const onDown = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e" && onVehicleToggle) onVehicleToggle(!inVehicle);
    };
    const onUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    const baseSpeed = inVehicle ? 0.45 : 0.2;
    const interval = setInterval(() => {
      let dx = 0, dz = 0;
      if (keys.has("arrowup") || keys.has("w")) dz -= baseSpeed;
      if (keys.has("arrowdown") || keys.has("s")) dz += baseSpeed;
      if (keys.has("arrowleft") || keys.has("a")) dx -= baseSpeed;
      if (keys.has("arrowright") || keys.has("d")) dx += baseSpeed;

      if (dx !== 0 || dz !== 0) {
        // Normalize diagonal
        if (dx !== 0 && dz !== 0) {
          const len = Math.hypot(dx, dz);
          dx = (dx / len) * baseSpeed;
          dz = (dz / len) * baseSpeed;
        }
        setClickTarget(null); // Cancel click-to-move

        setPlayerPos(prev => {
          const playerRadius = inVehicle ? 0.4 : 0.25;
          const [nx, nz] = moveWithCollision(prev[0], prev[2], dx, dz, playerRadius, aabbs);
          // Clamp to city bounds
          const fx = Math.max(-35, Math.min(35, nx));
          const fz = Math.max(-35, Math.min(35, nz));
          if (fx !== prev[0] || fz !== prev[2]) {
            setPlayerRot(Math.atan2(dx, dz));
            updateCameraCenter(fx * 2.5, fz * 2.5);
          }
          return [fx, 0, fz];
        });
      }
    }, 33);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      clearInterval(interval);
    };
  }, [updateCameraCenter, inVehicle, onVehicleToggle, aabbs, flyMode]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        shadows
        style={{ touchAction: "none", width: "100%", height: "100%", display: "block" }}
        camera={{ position: [12, 18, 22], fov: 40, near: 0.5, far: 500 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = dn.exposure;
          onReady?.();
        }}
      >
        <color attach="background" args={[dn.bgColor]} />
        <fog attach="fog" args={[dn.fogColor, 25, 120]} />

        <ambientLight intensity={dn.ambientIntensity} color={dn.ambientColor} />
        <directionalLight
          position={dn.sunPosition}
          intensity={dn.sunIntensity}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-camera-far={40}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          color={dn.sunColor}
        />
        <hemisphereLight args={[dn.skyColor, dn.groundColor, dn.hemiIntensity]} />

        {/* Moon */}
        {dn.isNight && (
          <group position={[-20, 30, -15]}>
            <mesh>
              <sphereGeometry args={[2, 16, 16]} />
              <meshBasicMaterial color="#E8E8F0" />
            </mesh>
            {/* Moon glow */}
            <mesh>
              <sphereGeometry args={[3, 16, 16]} />
              <meshBasicMaterial color="#8899CC" transparent opacity={0.08} />
            </mesh>
            {/* Moonlight - directional from moon position */}
            <directionalLight
              position={[0, 0, 0]}
              target-position={[0, 0, 0]}
              intensity={0.3}
              color="#8899CC"
            />
          </group>
        )}
        {dn.isSunset && (
          <group position={[-20, 25, -15]}>
            <mesh>
              <sphereGeometry args={[1.5, 12, 12]} />
              <meshBasicMaterial color="#D8D8E8" transparent opacity={dn.starOpacity * 0.8} />
            </mesh>
          </group>
        )}

        {dn.showStars && <Stars radius={100} depth={50} count={1500} factor={4} saturation={0.3} fade speed={0.5} />}

        {/* Ground mode controls */}
        {!flyMode && (
          <>
            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.15}
              enablePan={false}
              enableZoom
              enableRotate
              minDistance={8}
              maxDistance={25}
              minPolarAngle={Math.PI / 8}
              maxPolarAngle={Math.PI / 2.8}
              zoomSpeed={0.8}
              rotateSpeed={0.5}
              target={[playerPos[0], 0.5, playerPos[2]]}
            />
            <CameraFollow target={playerPos} controlsRef={controlsRef} active={!flyMode} />
          </>
        )}

        {/* Flight mode */}
        <FlightCamera active={!!flyMode} playerPos={playerPos} />

        {/* Camera occlusion */}
        <CameraOcclusion playerPos={playerPos} onOccludedBuildings={setOccludedBuildings} />

        {/* Clickable ground */}
        <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handleFloorClick}>
          <planeGeometry args={[80, 80]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        <CityGround />
        <CityPlaza />
        <StreetLights />
        <CityLandscaping />
        <BuildingNeonSigns />

        {/* Click marker */}
        <ClickMarker position={clickTarget} />

        {/* Static buildings with occlusion */}
        {CITY_BUILDINGS.map((b, i) => (
          <StaticBuildingOccludable
            key={i}
            x={b.x} z={b.z} w={b.w} d={b.d} h={b.h} color={b.color}
            occluded={occludedBuildings.has(`static-${b.x}-${b.z}`)}
          />
        ))}

        {/* Dynamic buildings */}
        {dynamicBuildings.map(b => (
          <LightBuilding3D
            key={b.id}
            building={b}
            highlighted={userBuilding?.id === b.id}
            onClick={() => onBuildingClick?.(b.id)}
            occluded={false}
          />
        ))}

        {/* User building vehicle */}
        {userBuilding && dynamicBuildings.filter(b => b.id === userBuilding.id).map(b => {
          const transport = b.transportType || STYLE_TRANSPORT_MAP[b.style] || "car";
          if (transport === "none") return null;
          return (
            <Vehicle3D
              key={`v-${b.id}`}
              type={transport}
              position={[b.coordinates.x + 1.5, 0, b.coordinates.z + 1.5]}
              color={b.primaryColor}
              ownerName={b.name}
              isActive
            />
          );
        })}

        {/* NPCs with collision awareness */}
        {NPC_DATA.map((npc, i) => (
          <CityNPC key={i} startX={npc.x} startZ={npc.z} color={npc.color} aabbs={aabbs} />
        ))}

        {/* Player + vehicle */}
        {inVehicle && vehicleType && vehicleType !== "none" && (
          <Vehicle3D type={vehicleType as any} position={playerPos} color={vehicleColor} ownerName={playerName} isActive />
        )}
        {!inVehicle && <CityPlayer position={playerPos} name={playerName} rotation={playerRot} />}
      </Canvas>
    </div>
  );
}
